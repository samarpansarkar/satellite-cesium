import { useState, useEffect, useCallback } from "react";

export interface SystemPayload {
  id: string;
  name: string;
  active: boolean;
  colorHex?: string;
  targetStation?: [number, number]; // [longitude, latitude] for comms
}

export interface SatelliteData {
  id: string;
  name: string;
  type: string;
  altitudeKm: number;
  inclinationDeg: number;
  colorHex: string;
  speedMultiplier: number;
  periodSec: number;
  cameras: SystemPayload[];
  sensors: SystemPayload[];
  communications: SystemPayload[];
}

export const OFFLINE_SATELLITES: SatelliteData[] = [
  // Low Earth Orbit (LEO) - Space Stations & Telescopes
  { id: "iss", name: "ISS (ZARYA)", type: "Space Station", altitudeKm: 420, inclinationDeg: 51.64, colorHex: "#38bdf8", speedMultiplier: 1.0, periodSec: 90, 
    cameras: [{ id: "iss-cam1", name: "High-Res Earth Obs", active: true, colorHex: "#06b6d4" }, { id: "iss-cam2", name: "Docking Camera", active: false, colorHex: "#3b82f6" }],
    sensors: [{ id: "iss-sens1", name: "Telemetry Radar", active: true, colorHex: "#f59e0b" }],
    communications: [{ id: "iss-com1", name: "S-Band Uplink", active: true, targetStation: [77.2090, 28.6139] }] },
  
  { id: "tiangong", name: "Tiangong Space Station", type: "Space Station", altitudeKm: 390, inclinationDeg: 41.58, colorHex: "#0ea5e9", speedMultiplier: 1.0, periodSec: 92, 
    cameras: [{ id: "tg-cam1", name: "Panoramic View", active: true, colorHex: "#0ea5e9" }],
    sensors: [{ id: "tg-sens1", name: "Proximity Sensor", active: true, colorHex: "#eab308" }],
    communications: [{ id: "tg-com1", name: "Beijing Ground Control", active: true, targetStation: [116.4074, 39.9042] }] },

  { id: "hubble", name: "HST (Hubble)", type: "Space Telescope", altitudeKm: 535, inclinationDeg: 28.5, colorHex: "#c084fc", speedMultiplier: 0.95, periodSec: 96, 
    cameras: [{ id: "hst-cam1", name: "Deep Space Optical", active: true, colorHex: "#c084fc" }],
    sensors: [{ id: "hst-sens1", name: "Fine Guidance Sensor", active: true, colorHex: "#f43f5e" }],
    communications: [{ id: "hst-com1", name: "TDRS Relay Link", active: true, targetStation: [-77.0369, 38.9072] }] },
  
  // Low Earth Orbit (LEO) - Earth Observation
  { id: "landsat-9", name: "LANDSAT 9", type: "Earth Observation", altitudeKm: 705, inclinationDeg: 98.2, colorHex: "#34d399", speedMultiplier: 0.85, periodSec: 110, 
    cameras: [{ id: "l9-cam1", name: "OLI-2 Instrument", active: true, colorHex: "#10b981" }, { id: "l9-cam2", name: "TIRS-2 Sensor", active: true, colorHex: "#ef4444" }],
    sensors: [], communications: [{ id: "l9-com1", name: "Data Downlink", active: true, targetStation: [-100.0, 40.0] }] },
  
  { id: "suomi-npp", name: "Suomi NPP", type: "Weather", altitudeKm: 824, inclinationDeg: 98.7, colorHex: "#f97316", speedMultiplier: 0.8, periodSec: 118, 
    cameras: [], sensors: [{ id: "snpp-sens1", name: "VIIRS", active: true, colorHex: "#f97316" }, { id: "snpp-sens2", name: "ATMS", active: false, colorHex: "#ea580c" }],
    communications: [{ id: "snpp-com1", name: "NOAA Station", active: true, targetStation: [-77.0369, 38.9072] }] },
  
  // Medium Earth Orbit (MEO) - Navigation
  { id: "navstar-gps", name: "GPS BIIF-10", type: "Navigation", altitudeKm: 20180, inclinationDeg: 55.0, colorHex: "#fbbf24", speedMultiplier: 0.35, periodSec: 240, 
    cameras: [], sensors: [], communications: [{ id: "gps-com1", name: "L1/L2 Broadcast", active: true, targetStation: [0, 0] }, { id: "gps-com2", name: "M-Code Link", active: false, targetStation: [-104.9903, 39.7392] }] },
  
  // Geostationary Orbit (GEO) - Communications & Weather
  { id: "goes-16", name: "GOES-16", type: "Weather (GEO)", altitudeKm: 35786, inclinationDeg: 0.0, colorHex: "#ef4444", speedMultiplier: 0.1, periodSec: 1440, 
    cameras: [{ id: "goes-cam1", name: "ABI Imager", active: true, colorHex: "#dc2626" }],
    sensors: [{ id: "goes-sens1", name: "GLM Mapper", active: true, colorHex: "#fcd34d" }],
    communications: [{ id: "goes-com1", name: "Wallops Station", active: true, targetStation: [-75.478, 37.935] }] },
];

export const SATELLITE_STORAGE_KEY = "satellite_cesium_fleet_v2";
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
      // Migration step: if old boolean fields exist instead of arrays, convert them
      return parsed.map((sat: any) => {
        const migrated = { ...sat };
        if (!Array.isArray(migrated.cameras)) {
          migrated.cameras = sat.camera ? [{ id: `${sat.id}-cam`, name: "Camera System", active: true, colorHex: "#06b6d4" }] : [];
          delete migrated.camera;
        }
        if (!Array.isArray(migrated.sensors)) {
          migrated.sensors = sat.sensor ? [{ id: `${sat.id}-sens`, name: "Sensor Array", active: true, colorHex: "#f59e0b" }] : [];
          delete migrated.sensor;
        }
        if (!Array.isArray(migrated.communications)) {
          migrated.communications = sat.communication ? [{ id: `${sat.id}-com`, name: "Comm Link", active: true, targetStation: [77.2090, 28.6139] }] : [];
          delete migrated.communication;
        }
        return migrated as SatelliteData;
      });
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
      cameras: newSat.cameras || [],
      sensors: newSat.sensors || [],
      communications: newSat.communications || [],
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
      cameras: target.cameras.map(c => ({...c, id: `${c.id}-copy`})),
      sensors: target.sensors.map(c => ({...c, id: `${c.id}-copy`})),
      communications: target.communications.map(c => ({...c, id: `${c.id}-copy`})),
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
