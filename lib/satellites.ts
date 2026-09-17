export interface SatelliteData {
  id: string;
  name: string;
  type: string;
  altitudeKm: number;
  inclinationDeg: number;
  colorHex: string;
  speedMultiplier: number;
  periodSec: number;
}

export const OFFLINE_SATELLITES: SatelliteData[] = [
  // Low Earth Orbit (LEO) - Space Stations & Telescopes
  { id: "iss", name: "ISS (ZARYA)", type: "Space Station", altitudeKm: 420, inclinationDeg: 51.64, colorHex: "#38bdf8", speedMultiplier: 1.0, periodSec: 90 },
  { id: "tiangong", name: "Tiangong Space Station", type: "Space Station", altitudeKm: 390, inclinationDeg: 41.58, colorHex: "#0ea5e9", speedMultiplier: 1.0, periodSec: 92 },
  { id: "hubble", name: "HST (Hubble)", type: "Space Telescope", altitudeKm: 535, inclinationDeg: 28.5, colorHex: "#c084fc", speedMultiplier: 0.95, periodSec: 96 },
  
  // Low Earth Orbit (LEO) - Earth Observation
  { id: "landsat-9", name: "LANDSAT 9", type: "Earth Observation", altitudeKm: 705, inclinationDeg: 98.2, colorHex: "#34d399", speedMultiplier: 0.85, periodSec: 110 },
  { id: "sentinel-1a", name: "Sentinel-1A", type: "Earth Observation", altitudeKm: 693, inclinationDeg: 98.18, colorHex: "#10b981", speedMultiplier: 0.86, periodSec: 108 },
  { id: "terra", name: "Terra (EOS AM-1)", type: "Earth Observation", altitudeKm: 710, inclinationDeg: 98.2, colorHex: "#059669", speedMultiplier: 0.84, periodSec: 112 },
  { id: "suomi-npp", name: "Suomi NPP", type: "Weather", altitudeKm: 824, inclinationDeg: 98.7, colorHex: "#f97316", speedMultiplier: 0.8, periodSec: 118 },
  { id: "noaa-20", name: "NOAA-20", type: "Weather", altitudeKm: 825, inclinationDeg: 98.7, colorHex: "#ea580c", speedMultiplier: 0.8, periodSec: 118 },
  
  // Medium Earth Orbit (MEO) - Navigation
  { id: "navstar-gps", name: "GPS BIIF-10", type: "Navigation", altitudeKm: 20180, inclinationDeg: 55.0, colorHex: "#fbbf24", speedMultiplier: 0.35, periodSec: 240 },
  { id: "galileo-22", name: "Galileo 22", type: "Navigation", altitudeKm: 23222, inclinationDeg: 56.0, colorHex: "#f59e0b", speedMultiplier: 0.3, periodSec: 260 },
  { id: "glonass-m", name: "GLONASS-M", type: "Navigation", altitudeKm: 19130, inclinationDeg: 64.8, colorHex: "#d97706", speedMultiplier: 0.38, periodSec: 230 },
  
  // Geostationary Orbit (GEO) - Communications & Weather
  { id: "goes-16", name: "GOES-16", type: "Weather (GEO)", altitudeKm: 35786, inclinationDeg: 0.0, colorHex: "#ef4444", speedMultiplier: 0.1, periodSec: 1440 },
  { id: "himawari-8", name: "Himawari-8", type: "Weather (GEO)", altitudeKm: 35786, inclinationDeg: 0.0, colorHex: "#dc2626", speedMultiplier: 0.1, periodSec: 1440 },
  { id: "inmarsat-5", name: "Inmarsat-5 F4", type: "Communications", altitudeKm: 35786, inclinationDeg: 0.1, colorHex: "#6366f1", speedMultiplier: 0.1, periodSec: 1440 },
  { id: "echostar-21", name: "EchoStar 21", type: "Communications", altitudeKm: 35786, inclinationDeg: 0.0, colorHex: "#4f46e5", speedMultiplier: 0.1, periodSec: 1440 },
];
