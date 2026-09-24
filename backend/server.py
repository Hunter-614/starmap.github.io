"""
FastAPI application backend for Local Star Map & ISS Tracker.
Serves:
- REST API for ESA Gaia TAP queries, real-time ISS tracking, and astronomical ephemeris.
- Static UI files for the local star map interface.
"""

from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import time
import datetime
import urllib.request
import urllib.parse
import json
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from .astronomy import (
    to_utc_datetime, get_julian_date, get_lst_hours,
    radec_to_altaz, get_sun_position, get_moon_position,
    get_planet_positions
)
from .gaia_service import (
    init_catalogs, get_base_stars, get_constellations,
    execute_adql_query, cone_search
)
from .iss_service import get_iss_topocentric, fetch_live_iss

app = FastAPI(
    title="Local Star Map & ISS Observatory API",
    description="Astronomical sky engine powered by ESA Gaia Archive TAP API and ISS live telemetry",
    version="1.0.0"
)

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to load cached star datasets
@app.on_event("startup")
async def startup_event():
    init_catalogs()

class GaiaQueryRequest(BaseModel):
    query: str
    timeout_sec: Optional[int] = 25

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "ESA Gaia & ISS Sky Observatory",
        "server_time_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "cached_stars_count": len(get_base_stars()),
        "constellations_count": len(get_constellations())
    }

@app.get("/api/stars")
def get_stars():
    """Return pre-cached ESA Gaia DR3 bright stars."""
    return get_base_stars()

@app.get("/api/constellations")
def get_constellations_endpoint():
    """Return IAU 88 constellations with star-line vectors."""
    return get_constellations()

@app.get("/api/sky")
def get_sky_state(
    lat: float = Query(40.7128, description="Observer latitude in degrees (-90 to +90)"),
    lon: float = Query(-74.0060, description="Observer longitude in degrees (-180 to +180)"),
    timestamp: Optional[float] = Query(None, description="Unix timestamp in seconds (default: current UTC)"),
    min_alt: float = Query(-10.0, description="Minimum altitude to filter stars (-90 to +90)")
):
    """
    Computes real-time celestial positions (Alt/Az) for:
    - Stars from ESA Gaia DR3
    - Sun and Moon (with phase fraction & illumination)
    - All major planets (Mercury to Neptune)
    - ISS satellite topocentric position & trajectory
    """
    if timestamp is None:
        dt = datetime.datetime.now(datetime.timezone.utc)
    else:
        dt = datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc)
        
    jd = get_julian_date(dt)
    lst_hours = get_lst_hours(jd, lon)
    
    # 1. Sun
    sun = get_sun_position(jd)
    sun_alt, sun_az = radec_to_altaz(sun["ra"], sun["dec"], lat, lon, jd)
    sun_info = {
        "ra": round(sun["ra"], 3),
        "dec": round(sun["dec"], 3),
        "alt": round(sun_alt, 2),
        "az": round(sun_az, 2),
        "is_daylight": sun_alt > 0,
        "twilight_phase": (
            "Daylight" if sun_alt > 0 else
            "Civil Twilight" if sun_alt > -6 else
            "Nautical Twilight" if sun_alt > -12 else
            "Astronomical Twilight" if sun_alt > -18 else
            "Night"
        )
    }
    
    # 2. Moon
    moon = get_moon_position(jd)
    moon_alt, moon_az = radec_to_altaz(moon["ra"], moon["dec"], lat, lon, jd)
    moon_info = {
        "ra": round(moon["ra"], 3),
        "dec": round(moon["dec"], 3),
        "alt": round(moon_alt, 2),
        "az": round(moon_az, 2),
        "dist_km": round(moon["dist_km"], 0),
        "phase_fraction": round(moon["phase_fraction"], 3),
        "phase_name": moon["phase_name"],
        "is_waxing": moon["is_waxing"]
    }
    
    # 3. Planets
    planets = get_planet_positions(jd)
    planet_list = []
    for p in planets:
        p_alt, p_az = radec_to_altaz(p["ra"], p["dec"], lat, lon, jd)
        planet_list.append({
            "name": p["name"],
            "ra": round(p["ra"], 3),
            "dec": round(p["dec"], 3),
            "alt": round(p_alt, 2),
            "az": round(p_az, 2),
            "dist_au": p["dist_au"],
            "color": p["color"],
            "mag": p["mag"],
            "is_above_horizon": p_alt > 0
        })
        
    # 4. ISS Topocentric Position
    iss = get_iss_topocentric(lat, lon)
    
    # 5. Visible Stars with Alt/Az
    all_stars = get_base_stars()
    visible_stars = []
    for star in all_stars:
        s_alt, s_az = radec_to_altaz(star["ra"], star["dec"], lat, lon, jd)
        if s_alt >= min_alt:
            visible_stars.append({
                "id": star["id"],
                "name": star.get("name", ""),
                "bayer": star.get("bayer", ""),
                "con": star.get("con", ""),
                "mag": star["mag"],
                "bp_rp": star.get("bp_rp", 0.5),
                "dist_ly": star.get("dist_ly"),
                "ra": star["ra"],
                "dec": star["dec"],
                "alt": round(s_alt, 2),
                "az": round(s_az, 2)
            })
            
    return {
        "observer": {
            "lat": lat,
            "lon": lon,
            "utc_iso": dt.isoformat(),
            "timestamp": int(dt.timestamp()),
            "julian_date": round(jd, 5),
            "lst_hours": round(lst_hours, 4)
        },
        "sun": sun_info,
        "moon": moon_info,
        "planets": planet_list,
        "iss": iss,
        "stars_count": len(visible_stars),
        "stars": visible_stars
    }

@app.get("/api/iss")
def get_iss(
    lat: float = Query(40.7128, description="Observer latitude in degrees"),
    lon: float = Query(-74.0060, description="Observer longitude in degrees")
):
    """Fetch live ISS position, topocentric coordinates, and orbital path."""
    return get_iss_topocentric(lat, lon)

@app.post("/api/gaia/query")
def query_gaia(req: GaiaQueryRequest = Body(...)):
    """Execute live ADQL query directly on ESA Gaia TAP service."""
    result = execute_adql_query(req.query, req.timeout_sec or 25)
    return result

@app.get("/api/gaia/cone")
def cone_gaia(
    ra: float = Query(..., description="Center Right Ascension in degrees (0-360)"),
    dec: float = Query(..., description="Center Declination in degrees (-90 to +90)"),
    radius: float = Query(1.5, description="Search radius in degrees (0.1 to 10.0)"),
    max_mag: float = Query(10.0, description="Maximum G magnitude cutoff"),
    limit: int = Query(150, description="Maximum number of stars to return")
):
    """Execute live cone search on ESA Gaia TAP service."""
    return cone_search(ra, dec, radius, max_mag, limit)

_geocode_cache: Dict[str, List[Dict[str, Any]]] = {}

@app.get("/api/geocode")
def geocode_location(q: str = Query(..., min_length=2, description="City, address or location query")):
    """Geocode any city or address worldwide using OpenStreetMap Nominatim."""
    q_norm = q.strip().lower()
    if q_norm in _geocode_cache:
        return _geocode_cache[q_norm]
        
    url = f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(q.strip())}&limit=8"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "LocalStarMap/1.0 (IARC 425 Astronomy Observatory)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            results = []
            for item in data:
                try:
                    display_name = item.get("display_name", "")
                    # Short name: first 2 tokens of display name
                    parts = [p.strip() for p in display_name.split(",")]
                    short_name = ", ".join(parts[:2]) if len(parts) >= 2 else display_name
                    results.append({
                        "name": short_name,
                        "display_name": display_name,
                        "lat": round(float(item.get("lat")), 4),
                        "lon": round(float(item.get("lon")), 4),
                        "type": item.get("type", "location")
                    })
                except (ValueError, TypeError):
                    continue
            _geocode_cache[q_norm] = results
            return results
    except Exception as e:
        return []


# Mount static frontend directory and data directory
ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
STATIC_DIR = os.path.join(ROOT_DIR, "static")
DATA_DIR = os.path.join(ROOT_DIR, "data")

if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

if os.path.exists(DATA_DIR):
    app.mount("/data", StaticFiles(directory=DATA_DIR), name="data")

SOURCE_IMAGES_DIR = os.path.join(ROOT_DIR, "Source Images")
if os.path.exists(SOURCE_IMAGES_DIR):
    app.mount("/Source Images", StaticFiles(directory=SOURCE_IMAGES_DIR), name="source_images")

@app.get("/")
def serve_index():
    root_index = os.path.join(ROOT_DIR, "index.html")
    if os.path.exists(root_index):
        return FileResponse(root_index)
    static_index = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(static_index):
        return FileResponse(static_index)
    return {"message": "Local Star Map Observatory running. index.html not found."}

