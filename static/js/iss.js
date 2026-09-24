/**
 * Local Star Map - ISS Live Tracking and Ground Radar Component
 */

class ISSTracker {
  constructor(options = {}) {
    this.radarCanvas = document.getElementById(options.radarCanvasId || 'iss-radar-canvas');
    this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;
    this.onUpdateCallback = options.onUpdate || null;
    
    this.observerLat = options.lat || 40.7128;
    this.observerLon = options.lon || -74.0060;
    
    this.pollInterval = null;
    this.currentData = null;
    this.isFetching = false;
    
    this.initRadarCanvas();
  }

  initRadarCanvas() {
    if (!this.radarCanvas) return;
    const rect = this.radarCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.radarWidth = rect.width || 320;
    this.radarHeight = rect.height || 160;
    this.radarCanvas.width = this.radarWidth * dpr;
    this.radarCanvas.height = this.radarHeight * dpr;
    if (this.radarCtx) {
      this.radarCtx.scale(dpr, dpr);
    }
  }

  setObserver(lat, lon) {
    this.observerLat = lat;
    this.observerLon = lon;
    this.fetchData();
  }

  start(intervalMs = 3000) {
    this.fetchData();
    this.stop();
    this.pollInterval = setInterval(() => this.fetchData(), intervalMs);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async fetchData() {
    if (this.isFetching) return;
    this.isFetching = true;

    const isStaticHost = location.hostname.includes('github.io') || location.protocol === 'file:' || !location.port;

    // 1. Try local FastAPI backend endpoint only if not on a pure static host
    if (!isStaticHost) {
      try {
        const resp = await fetch(`/api/iss?lat=${this.observerLat}&lon=${this.observerLon}`);
        if (resp.ok) {
          const data = await resp.json();
          this.currentData = data;
          this.renderRadar();
          this.updateHUD();
          if (this.onUpdateCallback) this.onUpdateCallback(data);
          this.isFetching = false;
          return;
        }
      } catch (e) {}
    }

    // 2. Standalone fallback (GitHub Pages / pure client-side)
    try {
      const resp = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
      if (resp.ok) {
        const live = await resp.json();
        const obsEcef = Astronomy.geodeticToEcef(this.observerLat, this.observerLon, 0);
        const satEcef = Astronomy.geodeticToEcef(live.latitude, live.longitude, live.altitude);
        const enu = Astronomy.ecefToEnu(satEcef.x, satEcef.y, satEcef.z, obsEcef.x, obsEcef.y, obsEcef.z, this.observerLat, this.observerLon);

        // Compute 90-minute orbital track (ground path & local sky trajectory)
        const groundTrack = [];
        const skyTrajectory = [];
        const t0 = live.timestamp;
        const periodSec = 5560; // ~92.6 min orbital period
        const incRad = 51.64 * (Math.PI / 180.0);

        for (let i = -15; i <= 15; i++) {
          const dt = i * 180;
          const ptTs = t0 + dt;
          const theta = ((t0 % periodSec + dt) / periodSec) * 2 * Math.PI;
          const pLat = Math.asin(Math.sin(incRad) * Math.sin(theta)) * (180.0 / Math.PI);
          let pLon = (live.longitude + (dt / periodSec) * 360.0 * Math.cos(incRad) - (dt / 240.0)) % 360.0;
          if (pLon > 180) pLon -= 360;
          if (pLon < -180) pLon += 360;

          groundTrack.push({ lat: pLat, lon: pLon, ts: ptTs });

          const pSatEcef = Astronomy.geodeticToEcef(pLat, pLon, live.altitude);
          const pEnu = Astronomy.ecefToEnu(pSatEcef.x, pSatEcef.y, pSatEcef.z, obsEcef.x, obsEcef.y, obsEcef.z, this.observerLat, this.observerLon);
          skyTrajectory.push({
            az: pEnu.azimuth,
            el: pEnu.elevation,
            range_km: pEnu.slantRange,
            is_above: pEnu.elevation > 0,
            ts: ptTs
          });
        }

        // Check for upcoming pass
        let nextPass = null;
        const passPts = skyTrajectory.filter(p => p.ts >= t0 && p.el > 0);
        if (passPts.length > 0) {
          const maxPt = passPts.reduce((prev, curr) => (curr.el > prev.el ? curr : prev), passPts[0]);
          nextPass = {
            status: enu.elevation > 0 ? "In Progress" : "Upcoming",
            start_ts: passPts[0].ts,
            max_elevation: maxPt.el,
            max_azimuth: maxPt.az,
            max_ts: maxPt.ts,
            end_ts: passPts[passPts.length - 1].ts
          };
        }

        const fullData = {
          telemetry: {
            name: "International Space Station (ISS)",
            norad_id: 25544,
            latitude: live.latitude,
            longitude: live.longitude,
            altitude_km: live.altitude,
            velocity_kmh: live.velocity,
            visibility: live.visibility,
            timestamp: live.timestamp
          },
          topocentric: {
            azimuth_deg: enu.azimuth,
            elevation_deg: enu.elevation,
            slant_range_km: enu.slantRange,
            is_above_horizon: enu.elevation > 0,
            direction: this.bearingToCompass(enu.azimuth)
          },
          ground_track: groundTrack,
          sky_trajectory: skyTrajectory,
          next_pass: nextPass
        };

        this.currentData = fullData;
        this.renderRadar();
        this.updateHUD();
        if (this.onUpdateCallback) this.onUpdateCallback(fullData);
      }
    } catch (err) {
      console.warn("ISS live fetch failed:", err);
    } finally {
      this.isFetching = false;
    }
  }

  bearingToCompass(azDeg) {
    const bearings = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                      "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const idx = Math.floor((azDeg + 11.25) / 22.5) % 16;
    return bearings[idx];
  }

  updateHUD() {
    if (!this.currentData) return;
    const telem = this.currentData.telemetry;
    const topo = this.currentData.topocentric;

    const elAlt = document.getElementById('iss-hud-alt');
    const elAz = document.getElementById('iss-hud-az');
    const elDist = document.getElementById('iss-hud-dist');
    const elLatLon = document.getElementById('iss-hud-latlon');
    const elSpeed = document.getElementById('iss-hud-speed');
    const elStatus = document.getElementById('iss-status-badge');

    if (elAlt) elAlt.textContent = `${topo.elevation_deg.toFixed(1)}°`;
    if (elAz) elAz.textContent = `${topo.azimuth_deg.toFixed(1)}° (${topo.direction})`;
    if (elDist) elDist.textContent = `${Math.round(topo.slant_range_km).toLocaleString()} km`;
    if (elLatLon) elLatLon.textContent = `${telem.latitude.toFixed(2)}°, ${telem.longitude.toFixed(2)}°`;
    if (elSpeed) elSpeed.textContent = `${Math.round(telem.velocity_kmh).toLocaleString()} km/h`;

    if (elStatus) {
      if (topo.is_above_horizon) {
        elStatus.className = "px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse";
        elStatus.textContent = "● VISIBLE IN SKY";
      } else {
        elStatus.className = "px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700";
        elStatus.textContent = "○ BELOW HORIZON";
      }
    }

    // Pass details
    const passCard = document.getElementById('iss-pass-summary');
    if (passCard && this.currentData.next_pass) {
      const np = this.currentData.next_pass;
      const maxTime = new Date(np.max_ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      passCard.innerHTML = `
        <div class="text-xs text-amber-400 font-semibold mb-1 flex items-center justify-between">
          <span>Pass: ${np.status}</span>
          <span>Max El: ${np.max_elevation.toFixed(1)}°</span>
        </div>
        <div class="text-[11px] text-slate-300">
          Peak at <strong class="text-white">${maxTime}</strong> (${np.max_azimuth.toFixed(0)}° az)
        </div>
      `;
    }
  }

  renderRadar() {
    if (!this.radarCtx || !this.currentData) return;
    const ctx = this.radarCtx;
    const w = this.radarWidth;
    const h = this.radarHeight;

    ctx.clearRect(0, 0, w, h);

    // Dark grid background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, w, h);

    // Map latitude / longitude grid lines
    ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
    ctx.lineWidth = 1;

    // Equator & Tropics
    [-23.5, 0, 23.5].forEach(lat => {
      const y = h * (90 - lat) / 180;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    });

    // Meridians every 60 deg
    for (let lon = -180; lon <= 180; lon += 60) {
      const x = w * (lon + 180) / 360;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Simple continent landmass outlines (minimal vector aesthetics)
    this.drawMinimalContinents(ctx, w, h);

    // Draw Ground Track Trajectory
    if (this.currentData.ground_track && this.currentData.ground_track.length > 1) {
      ctx.save();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "rgba(250, 204, 21, 0.65)";
      ctx.setLineDash([3, 3]);

      let prevX = null;
      ctx.beginPath();
      this.currentData.ground_track.forEach(pt => {
        const x = w * (pt.lon + 180) / 360;
        const y = h * (90 - pt.lat) / 180;

        if (prevX !== null && Math.abs(x - prevX) > w * 0.4) {
          // Wrapped across 180th meridian
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
        } else if (prevX === null) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        prevX = x;
      });
      ctx.stroke();
      ctx.restore();
    }

    // Draw Observer Footprint & Crosshair
    const obsX = w * (this.observerLon + 180) / 360;
    const obsY = h * (90 - this.observerLat) / 180;

    // Horizon visibility footprint (~2200 km radius circle on Earth map)
    const footprintR = w * (2200 / 40075.0);
    ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(obsX, obsY, footprintR, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Observer Crosshair
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(obsX, obsY, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.strokeRect(obsX - 5, obsY - 5, 10, 10);

    // Draw ISS Sub-satellite point
    const telem = this.currentData.telemetry;
    const satX = w * (telem.longitude + 180) / 360;
    const satY = h * (90 - telem.latitude) / 180;

    // Satellite beacon
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(satX, satY, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = "#fef08a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(satX, satY, 8, 0, 2 * Math.PI);
    ctx.stroke();

    // Label
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 9px monospace";
    ctx.fillText("ISS", satX + 7, satY - 5);
  }

  drawMinimalContinents(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = "rgba(30, 41, 59, 0.45)";
    // Simplified continent blocks to provide geographic orientation
    const continents = [
      // North America
      [[-160, 70], [-130, 70], [-70, 75], [-60, 45], [-80, 25], [-100, 20], [-125, 30], [-165, 60]],
      // South America
      [[-80, 10], [-50, -5], [-35, -5], [-40, -22], [-65, -55], [-75, -45], [-80, -5]],
      // Europe
      [[-10, 36], [0, 50], [25, 70], [45, 60], [30, 35], [0, 40]],
      // Africa
      [[-15, 35], [30, 32], [50, 12], [40, -10], [30, -34], [15, -34], [10, 5], [-17, 15]],
      // Asia
      [[45, 60], [170, 65], [140, 35], [105, 10], [80, 10], [60, 25], [35, 35]],
      // Australia
      [[115, -15], [150, -12], [153, -28], [140, -38], [115, -34], [113, -22]]
    ];

    continents.forEach(poly => {
      ctx.beginPath();
      poly.forEach(([lon, lat], idx) => {
        const x = w * (lon + 180) / 360;
        const y = h * (90 - lat) / 180;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }
}

window.ISSTracker = ISSTracker;
