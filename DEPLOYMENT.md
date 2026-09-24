# 🚀 GitHub Pages Deployment Guide

This guide will show you how to host the **Local Star Map & ISS Observatory** live on GitHub Pages with zero server costs and zero configuration.

---

## 🌐 How It Works on GitHub Pages
GitHub Pages hosts purely static websites (HTML, CSS, JavaScript, JSON).
This application has been packaged so that **all core features work client-side in the browser**:

* **ESA Gaia DR3 Star Catalog**: Loads the pre-compiled 3,880 bright star catalog (`./data/gaia_bright_stars.json`) via relative paths.
* **Constellations & Planets**: All astronomical coordinate calculations (Julian Date, Local Sidereal Time, Alt/Az transformations, Keplerian planetary orbits, Moon phase) run client-side in JavaScript at 60 FPS.
* **Live ISS Telemetry & Orbit Path**: Connects directly to the public CORS-enabled ISS API (`api.wheretheiss.at`) to calculate the real-time satellite position, 90-minute ground track, and local sky trajectory.
* **Global Location Search**: Uses the built-in database of 150+ cities and observatories, plus direct browser access to OpenStreetMap Nominatim geocoding.

---

## 📋 Step-by-Step Hosting Instructions

### Step 1: Create a New GitHub Repository
1. Log in to [GitHub](https://github.com/).
2. In the top right corner, click the **`+`** icon and select **New repository**.
3. Name your repository (for example: `star-map` or `star-project`).
4. Choose **Public** (required for free GitHub Pages).
5. Leave "Add a README file" unchecked (since we already have a `README.md`).
6. Click **Create repository**.

---

### Step 2: Upload Your Files

Choose whichever method is easiest for you:

#### Option A: Web Browser Drag & Drop (Easiest — No Git required!)
1. On your newly created GitHub repository page, click the link that says **"uploading an existing file"**.
2. Open your local project folder:
   ```
   c:\Users\hunte\OneDrive\AA_SCHOOL\Fall 26\IARC 425\Module B\Star Project
   ```
3. Drag and drop all files and folders into GitHub:
   * `index.html` (at the root)
   * `.nojekyll`
   * `.gitignore`
   * `README.md`
   * `data/` folder (contains `gaia_bright_stars.json` and `constellations.json`)
   * `static/` folder (contains `css/` and `js/`)
   * `.github/` folder (contains `workflows/deploy.yml`)
4. At the bottom of the page, type a commit message (e.g. `Initial commit of Star Map`).
5. Click **Commit changes**.

#### Option B: Using GitHub Desktop
1. Download and open [GitHub Desktop](https://desktop.github.com/).
2. Click **File** -> **Add Local Repository...**.
3. Choose the folder `c:\Users\hunte\OneDrive\AA_SCHOOL\Fall 26\IARC 425\Module B\Star Project`.
4. Click **Publish repository** to push it to your GitHub account.

#### Option C: Using Git CLI (if installed)
In PowerShell or Terminal:
```bash
git init
git add .
git commit -m "Initial commit of Local Star Map & ISS Observatory"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

### Step 3: Enable GitHub Pages
1. On your GitHub repository page, click the **Settings** tab (the gear icon near the top right).
2. In the left sidebar, click **Pages** (under the "Code and automation" section).
3. Under **Build and deployment**:
   * **Source**: Select **Deploy from a branch**.
   * **Branch**: Select **`main`** from the dropdown, and leave folder as **`/ (root)`**.
   * Click **Save**.
   *(Alternatively, if you prefer automated Actions, you can select "GitHub Actions" as the Source since `.github/workflows/deploy.yml` is already included!)*

---

### Step 4: Access Your Live Website! 🎉
GitHub will deploy your website in about 30 to 60 seconds.

Your live URL will be:
```
https://<your-github-username>.github.io/<your-repository-name>/
```

*(For example: `https://hunter.github.io/star-project/`)*

Refresh the page after a minute, and you will see a green checkmark with the live link at the top of the **Settings -> Pages** tab!

---

## 🛠️ Verification Checklist

When opening your live GitHub Pages link:
* [x] **Local Star Dome loads**: 3,880 stars rendered with magnitude scaling and Gaia colors.
* [x] **Location Search works**: Click the search bar at the top, type any city (e.g., "Paris", "Tokyo", "Eugene"), and the sky updates instantly.
* [x] **Constellations display**: Orion, Big Dipper, Cassiopeia, Cygnus stick-figures are connected.
* [x] **Planets & Moon visible**: Real-time positions for Mercury through Neptune with current Moon phase.
* [x] **ISS Tracker active**: Live telemetry updates every few seconds, displaying the ground track on the mini radar and the pass trail across the sky dome.
* [x] **Time Travel responsive**: Move the 24-hour time slider to watch the Earth rotate beneath the stars!
