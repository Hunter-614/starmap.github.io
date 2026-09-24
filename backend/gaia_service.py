"""
ESA Gaia TAP Archive Service:
- Manages connection and live queries to ESA Gaia TAP Server (ADQL over HTTP TAP sync).
- Provides pre-cached bright star catalog (Gaia DR3) for sub-millisecond local responses.
- Allows user to execute live custom ADQL queries or cone searches against gaiadr3.gaia_source.
"""

import urllib.request
import urllib.parse
import json
import os
import time
from typing import Dict, Any, List, Optional

GAIA_TAP_URL = "https://gea.esac.esa.int/tap-server/tap/sync"
CATALOG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "gaia_bright_stars.json")
CONSTELLATIONS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "constellations.json")

# In-memory storage for base catalogs
_stars_catalog: List[Dict[str, Any]] = []
_constellations: List[Dict[str, Any]] = []

def init_catalogs():
    """Load local cached catalog on startup."""
    global _stars_catalog, _constellations
    if os.path.exists(CATALOG_PATH):
        try:
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                _stars_catalog = json.load(f)
            print(f"[GaiaService] Loaded {len(_stars_catalog)} stars from {CATALOG_PATH}")
        except Exception as e:
            print(f"[GaiaService] Error loading star catalog: {e}")
            
    if os.path.exists(CONSTELLATIONS_PATH):
        try:
            with open(CONSTELLATIONS_PATH, "r", encoding="utf-8") as f:
                _constellations = json.load(f)
            print(f"[GaiaService] Loaded {len(_constellations)} constellations from {CONSTELLATIONS_PATH}")
        except Exception as e:
            print(f"[GaiaService] Error loading constellations: {e}")

def get_base_stars() -> List[Dict[str, Any]]:
    if not _stars_catalog:
        init_catalogs()
    return _stars_catalog

def get_constellations() -> List[Dict[str, Any]]:
    if not _constellations:
        init_catalogs()
    return _constellations

def execute_adql_query(query: str, timeout_sec: int = 25) -> Dict[str, Any]:
    """
    Executes a custom ADQL query on the ESA Gaia TAP Archive.
    Returns metadata, columns, execution time, and parsed star records.
    """
    start_time = time.time()
    
    # Strip dangerous or malformed statements
    clean_query = query.strip()
    if not clean_query.upper().startswith("SELECT"):
        return {
            "success": False,
            "error": "Only SELECT queries are supported on the ESA Gaia TAP service.",
            "duration_ms": 0
        }
        
    data = urllib.parse.urlencode({
        "REQUEST": "doQuery",
        "LANG": "ADQL",
        "FORMAT": "json",
        "QUERY": clean_query
    }).encode("utf-8")
    
    req = urllib.request.Request(
        GAIA_TAP_URL,
        data=data,
        headers={"User-Agent": "LocalStarMap/1.0 (IARC 425 Astronomy Project)"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            content = resp.read().decode("utf-8")
            res = json.loads(content)
            duration_ms = round((time.time() - start_time) * 1000, 1)
            
            metadata = res.get("metadata", [])
            raw_data = res.get("data", [])
            col_names = [col.get("name") for col in metadata]
            
            # Convert tabular rows to list of dicts for frontend
            rows = []
            for row in raw_data:
                rows.append(dict(zip(col_names, row)))
                
            return {
                "success": True,
                "query": clean_query,
                "columns": col_names,
                "count": len(rows),
                "duration_ms": duration_ms,
                "rows": rows[:500]  # Cap at 500 rows for browser performance
            }
    except urllib.error.HTTPError as e:
        duration_ms = round((time.time() - start_time) * 1000, 1)
        err_msg = e.read().decode("utf-8", errors="ignore")
        return {
            "success": False,
            "error": f"ESA Gaia TAP HTTP {e.code}: {err_msg}",
            "duration_ms": duration_ms
        }
    except Exception as e:
        duration_ms = round((time.time() - start_time) * 1000, 1)
        return {
            "success": False,
            "error": f"Connection error: {str(e)}",
            "duration_ms": duration_ms
        }

def cone_search(ra_deg: float, dec_deg: float, radius_deg: float = 2.0, max_mag: float = 10.0, limit: int = 150) -> Dict[str, Any]:
    """
    Performs a spatial cone search centered at (ra_deg, dec_deg) with a given radius.
    """
    query = f"""
    SELECT TOP {limit} 
        source_id, ra, dec, phot_g_mean_mag, bp_rp, parallax, pmra, pmdec 
    FROM gaiadr3.gaia_source 
    WHERE 1=CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', {ra_deg}, {dec_deg}, {radius_deg}))
      AND phot_g_mean_mag <= {max_mag}
    ORDER BY phot_g_mean_mag ASC
    """
    return execute_adql_query(query)
