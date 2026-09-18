export type OrbitCategory = "ALL" | "LEO" | "MEO" | "GEO";

export interface SatelliteFormData {
  id?: string;
  name: string;
  type: string;
  altitudeKm: number | string;
  inclinationDeg: number | string;
  periodSec: number | string;
  speedMultiplier: number | string;
  colorHex: string;
}

export const PRESET_COLORS = [
  "#38bdf8", // Sky Blue
  "#0ea5e9", // Electric Blue
  "#34d399", // Emerald Light
  "#10b981", // Teal Green
  "#a7f3d0", // Mint
  "#fbbf24", // Amber Yellow
  "#f59e0b", // Gold
  "#f97316", // Orange
  "#ea580c", // Deep Orange
  "#ef4444", // Crimson Red
  "#c084fc", // Lavender Violet
  "#a855f7", // Deep Purple
  "#ec4899", // Neon Pink
  "#6366f1", // Indigo
];

export const COMMON_TYPES = [
  "Space Station",
  "Space Telescope",
  "Earth Observation",
  "Weather",
  "Weather (GEO)",
  "Navigation",
  "Communications",
  "Scientific",
  "Military / Defense",
  "Custom Payload",
];

export const DEFAULT_FORM: SatelliteFormData = {
  name: "",
  type: "Earth Observation",
  altitudeKm: 550,
  inclinationDeg: 53.0,
  periodSec: 95,
  speedMultiplier: 1.0,
  colorHex: "#38bdf8",
};

export function getOrbitCategory(altitudeKm: number): "LEO" | "MEO" | "GEO" {
  if (altitudeKm < 2000) return "LEO";
  if (altitudeKm < 35786) return "MEO";
  return "GEO";
}

export function getCategoryColor(cat: "LEO" | "MEO" | "GEO"): string {
  switch (cat) {
    case "LEO":
      return "#38bdf8";
    case "MEO":
      return "#fbbf24";
    case "GEO":
      return "#ef4444";
  }
}
