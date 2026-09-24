"""
ISS (International Space Station) tracking and orbit prediction service.
Provides:
- Real-time ISS coordinates, velocity, altitude, and daylight/eclipse status.
- Topocentric Azimuth, Elevation, and Distance relative to the observer's location.
- 90-minute orbital ground track and local sky pass trajectory.
- Upcoming pass prediction for the observer's horizon.
"""

import urllib.request
import json
import time
import math
from typing import Dict, Any, List, Optional
from .astronomy import geodetic_to_ecef, ecef_to_enu

ISS_NORAD_ID = 25544
WHERETHEISS_BASE = "https://api.wheretheiss.at/v1/satellites/25544"

# In-memory cache to prevent excessive API hammering
_cache = {
    "live": None,
    "live_ts": 0,
    "orbit": None,
    "orbit_ts": 0
}

def fetch_live_iss() -> Dict[str, Any]:
    """Fetch live ISS telemetry from wheretheiss.at API."""
    now = time.time()
    if _cache["live"] and (now - _cache["live_ts"]) < 2.0:
        return _cache["live"]
        
    try:
        req = urllib.request.Request(
            WHERETHEISS_BASE,
            headers={"User-Agent": "LocalStarMap/1.0"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            _cache["live"] = data
            _cache["live_ts"] = now
            return data
    except Exception as e:
        # If network error or cached data available, return cache or fallback synthetic orbit
        if _cache["live"]:
            return _cache["live"]
        # Fallback synthetic approximation for offline operation
        t = now % 5560  # ~92.6 min orbital period
        mean_anomaly = (t / 5560.0) * 2 * math.pi
        inc = math.radians(51.64)  # ISS orbital inclination ~51.6 deg
        lat = math.degrees(math.asin(math.sin(inc) * math.sin(mean_anomaly)))
        lon = (-(t / 5560.0) * 360.0 + 100.0) % 360.0
        if lon > 180:
            lon -= 360
        return {
            "name": "iss",
            "id": ISS_NORAD_ID,
            "latitude": lat,
            "longitude": lon,
            "altitude": 420.5,
            "velocity": 27600.0,
            "visibility": "daylight",
            "timestamp": int(now)
        }

def fetch_orbit_path(center_ts: int) -> List[Dict[str, Any]]:
    """
    Fetch a 90-minute trajectory (past 45 min and future 45 min) in 3-minute steps.
    """
    now = time.time()
    if _cache["orbit"] and (now - _cache["orbit_ts"]) < 60.0:
        return _cache["orbit"]
        
    # Generate 31 timestamps from -45 min to +45 min (every 3 minutes)
    step_sec = 180
    ts_list = [center_ts + i * step_sec for i in range(-15, 16)]
    
    # wheretheiss.at accepts up to 10 timestamps per request, so batch in chunks of 10
    all_points = []
    chunk_size = 10
    
    for i in range(0, len(ts_list), chunk_size):
        chunk = ts_list[i:i + chunk_size]
        ts_str = ",".join(str(t) for t in chunk)
        url = f"{WHERETHEISS_BASE}/positions?timestamps={ts_str}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "LocalStarMap/1.0"})
            with urllib.request.urlopen(req, timeout=6) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                all_points.extend(res)
        except Exception:
            pass
            
    if all_points:
        _cache["orbit"] = all_points
        _cache["orbit_ts"] = now
        return all_points
        
    # Synthetic fallback if external API fails
    pts = []
    for ts in ts_list:
        dt = ts - center_ts
        t_phase = (ts % 5560) / 5560.0 * 2 * math.pi
        inc = math.radians(51.64)
        lat = math.degrees(math.asin(math.sin(inc) * math.sin(t_phase)))
        lon = (-(ts % 86400) / 86400.0 * 360.0 * 15.6) % 360.0
        if lon > 180:
            lon -= 360
        pts.append({
            "timestamp": ts,
            "latitude": lat,
            "longitude": lon,
            "altitude": 420.0
        })
    return pts

def get_iss_topocentric(obs_lat: float, obs_lon: float, obs_alt_km: float = 0.0) -> Dict[str, Any]:
    """
    Computes real-time ISS telemetry, local topocentric Azimuth & Altitude for the observer,
    ground track, and local sky track pass.
    """
    live = fetch_live_iss()
    sat_lat = live.get("latitude", 0.0)
    sat_lon = live.get("longitude", 0.0)
    sat_alt = live.get("altitude", 420.0)
    sat_ts = live.get("timestamp", int(time.time()))
    
    # Calculate observer ECEF coordinates
    obs_x, obs_y, obs_z = geodetic_to_ecef(obs_lat, obs_lon, obs_alt_km)
    
    # Calculate satellite ECEF coordinates
    sat_x, sat_y, sat_z = geodetic_to_ecef(sat_lat, sat_lon, sat_alt)
    
    # Calculate topocentric Azimuth, Elevation, and Range
    az, el, rng = ecef_to_enu(sat_x, sat_y, sat_z, obs_x, obs_y, obs_z, obs_lat, obs_lon)
    
    # Fetch orbit path points
    orbit_pts = fetch_orbit_path(sat_ts)
    
    # Calculate topocentric coordinates for each orbit point to generate sky pass trajectory
    sky_trajectory = []
    ground_track = []
    
    for pt in orbit_pts:
        p_lat = pt.get("latitude", 0.0)
        p_lon = pt.get("longitude", 0.0)
        p_alt = pt.get("altitude", 420.0)
        p_ts = pt.get("timestamp", 0)
        
        ground_track.append({
            "lat": round(p_lat, 3),
            "lon": round(p_lon, 3),
            "ts": p_ts
        })
        
        px, py, pz = geodetic_to_ecef(p_lat, p_lon, p_alt)
        p_az, p_el, p_rng = ecef_to_enu(px, py, pz, obs_x, obs_y, obs_z, obs_lat, obs_lon)
        
        sky_trajectory.append({
            "az": round(p_az, 2),
            "el": round(p_el, 2),
            "range_km": round(p_rng, 1),
            "is_above": p_el > 0.0,
            "ts": p_ts
        })
        
    is_visible_now = el > 0.0
    
    # Estimate next pass summary
    next_pass = None
    pass_pts = [p for p in sky_trajectory if p["ts"] >= sat_ts and p["el"] > 0.0]
    if pass_pts:
        max_pt = max(pass_pts, key=lambda x: x["el"])
        next_pass = {
            "status": "In Progress" if is_visible_now else "Upcoming",
            "start_ts": pass_pts[0]["ts"],
            "max_elevation": max_pt["el"],
            "max_azimuth": max_pt["az"],
            "max_ts": max_pt["ts"],
            "end_ts": pass_pts[-1]["ts"]
        }
        
    return {
        "telemetry": {
            "name": "International Space Station (ISS)",
            "norad_id": ISS_NORAD_ID,
            "latitude": round(sat_lat, 4),
            "longitude": round(sat_lon, 4),
            "altitude_km": round(sat_alt, 2),
            "velocity_kmh": round(live.get("velocity", 27600.0), 1),
            "visibility": live.get("visibility", "unknown"),
            "timestamp": sat_ts
        },
        "topocentric": {
            "azimuth_deg": round(az, 2),
            "elevation_deg": round(el, 2),
            "slant_range_km": round(rng, 1),
            "is_above_horizon": is_visible_now,
            "direction": _get_compass_bearing(az)
        },
        "ground_track": ground_track,
        "sky_trajectory": sky_trajectory,
        "next_pass": next_pass
    }

def _get_compass_bearing(az_deg: float) -> str:
    bearings = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    idx = int((az_deg + 11.25) / 22.5) % 16
    return bearings[idx]
