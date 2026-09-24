/**
 * Local Star Map - ESA Gaia TAP Archive Query Console & Manager
 */

class GaiaConsole {
  constructor(options = {}) {
    this.skymap = options.skymap || null;
    this.resultsContainer = document.getElementById('gaia-query-results');
    this.statusContainer = document.getElementById('gaia-query-status');
    this.queryInput = document.getElementById('gaia-adql-input');
    this.presetSelect = document.getElementById('gaia-preset-select');
    this.runBtn = document.getElementById('btn-run-gaia');
    this.clearBtn = document.getElementById('btn-clear-gaia');
    
    this.currentStars = [];
    this.initEvents();
  }

  initEvents() {
    if (this.presetSelect) {
      this.presetSelect.addEventListener('change', (e) => {
        this.loadPreset(e.target.value);
      });
    }

    if (this.runBtn) {
      this.runBtn.addEventListener('click', () => {
        this.runQuery();
      });
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => {
        this.clearHighlights();
      });
    }
  }

  loadPreset(presetKey) {
    if (!this.queryInput) return;
    
    let query = "";
    switch (presetKey) {
      case "zenith":
        // Query around current local zenith (RA = LST, Dec = Lat)
        const jd = this.skymap ? this.skymap.jd : Astronomy.toJulianDate(new Date());
        const lstDeg = this.skymap ? Astronomy.getLST(jd, this.skymap.lon) * 15.0 : 0;
        const lat = this.skymap ? this.skymap.lat : 40.71;
        query = `SELECT TOP 100 
    source_id, ra, dec, phot_g_mean_mag, bp_rp, parallax 
FROM gaiadr3.gaia_source 
WHERE 1=CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', ${lstDeg.toFixed(2)}, ${lat.toFixed(2)}, 5.0))
  AND phot_g_mean_mag <= 9.0
ORDER BY phot_g_mean_mag ASC`;
        break;

      case "pleiades":
        // Pleiades Open Cluster (Seven Sisters)
        query = `SELECT TOP 80 
    source_id, ra, dec, phot_g_mean_mag, bp_rp, parallax 
FROM gaiadr3.gaia_source 
WHERE 1=CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', 56.75, 24.12, 1.8))
  AND phot_g_mean_mag <= 10.0
ORDER BY phot_g_mean_mag ASC`;
        break;

      case "orion_belt":
        // Orion Belt region
        query = `SELECT TOP 80 
    source_id, ra, dec, phot_g_mean_mag, bp_rp, parallax 
FROM gaiadr3.gaia_source 
WHERE 1=CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', 84.05, -1.20, 2.5))
  AND phot_g_mean_mag <= 9.5
ORDER BY phot_g_mean_mag ASC`;
        break;

      case "brightest_100":
        query = `SELECT TOP 100 
    source_id, ra, dec, phot_g_mean_mag, bp_rp, parallax 
FROM gaiadr3.gaia_source 
WHERE phot_g_mean_mag <= 4.0
ORDER BY phot_g_mean_mag ASC`;
        break;

      case "polaris":
        query = `SELECT TOP 60 
    source_id, ra, dec, phot_g_mean_mag, bp_rp, parallax 
FROM gaiadr3.gaia_source 
WHERE 1=CONTAINS(POINT('ICRS', ra, dec), CIRCLE('ICRS', 37.95, 89.26, 2.0))
  AND phot_g_mean_mag <= 10.0
ORDER BY phot_g_mean_mag ASC`;
        break;

      default:
        query = `SELECT TOP 50 source_id, ra, dec, phot_g_mean_mag, bp_rp, parallax FROM gaiadr3.gaia_source WHERE phot_g_mean_mag < 3.0 ORDER BY phot_g_mean_mag ASC`;
    }

    this.queryInput.value = query;
  }

  async runQuery() {
    if (!this.queryInput) return;
    const query = this.queryInput.value.trim();
    if (!query) return;

    this.setStatus("Executing ADQL query on ESA Gaia TAP server...", "loading");
    if (this.runBtn) this.runBtn.disabled = true;

    try {
      const resp = await fetch("/api/gaia/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query, timeout_sec: 30 })
      });

      const res = await resp.json();
      if (res.success) {
        this.currentStars = res.rows || [];
        this.setStatus(`Success: Returned ${res.count} stars in ${res.duration_ms} ms from ESA Gaia Archive.`, "success");
        this.renderResultsTable(res.rows, res.columns);

        // Highlight stars in skymap
        if (this.skymap) {
          this.skymap.setGaiaHighlights(this.currentStars);
        }
      } else {
        this.setStatus(`Gaia TAP Error: ${res.error || 'Query failed'}`, "error");
      }
    } catch (err) {
      this.setStatus(`Network Error: Failed to contact Gaia API proxy (${err.message})`, "error");
    } finally {
      if (this.runBtn) this.runBtn.disabled = false;
    }
  }

  clearHighlights() {
    this.currentStars = [];
    if (this.skymap) {
      this.skymap.setGaiaHighlights([]);
    }
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = '<div class="text-xs text-slate-500 py-3 text-center">No query active. Select a preset or write ADQL above.</div>';
    }
    this.setStatus("Highlights cleared.", "idle");
  }

  setStatus(msg, state = "idle") {
    if (!this.statusContainer) return;
    let badgeClass = "text-slate-400";
    let icon = "ℹ️";
    if (state === "loading") {
      badgeClass = "text-amber-400 animate-pulse font-semibold";
      icon = "⏳";
    } else if (state === "success") {
      badgeClass = "text-emerald-400 font-semibold";
      icon = "✅";
    } else if (state === "error") {
      badgeClass = "text-red-400 font-semibold";
      icon = "⚠️";
    }

    this.statusContainer.innerHTML = `<span class="${badgeClass}">${icon} ${msg}</span>`;
  }

  renderResultsTable(rows, columns) {
    if (!this.resultsContainer) return;
    if (!rows || rows.length === 0) {
      this.resultsContainer.innerHTML = '<div class="text-xs text-slate-500 py-3 text-center">Query returned 0 rows.</div>';
      return;
    }

    let html = `
      <div class="overflow-x-auto max-h-56 border border-slate-700 rounded text-xs font-mono">
        <table class="w-full text-left text-slate-300">
          <thead class="bg-slate-800 text-sky-400 sticky top-0 border-b border-slate-700">
            <tr>
              <th class="p-1.5">Source ID</th>
              <th class="p-1.5">RA (°)</th>
              <th class="p-1.5">Dec (°)</th>
              <th class="p-1.5">G Mag</th>
              <th class="p-1.5">BP-RP</th>
              <th class="p-1.5">Parallax</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
    `;

    rows.slice(0, 50).forEach(r => {
      const srcId = r.source_id || "N/A";
      const ra = r.ra != null ? Number(r.ra).toFixed(4) : "N/A";
      const dec = r.dec != null ? Number(r.dec).toFixed(4) : "N/A";
      const mag = r.phot_g_mean_mag != null ? Number(r.phot_g_mean_mag).toFixed(2) : "N/A";
      const bprp = r.bp_rp != null ? Number(r.bp_rp).toFixed(2) : "N/A";
      const plx = r.parallax != null ? Number(r.parallax).toFixed(2) : "N/A";

      html += `
        <tr class="hover:bg-slate-800/60 cursor-pointer" onclick="window.gaiaConsole.focusStar('${srcId}', ${r.ra}, ${r.dec})">
          <td class="p-1.5 text-sky-300">${srcId}</td>
          <td class="p-1.5">${ra}</td>
          <td class="p-1.5">${dec}</td>
          <td class="p-1.5 text-amber-300">${mag}</td>
          <td class="p-1.5">${bprp}</td>
          <td class="p-1.5">${plx}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
      <div class="text-[10px] text-slate-500 mt-1 flex justify-between">
        <span>Showing ${Math.min(rows.length, 50)} of ${rows.length} rows</span>
        <button class="hover:text-sky-400 text-slate-400 underline" onclick="window.gaiaConsole.downloadJSON()">Download JSON</button>
      </div>
    `;

    this.resultsContainer.innerHTML = html;
  }

  focusStar(id, ra, dec) {
    if (!this.skymap || ra == null || dec == null) return;
    const jd = this.skymap.jd;
    const altaz = Astronomy.radecToAltAz(ra, dec, this.skymap.lat, this.skymap.lon, jd);
    if (altaz.altitude < 0) {
      alert(`Star is currently below horizon at Alt ${altaz.altitude.toFixed(1)}°`);
      return;
    }
    // Zoom in on star
    this.skymap.zoom = 3.0;
    this.skymap.render();
  }

  downloadJSON() {
    if (!this.currentStars.length) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.currentStars, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `gaia_dr3_query_${Date.now()}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

window.GaiaConsole = GaiaConsole;
