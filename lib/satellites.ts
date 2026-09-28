import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/hooks/useApi";

export interface SystemPayload {
  id: string;
  name: string;
  active: boolean;
  targetStation?: [number, number]; // [longitude, latitude] for comms
}

export interface SatelliteData {
  id: string;
  name: string;
  type: string;
  altitudeKm: number;
  inclinationDeg: number;
  speedMultiplier: number;
  periodSec: number;
  cameras: SystemPayload[];
  sensors: SystemPayload[];
  communications: SystemPayload[];
}

export const SATELLITE_UPDATE_EVENT = "satellite_data_updated";

export function useSatellites() {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const { get, post, patch, del } = useApi();

  const refresh = useCallback(async () => {
    try {
      const data = await get<any[]>("/satellites");

      const formattedData: SatelliteData[] = data.map((sat: any, index: number) => ({
        id: sat.id || `sat-${index}-${sat.name?.replace(/\s+/g, "-")}`,
        name: sat.name || "Unknown Satellite",
        type: sat.type || "Experimental",
        altitudeKm: sat.altitudeKm || 500,
        inclinationDeg: sat.inclinationDeg !== undefined ? sat.inclinationDeg : 45,
        speedMultiplier: sat.speedMultiplier || 1.0,
        periodSec: sat.periodSec || 90,
        cameras: sat.cameras || [],
        sensors: sat.sensors || [],
        communications: sat.communications || [],
      }));

      setSatellites(formattedData);
      setIsLoaded(true);
    } catch (err) {
      console.error("Failed to load from JSON server:", err);
      // Fallback if the server goes down
      setSatellites([]);
      setIsLoaded(true);
    }
  }, [get]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000); // Poll every 5 seconds

    const handleUpdate = () => refresh();
    window.addEventListener(SATELLITE_UPDATE_EVENT, handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener(SATELLITE_UPDATE_EVENT, handleUpdate);
    };
  }, [refresh]);

  const addSatellite = useCallback(async (newSat: Omit<SatelliteData, "id"> & { id?: string }) => {
    const id = newSat.id && newSat.id.trim() ? newSat.id.trim().toLowerCase().replace(/\s+/g, "-") : `sat-${Date.now()}`;
    const completeSat = {
      ...newSat,
      id,
      cameras: newSat.cameras || [],
      sensors: newSat.sensors || [],
      communications: newSat.communications || [],
    };

    try {
      await post("/satellites", completeSat);
      refresh();
    } catch (err) {
      console.error("Failed to add satellite to server:", err);
    }
    return completeSat as SatelliteData;
  }, [post, refresh]);

  const updateSatellite = useCallback(async (id: string, updatedData: Partial<SatelliteData>) => {
    try {
      await patch(`/satellites/${id}`, updatedData);
      refresh();
    } catch (err) {
      console.error("Failed to update satellite on server:", err);
    }
  }, [patch, refresh]);

  const deleteSatellite = useCallback(async (id: string) => {
    try {
      await del(`/satellites/${id}`);
      refresh();
    } catch (err) {
      console.error("Failed to delete satellite on server:", err);
    }
  }, [del, refresh]);

  const duplicateSatellite = useCallback(async (id: string) => {
    const target = satellites.find((sat) => sat.id === id);
    if (!target) return null;

    const newId = `${target.id}-copy-${Date.now().toString().slice(-4)}`;
    const duplicated = {
      ...target,
      id: newId,
      name: `${target.name} (Copy)`,
      cameras: target.cameras?.map((c: any) => ({ ...c, id: `${c.id}-copy` })) || [],
      sensors: target.sensors?.map((c: any) => ({ ...c, id: `${c.id}-copy` })) || [],
      communications: target.communications?.map((c: any) => ({ ...c, id: `${c.id}-copy` })) || [],
    };

    try {
      await post("/satellites", duplicated);
      refresh();
    } catch (err) {
      console.error("Failed to duplicate satellite on server:", err);
    }
    return duplicated as SatelliteData;
  }, [satellites, post, refresh]);

  const resetToDefaults = useCallback(() => {
    console.warn("Reset to defaults is not fully supported with a live JSON server.");
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
