/**
 * Local Star Map - High Performance Canvas Planetarium Renderer
 * Supports All-Sky Planisphere (Dome) mode and Horizon Panorama mode.
 */

class SkyMap {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    this.options = Object.assign({
      mode: 'planisphere', // 'planisphere' or 'panorama'
      showConstellationLines: true,
      showConstellationLabels: true,
      showStarNames: true,
      showPlanets: true,
      showAltAzGrid: true,
      showRADecGrid: false,
      showAtmosphere: true,
      showISSTrail: true,
      showTwinkle: true,
      nightVision: false
    }, options);
    
    // Observer state
    this.lat = 40.7128;
    this.lon = -74.0060;
    this.currentDate = new Date();
    this.jd = Astronomy.toJulianDate(this.currentDate);
    
    // View transform state
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.rotAngle = 0; // Planisphere orientation
    this.panoramaAz = 180; // Facing South by default in panorama mode
    this.panoramaAlt = 35;
    
    // Data stores
    this.stars = [];
    this.gaiaHighlights = []; // Stars returned from custom Gaia queries
    this.constellations = [];
    this.planets = [];
    this.sun = null;
    this.moon = null;
    this.iss = null;
    
    // Interaction
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.hoveredObject = null;
    this.selectedObject = null;
    this.onSelectCallback = null;
    this.animTime = 0;

    // Load mini ISS satellite image with multi-path fallbacks
    const issCandidates = [
      './Source Images/ISS.png',
      './static/assets/iss.png',
      './assets/iss.png',
      '../Source Images/ISS.png',
      '../static/assets/iss.png'
    ];
    let candidateIdx = 0;
    this.issImage = new Image();
    this.issImageLoaded = false;
    this.issImage.onload = () => {
      this.issImageLoaded = true;
      this.render();
    };
    this.issImage.onerror = () => {
      candidateIdx++;
      if (candidateIdx < issCandidates.length) {
        this.issImage.src = issCandidates[candidateIdx];
      }
    };
    this.issImage.src = issCandidates[0];
    
    this.initEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (this.isDragging) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        if (this.options.mode === 'planisphere') {
          this.panX += dx;
          this.panY += dy;
        } else {
          this.panoramaAz = (this.panoramaAz - dx * 0.3 + 360) % 360;
          this.panoramaAlt = Math.max(0, Math.min(85, this.panoramaAlt + dy * 0.3));
        }
        this.render();
      } else {
        this.checkHover(mouseX, mouseY);
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      this.zoom = Math.max(0.7, Math.min(8.0, this.zoom * zoomFactor));
      this.render();
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      if (this.hoveredObject && this.onSelectCallback) {
        this.selectedObject = this.hoveredObject;
        this.onSelectCallback(this.hoveredObject);
      }
    });
  }

  resetView() {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.rotAngle = 0;
    this.panoramaAz = 180;
    this.panoramaAlt = 35;
    this.render();
  }

  setDate(date) {
    this.currentDate = date;
    this.jd = Astronomy.toJulianDate(date);
    this.updateEphemeris();
    this.render();
  }

  setObserver(lat, lon) {
    this.lat = lat;
    this.lon = lon;
    this.updateEphemeris();
    this.render();
  }

  setData({ stars, constellations, iss }) {
    if (stars) this.stars = stars;
    if (constellations) this.constellations = constellations;
    if (iss) this.iss = iss;
    this.updateEphemeris();
    this.render();
  }

  setGaiaHighlights(starsList) {
    this.gaiaHighlights = starsList || [];
    this.render();
  }

  updateEphemeris() {
    this.sun = Astronomy.getSunPosition(this.jd);
    const sunAltAz = Astronomy.radecToAltAz(this.sun.ra, this.sun.dec, this.lat, this.lon, this.jd);
    this.sun.altitude = sunAltAz.altitude;
    this.sun.azimuth = sunAltAz.azimuth;

    this.moon = Astronomy.getMoonPosition(this.jd);
    const moonAltAz = Astronomy.radecToAltAz(this.moon.ra, this.moon.dec, this.lat, this.lon, this.jd);
    this.moon.altitude = moonAltAz.altitude;
    this.moon.azimuth = moonAltAz.azimuth;

    this.planets = Astronomy.getPlanets(this.jd);
    this.planets.forEach(p => {
      const altaz = Astronomy.radecToAltAz(p.ra, p.dec, this.lat, this.lon, this.jd);
      p.altitude = altaz.altitude;
      p.azimuth = altaz.azimuth;
    });

    if (this.iss && this.iss.telemetry) {
      const telem = this.iss.telemetry;
      const ts = this.currentDate ? (this.currentDate.getTime() / 1000) : (Date.now() / 1000);
      const t0 = telem.timestamp || ts;
      const dt = ts - t0;

      const periodSec = 5560; // ~92.6 min orbital period
      const incRad = 51.64 * (Math.PI / 180.0);

      const theta = (((t0 % periodSec) + dt) / periodSec) * 2 * Math.PI;
      const lat = Math.asin(Math.sin(incRad) * Math.sin(theta)) * (180.0 / Math.PI);
      let lon = (telem.longitude + (dt / periodSec) * 360.0 * Math.cos(incRad) - (dt / 240.0)) % 360.0;
      if (lon > 180) lon -= 360;
      if (lon < -180) lon += 360;

      const obsEcef = Astronomy.geodeticToEcef(this.lat, this.lon, 0);
      const satEcef = Astronomy.geodeticToEcef(lat, lon, telem.altitude_km || 420.0);
      const enu = Astronomy.ecefToEnu(satEcef.x, satEcef.y, satEcef.z, obsEcef.x, obsEcef.y, obsEcef.z, this.lat, this.lon);
      this.iss.currentAlt = enu.elevation;
      this.iss.currentAz = enu.azimuth;
      this.iss.rangeKm = enu.slantRange;
      this.iss.subLat = lat;
      this.iss.subLon = lon;

      // Also compute a forward step (8 seconds ahead) to compute sky projection heading
      const dtAhead = 8.0;
      const thetaAhead = (((t0 % periodSec) + dt + dtAhead) / periodSec) * 2 * Math.PI;
      const latAhead = Math.asin(Math.sin(incRad) * Math.sin(thetaAhead)) * (180.0 / Math.PI);
      let lonAhead = (telem.longitude + ((dt + dtAhead) / periodSec) * 360.0 * Math.cos(incRad) - ((dt + dtAhead) / 240.0)) % 360.0;
      if (lonAhead > 180) lonAhead -= 360;
      if (lonAhead < -180) lonAhead += 360;

      const satEcefAhead = Astronomy.geodeticToEcef(latAhead, lonAhead, telem.altitude_km || 420.0);
      const enuAhead = Astronomy.ecefToEnu(satEcefAhead.x, satEcefAhead.y, satEcefAhead.z, obsEcef.x, obsEcef.y, obsEcef.z, this.lat, this.lon);
      this.iss.nextAlt = enuAhead.elevation;
      this.iss.nextAz = enuAhead.azimuth;
    }
  }

  /**
   * Projects (Azimuth, Altitude) to Canvas coordinates (x, y)
   */
  project(azDeg, altDeg) {
    const cx = this.width / 2 + this.panX;
    const cy = this.height / 2 + this.panY;
    const radius = Math.min(this.width, this.height) * 0.44 * this.zoom;

    if (this.options.mode === 'planisphere') {
      // Planisphere dome: Center is Zenith (alt=90), Edge is Horizon (alt=0)
      // Distance from center: r = radius * (90 - alt) / 90
      if (altDeg < -15) return null; // filter far below horizon
      const r = radius * ((90.0 - altDeg) / 90.0);
      // Azimuth: 0=N (up), 90=E (left on skymap), 180=S (down), 270=W (right)
      const theta = (azDeg - 90.0) * (Math.PI / 180.0) + this.rotAngle;
      return {
        x: cx - r * Math.cos(theta),
        y: cy + r * Math.sin(theta),
        visible: altDeg >= 0
      };
    } else {
      // Panorama horizon view:
      // X maps to azimuth relative to center azimuth
      // Y maps to altitude relative to horizon
      const fovHoriz = (100.0 / this.zoom);
      const fovVert = (75.0 / this.zoom);
      
      let dAz = ((azDeg - this.panoramaAz + 540) % 360) - 180;
      if (Math.abs(dAz) > fovHoriz * 0.7) return null;

      const x = cx + (dAz / (fovHoriz / 2)) * (this.width / 2);
      const y = cy - ((altDeg - this.panoramaAlt) / (fovVert / 2)) * (this.height / 2);
      return {
        x,
        y,
        visible: altDeg >= 0
      };
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.animTime += 0.05;

    // 1. Draw Sky Dome Background & Atmosphere
    this.drawSkyBackground();

    // 2. Draw Alt-Az & Equatorial Grid
    if (this.options.showAltAzGrid) {
      this.drawAltAzGrid();
    }

    // 3. Draw Constellation Stick Figures
    if (this.options.showConstellationLines) {
      this.drawConstellations();
    }

    // 4. Draw Gaia Stars
    this.drawStars();

    // 5. Draw Custom Gaia TAP Query Highlights
    if (this.gaiaHighlights.length > 0) {
      this.drawGaiaHighlights();
    }

    // 6. Draw Sun, Moon, and Planets
    if (this.options.showPlanets) {
      this.drawSolarSystem();
    }

    // 7. Draw ISS and Orbit Trajectory
    if (this.iss) {
      this.drawISS();
    }

    // 8. Draw Horizon Rim & Cardinal Directions
    this.drawHorizonRim();

    // 9. Draw Tooltip for Hovered Object
    if (this.hoveredObject) {
      this.drawTooltip(this.hoveredObject);
    }
  }

  drawSkyBackground() {
    const ctx = this.ctx;
    const cx = this.width / 2 + this.panX;
    const cy = this.height / 2 + this.panY;
    const radius = Math.min(this.width, this.height) * 0.44 * this.zoom;

    if (this.options.nightVision) {
      ctx.fillStyle = "#100000";
      ctx.fillRect(0, 0, this.width, this.height);
      return;
    }

    const sunAlt = this.sun ? this.sun.altitude : -30;
    let bgGrad;

    if (this.options.mode === 'planisphere') {
      bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      
      if (!this.options.showAtmosphere || sunAlt < -18) {
        // Deep Space Night
        bgGrad.addColorStop(0, "#080c1d");
        bgGrad.addColorStop(0.7, "#040611");
        bgGrad.addColorStop(1, "#020308");
      } else if (sunAlt < -12) {
        // Astronomical Twilight
        bgGrad.addColorStop(0, "#0d1330");
        bgGrad.addColorStop(0.8, "#090c20");
        bgGrad.addColorStop(1, "#040510");
      } else if (sunAlt < -6) {
        // Nautical Twilight
        bgGrad.addColorStop(0, "#151d45");
        bgGrad.addColorStop(0.7, "#11183c");
        bgGrad.addColorStop(1, "#1e1e3f");
      } else if (sunAlt < 0) {
        // Civil Twilight / Sunset Glow
        bgGrad.addColorStop(0, "#1a2558");
        bgGrad.addColorStop(0.6, "#293268");
        bgGrad.addColorStop(1, "#543350");
      } else {
        // Daytime Sky
        bgGrad.addColorStop(0, "#3a7bd5");
        bgGrad.addColorStop(0.7, "#2e62a8");
        bgGrad.addColorStop(1, "#1d3e6d");
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 2, 0, 2 * Math.PI);
      ctx.fillStyle = bgGrad;
      ctx.fill();
      ctx.restore();

      // Outer background
      ctx.fillStyle = "#010204";
      ctx.fillRect(0, 0, this.width, cy - radius);
      ctx.fillRect(0, cy + radius, this.width, this.height - (cy + radius));
      ctx.fillRect(0, 0, cx - radius, this.height);
      ctx.fillRect(cx + radius, 0, this.width - (cx + radius), this.height);
    } else {
      // Panorama background
      bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      if (!this.options.showAtmosphere || sunAlt < -18) {
        bgGrad.addColorStop(0, "#03040a");
        bgGrad.addColorStop(0.8, "#080c1d");
        bgGrad.addColorStop(1, "#0d1117");
      } else if (sunAlt < 0) {
        bgGrad.addColorStop(0, "#0f1738");
        bgGrad.addColorStop(0.6, "#2a2d5a");
        bgGrad.addColorStop(1, "#5c3d4e");
      } else {
        bgGrad.addColorStop(0, "#2563eb");
        bgGrad.addColorStop(0.7, "#60a5fa");
        bgGrad.addColorStop(1, "#93c5fd");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawAltAzGrid() {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.options.nightVision ? "rgba(220, 38, 38, 0.22)" : "rgba(99, 140, 210, 0.18)";
    ctx.fillStyle = this.options.nightVision ? "rgba(239, 68, 68, 0.6)" : "rgba(148, 163, 184, 0.6)";
    ctx.font = "10px sans-serif";

    if (this.options.mode === 'planisphere') {
      const cx = this.width / 2 + this.panX;
      const cy = this.height / 2 + this.panY;
      const radius = Math.min(this.width, this.height) * 0.44 * this.zoom;

      // Altitude rings: 30°, 60°
      [30, 60].forEach(alt => {
        const r = radius * ((90 - alt) / 90);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillText(`${alt}°`, cx + 4, cy - r + 12);
      });

      // Azimuth radial spokes every 30°
      for (let az = 0; az < 360; az += 30) {
        const theta = (az - 90.0) * (Math.PI / 180.0) + this.rotAngle;
        const x1 = cx - 20 * Math.cos(theta);
        const y1 = cy + 20 * Math.sin(theta);
        const x2 = cx - radius * Math.cos(theta);
        const y2 = cy + radius * Math.sin(theta);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Zenith mark
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
      ctx.fillStyle = this.options.nightVision ? "#ef4444" : "#38bdf8";
      ctx.fill();
      ctx.fillText("Zenith (Z)", cx + 6, cy - 6);
    }
    ctx.restore();
  }

  drawConstellations() {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = this.options.nightVision ? "rgba(239, 68, 68, 0.45)" : "rgba(56, 189, 248, 0.35)";

    this.constellations.forEach(con => {
      // Draw lines
      con.lines.forEach(seg => {
        const [p1, p2] = seg;
        const altaz1 = Astronomy.radecToAltAz(p1[0], p1[1], this.lat, this.lon, this.jd);
        const altaz2 = Astronomy.radecToAltAz(p2[0], p2[1], this.lat, this.lon, this.jd);

        const pt1 = this.project(altaz1.azimuth, altaz1.altitude);
        const pt2 = this.project(altaz2.azimuth, altaz2.altitude);

        if (pt1 && pt2 && (pt1.visible || pt2.visible)) {
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.stroke();
        }
      });

      // Draw constellation label at center
      if (this.options.showConstellationLabels && con.ra != null && con.dec != null) {
        const centerAltAz = Astronomy.radecToAltAz(con.ra, con.dec, this.lat, this.lon, this.jd);
        if (centerAltAz.altitude > 8) {
          const pt = this.project(centerAltAz.azimuth, centerAltAz.altitude);
          if (pt && pt.visible) {
            ctx.fillStyle = this.options.nightVision ? "rgba(252, 165, 165, 0.75)" : "rgba(186, 230, 253, 0.75)";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(con.name.toUpperCase(), pt.x, pt.y);
          }
        }
      }
    });
    ctx.restore();
  }

  drawStars() {
    const ctx = this.ctx;
    const nightVision = this.options.nightVision;

    this.stars.forEach(star => {
      const altaz = Astronomy.radecToAltAz(star.ra, star.dec, this.lat, this.lon, this.jd);
      if (altaz.altitude < -5) return;

      const pt = this.project(altaz.azimuth, altaz.altitude);
      if (!pt || !pt.visible) return;

      // Base radius scaled by magnitude (mag -1.5 is largest, mag 5.5 is smallest)
      const baseRadius = Math.max(0.7, (6.2 - star.mag) * 0.95);
      let r = baseRadius;

      // Subtle atmospheric scintillation / twinkle
      if (this.options.showTwinkle && star.mag < 3.5) {
        const twinkle = 0.85 + 0.15 * Math.sin(this.animTime * 3.0 + star.ra);
        r *= twinkle;
      }

      const color = nightVision ? "#ff4d4d" : Astronomy.bpRpToColor(star.bp_rp);

      // Star glow for bright stars
      if (star.mag < 2.2) {
        const glowRad = r * 3.2;
        const grad = ctx.createRadialGradient(pt.x, pt.y, r * 0.5, pt.x, pt.y, glowRad);
        grad.addColorStop(0, color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, glowRad, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Star core disk
      ctx.fillStyle = nightVision ? "#ffa3a3" : "#ffffff";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(0.6, r * 0.75), 0, 2 * Math.PI);
      ctx.fill();

      // Outer colored disc
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, 2 * Math.PI);
      ctx.fill();

      // Star label if famous / bright
      if (this.options.showStarNames && star.name && star.mag < 2.6) {
        ctx.fillStyle = nightVision ? "#fca5a5" : "#e2e8f0";
        ctx.font = "9px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(star.name, pt.x + r + 4, pt.y + 3);
      }
    });
  }

  drawGaiaHighlights() {
    const ctx = this.ctx;
    ctx.save();

    this.gaiaHighlights.forEach(star => {
      const altaz = Astronomy.radecToAltAz(star.ra, star.dec, this.lat, this.lon, this.jd);
      const pt = this.project(altaz.azimuth, altaz.altitude);
      if (!pt || !pt.visible) return;

      // Draw distinctive emerald target ring around Gaia query stars
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
      ctx.fill();

      if (star.phot_g_mean_mag) {
        ctx.fillStyle = "#6ee7b7";
        ctx.font = "9px monospace";
        ctx.fillText(`G ${Number(star.phot_g_mean_mag).toFixed(1)}`, pt.x + 8, pt.y + 3);
      }
    });
    ctx.restore();
  }

  drawSolarSystem() {
    const ctx = this.ctx;
    const nightVision = this.options.nightVision;

    // 1. Sun
    if (this.sun) {
      const sunPt = this.project(this.sun.azimuth, this.sun.altitude);
      if (sunPt && sunPt.visible) {
        const sunRadius = 10 * this.zoom;
        const grad = ctx.createRadialGradient(sunPt.x, sunPt.y, sunRadius * 0.2, sunPt.x, sunPt.y, sunRadius * 2.5);
        grad.addColorStop(0, nightVision ? "#ef4444" : "#fffbeb");
        grad.addColorStop(0.3, nightVision ? "#dc2626" : "#fef08a");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sunPt.x, sunPt.y, sunRadius * 2.5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = nightVision ? "#f87171" : "#f59e0b";
        ctx.beginPath();
        ctx.arc(sunPt.x, sunPt.y, sunRadius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = nightVision ? "#ff8888" : "#fbbf24";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Sun ☉", sunPt.x + sunRadius + 6, sunPt.y + 4);
      }
    }

    // 2. Moon
    if (this.moon) {
      const moonPt = this.project(this.moon.azimuth, this.moon.altitude);
      if (moonPt && moonPt.visible) {
        const moonRadius = 8 * this.zoom;
        ctx.fillStyle = nightVision ? "#ef4444" : "#f1f5f9";
        ctx.beginPath();
        ctx.arc(moonPt.x, moonPt.y, moonRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Moon phase shadow crescent
        const phase = this.moon.phaseFraction;
        ctx.fillStyle = nightVision ? "#450a0a" : "#0f172a";
        ctx.beginPath();
        ctx.arc(moonPt.x, moonPt.y, moonRadius - 0.5, -Math.PI / 2, Math.PI / 2, this.moon.isWaxing);
        ctx.fill();

        ctx.fillStyle = nightVision ? "#ffaaaa" : "#e2e8f0";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`Moon (${this.moon.phaseName})`, moonPt.x + moonRadius + 6, moonPt.y + 3);
      }
    }

    // 3. Planets
    this.planets.forEach(p => {
      const pt = this.project(p.azimuth, p.altitude);
      if (!pt || !pt.visible) return;

      const r = Math.max(2.5, (4.5 - p.mag * 0.5));
      const col = nightVision ? "#ff5555" : p.color;

      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, 2 * Math.PI);
      ctx.fill();

      // Saturn Rings hint
      if (p.name === "Saturn") {
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, r * 2.2, r * 0.8, Math.PI / 6, 0, 2 * Math.PI);
        ctx.stroke();
      }

      ctx.fillStyle = nightVision ? "#ff9999" : "#cbd5e1";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${p.name}`, pt.x + r + 5, pt.y + 3);
    });
  }

  drawISS() {
    const ctx = this.ctx;
    const iss = this.iss;
    if (!iss) return;

    // Draw orbital path trail across sky
    if (this.options.showISSTrail && iss.sky_trajectory && iss.sky_trajectory.length > 1) {
      ctx.save();
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = this.options.nightVision ? "rgba(248, 113, 113, 0.7)" : "rgba(250, 204, 21, 0.65)";

      ctx.beginPath();
      let first = true;
      iss.sky_trajectory.forEach(pt => {
        const proj = this.project(pt.az, pt.el);
        if (proj && proj.visible) {
          if (first) {
            ctx.moveTo(proj.x, proj.y);
            first = false;
          } else {
            ctx.lineTo(proj.x, proj.y);
          }
        } else {
          first = true;
        }
      });
      ctx.stroke();
      ctx.restore();
    }

    // Draw current ISS position
    const currentAlt = iss.currentAlt != null ? iss.currentAlt : (iss.topocentric ? iss.topocentric.elevation_deg : -90);
    const currentAz = iss.currentAz != null ? iss.currentAz : (iss.topocentric ? iss.topocentric.azimuth_deg : 0);

    const pt = this.project(currentAz, currentAlt);

    if (pt && pt.visible) {
      // 1. Calculate flight direction vector on sky projection
      let angle = 0;
      let hasAngle = false;
      if (iss.nextAz != null && iss.nextAlt != null) {
        const ptNext = this.project(iss.nextAz, iss.nextAlt);
        if (ptNext) {
          angle = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x);
          hasAngle = true;
        }
      }

      // 2. Pulsing Beacon Halo & Reticle
      const pulse = 1.0 + 0.25 * Math.sin(this.animTime * 5.0);
      const beaconRadius = 15 * pulse;

      ctx.save();
      ctx.strokeStyle = this.options.nightVision ? "rgba(239, 68, 68, 0.75)" : "rgba(250, 204, 21, 0.75)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, beaconRadius, 0, 2 * Math.PI);
      ctx.stroke();

      // Targeting reticle corners
      ctx.strokeStyle = this.options.nightVision ? "#f87171" : "#facc15";
      ctx.lineWidth = 1.2;
      const tick = 4;
      const rReticle = 16;
      [-1, 1].forEach(sx => {
        [-1, 1].forEach(sy => {
          ctx.beginPath();
          ctx.moveTo(pt.x + sx * rReticle, pt.y + sy * (rReticle - tick));
          ctx.lineTo(pt.x + sx * rReticle, pt.y + sy * rReticle);
          ctx.lineTo(pt.x + sx * (rReticle - tick), pt.y + sy * rReticle);
          ctx.stroke();
        });
      });
      ctx.restore();

      // 3. Mini ISS Image rendering
      const issSize = 34;
      if (this.issImageLoaded && this.issImage.naturalWidth > 0) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.translate(pt.x, pt.y);
        if (hasAngle) {
          // Align with flight trajectory direction (-45 deg to align illustration diagonal)
          ctx.rotate(angle - Math.PI / 4);
        }
        // Glowing aura shadow
        ctx.shadowColor = this.options.nightVision ? "rgba(239, 68, 68, 0.9)" : "rgba(250, 204, 21, 0.85)";
        ctx.shadowBlur = 10;
        ctx.drawImage(this.issImage, -issSize / 2, -issSize / 2, issSize, issSize);
        ctx.restore();
      } else {
        // Fallback satellite core marker (solar array cross shape)
        ctx.fillStyle = this.options.nightVision ? "#ff7777" : "#fef08a";
        ctx.fillRect(pt.x - 7, pt.y - 1.5, 14, 3); // Horizontal solar wings
        ctx.fillRect(pt.x - 2, pt.y - 5, 4, 10);  // Central habitat module
      }

      // 4. Label badge and telemetry
      ctx.save();
      ctx.fillStyle = this.options.nightVision ? "#ffaaaa" : "#fef08a";
      ctx.font = "bold 11px monospace";
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 4;
      ctx.textAlign = "left";
      ctx.fillText("🛸 ISS (LIVE)", pt.x + 20, pt.y - 4);

      ctx.fillStyle = this.options.nightVision ? "rgba(254, 202, 202, 0.9)" : "rgba(254, 240, 138, 0.9)";
      ctx.font = "9px monospace";
      const altStr = `${currentAlt.toFixed(1)}°`;
      const distStr = `${Math.round(iss.rangeKm || (iss.topocentric ? iss.topocentric.slant_range_km : 420))} km`;
      ctx.fillText(`Alt ${altStr} • ${distStr}`, pt.x + 20, pt.y + 9);
      ctx.restore();
    } else {
      // Below horizon - Draw radar approach indicator on horizon rim
      const cx = this.width / 2 + this.panX;
      const cy = this.height / 2 + this.panY;
      const radius = Math.min(this.width, this.height) * 0.44 * this.zoom;

      if (this.options.mode === 'planisphere') {
        const theta = (currentAz - 90.0) * (Math.PI / 180.0) + this.rotAngle;
        const arrowX = cx - (radius - 12) * Math.cos(theta);
        const arrowY = cy + (radius - 12) * Math.sin(theta);

        ctx.save();
        if (this.issImageLoaded && this.issImage.naturalWidth > 0) {
          ctx.save();
          ctx.translate(arrowX, arrowY);
          ctx.shadowColor = this.options.nightVision ? "rgba(239,68,68,0.7)" : "rgba(234,179,8,0.7)";
          ctx.shadowBlur = 6;
          ctx.drawImage(this.issImage, -9, -9, 18, 18);
          ctx.restore();
        } else {
          ctx.fillStyle = this.options.nightVision ? "rgba(239, 68, 68, 0.7)" : "rgba(234, 179, 8, 0.8)";
          ctx.beginPath();
          ctx.arc(arrowX, arrowY + 6, 3.5, 0, 2 * Math.PI);
          ctx.fill();
        }

        ctx.fillStyle = this.options.nightVision ? "rgba(239, 68, 68, 0.85)" : "rgba(234, 179, 8, 0.9)";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`ISS (${currentAlt.toFixed(0)}°)`, arrowX, arrowY - 11);
        ctx.restore();
      }
    }
  }

  drawHorizonRim() {
    const ctx = this.ctx;
    const cx = this.width / 2 + this.panX;
    const cy = this.height / 2 + this.panY;
    const radius = Math.min(this.width, this.height) * 0.44 * this.zoom;

    if (this.options.mode === 'planisphere') {
      ctx.save();
      // Horizon circular boundary
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = this.options.nightVision ? "#dc2626" : "#38bdf8";
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // Cardinal direction ticks & letters
      const cardinals = [
        { label: "N", az: 0 },
        { label: "NE", az: 45 },
        { label: "E", az: 90 },
        { label: "SE", az: 135 },
        { label: "S", az: 180 },
        { label: "SW", az: 225 },
        { label: "W", az: 270 },
        { label: "NW", az: 315 }
      ];

      cardinals.forEach(card => {
        const theta = (card.az - 90.0) * (Math.PI / 180.0) + this.rotAngle;
        const tx = cx - (radius + 16) * Math.cos(theta);
        const ty = cy + (radius + 16) * Math.sin(theta);

        ctx.fillStyle = card.label.length === 1 
          ? (this.options.nightVision ? "#ef4444" : "#38bdf8") 
          : (this.options.nightVision ? "#b91c1c" : "#94a3b8");
        ctx.font = card.label.length === 1 ? "bold 13px sans-serif" : "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(card.label, tx, ty);
      });
      ctx.restore();
    } else {
      // Panorama horizon line
      const horizonY = cy + (this.panoramaAlt / 75.0) * (this.height / 2);
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.options.nightVision ? "#dc2626" : "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(this.width, horizonY);
      ctx.stroke();

      ctx.fillStyle = this.options.nightVision ? "#ef4444" : "#38bdf8";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("HORIZON (0° Alt)", 16, horizonY - 6);
      ctx.restore();
    }
  }

  checkHover(mouseX, mouseY) {
    let closest = null;
    let minDist = 18; // Pixel hit radius

    // Check ISS
    if (this.iss) {
      const currentAlt = this.iss.currentAlt != null ? this.iss.currentAlt : (this.iss.topocentric ? this.iss.topocentric.elevation_deg : -90);
      const currentAz = this.iss.currentAz != null ? this.iss.currentAz : (this.iss.topocentric ? this.iss.topocentric.azimuth_deg : 0);
      const pt = this.project(currentAz, currentAlt);
      if (pt && pt.visible) {
        const d = Math.hypot(mouseX - pt.x, mouseY - pt.y);
        if (d < minDist) {
          closest = {
            type: "satellite",
            name: "International Space Station (ISS)",
            data: this.iss,
            az: currentAz,
            alt: currentAlt,
            x: pt.x,
            y: pt.y
          };
          minDist = d;
        }
      }
    }

    // Check Planets
    if (this.options.showPlanets) {
      this.planets.forEach(p => {
        const pt = this.project(p.azimuth, p.altitude);
        if (pt && pt.visible) {
          const d = Math.hypot(mouseX - pt.x, mouseY - pt.y);
          if (d < minDist) {
            closest = {
              type: "planet",
              name: p.name,
              data: p,
              az: p.azimuth,
              alt: p.altitude,
              x: pt.x,
              y: pt.y
            };
            minDist = d;
          }
        }
      });

      // Check Moon
      if (this.moon) {
        const pt = this.project(this.moon.azimuth, this.moon.altitude);
        if (pt && pt.visible) {
          const d = Math.hypot(mouseX - pt.x, mouseY - pt.y);
          if (d < minDist) {
            closest = {
              type: "moon",
              name: `Moon (${this.moon.phaseName})`,
              data: this.moon,
              az: this.moon.azimuth,
              alt: this.moon.altitude,
              x: pt.x,
              y: pt.y
            };
            minDist = d;
          }
        }
      }
    }

    // Check Stars
    this.stars.forEach(star => {
      const altaz = Astronomy.radecToAltAz(star.ra, star.dec, this.lat, this.lon, this.jd);
      if (altaz.altitude < 0) return;
      const pt = this.project(altaz.azimuth, altaz.altitude);
      if (pt && pt.visible) {
        const d = Math.hypot(mouseX - pt.x, mouseY - pt.y);
        if (d < minDist) {
          closest = {
            type: "star",
            name: star.name || star.bayer || `Gaia ${star.id}`,
            data: star,
            az: altaz.azimuth,
            alt: altaz.altitude,
            x: pt.x,
            y: pt.y
          };
          minDist = d;
        }
      }
    });

    // Check ISS Satellite
    if (this.iss) {
      const currentAlt = this.iss.currentAlt != null ? this.iss.currentAlt : (this.iss.topocentric ? this.iss.topocentric.elevation_deg : -90);
      const currentAz = this.iss.currentAz != null ? this.iss.currentAz : (this.iss.topocentric ? this.iss.topocentric.azimuth_deg : 0);
      const pt = this.project(currentAz, currentAlt);
      if (pt && pt.visible) {
        const d = Math.hypot(mouseX - pt.x, mouseY - pt.y);
        if (d < 22 && d < minDist) {
          closest = {
            type: "satellite",
            name: "International Space Station (ISS)",
            data: this.iss,
            az: currentAz,
            alt: currentAlt,
            x: pt.x,
            y: pt.y
          };
          minDist = d;
        }
      }
    }

    if (closest !== this.hoveredObject) {
      this.hoveredObject = closest;
      this.canvas.style.cursor = closest ? "pointer" : "default";
      this.render();
    }
  }

  drawTooltip(obj) {
    const ctx = this.ctx;
    ctx.save();

    const title = obj.name;
    const sub1 = `Alt: ${obj.alt.toFixed(1)}° | Az: ${obj.az.toFixed(1)}°`;
    let sub2 = "";
    if (obj.type === "star") {
      sub2 = `Mag: ${obj.data.mag} | Dist: ${obj.data.dist_ly ? obj.data.dist_ly + " ly" : "N/A"}`;
    } else if (obj.type === "planet") {
      sub2 = `Mag: ${obj.data.mag} | Dist: ${obj.data.distAu} AU`;
    } else if (obj.type === "satellite") {
      sub2 = `Alt: ~420 km | Spd: ~27,600 km/h`;
    }

    ctx.font = "bold 12px sans-serif";
    const w1 = ctx.measureText(title).width;
    ctx.font = "10px monospace";
    const w2 = ctx.measureText(sub1).width;
    const w3 = ctx.measureText(sub2).width;
    const boxW = Math.max(w1, w2, w3) + 24;
    const boxH = sub2 ? 56 : 42;

    let bx = obj.x + 14;
    let by = obj.y - boxH / 2;
    if (bx + boxW > this.width - 10) bx = obj.x - boxW - 14;
    if (by < 10) by = 10;
    if (by + boxH > this.height - 10) by = this.height - boxH - 10;

    // Tooltip backdrop glass
    ctx.fillStyle = this.options.nightVision ? "rgba(40, 0, 0, 0.9)" : "rgba(15, 23, 42, 0.92)";
    ctx.strokeStyle = this.options.nightVision ? "#ef4444" : "#38bdf8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = this.options.nightVision ? "#ff8888" : "#38bdf8";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(title, bx + 10, by + 16);

    ctx.fillStyle = this.options.nightVision ? "#fca5a5" : "#cbd5e1";
    ctx.font = "10px monospace";
    ctx.fillText(sub1, bx + 10, by + 32);

    if (sub2) {
      ctx.fillStyle = this.options.nightVision ? "#f87171" : "#94a3b8";
      ctx.fillText(sub2, bx + 10, by + 47);
    }

    ctx.restore();
  }
}

window.SkyMap = SkyMap;
