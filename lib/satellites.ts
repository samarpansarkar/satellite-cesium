import { useState, useEffect, useCallback } from "react";

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

export const SATELLITE_STORAGE_KEY = "satellite_cesium_fleet_v1";
export const SATELLITE_UPDATE_EVENT = "satellite_data_updated";

export function getStoredSatellites(): SatelliteData[] {
  if (typeof window === "undefined") {
    return OFFLINE_SATELLITES;
  }
  try {
    const raw = localStorage.getItem(SATELLITE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SATELLITE_STORAGE_KEY, JSON.stringify(OFFLINE_SATELLITES));
      return OFFLINE_SATELLITES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return OFFLINE_SATELLITES;
  } catch (err) {
    console.error("Failed to load satellites from localStorage:", err);
    return OFFLINE_SATELLITES;
  }
}

export function saveStoredSatellites(satellites: SatelliteData[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SATELLITE_STORAGE_KEY, JSON.stringify(satellites));
    window.dispatchEvent(new CustomEvent(SATELLITE_UPDATE_EVENT, { detail: satellites }));
  } catch (err) {
    console.error("Failed to save satellites to localStorage:", err);
  }
}

export function resetStoredSatellites(): SatelliteData[] {
  saveStoredSatellites(OFFLINE_SATELLITES);
  return OFFLINE_SATELLITES;
}

export function useSatellites() {
  const [satellites, setSatellites] = useState<SatelliteData[]>(OFFLINE_SATELLITES);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const refresh = useCallback(() => {
    const current = getStoredSatellites();
    setSatellites(current);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener(SATELLITE_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(SATELLITE_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  const addSatellite = useCallback((newSat: Omit<SatelliteData, "id"> & { id?: string }) => {
    const current = getStoredSatellites();
    const id = newSat.id && newSat.id.trim() ? newSat.id.trim().toLowerCase().replace(/\s+/g, "-") : `sat-${Date.now()}`;
    const completeSat: SatelliteData = {
      ...newSat,
      id,
    };
    const updated = [completeSat, ...current];
    saveStoredSatellites(updated);
    setSatellites(updated);
    return completeSat;
  }, []);

  const updateSatellite = useCallback((id: string, updatedData: Partial<SatelliteData>) => {
    const current = getStoredSatellites();
    const updated = current.map((sat) => (sat.id === id ? { ...sat, ...updatedData } : sat));
    saveStoredSatellites(updated);
    setSatellites(updated);
  }, []);

  const deleteSatellite = useCallback((id: string) => {
    const current = getStoredSatellites();
    const updated = current.filter((sat) => sat.id !== id);
    saveStoredSatellites(updated);
    setSatellites(updated);
  }, []);

  const duplicateSatellite = useCallback((id: string) => {
    const current = getStoredSatellites();
    const target = current.find((sat) => sat.id === id);
    if (!target) return null;

    const newId = `${target.id}-copy-${Date.now().toString().slice(-4)}`;
    const duplicated: SatelliteData = {
      ...target,
      id: newId,
      name: `${target.name} (Copy)`,
    };
    const targetIndex = current.findIndex((sat) => sat.id === id);
    const updated = [...current];
    updated.splice(targetIndex + 1, 0, duplicated);
    saveStoredSatellites(updated);
    setSatellites(updated);
    return duplicated;
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = resetStoredSatellites();
    setSatellites(defaults);
  }, []);

  return {
    satellites,
    isLoaded,
    addSatellite,
    updateSatellite,
    deleteSatellite,
    duplicateSatellite,
    resetToDefaults,
  };
}
