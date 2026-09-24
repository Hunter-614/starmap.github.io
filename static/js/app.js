/**
 * Local Star Map & ISS Observatory - Main Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Cities & Astronomical Observatories database
  const CITIES = [
    // World Astronomical Observatories
    { name: "Mauna Kea Observatory, Hawaii", category: "Observatory", lat: 19.8207, lon: -155.4681 },
    { name: "Paranal Observatory (VLT), Chile", category: "Observatory", lat: -24.6273, lon: -70.4042 },
    { name: "Roque de los Muchachos, La Palma", category: "Observatory", lat: 28.7566, lon: -17.8920 },
    { name: "Royal Observatory Greenwich, UK", category: "Observatory", lat: 51.4769, lon: -0.0005 },
    { name: "Kitt Peak National Observatory, AZ", category: "Observatory", lat: 31.9583, lon: -111.5967 },
    { name: "Lowell Observatory, Flagstaff AZ", category: "Observatory", lat: 35.2033, lon: -111.6647 },
    { name: "Palomar Observatory, California", category: "Observatory", lat: 33.3563, lon: -116.8650 },
    { name: "Siding Spring Observatory, Australia", category: "Observatory", lat: -31.2756, lon: 149.0644 },
    { name: "ALMA Chajnantor Plateau, Chile", category: "Observatory", lat: -23.0292, lon: -67.7550 },
    { name: "South Pole Station, Antarctica", category: "Observatory", lat: -90.0000, lon: 0.0000 },

    // North America
    { name: "New York, USA", category: "City", lat: 40.7128, lon: -74.0060 },
    { name: "Los Angeles, USA", category: "City", lat: 34.0522, lon: -118.2437 },
    { name: "Chicago, USA", category: "City", lat: 41.8781, lon: -87.6298 },
    { name: "Houston, USA", category: "City", lat: 29.7604, lon: -95.3698 },
    { name: "Phoenix, USA", category: "City", lat: 33.4484, lon: -112.0740 },
    { name: "Eugene, Oregon, USA", category: "City", lat: 44.0521, lon: -123.0868 },
    { name: "Seattle, USA", category: "City", lat: 47.6062, lon: -122.3321 },
    { name: "San Francisco, USA", category: "City", lat: 37.7749, lon: -122.4194 },
    { name: "Denver, USA", category: "City", lat: 39.7392, lon: -104.9903 },
    { name: "Boston, USA", category: "City", lat: 42.3601, lon: -71.0589 },
    { name: "Washington DC, USA", category: "City", lat: 38.9072, lon: -77.0369 },
    { name: "Miami, USA", category: "City", lat: 25.7617, lon: -80.1918 },
    { name: "Austin, Texas, USA", category: "City", lat: 30.2672, lon: -97.7431 },
    { name: "Portland, Oregon, USA", category: "City", lat: 45.5152, lon: -122.6784 },
    { name: "Honolulu, Hawaii, USA", category: "City", lat: 21.3069, lon: -157.8583 },
    { name: "Anchorage, Alaska, USA", category: "City", lat: 61.2181, lon: -149.9003 },
    { name: "Toronto, Canada", category: "City", lat: 43.6532, lon: -79.3832 },
    { name: "Vancouver, Canada", category: "City", lat: 49.2827, lon: -123.1207 },
    { name: "Montreal, Canada", category: "City", lat: 45.5017, lon: -73.5673 },
    { name: "Mexico City, Mexico", category: "City", lat: 19.4326, lon: -99.1332 },

    // Europe
    { name: "London, UK", category: "City", lat: 51.5074, lon: -0.1278 },
    { name: "Paris, France", category: "City", lat: 48.8566, lon: 2.3522 },
    { name: "Berlin, Germany", category: "City", lat: 52.5200, lon: 13.4050 },
    { name: "Madrid, Spain", category: "City", lat: 40.4168, lon: -3.7038 },
    { name: "Rome, Italy", category: "City", lat: 41.9028, lon: 12.4964 },
    { name: "Amsterdam, Netherlands", category: "City", lat: 52.3676, lon: 4.9041 },
    { name: "Vienna, Austria", category: "City", lat: 48.2082, lon: 16.3738 },
    { name: "Athens, Greece", category: "City", lat: 37.9838, lon: 23.7275 },
    { name: "Stockholm, Sweden", category: "City", lat: 59.3293, lon: 18.0686 },
    { name: "Reykjavik, Iceland", category: "City", lat: 64.1466, lon: -21.9426 },
    { name: "Dublin, Ireland", category: "City", lat: 53.3498, lon: -6.2603 },
    { name: "Oslo, Norway", category: "City", lat: 59.9139, lon: 10.7522 },
    { name: "Zurich, Switzerland", category: "City", lat: 47.3769, lon: 8.5417 },
    { name: "Prague, Czechia", category: "City", lat: 50.0755, lon: 14.4378 },

    // Asia & Pacific
    { name: "Tokyo, Japan", category: "City", lat: 35.6762, lon: 139.6503 },
    { name: "Kyoto, Japan", category: "City", lat: 35.0116, lon: 135.7681 },
    { name: "Beijing, China", category: "City", lat: 39.9042, lon: 116.4074 },
    { name: "Shanghai, China", category: "City", lat: 31.2304, lon: 121.4737 },
    { name: "Seoul, South Korea", category: "City", lat: 37.5665, lon: 126.9780 },
    { name: "Singapore", category: "City", lat: 1.3521, lon: 103.8198 },
    { name: "Hong Kong", category: "City", lat: 22.3193, lon: 114.1694 },
    { name: "Bangkok, Thailand", category: "City", lat: 13.7563, lon: 100.5018 },
    { name: "Mumbai, India", category: "City", lat: 19.0760, lon: 72.8777 },
    { name: "New Delhi, India", category: "City", lat: 28.6139, lon: 77.2090 },
    { name: "Dubai, UAE", category: "City", lat: 25.2048, lon: 55.2708 },
    { name: "Sydney, Australia", category: "City", lat: -33.8688, lon: 151.2093 },
    { name: "Melbourne, Australia", category: "City", lat: -37.8136, lon: 144.9631 },
    { name: "Auckland, New Zealand", category: "City", lat: -36.8485, lon: 174.7633 },

    // South America & Africa
    { name: "Santiago, Chile", category: "City", lat: -33.4489, lon: -70.6693 },
    { name: "Buenos Aires, Argentina", category: "City", lat: -34.6037, lon: -58.3816 },
    { name: "São Paulo, Brazil", category: "City", lat: -23.5505, lon: -46.6333 },
    { name: "Rio de Janeiro, Brazil", category: "City", lat: -22.9068, lon: -43.1729 },
    { name: "Lima, Peru", category: "City", lat: -12.0464, lon: -77.0428 },
    { name: "Cairo, Egypt", category: "City", lat: 30.0444, lon: 31.2357 },
    { name: "Cape Town, South Africa", category: "City", lat: -33.9249, lon: 18.4241 },
    { name: "Nairobi, Kenya", category: "City", lat: -1.2921, lon: 36.8219 }
  ];

  // App State
  const state = {
    lat: 40.7128,
    lon: -74.0060,
    cityName: "New York, USA",
    currentTime: new Date(),
    isPlaying: false,
    speedMultiplier: 1, // 1x, 60x, 300x, 1800x, 7200x
    lastFrameTime: performance.now(),
    skymap: null,
    issTracker: null,
    gaiaConsole: null
  };

  // 1. Initialize SkyMap
  const skymap = new SkyMap('skymap-canvas', {
    mode: 'planisphere'
  });
  state.skymap = skymap;
  skymap.setObserver(state.lat, state.lon);
  skymap.setDate(state.currentTime);

  // 2. Initialize ISS Tracker
  const issTracker = new ISSTracker({
    radarCanvasId: 'iss-radar-canvas',
    lat: state.lat,
    lon: state.lon,
    onUpdate: (data) => {
      skymap.setData({ iss: data });
    }
  });
  state.issTracker = issTracker;
  issTracker.start(3000);

  // 3. Initialize Gaia Console
  const gaiaConsole = new GaiaConsole({ skymap });
  state.gaiaConsole = gaiaConsole;
  window.gaiaConsole = gaiaConsole;

  // 4. Load Base Stars and Constellations
  loadInitialData();

  // 5. Setup UI Event Listeners
  setupLocationControls();
  setupTimeControls();
  setupDisplayToggles();
  setupSearch();
  setupInspectorModal();

  // 6. Animation Loop
  function animate(now) {
    const deltaSec = (now - state.lastFrameTime) / 1000.0;
    state.lastFrameTime = now;

    if (state.isPlaying) {
      const advancedMs = deltaSec * 1000 * state.speedMultiplier;
      state.currentTime = new Date(state.currentTime.getTime() + advancedMs);
      skymap.setDate(state.currentTime);
      updateClockDisplay();
      updateTimeSlider();
      if (state.issTracker) {
        state.issTracker.renderRadar(state.currentTime.getTime() / 1000);
        state.issTracker.updateHUD(state.currentTime.getTime() / 1000);
      }
    } else {
      skymap.render();
      if (state.issTracker) {
        state.issTracker.renderRadar();
      }
    }

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // ----------------------------------------------------
  // Initial Data Loading
  // ----------------------------------------------------
  async function loadInitialData() {
    try {
      const isStaticHost = location.hostname.includes('github.io') || location.protocol === 'file:' || !location.port;
      let stars = [];
      let constellations = [];

      // If running with local FastAPI server, try API endpoints first
      if (!isStaticHost) {
        try {
          const starResp = await fetch('/api/stars');
          if (starResp.ok) stars = await starResp.json();
          const conResp = await fetch('/api/constellations');
          if (conResp.ok) constellations = await conResp.json();
        } catch (e) {}
      }

      // Static fallback / GitHub Pages relative data loading
      if (!stars.length) {
        try {
          const starResp = await fetch('./data/gaia_bright_stars.json');
          if (starResp.ok) stars = await starResp.json();
        } catch (e) {
          const starResp = await fetch('../data/gaia_bright_stars.json');
          if (starResp.ok) stars = await starResp.json();
        }
      }

      if (!constellations.length) {
        try {
          const conResp = await fetch('./data/constellations.json');
          if (conResp.ok) constellations = await conResp.json();
        } catch (e) {
          const conResp = await fetch('../data/constellations.json');
          if (conResp.ok) constellations = await conResp.json();
        }
      }

      skymap.setData({ stars, constellations });
      const statStars = document.getElementById('stat-stars-count');
      if (statStars) statStars.textContent = stars.length.toLocaleString();

      const statCon = document.getElementById('stat-con-count');
      if (statCon) statCon.textContent = constellations.length;
    } catch (err) {
      console.warn("Failed to load initial astronomical data:", err);
    }
  }

  // ----------------------------------------------------
  // Location Controls
  // ----------------------------------------------------
  // ----------------------------------------------------
  // Location Search Engine & Controls
  // ----------------------------------------------------
  function setupLocationControls() {
    const searchInput = document.getElementById('location-search-input');
    const clearBtn = document.getElementById('btn-clear-location-search');
    const dropdown = document.getElementById('location-results-dropdown');
    const latInput = document.getElementById('obs-lat-input');
    const lonInput = document.getElementById('obs-lon-input');
    const btnGeolocate = document.getElementById('btn-geolocate');
    const displayLocation = document.getElementById('hud-location-name');

    let debounceTimer = null;
    let selectedIndex = -1;
    let currentResults = [];

    // Initialize search input with default city
    if (searchInput) {
      searchInput.value = state.cityName;
    }

    // Load recent locations from localStorage
    function getRecentLocations() {
      try {
        const saved = localStorage.getItem('recent_star_locations');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }

    function saveRecentLocation(loc) {
      try {
        let recents = getRecentLocations();
        recents = recents.filter(r => Math.abs(r.lat - loc.lat) > 0.05 || Math.abs(r.lon - loc.lon) > 0.05);
        recents.unshift({ name: loc.name, lat: loc.lat, lon: loc.lon, category: loc.category || "Recent" });
        if (recents.length > 5) recents = recents.slice(0, 5);
        localStorage.setItem('recent_star_locations', JSON.stringify(recents));
      } catch (e) {}
    }

    // Render dropdown suggestions
    function renderDropdown(items, isSearching = false) {
      if (!dropdown) return;
      currentResults = items;
      selectedIndex = -1;

      if (items.length === 0) {
        dropdown.innerHTML = `
          <div class="px-3 py-3 text-center text-xs text-slate-500 font-sans">
            ${isSearching ? 'No locations found. Try city, state, or coordinates.' : 'Type to search any city or place in the world.'}
          </div>
        `;
        dropdown.classList.remove('hidden');
        return;
      }

      let html = '';

      // If not active search query, show grouped sections (GPS + Observatories + Popular)
      if (!isSearching) {
        html += `
          <div class="px-3 py-1.5 text-[10px] font-bold text-sky-400 uppercase tracking-wider bg-slate-800/40">
            Quick Actions &amp; Popular
          </div>
          <div class="px-3 py-2 hover:bg-slate-800/80 cursor-pointer flex items-center space-x-2 text-xs transition-colors" data-action="gps">
            <span class="text-sky-400">🎯</span>
            <span class="font-medium text-sky-300">Use My Current GPS Location</span>
          </div>
        `;

        const recents = getRecentLocations();
        if (recents.length > 0) {
          html += `<div class="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800/40">Recent Locations</div>`;
          recents.forEach((item, idx) => {
            html += `
              <div class="location-item px-3 py-2 hover:bg-slate-800 cursor-pointer flex justify-between items-center text-xs transition-colors" data-idx="${idx}">
                <div class="flex items-center space-x-2 truncate">
                  <span class="text-slate-400">🕒</span>
                  <span class="font-medium text-slate-200 truncate">${item.name}</span>
                </div>
                <span class="text-[10px] text-slate-500 font-mono shrink-0 ml-2">${item.lat.toFixed(1)}°, ${item.lon.toFixed(1)}°</span>
              </div>
            `;
          });
        }

        html += `<div class="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800/40">Famous Observatories &amp; Cities</div>`;
      }

      items.forEach((item, idx) => {
        const icon = item.category === "Observatory" ? "🔭" : "📍";
        const catBadge = item.category === "Observatory" 
          ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">Observatory</span>`
          : (item.isLiveGeocode ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Geocoded</span>` : '');

        html += `
          <div class="location-item px-3 py-2 hover:bg-slate-800 cursor-pointer flex justify-between items-center text-xs transition-colors" data-idx="${idx}">
            <div class="truncate mr-2">
              <div class="flex items-center space-x-1.5 truncate">
                <span>${icon}</span>
                <span class="font-medium text-slate-200 truncate">${item.name}</span>
                ${catBadge}
              </div>
              ${item.display_name && item.display_name !== item.name ? `<div class="text-[10px] text-slate-400 truncate pl-5">${item.display_name}</div>` : ''}
            </div>
            <div class="text-[10px] text-slate-500 font-mono text-right shrink-0">
              ${item.lat.toFixed(2)}°, ${item.lon.toFixed(2)}°
            </div>
          </div>
        `;
      });

      if (isSearching) {
        html += `
          <div class="px-3 py-1 text-[10px] text-slate-500 bg-slate-900 border-t border-slate-800 flex justify-between">
            <span>Powered by OpenStreetMap &amp; Local DB</span>
            <span>Use ↑ ↓ Enter</span>
          </div>
        `;
      }

      dropdown.innerHTML = html;
      dropdown.classList.remove('hidden');

      // Bind click handlers
      dropdown.querySelectorAll('.location-item').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.getAttribute('data-idx'));
          if (items[idx]) {
            selectLocation(items[idx]);
          }
        });
      });

      const gpsAction = dropdown.querySelector('[data-action="gps"]');
      if (gpsAction && btnGeolocate) {
        gpsAction.addEventListener('click', () => {
          btnGeolocate.click();
          dropdown.classList.add('hidden');
        });
      }
    }

    function selectLocation(loc) {
      updateLocation(loc.lat, loc.lon, loc.name);
      saveRecentLocation(loc);
      if (searchInput) {
        searchInput.value = loc.name;
        if (clearBtn) clearBtn.classList.remove('hidden');
      }
      dropdown.classList.add('hidden');
    }

    function showDefaultSuggestions() {
      // Show top observatories and major cities
      const defaults = [
        ...CITIES.filter(c => c.category === "Observatory").slice(0, 4),
        ...CITIES.filter(c => c.category === "City").slice(0, 6)
      ];
      renderDropdown(defaults, false);
    }

    // Local search filter
    function filterLocal(query) {
      const q = query.toLowerCase().trim();
      return CITIES.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.category && c.category.toLowerCase().includes(q))
      );
    }

    // Async online geocode query
    async function fetchGeocode(query) {
      try {
        // Try backend geocode proxy first
        const resp = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.length > 0) {
            return data.map(d => ({
              name: d.name,
              display_name: d.display_name,
              lat: d.lat,
              lon: d.lon,
              category: "Location",
              isLiveGeocode: true
            }));
          }
        }
      } catch (e) {}

      // Fallback directly to OpenStreetMap Nominatim
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6`;
        const resp = await fetch(url, { headers: { "Accept-Language": "en" } });
        if (resp.ok) {
          const data = await resp.json();
          return data.map(d => {
            const parts = d.display_name.split(", ");
            const shortName = parts.length > 1 ? `${parts[0]}, ${parts[parts.length - 1]}` : d.display_name;
            return {
              name: shortName,
              display_name: d.display_name,
              lat: parseFloat(d.lat),
              lon: parseFloat(d.lon),
              category: "Location",
              isLiveGeocode: true
            };
          });
        }
      } catch (e) {}

      return [];
    }

    if (searchInput) {
      // Focus event: show suggestions
      searchInput.addEventListener('focus', () => {
        if (!searchInput.value.trim() || searchInput.value === state.cityName) {
          showDefaultSuggestions();
        } else {
          doSearch(searchInput.value.trim());
        }
      });

      // Input event: perform search
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (clearBtn) {
          clearBtn.classList.toggle('hidden', val.length === 0);
        }

        if (!val.trim()) {
          showDefaultSuggestions();
          return;
        }

        doSearch(val.trim());
      });

      // Keyboard navigation (Up, Down, Enter, Escape)
      searchInput.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.location-item');
        if (items.length === 0 || dropdown.classList.contains('hidden')) return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedIndex = (selectedIndex + 1) % items.length;
          highlightItem(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedIndex = (selectedIndex - 1 + items.length) % items.length;
          highlightItem(items);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (selectedIndex >= 0 && currentResults[selectedIndex]) {
            selectLocation(currentResults[selectedIndex]);
          } else if (currentResults.length > 0) {
            selectLocation(currentResults[0]);
          }
        } else if (e.key === 'Escape') {
          dropdown.classList.add('hidden');
        }
      });
    }

    function highlightItem(items) {
      items.forEach((item, idx) => {
        if (idx === selectedIndex) {
          item.classList.add('bg-slate-700/80', 'border-l-2', 'border-sky-400');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('bg-slate-700/80', 'border-l-2', 'border-sky-400');
        }
      });
    }

    function doSearch(q) {
      // 1. Instant local search
      const localMatches = filterLocal(q);
      renderDropdown(localMatches, true);

      // 2. Debounced online geocoding if query >= 2 chars
      clearTimeout(debounceTimer);
      if (q.length >= 2) {
        debounceTimer = setTimeout(async () => {
          const onlineMatches = await fetchGeocode(q);
          
          // Merge results, removing spatial duplicates (< 0.1 deg)
          const merged = [...localMatches];
          onlineMatches.forEach(om => {
            const exists = merged.some(m => Math.abs(m.lat - om.lat) < 0.1 && Math.abs(m.lon - om.lon) < 0.1);
            if (!exists) merged.push(om);
          });

          renderDropdown(merged, true);
        }, 280);
      }
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        clearBtn.classList.add('hidden');
        showDefaultSuggestions();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (dropdown && !dropdown.contains(e.target) && searchInput && !searchInput.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });

    // Manual Coordinates Inputs (in Coordinates Tab)
    if (latInput && lonInput) {
      const applyManualCoords = () => {
        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);
        if (!isNaN(lat) && !isNaN(lon)) {
          updateLocation(lat, lon, `Custom (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`);
          if (searchInput) searchInput.value = `Custom (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
        }
      };
      latInput.addEventListener('change', applyManualCoords);
      lonInput.addEventListener('change', applyManualCoords);
    }

    // GPS Geolocation Button
    if (btnGeolocate) {
      btnGeolocate.addEventListener('click', () => {
        if (!navigator.geolocation) {
          alert("Geolocation is not supported by your browser.");
          return;
        }
        btnGeolocate.classList.add('animate-pulse');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            btnGeolocate.classList.remove('animate-pulse');
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const name = `Local Sky (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
            updateLocation(lat, lon, name);
            if (searchInput) searchInput.value = name;
          },
          (err) => {
            btnGeolocate.classList.remove('animate-pulse');
            alert(`Unable to retrieve your location: ${err.message}`);
          }
        );
      });
    }

    // Master update location function
    function updateLocation(lat, lon, name) {
      state.lat = lat;
      state.lon = lon;
      state.cityName = name;

      if (latInput) latInput.value = lat.toFixed(4);
      if (lonInput) lonInput.value = lon.toFixed(4);
      if (displayLocation) displayLocation.textContent = name;

      skymap.setObserver(lat, lon);
      issTracker.setObserver(lat, lon);
    }
  }

  // ----------------------------------------------------
  // Time Controls
  // ----------------------------------------------------
  function setupTimeControls() {
    const btnPlay = document.getElementById('btn-play-pause');
    const speedSelect = document.getElementById('time-speed-select');
    const timeSlider = document.getElementById('time-scrub-slider');
    const dateInput = document.getElementById('date-picker-input');
    const btnNow = document.getElementById('btn-time-now');
    const btnSunset = document.getElementById('btn-time-sunset');
    const btnMidnight = document.getElementById('btn-time-midnight');

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        state.isPlaying = !state.isPlaying;
        btnPlay.innerHTML = state.isPlaying 
          ? '<svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg><span>Pause</span>'
          : '<svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span>Play</span>';
      });
    }

    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        state.speedMultiplier = parseFloat(e.target.value);
      });
    }

    if (timeSlider) {
      timeSlider.addEventListener('input', (e) => {
        state.isPlaying = false;
        if (btnPlay) btnPlay.innerHTML = '<svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span>Play</span>';
        
        const minutes = parseFloat(e.target.value);
        const hrs = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        
        const d = new Date(state.currentTime);
        d.setHours(hrs, mins, 0);
        state.currentTime = d;
        skymap.setDate(state.currentTime);
        updateClockDisplay();
        if (state.issTracker) {
          state.issTracker.renderRadar(state.currentTime.getTime() / 1000);
          state.issTracker.updateHUD(state.currentTime.getTime() / 1000);
        }
      });
    }

    if (dateInput) {
      dateInput.value = state.currentTime.toISOString().split('T')[0];
      dateInput.addEventListener('change', (e) => {
        const [y, m, d] = e.target.value.split('-').map(Number);
        const newD = new Date(state.currentTime);
        newD.setFullYear(y, m - 1, d);
        state.currentTime = newD;
        skymap.setDate(state.currentTime);
        updateClockDisplay();
        if (state.issTracker) {
          state.issTracker.renderRadar(state.currentTime.getTime() / 1000);
          state.issTracker.updateHUD(state.currentTime.getTime() / 1000);
        }
      });
    }

    if (btnNow) {
      btnNow.addEventListener('click', () => {
        state.currentTime = new Date();
        skymap.setDate(state.currentTime);
        updateClockDisplay();
        updateTimeSlider();
        if (state.issTracker) {
          state.issTracker.renderRadar(state.currentTime.getTime() / 1000);
          state.issTracker.updateHUD(state.currentTime.getTime() / 1000);
        }
      });
    }

    if (btnSunset) {
      btnSunset.addEventListener('click', () => {
        const d = new Date(state.currentTime);
        d.setHours(19, 30, 0); // Approximate sunset time
        state.currentTime = d;
        skymap.setDate(state.currentTime);
        updateClockDisplay();
        updateTimeSlider();
        if (state.issTracker) {
          state.issTracker.renderRadar(state.currentTime.getTime() / 1000);
          state.issTracker.updateHUD(state.currentTime.getTime() / 1000);
        }
      });
    }

    if (btnMidnight) {
      btnMidnight.addEventListener('click', () => {
        const d = new Date(state.currentTime);
        d.setHours(0, 0, 0);
        state.currentTime = d;
        skymap.setDate(state.currentTime);
        updateClockDisplay();
        updateTimeSlider();
        if (state.issTracker) {
          state.issTracker.renderRadar(state.currentTime.getTime() / 1000);
          state.issTracker.updateHUD(state.currentTime.getTime() / 1000);
        }
      });
    }

    updateClockDisplay();
    updateTimeSlider();
  }

  function updateClockDisplay() {
    const elLocal = document.getElementById('clock-local-time');
    const elUTC = document.getElementById('clock-utc-time');
    const elLST = document.getElementById('clock-lst-time');
    const elSunPhase = document.getElementById('sun-phase-badge');

    if (elLocal) {
      elLocal.textContent = state.currentTime.toLocaleTimeString([], { hour12: false });
    }
    if (elUTC) {
      elUTC.textContent = state.currentTime.toUTCString().slice(17, 25) + " UTC";
    }
    if (elLST && skymap) {
      const lstHours = Astronomy.getLST(skymap.jd, state.lon);
      const h = Math.floor(lstHours);
      const m = Math.floor((lstHours - h) * 60);
      elLST.textContent = `LST ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
    }

    if (elSunPhase && skymap && skymap.sun) {
      const alt = skymap.sun.altitude;
      let phase = "Night";
      let badgeStyle = "bg-slate-800 text-slate-300 border-slate-700";

      if (alt > 0) {
        phase = "Daylight";
        badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/40";
      } else if (alt > -6) {
        phase = "Civil Twilight";
        badgeStyle = "bg-orange-500/20 text-orange-300 border-orange-500/40";
      } else if (alt > -12) {
        phase = "Nautical Twilight";
        badgeStyle = "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      } else if (alt > -18) {
        phase = "Astronomical Twilight";
        badgeStyle = "bg-blue-500/20 text-blue-300 border-blue-500/40";
      }

      elSunPhase.className = `px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeStyle}`;
      elSunPhase.textContent = phase;
    }
  }

  function updateTimeSlider() {
    const timeSlider = document.getElementById('time-scrub-slider');
    if (timeSlider) {
      const minutes = state.currentTime.getHours() * 60 + state.currentTime.getMinutes();
      timeSlider.value = minutes;
    }
  }

  // ----------------------------------------------------
  // Display Toggles & Mode Selection
  // ----------------------------------------------------
  function setupDisplayToggles() {
    const bindToggle = (id, prop) => {
      const el = document.getElementById(id);
      if (el) {
        el.checked = skymap.options[prop];
        el.addEventListener('change', (e) => {
          skymap.options[prop] = e.target.checked;
          skymap.render();
        });
      }
    };

    bindToggle('toggle-constellation-lines', 'showConstellationLines');
    bindToggle('toggle-constellation-labels', 'showConstellationLabels');
    bindToggle('toggle-star-names', 'showStarNames');
    bindToggle('toggle-planets', 'showPlanets');
    bindToggle('toggle-altaz-grid', 'showAltAzGrid');
    bindToggle('toggle-atmosphere', 'showAtmosphere');
    bindToggle('toggle-iss-trail', 'showISSTrail');
    bindToggle('toggle-twinkle', 'showTwinkle');

    // Projection Mode (Planisphere vs Panorama)
    const modeSelect = document.getElementById('projection-mode-select');
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        skymap.options.mode = e.target.value;
        skymap.resetView();
      });
    }

    // Reset View Button
    const btnResetView = document.getElementById('btn-reset-view');
    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        skymap.resetView();
      });
    }

    // Night Vision (Red Light) Mode
    const btnNightVision = document.getElementById('btn-night-vision');
    if (btnNightVision) {
      btnNightVision.addEventListener('click', () => {
        skymap.options.nightVision = !skymap.options.nightVision;
        document.body.classList.toggle('night-vision-active', skymap.options.nightVision);
        btnNightVision.classList.toggle('bg-red-900/60', skymap.options.nightVision);
        btnNightVision.classList.toggle('text-red-300', skymap.options.nightVision);
        skymap.render();
      });
    }
  }

  // ----------------------------------------------------
  // Search Celestial Objects
  // ----------------------------------------------------
  function setupSearch() {
    const searchInput = document.getElementById('search-object-input');
    const searchResults = document.getElementById('search-results-dropdown');

    if (!searchInput || !searchResults) return;

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        searchResults.classList.add('hidden');
        return;
      }

      const matches = [];

      // Check ISS
      if ("international space station iss".includes(q)) {
        matches.push({
          type: "satellite",
          name: "ISS (International Space Station)",
          desc: "Low Earth Orbit Satellite"
        });
      }

      // Check Planets & Moon
      ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Moon", "Sun"].forEach(p => {
        if (p.toLowerCase().includes(q)) {
          matches.push({ type: "planet", name: p, desc: "Solar System Object" });
        }
      });

      // Check Constellations
      skymap.constellations.forEach(c => {
        if (c.name.toLowerCase().includes(q) || c.meaning.toLowerCase().includes(q)) {
          matches.push({ type: "constellation", name: c.name, desc: c.meaning, con: c });
        }
      });

      // Check Stars
      skymap.stars.forEach(s => {
        if (s.name && s.name.toLowerCase().includes(q)) {
          matches.push({ type: "star", name: s.name, desc: `Mag ${s.mag} • ${s.con || 'Star'}`, star: s });
        }
      });

      if (matches.length > 0) {
        searchResults.innerHTML = matches.slice(0, 8).map(m => `
          <div class="px-3 py-2 hover:bg-slate-700/80 cursor-pointer flex justify-between items-center text-xs" data-target="${m.name}">
            <span class="font-medium text-sky-300">${m.name}</span>
            <span class="text-[10px] text-slate-400">${m.desc}</span>
          </div>
        `).join('');
        searchResults.classList.remove('hidden');

        searchResults.querySelectorAll('[data-target]').forEach(item => {
          item.addEventListener('click', () => {
            const name = item.getAttribute('data-target');
            searchInput.value = name;
            searchResults.classList.add('hidden');
            targetObject(name);
          });
        });
      } else {
        searchResults.innerHTML = `<div class="px-3 py-2 text-xs text-slate-500">No matching celestial objects</div>`;
        searchResults.classList.remove('hidden');
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });

    function targetObject(name) {
      if (name.includes("ISS")) {
        if (skymap.iss && skymap.iss.topocentric) {
          alert(`ISS is currently at Azimuth ${skymap.iss.topocentric.azimuth_deg.toFixed(1)}°, Altitude ${skymap.iss.topocentric.elevation_deg.toFixed(1)}° (${skymap.iss.topocentric.is_above_horizon ? 'Visible' : 'Below horizon'})`);
        }
        return;
      }

      // Check planets
      const p = skymap.planets.find(item => item.name.toLowerCase() === name.toLowerCase());
      if (p) {
        alert(`${p.name} is at Azimuth ${p.azimuth.toFixed(1)}°, Altitude ${p.altitude.toFixed(1)}° (${p.altitude > 0 ? 'Above Horizon' : 'Below Horizon'})`);
        return;
      }

      // Check stars
      const s = skymap.stars.find(item => item.name && item.name.toLowerCase() === name.toLowerCase());
      if (s) {
        const altaz = Astronomy.radecToAltAz(s.ra, s.dec, state.lat, state.lon, skymap.jd);
        alert(`${s.name} is at Altitude ${altaz.altitude.toFixed(1)}°, Azimuth ${altaz.azimuth.toFixed(1)}° (Gaia G Mag: ${s.mag})`);
        return;
      }
    }
  }

  // ----------------------------------------------------
  // Star & Object Inspector Modal
  // ----------------------------------------------------
  function setupInspectorModal() {
    const modal = document.getElementById('inspector-modal');
    const btnClose = document.getElementById('btn-close-inspector');

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    skymap.onSelectCallback = (obj) => {
      if (!modal) return;
      openInspector(obj);
    };

    function openInspector(obj) {
      const titleEl = document.getElementById('inspect-title');
      const badgeEl = document.getElementById('inspect-type-badge');
      const gaiaRow = document.getElementById('inspect-gaia-row');
      const gaiaIdEl = document.getElementById('inspect-gaia-id');
      const magEl = document.getElementById('inspect-mag');
      const distEl = document.getElementById('inspect-dist');
      const colorEl = document.getElementById('inspect-color');
      const radecEl = document.getElementById('inspect-radec');
      const altazEl = document.getElementById('inspect-altaz');
      const visStatusEl = document.getElementById('inspect-visibility');

      titleEl.textContent = obj.name;
      altazEl.textContent = `Alt: ${obj.alt.toFixed(2)}° | Az: ${obj.az.toFixed(2)}°`;
      visStatusEl.textContent = obj.alt >= 0 ? "Above Horizon (Visible)" : "Below Horizon";
      visStatusEl.className = obj.alt >= 0 ? "text-emerald-400 font-semibold" : "text-slate-400";

      if (obj.type === "star") {
        badgeEl.textContent = "STAR (ESA Gaia DR3)";
        badgeEl.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40";
        
        gaiaRow.classList.remove('hidden');
        gaiaIdEl.textContent = obj.data.id || "N/A";
        magEl.textContent = `${obj.data.mag} (Gaia G-Band)`;
        distEl.textContent = obj.data.dist_ly ? `${obj.data.dist_ly.toLocaleString()} Light-Years` : "Unknown";
        colorEl.textContent = `${obj.data.bp_rp != null ? obj.data.bp_rp : 'N/A'} (BP - RP Index)`;
        radecEl.textContent = `RA: ${obj.data.ra.toFixed(4)}° | Dec: ${obj.data.dec.toFixed(4)}°`;
      } else if (obj.type === "planet") {
        badgeEl.textContent = "SOLAR SYSTEM PLANET";
        badgeEl.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40";
        
        gaiaRow.classList.add('hidden');
        magEl.textContent = `${obj.data.mag} (Visual)`;
        distEl.textContent = `${obj.data.distAu} AU (~${(obj.data.distAu * 149.6).toFixed(1)} million km)`;
        colorEl.textContent = "Reflected Sunlight";
        radecEl.textContent = `RA: ${obj.data.ra.toFixed(2)}° | Dec: ${obj.data.dec.toFixed(2)}°`;
      } else if (obj.type === "satellite") {
        badgeEl.textContent = "SATELLITE (NORAD 25544)";
        badgeEl.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40";
        
        gaiaRow.classList.add('hidden');
        magEl.textContent = "~ -2.0 (When illuminated in dark sky)";
        distEl.textContent = `Slant Range: ${Math.round(obj.data.rangeKm || 420)} km`;
        colorEl.textContent = "Solar Panel Specular Reflection";
        radecEl.textContent = `Altitude: ~420 km | Velocity: ~27,600 km/h`;
      } else if (obj.type === "moon") {
        badgeEl.textContent = "NATURAL SATELLITE";
        badgeEl.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40";
        
        gaiaRow.classList.add('hidden');
        magEl.textContent = "-12.7 (At Full Moon)";
        distEl.textContent = "~384,400 km";
        colorEl.textContent = `Illumination: ${(obj.data.phaseFraction * 100).toFixed(1)}%`;
        radecEl.textContent = `Phase: ${obj.data.phaseName}`;
      }

      modal.classList.remove('hidden');
    }
  }
});
