"""
Script to fetch visible stars from ESA Gaia TAP Archive (Gaia DR3)
and compile a curated star catalog with proper names and constellation links.
"""

import urllib.request
import urllib.parse
import json
import os
import sys

# Canonical list of prominent named stars with J2000 coordinates, magnitude, Gaia DR3 ID, and constellation
FAMOUS_STARS = [
    {"name": "Sirius", "bayer": "Alpha Canis Majoris", "con": "CMa", "ra": 101.287, "dec": -16.716, "mag": -1.46, "bp_rp": 0.05, "dist_ly": 8.6, "gaia_id": "2945897216264871296"},
    {"name": "Canopus", "bayer": "Alpha Carinae", "con": "Car", "ra": 95.988, "dec": -52.696, "mag": -0.74, "bp_rp": 0.42, "dist_ly": 310.0, "gaia_id": "5285741364506306816"},
    {"name": "Rigil Kentaurus", "bayer": "Alpha Centauri", "con": "Cen", "ra": 219.902, "dec": -60.834, "mag": -0.01, "bp_rp": 0.85, "dist_ly": 4.37, "gaia_id": "5853498713190525696"},
    {"name": "Arcturus", "bayer": "Alpha Bootis", "con": "Boo", "ra": 213.915, "dec": 19.182, "mag": -0.05, "bp_rp": 1.25, "dist_ly": 36.7, "gaia_id": "1475335803276320000"},
    {"name": "Vega", "bayer": "Alpha Lyrae", "con": "Lyr", "ra": 279.234, "dec": 38.783, "mag": 0.03, "bp_rp": 0.00, "dist_ly": 25.04, "gaia_id": "2097891108042655616"},
    {"name": "Capella", "bayer": "Alpha Aurigae", "con": "Aur", "ra": 79.172, "dec": 45.998, "mag": 0.08, "bp_rp": 0.80, "dist_ly": 42.9, "gaia_id": "3408011244093902336"},
    {"name": "Rigel", "bayer": "Beta Orionis", "con": "Ori", "ra": 78.634, "dec": -8.201, "mag": 0.13, "bp_rp": -0.05, "dist_ly": 860.0, "gaia_id": "3200922883446059776"},
    {"name": "Procyon", "bayer": "Alpha Canis Minoris", "con": "CMi", "ra": 114.825, "dec": 5.225, "mag": 0.38, "bp_rp": 0.40, "dist_ly": 11.46, "gaia_id": "3144044431527962496"},
    {"name": "Betelgeuse", "bayer": "Alpha Orionis", "con": "Ori", "ra": 88.793, "dec": 7.407, "mag": 0.50, "bp_rp": 1.85, "dist_ly": 642.5, "gaia_id": "3226344211153724416"},
    {"name": "Achernar", "bayer": "Alpha Eridani", "con": "Eri", "ra": 24.428, "dec": -57.237, "mag": 0.46, "bp_rp": -0.15, "dist_ly": 139.0, "gaia_id": "4950853535201124224"},
    {"name": "Hadar", "bayer": "Beta Centauri", "con": "Cen", "ra": 210.956, "dec": -60.373, "mag": 0.61, "bp_rp": -0.20, "dist_ly": 390.0, "gaia_id": "5866750058226027520"},
    {"name": "Altair", "bayer": "Alpha Aquilae", "con": "Aql", "ra": 297.696, "dec": 8.868, "mag": 0.77, "bp_rp": 0.22, "dist_ly": 16.73, "gaia_id": "1829602046272936320"},
    {"name": "Acrux", "bayer": "Alpha Crucis", "con": "Cru", "ra": 186.649, "dec": -63.099, "mag": 0.76, "bp_rp": -0.25, "dist_ly": 320.0, "gaia_id": "5861448880579979776"},
    {"name": "Aldebaran", "bayer": "Alpha Tauri", "con": "Tau", "ra": 68.980, "dec": 16.509, "mag": 0.85, "bp_rp": 1.54, "dist_ly": 65.3, "gaia_id": "3313936648792615936"},
    {"name": "Antares", "bayer": "Alpha Scorpii", "con": "Sco", "ra": 247.352, "dec": -26.432, "mag": 1.06, "bp_rp": 1.80, "dist_ly": 550.0, "gaia_id": "6045142079836371584"},
    {"name": "Spica", "bayer": "Alpha Virginis", "con": "Vir", "ra": 201.298, "dec": -11.161, "mag": 0.98, "bp_rp": -0.23, "dist_ly": 250.0, "gaia_id": "3668700206969566976"},
    {"name": "Pollux", "bayer": "Beta Geminorum", "con": "Gem", "ra": 116.166, "dec": 28.026, "mag": 1.14, "bp_rp": 1.00, "dist_ly": 33.78, "gaia_id": "875487902631580288"},
    {"name": "Fomalhaut", "bayer": "Alpha Piscis Austrini", "con": "PsA", "ra": 344.413, "dec": -29.622, "mag": 1.16, "bp_rp": 0.10, "dist_ly": 25.13, "gaia_id": "6612711018805626240"},
    {"name": "Deneb", "bayer": "Alpha Cygni", "con": "Cyg", "ra": 310.358, "dec": 45.280, "mag": 1.25, "bp_rp": 0.09, "dist_ly": 2615.0, "gaia_id": "2080345224376176384"},
    {"name": "Mimosa", "bayer": "Beta Crucis", "con": "Cru", "ra": 191.930, "dec": -59.689, "mag": 1.25, "bp_rp": -0.23, "dist_ly": 280.0, "gaia_id": "5862706312457223040"},
    {"name": "Regulus", "bayer": "Alpha Leonis", "con": "Leo", "ra": 152.093, "dec": 11.967, "mag": 1.35, "bp_rp": -0.11, "dist_ly": 79.3, "gaia_id": "3845914619420956288"},
    {"name": "Adhara", "bayer": "Epsilon Canis Majoris", "con": "CMa", "ra": 104.656, "dec": -28.972, "mag": 1.50, "bp_rp": -0.21, "dist_ly": 430.0, "gaia_id": "2919927506941198592"},
    {"name": "Castor", "bayer": "Alpha Geminorum", "con": "Gem", "ra": 113.650, "dec": 31.888, "mag": 1.58, "bp_rp": 0.05, "dist_ly": 51.0, "gaia_id": "875083162799307776"},
    {"name": "Gacrux", "bayer": "Gamma Crucis", "con": "Cru", "ra": 187.791, "dec": -57.113, "mag": 1.64, "bp_rp": 1.60, "dist_ly": 88.6, "gaia_id": "5863897491790074240"},
    {"name": "Shaula", "bayer": "Lambda Scorpii", "con": "Sco", "ra": 263.402, "dec": -37.104, "mag": 1.62, "bp_rp": -0.22, "dist_ly": 570.0, "gaia_id": "5961358941013725184"},
    {"name": "Bellatrix", "bayer": "Gamma Orionis", "con": "Ori", "ra": 81.283, "dec": 6.350, "mag": 1.64, "bp_rp": -0.22, "dist_ly": 250.0, "gaia_id": "3277073289069152384"},
    {"name": "Elnath", "bayer": "Beta Tauri", "con": "Tau", "ra": 81.573, "dec": 28.607, "mag": 1.65, "bp_rp": -0.13, "dist_ly": 134.0, "gaia_id": "3441584988673752576"},
    {"name": "Miaplacidus", "bayer": "Beta Carinae", "con": "Car", "ra": 138.300, "dec": -69.717, "mag": 1.68, "bp_rp": -0.05, "dist_ly": 113.0, "gaia_id": "5246757134444583936"},
    {"name": "Alnilam", "bayer": "Epsilon Orionis", "con": "Ori", "ra": 84.053, "dec": -1.202, "mag": 1.69, "bp_rp": -0.19, "dist_ly": 2000.0, "gaia_id": "3215286591349887744"},
    {"name": "Alnitak", "bayer": "Zeta Orionis", "con": "Ori", "ra": 85.190, "dec": -1.943, "mag": 1.77, "bp_rp": -0.20, "dist_ly": 1260.0, "gaia_id": "3214815413120199424"},
    {"name": "Alioth", "bayer": "Epsilon Ursae Majoris", "con": "UMa", "ra": 193.507, "dec": 55.960, "mag": 1.77, "bp_rp": -0.02, "dist_ly": 82.6, "gaia_id": "1576683529448755328"},
    {"name": "Dubhe", "bayer": "Alpha Ursae Majoris", "con": "UMa", "ra": 165.932, "dec": 61.751, "mag": 1.79, "bp_rp": 1.07, "dist_ly": 123.0, "gaia_id": "1048684724213192064"},
    {"name": "Mirfak", "bayer": "Alpha Persei", "con": "Per", "ra": 51.081, "dec": 49.861, "mag": 1.80, "bp_rp": 0.48, "dist_ly": 510.0, "gaia_id": "452588147101869824"},
    {"name": "Wezen", "bayer": "Delta Canis Majoris", "con": "CMa", "ra": 107.098, "dec": -26.393, "mag": 1.83, "bp_rp": 0.67, "dist_ly": 1600.0, "gaia_id": "2923504381289139584"},
    {"name": "Alkaid", "bayer": "Eta Ursae Majoris", "con": "UMa", "ra": 206.885, "dec": 49.313, "mag": 1.86, "bp_rp": -0.19, "dist_ly": 103.9, "gaia_id": "1510374147844219904"},
    {"name": "Polaris", "bayer": "Alpha Ursae Minoris", "con": "UMi", "ra": 37.954, "dec": 89.264, "mag": 1.98, "bp_rp": 0.60, "dist_ly": 433.0, "gaia_id": "581635098634142336"},
    {"name": "Alpheratz", "bayer": "Alpha Andromedae", "con": "And", "ra": 2.097, "dec": 29.090, "mag": 2.06, "bp_rp": -0.11, "dist_ly": 97.0, "gaia_id": "385800040685237760"},
    {"name": "Hamal", "bayer": "Alpha Arietis", "con": "Ari", "ra": 31.793, "dec": 23.462, "mag": 2.01, "bp_rp": 1.15, "dist_ly": 65.8, "gaia_id": "58197779780182656"},
    {"name": "Denebola", "bayer": "Beta Leonis", "con": "Leo", "ra": 177.265, "dec": 14.572, "mag": 2.14, "bp_rp": 0.11, "dist_ly": 35.9, "gaia_id": "3810167699778401920"},
    {"name": "Algol", "bayer": "Beta Persei", "con": "Per", "ra": 47.042, "dec": 40.956, "mag": 2.12, "bp_rp": -0.05, "dist_ly": 90.0, "gaia_id": "233827471908953984"},
    {"name": "Saiph", "bayer": "Kappa Orionis", "con": "Ori", "ra": 86.939, "dec": -9.670, "mag": 2.07, "bp_rp": -0.18, "dist_ly": 650.0, "gaia_id": "3015409390299616000"},
    {"name": "Merak", "bayer": "Beta Ursae Majoris", "con": "UMa", "ra": 165.460, "dec": 56.382, "mag": 2.37, "bp_rp": 0.00, "dist_ly": 79.7, "gaia_id": "848249071477789440"},
    {"name": "Phecda", "bayer": "Gamma Ursae Majoris", "con": "UMa", "ra": 178.458, "dec": 53.695, "mag": 2.44, "bp_rp": 0.03, "dist_ly": 83.2, "gaia_id": "847250684742749440"},
    {"name": "Megrez", "bayer": "Delta Ursae Majoris", "con": "UMa", "ra": 183.857, "dec": 57.032, "mag": 3.31, "bp_rp": 0.08, "dist_ly": 80.5, "gaia_id": "1567406161989446272"},
    {"name": "Mizar", "bayer": "Zeta Ursae Majoris", "con": "UMa", "ra": 200.981, "dec": 54.925, "mag": 2.23, "bp_rp": 0.02, "dist_ly": 82.9, "gaia_id": "1566410313467645824"},
    {"name": "Alcor", "bayer": "80 Ursae Majoris", "con": "UMa", "ra": 201.300, "dec": 54.988, "mag": 3.99, "bp_rp": 0.16, "dist_ly": 81.7, "gaia_id": "1566415707938361728"},
    {"name": "Caph", "bayer": "Beta Cassiopeiae", "con": "Cas", "ra": 2.295, "dec": 59.150, "mag": 2.28, "bp_rp": 0.34, "dist_ly": 54.7, "gaia_id": "428258284872937728"},
    {"name": "Schedar", "bayer": "Alpha Cassiopeiae", "con": "Cas", "ra": 10.127, "dec": 56.537, "mag": 2.24, "bp_rp": 1.17, "dist_ly": 228.0, "gaia_id": "418551920284673408"},
    {"name": "Navi", "bayer": "Gamma Cassiopeiae", "con": "Cas", "ra": 14.177, "dec": 60.717, "mag": 2.15, "bp_rp": -0.15, "dist_ly": 550.0, "gaia_id": "429712711693892736"},
    {"name": "Ruchbah", "bayer": "Delta Cassiopeiae", "con": "Cas", "ra": 19.595, "dec": 60.235, "mag": 2.68, "bp_rp": 0.13, "dist_ly": 99.4, "gaia_id": "432617757962464768"},
    {"name": "Segin", "bayer": "Epsilon Cassiopeiae", "con": "Cas", "ra": 26.104, "dec": 63.670, "mag": 3.35, "bp_rp": -0.15, "dist_ly": 460.0, "gaia_id": "435133333333333333"},
    {"name": "Markab", "bayer": "Alpha Pegasi", "con": "Peg", "ra": 346.190, "dec": 15.205, "mag": 2.49, "bp_rp": -0.04, "dist_ly": 133.0, "gaia_id": "2768560037190089728"},
    {"name": "Scheat", "bayer": "Beta Pegasi", "con": "Peg", "ra": 345.944, "dec": 28.083, "mag": 2.44, "bp_rp": 1.65, "dist_ly": 196.0, "gaia_id": "1931505822369619328"},
    {"name": "Algenib", "bayer": "Gamma Pegasi", "con": "Peg", "ra": 3.309, "dec": 15.184, "mag": 2.84, "bp_rp": -0.23, "dist_ly": 390.0, "gaia_id": "2781421453257929472"},
    {"name": "Enif", "bayer": "Epsilon Pegasi", "con": "Peg", "ra": 326.046, "dec": 9.875, "mag": 2.38, "bp_rp": 1.54, "dist_ly": 690.0, "gaia_id": "1738724490895311232"},
    {"name": "Sadr", "bayer": "Gamma Cygni", "con": "Cyg", "ra": 305.557, "dec": 40.257, "mag": 2.23, "bp_rp": 0.67, "dist_ly": 1800.0, "gaia_id": "2065842858548981632"},
    {"name": "Gienah", "bayer": "Epsilon Cygni", "con": "Cyg", "ra": 311.539, "dec": 33.970, "mag": 2.48, "bp_rp": 1.03, "dist_ly": 73.0, "gaia_id": "1863581335431610496"},
    {"name": "Albireo", "bayer": "Beta Cygni", "con": "Cyg", "ra": 292.680, "dec": 27.960, "mag": 3.05, "bp_rp": 1.15, "dist_ly": 430.0, "gaia_id": "1831818274026362880"},
    {"name": "Mintaka", "bayer": "Delta Orionis", "con": "Ori", "ra": 83.002, "dec": -0.299, "mag": 2.25, "bp_rp": -0.22, "dist_ly": 1200.0, "gaia_id": "3219491873105742464"}
]

def fetch_gaia_stars(limit_mag=5.5):
    print(f"Fetching Gaia DR3 stars with phot_g_mean_mag <= {limit_mag} from ESA TAP...")
    query = f"""
    SELECT source_id, ra, dec, phot_g_mean_mag, bp_rp, parallax, pmra, pmdec 
    FROM gaiadr3.gaia_source 
    WHERE phot_g_mean_mag <= {limit_mag} 
    ORDER BY phot_g_mean_mag ASC
    """
    url = "https://gea.esac.esa.int/tap-server/tap/sync"
    data = urllib.parse.urlencode({
        "REQUEST": "doQuery",
        "LANG": "ADQL",
        "FORMAT": "json",
        "QUERY": query
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=data, headers={"User-Agent": "LocalStarMap/1.0"})
    with urllib.request.urlopen(req, timeout=45) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        rows = res.get("data", [])
        print(f"Downloaded {len(rows)} stars from ESA Gaia DR3.")
        return rows

def build_combined_catalog():
    gaia_rows = fetch_gaia_stars(limit_mag=5.5)
    
    # Map famous stars into a spatial lookup or id lookup
    stars_list = []
    
    # First, add all FAMOUS_STARS with their high-fidelity properties
    added_coords = []
    for fs in FAMOUS_STARS:
        stars_list.append({
            "id": fs["gaia_id"],
            "name": fs["name"],
            "bayer": fs.get("bayer", ""),
            "con": fs.get("con", ""),
            "ra": round(fs["ra"], 4),
            "dec": round(fs["dec"], 4),
            "mag": round(fs["mag"], 2),
            "bp_rp": round(fs.get("bp_rp", 0.5), 2),
            "dist_ly": round(fs.get("dist_ly", 100.0), 1),
            "source": "Gaia DR3 / Hipparcos"
        })
        added_coords.append((fs["ra"], fs["dec"]))
    
    # Now merge Gaia rows, skipping if too close to an already added famous star (< 0.1 deg)
    for r in gaia_rows:
        src_id, ra, dec, g_mag, bp_rp, plx, pmra, pmdec = r
        if ra is None or dec is None or g_mag is None:
            continue
            
        # Check proximity to known famous star to avoid double-rendering saturated star
        duplicate = False
        for fra, fdec in added_coords:
            if abs(ra - fra) < 0.08 and abs(dec - fdec) < 0.08:
                duplicate = True
                break
        if duplicate:
            continue
            
        dist_ly = None
        if plx and plx > 0:
            dist_ly = round((1000.0 / plx) * 3.26156, 1)
            
        stars_list.append({
            "id": str(src_id),
            "name": "",
            "bayer": "",
            "con": "",
            "ra": round(ra, 4),
            "dec": round(dec, 4),
            "mag": round(g_mag, 2),
            "bp_rp": round(bp_rp, 2) if bp_rp is not None else 0.5,
            "dist_ly": dist_ly,
            "source": "Gaia DR3"
        })
        
    print(f"Total curated stars in catalog: {len(stars_list)}")
    
    out_path = os.path.join("data", "gaia_bright_stars.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(stars_list, f, separators=(',', ':'))
    print(f"Saved catalog to {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")

if __name__ == "__main__":
    build_combined_catalog()
