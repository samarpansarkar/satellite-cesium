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
  {
    id: "iss",
    name: "ISS (ZARYA)",
    type: "Space Station",
    altitudeKm: 420,
    inclinationDeg: 51.64,
    colorHex: "#38bdf8", // Sky blue
    speedMultiplier: 1.0,
    periodSec: 90,
  },
  {
    id: "landsat-9",
    name: "LANDSAT 9",
    type: "Earth Observation",
    altitudeKm: 705,
    inclinationDeg: 98.2,
    colorHex: "#34d399", // Emerald green
    speedMultiplier: 0.85,
    periodSec: 110,
  },
  {
    id: "navstar-gps",
    name: "GPS BIIF-10",
    type: "Navigation",
    altitudeKm: 20180,
    inclinationDeg: 55.0,
    colorHex: "#fbbf24", // Amber
    speedMultiplier: 0.35,
    periodSec: 240,
  },
  {
    id: "hubble",
    name: "HST (Hubble)",
    type: "Space Telescope",
    altitudeKm: 535,
    inclinationDeg: 28.5,
    colorHex: "#c084fc", // Purple
    speedMultiplier: 0.95,
    periodSec: 96,
  },
];
