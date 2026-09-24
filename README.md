# Local Star Map & ISS Observatory
**Interactive Topocentric Planetarium powered by the European Space Agency (ESA) Gaia Archive TAP API and Live ISS Spacecraft Telemetry.**

Designed for **IARC 425: Module B (Star Project)**.

---

## 🌟 Key Features

1. **ESA Gaia DR3 Integration**:
   - Access to **Gaia DR3** (`gaiadr3.gaia_source`) via official Table Access Protocol (TAP) ADQL queries (`https://gea.esac.esa.int/tap-server/tap/sync`).
   - Pre-cached local high-precision catalog of **3,880 bright stars** with Gaia Source IDs, Right Ascension, Declination, G-band magnitudes, $BP - RP$ color indices, and parallax distances.
   - **Live ADQL Query Console**: Execute real-time queries directly into ESA's TAP server (cone searches, magnitude cuts, stellar clusters like Pleiades, Orion Belt, Polaris) with execution metrics and dynamic overlay on the star map.

2. **Accurate Topocentric Local Sky Dome**:
   - Converts Equatorial coordinates $(\alpha, \delta)$ into the observer's local horizontal coordinates (Altitude $h$, Azimuth $A$) using Julian Date, Greenwich Mean Sidereal Time (GMST), and Local Sidereal Time (LST).
   - **Dual Viewing Modes**:
     - **All-Sky Planisphere (Dome View)**: 360° stereographic fisheye projection looking straight up into the night sky, with Zenith $(h=90^\circ)$ in the center, Cardinal points (N, NE, E, SE, S, SW, W, NW), and altitude circles $(0^\circ, 30^\circ, 60^\circ)$.
     - **Virtual Horizon Panorama**: First-person ground-level viewpoint looking toward the horizon with horizontal azimuth panning and vertical pitch.
   - **Realistic Atmosphere & Twilight**:
     - Calculates solar elevation to render realistic day blue sky, golden hour, Civil Twilight $(-6^\circ)$, Nautical Twilight $(-12^\circ)$, Astronomical Twilight $(-18^\circ)$, and dark starlight.
     - Toggleable atmospheric scattering to stargaze in daytime or night.

3. **Current Constellations & Star Lore**:
   - Standard **IAU 88 constellation line stick figures** connecting major anchor stars across Northern and Southern skies (Orion, Ursa Major / Big Dipper, Cassiopeia, Cygnus, Crux / Southern Cross, Scorpius, Taurus, Gemini, Leo, Pegasus, etc.).
   - Interactive constellation highlighting and labels.

4. **Planetary & Lunar Ephemeris**:
   - Real-time Keplerian orbital calculations for **Mercury, Venus, Mars, Jupiter (with ring angle indicator), Saturn, Uranus, and Neptune**.
   - **Moon**: Topocentric altitude/azimuth, distance in km, exact phase fraction, illuminated crescent/gibbous rendering, and phase classification (Waxing/Waning Crescent, Gibbous, Quarter, Full Moon).
   - **Sun**: Current altitude, sunrise/sunset twilight phases.

5. **Live ISS (International Space Station) Tracking & Path**:
   - Real-time satellite telemetry (latitude, longitude, altitude ~420 km, velocity ~27,600 km/h, sunlight/eclipse illumination).
   - **Mini ISS Spacecraft Visuals (`Source Images/ISS.png`)**:
     - Miniature, high-resolution rendering of the ISS spacecraft with transparent background, solar arrays, and module structures.
     - **Celestial Sky Dome Projection**: When ISS is above the horizon ($h > 0^\circ$), renders the mini ISS spacecraft oriented along its orbital flight vector with animated pulsing beacon rings and live altitude/distance badges.
     - **2D World Ground Track Radar**: Renders the mini ISS spacecraft gliding across the world map in real-time sync, oriented along its ground track bearing with expanding radar ping rings.
     - **Below-Horizon Radar Approach Indicator**: Displays a mini ISS thumbnail on the planisphere azimuth rim indicating the satellite's approach bearing before it rises.
     - **Dynamic Real-Time & Time-Warp Orbit Propagation**: Satellite position updates smoothly at 60 FPS in real-time and during accelerated time playback (60x to 7200x) and time scrub.
   - **WGS84 ECEF to ENU Topocentric Transform**:
     - Converts geodetic satellite coordinates into observer-centric **Altitude (Elevation)** and **Azimuth** angles.
   - **Orbital Trail**: Plots past 45-minute and future 45-minute trajectory across the local sky dome.
   - **Ground Track Radar**: Miniature world map projection showing the sub-satellite point, ground track, and observer's horizon footprint circle.
6. **Astronomer's Toolkit**:
   - **Global Location Search & Geocoding**: Real-time autocomplete search across 150+ major cities and world-class astronomical observatories (Mauna Kea, Paranal, La Palma, Greenwich, Kitt Peak), plus live OpenStreetMap Nominatim geocoding to search any town, city, or address on Earth.
   - **Time Travel**: Scrub through the 24 hours of the day, accelerated playback (1x, 60x, 300x, 1800x, 7200x), jump to Sunset, Midnight, Sunrise, or Real-time.
   - **Star & Object Inspector**: Click any star, planet, or ISS to view Gaia Source ID, apparent magnitude, $BP - RP$ index, estimated surface temperature, distance in light-years, RA/Dec, and Alt/Az.
   - **Night Vision Mode (Red Light)**: Preserves human dark adaptation for actual telescope viewing.
   - **Universal Search**: Type any star, constellation, or planet to locate and inspect it immediately.

---

## 🚀 Quick Start

### Option 1: Run with Python FastAPI (Recommended)
This starts the local web server with the full ESA Gaia TAP query proxy and real-time ISS tracking:

```bash
python main.py
```

The terminal will automatically open your default browser to:
```
http://localhost:8000
```

### Option 2: Run Standalone HTML (Zero Dependencies)
You can also directly open `index.html` in any web browser (Google Chrome, Microsoft Edge, Firefox, Safari). It features built-in fallback mathematical ephemeris and direct API clients.

---

## 📁 Project Architecture

```
Star Project/
├── main.py                     # Main launcher script (starts uvicorn & opens browser)
├── index.html                  # Standalone client application
├── requirements.txt            # Python dependencies (fastapi, uvicorn, httpx)
├── backend/
│   ├── server.py               # FastAPI application with REST API endpoints & CORS
│   ├── astronomy.py            # Core math: Julian Date, LST, Alt/Az, Sun, Moon, Planets, ENU
│   ├── gaia_service.py         # ESA Gaia TAP Archive client (ADQL query executor & cache)
│   └── iss_service.py          # ISS orbital tracking, WGS84 ECEF -> ENU, topocentric pass prediction
├── data/
│   ├── gaia_bright_stars.json  # 3,880 Gaia DR3 stars (m_G <= 5.5 + named stars)
│   └── constellations.json     # IAU constellation stick lines and center coordinates
├── scripts/
│   ├── fetch_gaia_catalog.py   # Script to update/fetch bright stars from ESA Gaia TAP
│   └── build_constellations.py # Generates constellation stick-figure geometries
└── static/
    ├── index.html              # Main observatory HTML interface
    ├── css/
    │   └── style.css           # Glassmorphism dark observatory stylesheet & night vision
    └── js/
        ├── astronomy.js        # Client-side 60 FPS astronomy calculation engine
        ├── skymap.js           # HTML5 Canvas planetarium renderer (Dome & Panorama)
        ├── iss.js              # ISS real-time polling & 2D world radar mini-map
        ├── gaia.js             # ESA Gaia TAP ADQL query manager & live data table
        └── app.js              # Master UI orchestrator, time warp, and search
```

---

## 🧮 Mathematical Reference

### 1. Equatorial to Horizontal Coordinates
Given Right Ascension $\alpha$, Declination $\delta$, Observer Latitude $\varphi$, and Longitude $\lambda$:
$$\text{GMST} = 18.697374558 + 24.06570982441908 \times d$$
$$\text{LST} = \text{GMST} + \frac{\lambda}{15.0} \pmod{24}$$
$$\text{HA} = \text{LST} \times 15.0 - \alpha$$
$$\sin(h) = \sin(\delta)\sin(\varphi) + \cos(\delta)\cos(\varphi)\cos(\text{HA})$$
$$\cos(A) = \frac{\sin(\delta) - \sin(\varphi)\sin(h)}{\cos(\varphi)\cos(h)}$$

### 2. Satellite (ISS) Topocentric Position
Satellite geodetic position $(\phi_{sat}, \lambda_{sat}, h_{sat})$ and observer position $(\phi_{obs}, \lambda_{obs}, h_{obs})$ are converted into WGS84 Earth-Centered Earth-Fixed (ECEF) Cartesian coordinates:
$$X = (N + h)\cos\phi\cos\lambda,\quad Y = (N + h)\cos\phi\sin\lambda,\quad Z = (N(1 - e^2) + h)\sin\phi$$
The relative displacement vector $\Delta\vec{R} = \vec{R}_{sat} - \vec{R}_{obs}$ is projected onto the local East, North, Up (ENU) frame to yield:
$$\text{Elevation} = \arctan\left(\frac{U}{\sqrt{E^2 + N^2}}\right),\quad \text{Azimuth} = \text{atan2}(E, N)$$

---

## 📡 ESA Gaia TAP ADQL Query Example
To query stars directly from ESA Gaia DR3:
```sql
SELECT TOP 100 
    source_id, ra, dec, phot_g_mean_mag, bp_rp, parallax 
FROM gaiadr3.gaia_source 
WHERE phot_g_mean_mag <= 4.0
ORDER BY phot_g_mean_mag ASC
```
You can type or paste any valid ADQL query into the built-in **ESA Gaia TAP** tab to pull live data from ESAC into the observatory in real-time.
