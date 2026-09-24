/**
 * Local Star Map - Client-side Astronomical Calculation Engine
 * High-precision algorithms for Julian Date, LST, Alt/Az, Sun, Moon, Planets, and Satellite ENU geometry.
 */

const Astronomy = {
  WGS84_A: 6378.137, // km
  WGS84_F: 1.0 / 298.257223563,
  
  toJulianDate(date) {
    let year = date.getUTCFullYear();
    let month = date.getUTCMonth() + 1;
    const day = date.getUTCDate() + 
                (date.getUTCHours() + date.getUTCMinutes() / 60.0 + 
                 date.getUTCSeconds() / 3600.0 + date.getUTCMilliseconds() / 3.6e6) / 24.0;
    
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
  },

  getGMST(jd) {
    const d = jd - 2451545.0;
    let gmst = 18.697374558 + 24.06570982441908 * d;
    return ((gmst % 24.0) + 24.0) % 24.0;
  },

  getLST(jd, lonDeg) {
    const gmst = this.getGMST(jd);
    let lst = (gmst + lonDeg / 15.0) % 24.0;
    return ((lst % 24.0) + 24.0) % 24.0;
  },

  radecToAltAz(raDeg, decDeg, latDeg, lonDeg, jd) {
    const lstDeg = this.getLST(jd, lonDeg) * 15.0;
    const haDeg = ((lstDeg - raDeg + 360.0) % 360.0);
    
    const ha = haDeg * (Math.PI / 180.0);
    const dec = decDeg * (Math.PI / 180.0);
    const lat = latDeg * (Math.PI / 180.0);
    
    let sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
    sinAlt = Math.max(-1.0, Math.min(1.0, sinAlt));
    const altRad = Math.asin(sinAlt);
    
    const cosAlt = Math.cos(altRad);
    let azRad = 0;
    if (cosAlt > 1e-6) {
      let cosAz = (Math.sin(dec) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * cosAlt);
      cosAz = Math.max(-1.0, Math.min(1.0, cosAz));
      azRad = Math.acos(cosAz);
      if (Math.sin(ha) > 0) {
        azRad = 2 * Math.PI - azRad;
      }
    }
    
    return {
      altitude: altRad * (180.0 / Math.PI),
      azimuth: azRad * (180.0 / Math.PI)
    };
  },

  getSunPosition(jd) {
    const d = jd - 2451545.0;
    const M = ((357.5291 + 0.98560028 * d) % 360.0) * (Math.PI / 180.0);
    const L0 = ((280.46646 + 0.98564736 * d) % 360.0) * (Math.PI / 180.0);
    
    const C = (1.914602 * Math.sin(M) + 0.019993 * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M)) * (Math.PI / 180.0);
    const trueLon = L0 + C;
    const eps = (23.439291 - 0.0130042 * (d / 36525.0)) * (Math.PI / 180.0);
    
    const sinDec = Math.sin(eps) * Math.sin(trueLon);
    const decRad = Math.asin(Math.max(-1.0, Math.min(1.0, sinDec)));
    
    const y = Math.cos(eps) * Math.sin(trueLon);
    const x = Math.cos(trueLon);
    let raRad = Math.atan2(y, x);
    if (raRad < 0) raRad += 2 * Math.PI;
    
    return {
      ra: raRad * (180.0 / Math.PI),
      dec: decRad * (180.0 / Math.PI),
      eclipticLon: (trueLon * (180.0 / Math.PI)) % 360.0
    };
  },

  getMoonPosition(jd) {
    const d = jd - 2451545.0;
    const L = ((218.316 + 13.176396 * d) % 360.0) * (Math.PI / 180.0);
    const M = ((134.963 + 13.064993 * d) % 360.0) * (Math.PI / 180.0);
    const F = ((93.272 + 13.229350 * d) % 360.0) * (Math.PI / 180.0);
    const Ms = ((357.529 + 0.985600 * d) % 360.0) * (Math.PI / 180.0);
    const D = ((297.850 + 12.190749 * d) % 360.0) * (Math.PI / 180.0);
    
    const lPert = 6.289 * Math.sin(M) + 1.274 * Math.sin(2 * D - M) + 
                  0.658 * Math.sin(2 * D) + 0.214 * Math.sin(2 * M) - 
                  0.186 * Math.sin(Ms) - 0.114 * Math.sin(2 * F);
    const lon = ((L * (180.0 / Math.PI) + lPert) % 360.0) * (Math.PI / 180.0);
    
    const bPert = 5.128 * Math.sin(F) + 0.280 * Math.sin(M + F) + 
                  0.277 * Math.sin(M - F) + 0.173 * Math.sin(2 * D - F);
    const lat = (bPert) * (Math.PI / 180.0);
    
    const eps = 23.439 * (Math.PI / 180.0);
    const sinDec = Math.sin(lat) * Math.cos(eps) + Math.cos(lat) * Math.sin(eps) * Math.sin(lon);
    const decRad = Math.asin(Math.max(-1.0, Math.min(1.0, sinDec)));
    
    const y = Math.sin(lon) * Math.cos(eps) - Math.tan(lat) * Math.sin(eps);
    const x = Math.cos(lon);
    let raRad = Math.atan2(y, x);
    if (raRad < 0) raRad += 2 * Math.PI;
    
    // Phase calculation
    const sun = this.getSunPosition(jd);
    const sunDec = sun.dec * (Math.PI / 180.0);
    const sunRa = sun.ra * (Math.PI / 180.0);
    
    const cosElong = Math.sin(decRad) * Math.sin(sunDec) + 
                     Math.cos(decRad) * Math.cos(sunDec) * Math.cos(raRad - sunRa);
    const elong = Math.acos(Math.max(-1.0, Math.min(1.0, cosElong)));
    const phaseFraction = (1.0 - Math.cos(elong)) / 2.0;
    
    const sunLon = sun.eclipticLon * (Math.PI / 180.0);
    const lonDiff = ((lon - sunLon) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const isWaxing = lonDiff < Math.PI;
    
    let phaseName = "New Moon";
    if (phaseFraction < 0.03) phaseName = "New Moon";
    else if (phaseFraction < 0.45) phaseName = isWaxing ? "Waxing Crescent" : "Waning Crescent";
    else if (phaseFraction < 0.55) phaseName = isWaxing ? "First Quarter" : "Last Quarter";
    else if (phaseFraction < 0.97) phaseName = isWaxing ? "Waxing Gibbous" : "Waning Gibbous";
    else phaseName = "Full Moon";
    
    return {
      ra: raRad * (180.0 / Math.PI),
      dec: decRad * (180.0 / Math.PI),
      phaseFraction,
      phaseName,
      isWaxing,
      elongationDeg: elong * (180.0 / Math.PI)
    };
  },

  planetsElements: {
    Mercury: { N: [48.3313, 3.24587e-5], i: [7.0047, 5e-8], w: [29.1241, 1.01444e-5], a: 0.387098, e: [0.205635, 5.59e-10], M: [168.6562, 4.0923344368], color: "#e2b688", mag: -0.4 },
    Venus:   { N: [76.6799, 2.46590e-5], i: [3.3946, 2.75e-8], w: [54.8910, 1.38374e-5], a: 0.723330, e: [0.006773, -1.302e-9], M: [48.0052, 1.6021302244], color: "#ffeaa7", mag: -4.4 },
    Mars:    { N: [49.5574, 2.11081e-5], i: [1.8497, -1.78e-8], w: [286.5016, 2.92961e-5], a: 1.523688, e: [0.093405, 2.516e-9], M: [18.6021, 0.5240207766], color: "#ff7675", mag: -1.5 },
    Jupiter: { N: [100.4542, 2.76854e-5], i: [1.3030, -1.557e-7], w: [273.8777, 1.64505e-5], a: 5.20256, e: [0.048498, 4.469e-9], M: [19.8950, 0.0830853001], color: "#fdcb6e", mag: -2.7 },
    Saturn:  { N: [113.6634, 2.38980e-5], i: [2.4886, -1.081e-7], w: [339.3939, 2.97661e-5], a: 9.55475, e: [0.055546, -9.499e-9], M: [316.9670, 0.0334442282], color: "#f9ca24", mag: 0.7 },
    Uranus:  { N: [74.0005, 1.3978e-5], i: [0.7733, 1.9e-8], w: [96.6612, 3.0565e-5], a: 19.18171, e: [0.047318, 7.45e-9], M: [142.5905, 0.011725806], color: "#81ecec", mag: 5.6 },
    Neptune: { N: [131.7806, 3.0173e-5], i: [1.7700, -2.55e-7], w: [272.8461, -6.027e-6], a: 30.05826, e: [0.008606, 2.15e-9], M: [260.2471, 0.005995147], color: "#74b9ff", mag: 7.8 }
  },

  getPlanets(jd) {
    const d = jd - 2451545.0;
    const sun = this.getSunPosition(jd);
    const sunLon = sun.eclipticLon * (Math.PI / 180.0);
    const sunR = 1.0;
    const xEarth = sunR * Math.cos(sunLon + Math.PI);
    const yEarth = sunR * Math.sin(sunLon + Math.PI);
    const eps = (23.439291 - 0.0130042 * (d / 36525.0)) * (Math.PI / 180.0);
    
    const results = [];
    for (const [name, el] of Object.entries(this.planetsElements)) {
      const N = (((el.N[0] + el.N[1] * d) % 360.0) + 360.0) % 360.0 * (Math.PI / 180.0);
      const i = (el.i[0] + el.i[1] * d) * (Math.PI / 180.0);
      const w = (((el.w[0] + el.w[1] * d) % 360.0) + 360.0) % 360.0 * (Math.PI / 180.0);
      const a = el.a;
      const e = el.e[0] + el.e[1] * d;
      const M = (((el.M[0] + el.M[1] * d) % 360.0) + 360.0) % 360.0 * (Math.PI / 180.0);
      
      let E = M;
      for (let iter = 0; iter < 10; iter++) {
        const dE = (M - (E - e * Math.sin(E))) / (1.0 - e * Math.cos(E));
        E += dE;
        if (Math.abs(dE) < 1e-6) break;
      }
      
      const xv = a * (Math.cos(E) - e);
      const yv = a * (Math.sqrt(Math.max(0, 1.0 - e * e)) * Math.sin(E));
      const r = Math.hypot(xv, yv);
      const v = Math.atan2(yv, xv);
      
      const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i));
      const yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i));
      const zh = r * (Math.sin(v + w) * Math.sin(i));
      
      const xg = xh - xEarth;
      const yg = yh - yEarth;
      const zg = zh;
      const dist = Math.sqrt(xg * xg + yg * yg + zg * zg);
      
      const xe = xg;
      const ye = yg * Math.cos(eps) - zg * Math.sin(eps);
      const ze = yg * Math.sin(eps) + zg * Math.cos(eps);
      
      let ra = Math.atan2(ye, xe) * (180.0 / Math.PI);
      if (ra < 0) ra += 360.0;
      const dec = Math.asin(Math.max(-1.0, Math.min(1.0, ze / dist))) * (180.0 / Math.PI);
      
      results.push({
        name,
        ra,
        dec,
        distAu: dist.toFixed(3),
        color: el.color,
        mag: el.mag
      });
    }
    return results;
  },

  geodeticToEcef(latDeg, lonDeg, altKm) {
    const phi = latDeg * (Math.PI / 180.0);
    const lam = lonDeg * (Math.PI / 180.0);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const e2 = this.WGS84_F * (2 - this.WGS84_F);
    const N = this.WGS84_A / Math.sqrt(1.0 - e2 * sinPhi * sinPhi);
    
    return {
      x: (N + altKm) * cosPhi * Math.cos(lam),
      y: (N + altKm) * cosPhi * Math.sin(lam),
      z: (N * (1.0 - e2) + altKm) * sinPhi
    };
  },

  ecefToEnu(satX, satY, satZ, obsX, obsY, obsZ, obsLatDeg, obsLonDeg) {
    const dx = satX - obsX;
    const dy = satY - obsY;
    const dz = satZ - obsZ;
    
    const phi = obsLatDeg * (Math.PI / 180.0);
    const lam = obsLonDeg * (Math.PI / 180.0);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const sinLam = Math.sin(lam);
    const cosLam = Math.cos(lam);
    
    const east  = -sinLam * dx + cosLam * dy;
    const north = -sinPhi * cosLam * dx - sinPhi * sinLam * dy + cosPhi * dz;
    const up    =  cosPhi * cosLam * dx + cosPhi * sinLam * dy + sinPhi * dz;
    
    const horizDist = Math.hypot(east, north);
    const slantRange = Math.sqrt(east * east + north * north + up * up);
    
    const elevation = Math.atan2(up, horizDist) * (180.0 / Math.PI);
    let azimuth = Math.atan2(east, north) * (180.0 / Math.PI);
    if (azimuth < 0) azimuth += 360.0;
    
    return { azimuth, elevation, slantRange };
  },

  /**
   * Maps ESA Gaia BP-RP color index to RGB color hex.
   * BP-RP ranges roughly from -0.4 (hot blue O-star) to 3.0+ (cool red M-star).
   */
  bpRpToColor(bpRp) {
    if (bpRp == null) return "#dbe4ff";
    if (bpRp < -0.2) return "#9bb0ff"; // O / B0
    if (bpRp < 0.0)  return "#aabfff"; // B
    if (bpRp < 0.3)  return "#cad7ff"; // A
    if (bpRp < 0.6)  return "#f8f9ff"; // F
    if (bpRp < 0.9)  return "#fff4e8"; // G (Sun)
    if (bpRp < 1.4)  return "#ffd2a1"; // K
    if (bpRp < 2.0)  return "#ffb56c"; // Early M
    return "#ff8e6c"; // Late M / Carbon star
  }
};

window.Astronomy = Astronomy;
