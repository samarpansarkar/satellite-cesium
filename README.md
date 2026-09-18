# 🛰️ Orbit Tracker — Industry-Standard 3D Satellite & Orbital Geospatial Simulation

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=flat-square&logo=react)](https://react.dev/)
[![CesiumJS](https://img.shields.io/badge/CesiumJS-1.145.0-689f38?style=flat-square&logo=cesium)](https://cesium.com/cesiumjs/)
[![Resium](https://img.shields.io/badge/Resium-1.26.0-0284c7?style=flat-square)](https://resium.reearth.io/)
[![Material UI](https://img.shields.io/badge/MUI-v9.4.0-007FFF?style=flat-square&logo=mui)](https://mui.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Offline Capable](https://img.shields.io/badge/Offline-100%25%20Air--Gapped-success?style=flat-square)](#offline-air-gapped-architecture)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)](#license)

**Orbit Tracker** is a professional-grade, 100% air-gapped 3D geospatial satellite tracking and orbital visualization platform. Built on **Next.js 16 (App Router)**, **React 19**, **CesiumJS**, **Resium**, and **Material UI (MUI v9)**, the application visualizes artificial satellites across Low Earth Orbit (LEO), Medium Earth Orbit (MEO), and Geostationary Orbit (GEO) in high-fidelity 3D space with zero external cloud dependencies.

---

## 📑 Table of Contents

- [Key Highlights](#-key-highlights)
- [System Architecture](#-system-architecture)
- [Feature Matrix](#-feature-matrix)
- [Orbital Mechanics & Mathematical Formulation](#-orbital-mechanics--mathematical-formulation)
- [Offline / Air-Gapped Engine Implementation](#-offline--air-gapped-engine-implementation)
- [Component Breakdown](#-component-breakdown)
- [Satellite Catalog & Orbital Classifications](#-satellite-catalog--orbital-classifications)
- [Performance & Rendering Optimization](#-performance--rendering-optimization)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started & Installation](#-getting-started--installation)
- [Operational Guide & Controls](#-operational-guide--controls)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)
- [License & Credits](#-license--credits)

---

## 🌟 Key Highlights

- **100% Air-Gapped & Offline Ready**: Completely uncoupled from Cesium Ion and third-party tile servers. Runs inside secure, isolated environments, intranets, or field deployments without requiring internet access or API tokens.
- **Sub-Millisecond 60 FPS Orbit Engine**: Uses decoupled `Cesium.CallbackProperty` updates driven by `requestAnimationFrame` and high-resolution timers (`performance.now()`), eliminating React render cycle bottlenecks and preventing polyline flickering.
- **Accurate Orbital Trajectory Rendering**: Real-time 3D coordinate transformations for inclination angles, semi-major orbital radii, period calculations, and instantaneous orbital state vectors.
- **Enterprise Mission Control UI**: Custom-tailored dark aerospace theme (`#0a192f` deep navy and `#38bdf8` sky blue) utilizing Material UI (MUI v9) with smooth drawer transitions, live telemetry cards, and responsive controls.
- **Tactical Basemap Modes**: Instant toggle between high-contrast Natural Earth II photorealistic terrain imagery and tactical cybernetic grid projections.
- **Simulation Speed Controls**: Variable time multiplier from `0.0x` (paused inspection) up to `10.0x` hyper-speed with 0.5x stepping.
- **Geographic Default Center**: Preset home camera vantage point focused on the Indian Subcontinent and Eastern Hemisphere with wide field-of-view orbital perspective.

---

## 🏗 System Architecture

The application adopts an isolated client-side rendering pipeline with Next.js dynamic module resolution to prevent SSR DOM incompatibilities with Cesium's WebGL context.

```mermaid
flowchart TD
    subgraph Browser ["Client Runtime (Browser)"]
        subgraph UI ["User Interface Layer (MUI v9)"]
            NAV[Navbar Component]
            SB[Sidebar Drawer]
            FC[Footer Controls Panel]
            INFO[Satellite Info Panel]
        end

        subgraph State ["Application State Hub (app/page.tsx)"]
            VIS[Visibility Filter: hiddenSatellites]
            SPD[Simulation Speed: 0x - 10x]
            ORB[Trajectory Toggle: showOrbits]
            MAP[Basemap Mode: natural | grid]
            SEL[Selected Satellite Telemetry]
        end

        subgraph DynamicLoader ["SSR Isolation Boundary"]
            CW[CesiumWrapper: next/dynamic ssr:false]
        end

        subgraph Engine ["CesiumJS 3D WebGL Engine (CesiumViewer.tsx)"]
            RAF[requestAnimationFrame Loop: Delta Timing]
            CP[Cesium.CallbackProperty: Instantaneous Coordinates]
            VIEWER[Cesium.Viewer / Resium Viewer]
            IMAGERY[TileMapServiceImageryProvider / GridImageryProvider]
            ENTITIES[Cesium.Entity: Billboards, Polylines, Labels]
        end
    end

    subgraph StaticAssets ["Local Asset Storage (public/cesium)"]
        TEX[NaturalEarthII Textures]
        WID[Cesium Widgets & CSS]
        WRK[Cesium Web Workers]
    end

    UI -->|Dispatches Events| State
    State -->|Props Synchronization| DynamicLoader
    DynamicLoader --> Engine
    StaticAssets -->|Local Fetch| Engine
    RAF -->|Updates elapsed seconds| CP
    CP -->|Feeds Cartesian3| ENTITIES
```

---

## 🚀 Feature Matrix

| Feature Category | Capability | Implementation Detail |
| :--- | :--- | :--- |
| **Geospatial Engine** | WebGL 3D Globe | Powered by CesiumJS 1.145 + Resium 1.26 |
| **Connectivity** | 100% Offline | Static tiles from `/cesium/Assets/Textures/NaturalEarthII` |
| **Token Authentication** | Zero External Auth | `Cesium.Ion.defaultAccessToken = ""` explicitly cleared |
| **Camera Configuration** | Default Home View | India / Indian Ocean (`20°E, -40°S` to `140°E, 60°N`) |
| **Orbital Mechanics** | Keplerian Approximation | Cartesian coordinates derived from semi-major radius & inclination |
| **Trajectory Display** | 3D Polyline Rings | Continuous circular orbits with 120-segment Cartesian interpolation |
| **Satellite Entity** | Billboard + Label | White vector satellite glyph with contrast background pill label |
| **Telemetry Inspection** | Floating HUD Panel | Displays Altitude, Inclination, Period, and Speed Multiplier |
| **Fleet Management** | Multi-Select Drawer | Individual toggles, color indicator pips, "Show All", "Hide All" |
| **Time Warping** | Simulation Speed Slider | 0x (Pause) to 10x acceleration with live multiplier badge |
| **Basemap Switching** | Dual Imagery Modes | Natural Earth II phototexture or Slate/Cyan Vector Tactical Grid |
| **Performance** | Flicker-Free Orbit | Decoupled `CallbackProperty` rendering outside React state tree |

---

## 📐 Orbital Mechanics & Mathematical Formulation

The simulation models satellite trajectories using 3-dimensional spherical-to-Cartesian transformation geometry.

### 1. Orbit Radius Formulation
Given Earth's mean volumetric radius $R_{\text{earth}} = 6,371,000\text{ m}$ ($6,371\text{ km}$):
$$R_{\text{orbit}} = R_{\text{earth}} + (h \times 1000)$$
where $h$ is the satellite altitude in kilometers above mean sea level.

### 2. Orbital Path Generation
An orbit trajectory is sampled into $N = 120$ discrete vertices across the parameter $u \in [0, 2\pi]$:
$$\theta_i = \frac{i}{N} \cdot 2\pi \quad (i = 0, 1, \dots, N)$$
Taking orbital inclination angle $i_{\text{deg}}$ converted to radians $i_{\text{rad}} = \text{toRadians}(i_{\text{deg}})$:
$$\begin{aligned}
x &= R_{\text{orbit}} \cdot \cos(\theta_i) \\
y &= R_{\text{orbit}} \cdot \sin(\theta_i) \cdot \cos(i_{\text{rad}}) \\
z &= R_{\text{orbit}} \cdot \sin(\theta_i) \cdot \sin(i_{\text{rad}})
\end{aligned}$$
This creates an elliptical 3D ring tilted at the exact inclination angle relative to the equatorial plane ($z = 0$).

### 3. Instantaneous Satellite Position Vector
For any given simulation elapsed time $t$ (in seconds), the satellite's position is computed dynamically:
$$t_{\text{effective}} = t \cdot M_{\text{speed}}$$
$$\phi = \left(\frac{t_{\text{effective}} \pmod{T_{\text{period}}}}{T_{\text{period}}}\right) \cdot 2\pi$$
$$\vec{P}(t) = \begin{bmatrix}
R_{\text{orbit}} \cdot \cos(\phi) \\
R_{\text{orbit}} \cdot \sin(\phi) \cdot \cos(i_{\text{rad}}) \\
R_{\text{orbit}} \cdot \sin(\phi) \cdot \sin(i_{\text{rad}})
\end{bmatrix}$$
where:
- $M_{\text{speed}}$ is the satellite's relative speed coefficient.
- $T_{\text{period}}$ is the orbital cycle duration in simulation seconds.
- $\vec{P}(t)$ is returned directly to Cesium's render loop as a `Cesium.Cartesian3` position vector.

---

## 🛡️ Offline / Air-Gapped Engine Implementation

Standard CesiumJS applications require active network calls to Cesium Ion servers (`api.cesium.com`) for token verification, terrain data, and Bing/Sentinel imagery. This application is architected to operate in complete isolation:

### 1. Build-Time Static Asset Mirroring
A dedicated Node.js build hook (`scripts/copy-cesium.mjs`) automatically mirrors critical Cesium libraries into the web root:
- Source: `node_modules/cesium/Build/Cesium/`
- Destination: `public/cesium/`
- Mirror Targets: `Assets/`, `ThirdParty/`, `Widgets/`, `Workers/`

This script is embedded in `package.json`:
```json
"scripts": {
  "copy-cesium": "node scripts/copy-cesium.mjs",
  "dev": "npm run copy-cesium && next dev",
  "build": "npm run copy-cesium && next build"
}
```

### 2. Runtime Asset Redirection
In `components/CesiumViewer.tsx`, the global asset pointer is routed to the local origin:
```typescript
if (typeof window !== "undefined") {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";
}
```

### 3. Zero-Network Imagery & Ion Token Suppression
- **Token Annihilation**: `Cesium.Ion.defaultAccessToken = "";`
- **Default Layer Blockade**: The viewer's default cloud-seeking imagery provider is explicitly disabled via `<Viewer imageryProvider={false} />`.
- **Local Imagery Provider**:
  ```typescript
  Cesium.TileMapServiceImageryProvider.fromUrl(
    Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")
  );
  ```
- **Procedural Imagery Provider**:
  ```typescript
  new Cesium.GridImageryProvider({
    backgroundColor: Cesium.Color.fromCssColorString("#090d16"),
    color: Cesium.Color.fromCssColorString("#0284c7").withAlpha(0.6),
    cells: 8,
  });
  ```
- **Credit Container Isolation**: The default Cesium credit link container is rerouted to a hidden container `<div id="cesium-credit-container" style={{ display: "none" }} />` to prevent UI layout shift.

---

## 🧩 Component Breakdown

### 1. `app/page.tsx` (Root Orchestrator)
- Manages application-wide state:
  - `hiddenSatellites`: Set of satellite identifiers excluded from rendering.
  - `selectedSatInfo`: Reference to satellite currently under inspection.
  - `simulationSpeed`: Time acceleration scalar (0x - 10x).
  - `showOrbits`: Boolean flag controlling polyline trajectory visibility.
  - `baseMapMode`: `"natural"` or `"grid"`.
  - `drawerOpen`: Boolean controlling sidebar drawer presentation.
- Provides batch handlers: `handleShowAll()` and `handleHideAll()`.

### 2. `components/CesiumWrapper.tsx` (SSR Barrier)
- Dynamically imports `CesiumViewer.tsx` with `{ ssr: false }`.
- Renders a stylized circular loader with loading text while WebGL modules load into browser memory.

### 3. `components/CesiumViewer.tsx` (Core 3D Engine)
- Renders Resium `Viewer`, `Scene`, and `Globe`.
- Maintains the high-resolution `requestAnimationFrame` delta clock.
- Sets camera default view coordinates to India/Asia:
  ```typescript
  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(20.0, -40.0, 140.0, 60.0);
  ```
- Constructs `Entity` objects for each visible satellite with:
  - `PolylineGraphics`: Rendered with `sat.cesiumColor.withAlpha(0.7)` and `ArcType.NONE`.
  - `BillboardGraphics`: Custom embedded SVG icon.
  - `LabelGraphics`: Bold, anti-aliased font with semi-transparent black pill backdrop and disabled depth testing for unobstructed visibility across the globe.

### 4. `components/Sidebar.tsx` (Constellation Navigation)
- Width: `340px` anchored to the left.
- Header displays total registered satellite count.
- Action toolbar with dual buttons:
  - **Show All**: Makes all satellites visible at once.
  - **Hide All**: Unchecks all satellites.
- List items featuring:
  - Checkbox toggle for visibility.
  - Color dot indicator with matching CSS box-shadow glow.
  - Primary title (satellite name) and secondary caption (satellite type/classification).
  - Info button icon triggering detailed telemetry.
- Custom CSS eliminating native scrollbars (`msOverflowStyle: 'none'`, `scrollbarWidth: 'none'`).

### 5. `components/FooterControls.tsx` (Mission Control Center)
- Fixed bottom docked bar (`60px` height) with dark paper background.
- Left block: Speed icon, smooth slider (0x to 10x), and live readout label.
- Center block: "Show Orbits" switch with primary accent color.
- Right block: Segmented `ToggleButtonGroup` to switch between "Earth" and "Grid" basemaps.

### 6. `components/SatelliteInfoPanel.tsx` (Telemetry HUD)
- Floating card anchored at `top: 80px, right: 24px` with elevated box shadow (`boxShadow: 6`).
- Color-matched title header corresponding to the satellite's signature color.
- Displays:
  - **Altitude**: Formatted with commas in kilometers.
  - **Inclination**: Degree angle.
  - **Orbital Period**: Seconds per full revolution.
  - **Speed Multiplier**: Velocity modifier factor.
- Includes a close button to dismiss the overlay.

### 7. `components/Navbar.tsx` (Header)
- Dark paper app bar with bottom border divider.
- Hamburger menu button for sidebar drawer toggle.
- Glowing cyan gradient satellite badge.
- Gradient typography branding for "Orbit Tracker".

### 8. `app/Providers.tsx` (Theme & Styling Engine)
- Configures MUI `darkTheme`:
  - Default background: `#0a192f` (Deep Navy).
  - Paper background: `#112240` (Slate Navy).
  - Primary accent: `#38bdf8` (Vibrant Sky Blue).
  - Secondary accent: `#7dd3fc`.
- Incorporates `CssBaseline` and modern system font typography.

---

## 🛰️ Satellite Catalog & Orbital Classifications

The application includes 14 curated operational satellites representing different orbital altitudes, missions, and regimes:

```
Altitude Scale:
LEO [300 - 1,000 km]  ============ (ISS, Tiangong, Hubble, Landsat, Sentinel, Terra, Suomi, NOAA)
MEO [19,000 - 24,000 km] ================================== (GPS, Galileo, GLONASS)
GEO [35,786 km]       ========================================================= (GOES, Himawari, Inmarsat, EchoStar)
```

### Complete Satellite Specification Table

| Satellite Identifier | Official Mission Name | Mission Classification | Altitude ($h$) | Inclination ($i$) | Signature Color | Speed Multiplier | Period ($T$) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `iss` | **ISS (ZARYA)** | Space Station | 420 km | 51.64° | `#38bdf8` (Cyan) | 1.00x | 90s |
| `tiangong` | **Tiangong Space Station** | Space Station | 390 km | 41.58° | `#0ea5e9` (Sky Blue) | 1.00x | 92s |
| `hubble` | **HST (Hubble)** | Space Telescope | 535 km | 28.50° | `#c084fc` (Purple) | 0.95x | 96s |
| `landsat-9` | **LANDSAT 9** | Earth Observation | 705 km | 98.20° | `#34d399` (Emerald) | 0.85x | 110s |
| `sentinel-1a` | **Sentinel-1A** | Earth Observation | 693 km | 98.18° | `#10b981` (Green) | 0.86x | 108s |
| `terra` | **Terra (EOS AM-1)** | Earth Observation | 710 km | 98.20° | `#059669` (Dark Green) | 0.84x | 112s |
| `suomi-npp` | **Suomi NPP** | Weather Reconnaissance | 824 km | 98.70° | `#f97316` (Orange) | 0.80x | 118s |
| `noaa-20` | **NOAA-20** | Weather Reconnaissance | 825 km | 98.70° | `#ea580c` (Rust Orange) | 0.80x | 118s |
| `navstar-gps` | **GPS BIIF-10** | Global Navigation (GNSS) | 20,180 km | 55.00° | `#fbbf24` (Amber) | 0.35x | 240s |
| `galileo-22` | **Galileo 22** | Global Navigation (GNSS) | 23,222 km | 56.00° | `#f59e0b` (Gold) | 0.30x | 260s |
| `glonass-m` | **GLONASS-M** | Global Navigation (GNSS) | 19,130 km | 64.80° | `#d97706` (Ochre) | 0.38x | 230s |
| `goes-16` | **GOES-16** | Geostationary Weather | 35,786 km | 0.00° | `#ef4444` (Crimson) | 0.10x | 1440s |
| `himawari-8` | **Himawari-8** | Geostationary Weather | 35,786 km | 0.00° | `#dc2626` (Red) | 0.10x | 1440s |
| `inmarsat-5` | **Inmarsat-5 F4** | Satellite Telecommunications| 35,786 km | 0.10° | `#6366f1` (Indigo) | 0.10x | 1440s |
| `echostar-21` | **EchoStar 21** | Satellite Telecommunications| 35,786 km | 0.00° | `#4f46e5` (Deep Indigo) | 0.10x | 1440s |

---

## ⚡ Performance & Rendering Optimization

### 1. Resolution of the "Orbit Flickering" Problem
In naive React + Cesium integrations, updating an entity's position inside React state triggers a full component re-render. This causes Cesium to recreate `PolylineGraphics` and `BillboardGraphics` entities every frame, producing noticeable flickering and GPU stalls.

**Solution**:
- Satellite motion is driven by an out-of-band `requestAnimationFrame` loop that mutates an animation clock object `animClock.elapsedTime`.
- Satellites use a memoized instance of `Cesium.CallbackProperty`:
  ```typescript
  positionProperty: new Cesium.CallbackProperty(
    () => calculateSatPosition(sat, animClock.elapsedTime),
    false // isConstant = false
  )
  ```
- Cesium queries `positionProperty` directly during its native render pass without triggering React reconciliation or recreating polylines.

### 2. Memoized Static Geometry
- Orbit paths (`generateOrbitPath`) are computed once per satellite using `useMemo` and cached for the lifetime of the session.
- Tile providers (`naturalEarthProvider` and `gridProvider`) are instantiated once using `useMemo`.

### 3. Scene Optimization Parameters
- `highDynamicRange={false}`: Prevents redundant HDR post-processing buffers.
- `enableLighting={false}`: Disables dynamic sun shadowing calculations for maximum FPS.
- `maximumScreenSpaceError={1.5}`: Provides balanced terrain tile division without overloading VRAM.

---

## 📁 Project Directory Structure

```
satellite-cesium/
├── app/
│   ├── favicon.ico              # Web application favicon
│   ├── globals.css              # Global styles & Tailwind CSS imports
│   ├── layout.tsx               # Root Next.js layout & Emotion cache provider
│   ├── page.tsx                 # Main application dashboard & state manager
│   └── Providers.tsx            # Material UI dark theme configuration
├── components/
│   ├── CesiumViewer.tsx         # Core CesiumJS/Resium 3D WebGL implementation
│   ├── CesiumWrapper.tsx        # Next.js dynamic client boundary (SSR: false)
│   ├── FooterControls.tsx       # Bottom HUD (speed slider, orbit & map toggles)
│   ├── Navbar.tsx               # Header bar with drawer toggle & branding
│   ├── SatelliteInfoPanel.tsx   # Floating satellite telemetry HUD card
│   └── Sidebar.tsx              # Satellite selector drawer with bulk actions
├── lib/
│   └── satellites.ts            # Satellite catalog data, coordinates & types
├── public/
│   └── cesium/                  # Mirrored offline Cesium static runtime assets
│       ├── Assets/              # NaturalEarthII textures, skyboxes, icons
│       ├── ThirdParty/          # Third-party web worker dependencies
│       ├── Widgets/             # Cesium UI CSS and imagery stylesheets
│       └── Workers/             # Multi-threaded Web Workers for geometry
├── scripts/
│   └── copy-cesium.mjs          # Build script automating asset synchronization
├── eslint.config.mjs            # ESLint code style configuration
├── next.config.ts               # Next.js compiler & bundler settings
├── package.json                 # Dependencies, scripts, and package metadata
├── tsconfig.json                # TypeScript compiler configuration
└── README.md                    # System documentation
```

---

## 🛠️ Getting Started & Installation

### Prerequisites
- **Node.js**: `v20.x` or higher (Node 22 LTS recommended)
- **npm**: `v10.x` or higher (or `pnpm` / `yarn`)
- Modern browser with WebGL 2.0 support (Chrome, Edge, Firefox, Safari)

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd satellite-cesium
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   *Note: This automatically invokes `copy-cesium.mjs` to prepare the offline assets before starting Next.js.*

4. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Deployment

To compile a production-ready standalone build:

```bash
npm run build
npm run start
```

---

## 🕹️ Operational Guide & Controls

### 3D Globe Navigation (Cesium Standard Controls)
| Action | Mouse Gesture | Keyboard / Touch |
| :--- | :--- | :--- |
| **Rotate Globe** | Left Click + Drag | Single Finger Drag |
| **Zoom In / Out** | Mouse Wheel Scroll / Right Click + Drag | Two-Finger Pinch |
| **Tilt Perspective** | Middle Click + Drag / Ctrl + Left Drag | Two-Finger Drag Vertical |
| **Reset View to India** | Click Home Icon (`HomeButton`) in top right | — |
| **Switch Scene Mode** | Click Scene Picker Icon in top right | 3D, 2D, or Columbus View |

### Mission Controls HUD
1. **Selecting Satellites**: Click the hamburger icon (`☰`) on the top navigation bar to open the sidebar. Click any satellite's checkbox to toggle its orbit and position.
2. **Bulk Selection**:
   - Click **Show All** to display all 14 satellites simultaneously.
   - Click **Hide All** to clear the globe for focused analysis.
3. **Telemetry Inspection**: Click the info icon (`ℹ️`) next to any satellite in the sidebar to open the floating HUD card displaying altitude, inclination, orbital period, and speed.
4. **Time Multiplier**: Drag the speed slider in the bottom bar from `0x` (freeze orbit) up to `10x` (rapid orbit propagation).
5. **Hide / Show Orbits**: Toggle the **Show Orbits** switch in the bottom bar to view satellites with or without their trajectory rings.
6. **Basemap Switching**: Click **Earth** for photorealistic terrain textures, or **Grid** for tactical high-contrast mission grid visualization.

---

## ❓ Troubleshooting & FAQs

### Why is the globe completely black or not rendering?
Ensure `npm run copy-cesium` executed properly and that `public/cesium/Assets/Textures/NaturalEarthII` exists. If you ran `npm install` without running `npm run dev`, execute:
```bash
node scripts/copy-cesium.mjs
```

### Can this run in a secure, disconnected network (air-gapped environment)?
**Yes.** Orbit Tracker does not make any outgoing HTTP/HTTPS calls to Cesium Ion, Google Maps, Bing, or any analytics providers. All static assets, Web Workers, and imagery tiles are served directly from the local Next.js server.

### How do I add custom satellites to the tracking engine?
Open [`lib/satellites.ts`](file:///c:/Users/samar/OneDrive/Desktop/workspace/satellite-cesium/lib/satellites.ts) and append a new object to the `OFFLINE_SATELLITES` array conforming to the `SatelliteData` interface:
```typescript
{
  id: "custom-sat-1",
  name: "INSAT-3DR",
  type: "Weather (GEO)",
  altitudeKm: 35786,
  inclinationDeg: 0.0,
  colorHex: "#3b82f6",
  speedMultiplier: 0.1,
  periodSec: 1440
}
```
The application will automatically register the satellite in the sidebar, calculate its 3D orbit trajectory, and make it available in the viewport.

---

## 📜 License & Credits

- **CesiumJS**: Licensed under the Apache 2.0 License.
- **Natural Earth II Textures**: Public domain geospatial dataset courtesy of Natural Earth.
- **Application Code**: Licensed under the [MIT License](LICENSE).
