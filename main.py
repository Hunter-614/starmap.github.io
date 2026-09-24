"""
Main launcher for the Local Star Map & ISS Observatory.
Run:
    python main.py
"""

import sys
import os
import webbrowser
import socket

def is_port_available(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) != 0

def find_available_port(start_port: int = 8000) -> int:
    port = start_port
    while port < start_port + 50:
        if is_port_available(port):
            return port
        port += 1
    return start_port

def main():
    print("=" * 65)
    print("    LOCAL STAR MAP & ISS TRACKER OBSERVATORY")
    print("    Powered by ESA Gaia TAP Archive & Live Space Telemetry")
    print("=" * 65)
    
    # Ensure data exists
    stars_file = os.path.join(os.path.dirname(__file__), "data", "gaia_bright_stars.json")
    if not os.path.exists(stars_file):
        print("\n[*] Initializing ESA Gaia DR3 star catalog...")
        from scripts.fetch_gaia_catalog import build_combined_catalog
        build_combined_catalog()
        
    con_file = os.path.join(os.path.dirname(__file__), "data", "constellations.json")
    if not os.path.exists(con_file):
        print("\n[*] Initializing constellation geometries...")
        from scripts.build_constellations import save_constellations
        save_constellations()
        
    port = find_available_port(8000)
    url = f"http://localhost:{port}"
    
    print(f"\n[+] Local Server starting at: {url}")
    print(f"[+] Opening browser automatically...")
    print(f"[+] Press Ctrl+C in terminal to stop server.\n")
    
    # Try opening browser after a brief delay
    import threading
    import time
    def open_browser():
        time.sleep(1.2)
        try:
            webbrowser.open(url)
        except Exception:
            pass
            
    threading.Thread(target=open_browser, daemon=True).start()
    
    import uvicorn
    uvicorn.run("backend.server:app", host="127.0.0.1", port=port, log_level="info")

if __name__ == "__main__":
    main()
