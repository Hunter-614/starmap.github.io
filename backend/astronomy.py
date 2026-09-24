"""
Astronomical calculation engine:
- Julian Date, GMST, LST
- RA/Dec to Alt/Az topocentric conversions
- Sun ephemeris & Twilight phases
- Moon ephemeris & Lunar phase calculation
- Keplerian orbital calculations for major planets (Mercury through Neptune)
- WGS84 ECEF to ENU topocentric conversions for satellites (ISS)
"""

import math
import datetime

# Earth WGS84 parameters
WGS84_A = 6378.137  # Semi-major axis in km
WGS84_F = 1.0 / 298.257223563  # Flattening
WGS84_E2 = WGS84_F * (2 - WGS84_F)

def to_utc_datetime(dt_input):
    """Normalize input to UTC datetime object."""
    if isinstance(dt_input, (int, float)):
        return datetime.datetime.fromtimestamp(dt_input, tz=datetime.timezone.utc)
    if isinstance(dt_input, str):
        # Clean ISO string
        s = dt_input.replace('Z', '+00:00')
        dt = datetime.datetime.fromisoformat(s)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=datetime.timezone.utc)
        return dt.astimezone(datetime.timezone.utc)
    if isinstance(dt_input, datetime.datetime):
        if dt_input.tzinfo is None:
            return dt_input.replace(tzinfo=datetime.timezone.utc)
        return dt_input.astimezone(datetime.timezone.utc)
    return datetime.datetime.now(datetime.timezone.utc)

def get_julian_date(dt):
    """Calculate Julian Date from UTC datetime."""
    year = dt.year
    month = dt.month
    day = dt.day + (dt.hour + dt.minute / 60.0 + dt.second / 3600.0 + dt.microsecond / 3.6e9) / 24.0
    
    if month <= 2:
        year -= 1
        month += 12
        
    A = math.floor(year / 100.0)
    B = 2 - A + math.floor(A / 4.0)
    jd = math.floor(365.25 * (year + 4716)) + math.floor(30.6001 * (month + 1)) + day + B - 1524.5
    return jd

def get_days_since_j2000(jd):
    """Days since standard epoch J2000.0 (2000 Jan 1.5 TD)."""
    return jd - 2451545.0

def get_gmst_hours(jd):
    """Greenwich Mean Sidereal Time in hours (0 to 24)."""
    d = get_days_since_j2000(jd)
    gmst = 18.697374558 + 24.06570982441908 * d
    return (gmst % 24.0 + 24.0) % 24.0

def get_lst_hours(jd, lon_deg):
    """Local Sidereal Time in hours for a given longitude in degrees."""
    gmst = get_gmst_hours(jd)
    lst = (gmst + lon_deg / 15.0) % 24.0
    return (lst + 24.0) % 24.0

def radec_to_altaz(ra_deg, dec_deg, lat_deg, lon_deg, jd):
    """
    Convert Equatorial coordinates (RA, Dec) to Horizontal coordinates (Alt, Az).
    Azimuth: 0 = North, 90 = East, 180 = South, 270 = West.
    Altitude: -90 (Nadir) to +90 (Zenith).
    """
    lst_deg = get_lst_hours(jd, lon_deg) * 15.0
    ha_deg = (lst_deg - ra_deg + 360.0) % 360.0
    
    ha = math.radians(ha_deg)
    dec = math.radians(dec_deg)
    lat = math.radians(lat_deg)
    
    sin_alt = math.sin(dec) * math.sin(lat) + math.cos(dec) * math.cos(lat) * math.cos(ha)
    sin_alt = max(-1.0, min(1.0, sin_alt))
    alt_rad = math.asin(sin_alt)
    
    cos_alt = math.cos(alt_rad)
    if cos_alt < 1e-6:
        az_rad = 0.0
    else:
        cos_az = (math.sin(dec) - math.sin(lat) * sin_alt) / (math.cos(lat) * cos_alt)
        cos_az = max(-1.0, min(1.0, cos_az))
        az_rad = math.acos(cos_az)
        if math.sin(ha) > 0:
            az_rad = 2 * math.pi - az_rad
            
    return math.degrees(alt_rad), math.degrees(az_rad)

def get_sun_position(jd):
    """
    Computes Sun coordinates (RA, Dec, Ecliptic Longitude, Earth Distance AU).
    Accurate to within ~0.01 degrees.
    """
    d = get_days_since_j2000(jd)
    
    # Mean anomaly & longitude
    M = math.radians((357.5291 + 0.98560028 * d) % 360.0)
    L0 = math.radians((280.46646 + 0.98564736 * d) % 360.0)
    
    # Center equation
    C = math.radians((1.914602 - 0.004817 * (d / 36525.0)) * math.sin(M) +
                     (0.019993 - 0.000101 * (d / 36525.0)) * math.sin(2 * M) +
                     0.000289 * math.sin(3 * M))
    
    true_lon = L0 + C
    ecliptic_lon_deg = math.degrees(true_lon) % 360.0
    
    # Obliquity of ecliptic
    eps = math.radians(23.439291 - 0.0130042 * (d / 36525.0))
    
    # Equatorial coordinates
    sin_dec = math.sin(eps) * math.sin(true_lon)
    dec_rad = math.asin(max(-1.0, min(1.0, sin_dec)))
    
    y = math.cos(eps) * math.sin(true_lon)
    x = math.cos(true_lon)
    ra_rad = math.atan2(y, x)
    if ra_rad < 0:
        ra_rad += 2 * math.pi
        
    ra_deg = math.degrees(ra_rad)
    dec_deg = math.degrees(dec_rad)
    
    # Distance to Sun in AU
    v = M + C
    e = 0.016708634
    r = (1.000001018 * (1 - e*e)) / (1 + e * math.cos(v))
    
    return {
        "ra": ra_deg,
        "dec": dec_deg,
        "ecliptic_lon": ecliptic_lon_deg,
        "dist_au": r
    }

def get_moon_position(jd):
    """
    Computes Moon coordinates (RA, Dec), distance in km, and lunar phase fraction (0.0=New, 0.5=Quarter, 1.0=Full).
    """
    d = get_days_since_j2000(jd)
    
    # Lunar orbital elements (degrees)
    L = math.radians((218.316 + 13.176396 * d) % 360.0)      # Mean longitude
    M = math.radians((134.963 + 13.064993 * d) % 360.0)      # Mean anomaly
    F = math.radians((93.272 + 13.229350 * d) % 360.0)       # Argument of latitude
    Ms = math.radians((357.529 + 0.985600 * d) % 360.0)      # Sun mean anomaly
    D = math.radians((297.850 + 12.190749 * d) % 360.0)      # Mean elongation
    
    # Ecliptic longitude perturbations
    l_pert = (6.289 * math.sin(M) +
              1.274 * math.sin(2 * D - M) +
              0.658 * math.sin(2 * D) +
              0.214 * math.sin(2 * M) -
              0.186 * math.sin(Ms) -
              0.114 * math.sin(2 * F))
    lon_deg = (math.degrees(L) + l_pert) % 360.0
    lon = math.radians(lon_deg)
    
    # Ecliptic latitude perturbations
    b_pert = (5.128 * math.sin(F) +
              0.280 * math.sin(M + F) +
              0.277 * math.sin(M - F) +
              0.173 * math.sin(2 * D - F))
    lat = math.radians(b_pert)
    
    # Distance in km
    dist_km = 385001 - 20905 * math.cos(M) - 3699 * math.cos(2 * D - M) - 2956 * math.cos(2 * D)
    
    # Obliquity
    eps = math.radians(23.439 - 0.00013 * (d / 365.25))
    
    # Equatorial coordinates
    sin_dec = math.sin(lat) * math.cos(eps) + math.cos(lat) * math.sin(eps) * math.sin(lon)
    dec_rad = math.asin(max(-1.0, min(1.0, sin_dec)))
    
    y = math.sin(lon) * math.cos(eps) - math.tan(lat) * math.sin(eps)
    x = math.cos(lon)
    ra_rad = math.atan2(y, x)
    if ra_rad < 0:
        ra_rad += 2 * math.pi
        
    ra_deg = math.degrees(ra_rad)
    dec_deg = math.degrees(dec_rad)
    
    # Phase calculation: elongation from Sun
    sun = get_sun_position(jd)
    elongation = math.acos(math.sin(dec_rad) * math.sin(math.radians(sun["dec"])) +
                           math.cos(dec_rad) * math.cos(math.radians(sun["dec"])) *
                           math.cos(ra_rad - math.radians(sun["ra"])))
    
    # Phase fraction (0 to 1)
    phase_fraction = (1.0 - math.cos(elongation)) / 2.0
    
    # Determine waxing vs waning
    sun_lon_rad = math.radians(sun["ecliptic_lon"])
    moon_lon_diff = (lon - sun_lon_rad) % (2 * math.pi)
    is_waxing = (moon_lon_diff < math.pi)
    
    if phase_fraction < 0.03:
        phase_name = "New Moon"
    elif phase_fraction < 0.45:
        phase_name = "Waxing Crescent" if is_waxing else "Waning Crescent"
    elif phase_fraction < 0.55:
        phase_name = "First Quarter" if is_waxing else "Last Quarter"
    elif phase_fraction < 0.97:
        phase_name = "Waxing Gibbous" if is_waxing else "Waning Gibbous"
    else:
        phase_name = "Full Moon"
        
    return {
        "ra": ra_deg,
        "dec": dec_deg,
        "dist_km": dist_km,
        "phase_fraction": phase_fraction,
        "is_waxing": is_waxing,
        "phase_name": phase_name,
        "elongation_deg": math.degrees(elongation)
    }

# Keplerian orbital elements for planets
PLANET_ELEMENTS = {
    "Mercury": {
        "N": (48.3313, 3.24587e-5), "i": (7.0047, 5.00e-8), "w": (29.1241, 1.01444e-5),
        "a": 0.387098, "e": (0.205635, 5.59e-10), "M": (168.6562, 4.0923344368),
        "color": "#d8b48f", "radius_km": 2440, "mag_v0": -0.42
    },
    "Venus": {
        "N": (76.6799, 2.46590e-5), "i": (3.3946, 2.75e-8), "w": (54.8910, 1.38374e-5),
        "a": 0.723330, "e": (0.006773, -1.302e-9), "M": (48.0052, 1.6021302244),
        "color": "#ffeaa7", "radius_km": 6052, "mag_v0": -4.40
    },
    "Mars": {
        "N": (49.5574, 2.11081e-5), "i": (1.8497, -1.78e-8), "w": (286.5016, 2.92961e-5),
        "a": 1.523688, "e": (0.093405, 2.516e-9), "M": (18.6021, 0.5240207766),
        "color": "#ff7675", "radius_km": 3390, "mag_v0": -1.52
    },
    "Jupiter": {
        "N": (100.4542, 2.76854e-5), "i": (1.3030, -1.557e-7), "w": (273.8777, 1.64505e-5),
        "a": 5.20256, "e": (0.048498, 4.469e-9), "M": (19.8950, 0.0830853001),
        "color": "#fab1a0", "radius_km": 69911, "mag_v0": -2.70
    },
    "Saturn": {
        "N": (113.6634, 2.38980e-5), "i": (2.4886, -1.081e-7), "w": (339.3939, 2.97661e-5),
        "a": 9.55475, "e": (0.055546, -9.499e-9), "M": (316.9670, 0.0334442282),
        "color": "#ffeaa7", "radius_km": 58232, "mag_v0": 0.67
    },
    "Uranus": {
        "N": (74.0005, 1.3978e-5), "i": (0.7733, 1.9e-8), "w": (96.6612, 3.0565e-5),
        "a": 19.18171, "e": (0.047318, 7.45e-9), "M": (142.5905, 0.011725806),
        "color": "#81ecec", "radius_km": 25362, "mag_v0": 5.5
    },
    "Neptune": {
        "N": (131.7806, 3.0173e-5), "i": (1.7700, -2.55e-7), "w": (272.8461, -6.027e-6),
        "a": 30.05826, "e": (0.008606, 2.15e-9), "M": (260.2471, 0.005995147),
        "color": "#74b9ff", "radius_km": 24622, "mag_v0": 7.8
    }
}

def solve_kepler(M_rad, e):
    """Solves Kepler's equation for Eccentric Anomaly E."""
    E = M_rad
    for _ in range(12):
        dE = (M_rad - (E - e * math.sin(E))) / (1.0 - e * math.cos(E))
        E += dE
        if abs(dE) < 1e-7:
            break
    return E

def get_planet_positions(jd):
    """
    Computes geocentric equatorial coordinates (RA, Dec, Distance) for all major planets.
    """
    d = get_days_since_j2000(jd)
    sun = get_sun_position(jd)
    sun_lon = math.radians(sun["ecliptic_lon"])
    sun_r = sun["dist_au"]
    
    # Earth heliocentric coordinates in ecliptic plane
    x_earth = sun_r * math.cos(sun_lon + math.pi)
    y_earth = sun_r * math.sin(sun_lon + math.pi)
    z_earth = 0.0
    
    eps = math.radians(23.439291 - 0.0130042 * (d / 36525.0))
    planets = []
    
    for name, el in PLANET_ELEMENTS.items():
        N = math.radians((el["N"][0] + el["N"][1] * d) % 360.0)
        i = math.radians(el["i"][0] + el["i"][1] * d)
        w = math.radians((el["w"][0] + el["w"][1] * d) % 360.0)
        a = el["a"]
        e = el["e"][0] + el["e"][1] * d
        M = math.radians((el["M"][0] + el["M"][1] * d) % 360.0)
        
        E = solve_kepler(M, e)
        
        # Heliocentric coordinates in orbital plane
        xv = a * (math.cos(E) - e)
        yv = a * (math.sqrt(max(0.0, 1.0 - e*e)) * math.sin(E))
        
        r = math.hypot(xv, yv)
        v = math.atan2(yv, xv)
        
        # Heliocentric ecliptic coordinates
        xh = r * (math.cos(N) * math.cos(v + w) - math.sin(N) * math.sin(v + w) * math.cos(i))
        yh = r * (math.sin(N) * math.cos(v + w) + math.cos(N) * math.sin(v + w) * math.cos(i))
        zh = r * (math.sin(v + w) * math.sin(i))
        
        # Geocentric ecliptic coordinates
        xg = xh - x_earth
        yg = yh - y_earth
        zg = zh - z_earth
        
        dist_geoc = math.sqrt(xg*xg + yg*yg + zg*zg)
        
        # Convert to equatorial coordinates
        xe = xg
        ye = yg * math.cos(eps) - zg * math.sin(eps)
        ze = yg * math.sin(eps) + zg * math.cos(eps)
        
        ra_rad = math.atan2(ye, xe)
        if ra_rad < 0:
            ra_rad += 2 * math.pi
        dec_rad = math.asin(max(-1.0, min(1.0, ze / dist_geoc)))
        
        planets.append({
            "name": name,
            "ra": math.degrees(ra_rad),
            "dec": math.degrees(dec_rad),
            "dist_au": round(dist_geoc, 4),
            "color": el["color"],
            "mag": el["mag_v0"]
        })
        
    return planets

def geodetic_to_ecef(lat_deg, lon_deg, alt_km):
    """Convert geodetic latitude, longitude, altitude to ECEF (X, Y, Z in km)."""
    phi = math.radians(lat_deg)
    lam = math.radians(lon_deg)
    sin_phi = math.sin(phi)
    cos_phi = math.cos(phi)
    
    N = WGS84_A / math.sqrt(1.0 - WGS84_E2 * sin_phi * sin_phi)
    
    x = (N + alt_km) * cos_phi * math.cos(lam)
    y = (N + alt_km) * cos_phi * math.sin(lam)
    z = (N * (1.0 - WGS84_E2) + alt_km) * sin_phi
    return x, y, z

def ecef_to_enu(sat_x, sat_y, sat_z, obs_x, obs_y, obs_z, obs_lat_deg, obs_lon_deg):
    """
    Transform relative ECEF vector to local Topocentric ENU (East, North, Up) in km,
    and compute topocentric Azimuth (deg), Elevation/Altitude (deg), and Slant Range (km).
    """
    dx = sat_x - obs_x
    dy = sat_y - obs_y
    dz = sat_z - obs_z
    
    phi = math.radians(obs_lat_deg)
    lam = math.radians(obs_lon_deg)
    
    sin_phi = math.sin(phi)
    cos_phi = math.cos(phi)
    sin_lam = math.sin(lam)
    cos_lam = math.cos(lam)
    
    east = -sin_lam * dx + cos_lam * dy
    north = -sin_phi * cos_lam * dx - sin_phi * sin_lam * dy + cos_phi * dz
    up = cos_phi * cos_lam * dx + cos_phi * sin_lam * dy + sin_phi * dz
    
    horiz_dist = math.hypot(east, north)
    slant_range = math.sqrt(east*east + north*north + up*up)
    
    elevation_deg = math.degrees(math.atan2(up, horiz_dist))
    azimuth_deg = math.degrees(math.atan2(east, north))
    if azimuth_deg < 0:
        azimuth_deg += 360.0
        
    return azimuth_deg, elevation_deg, slant_range
