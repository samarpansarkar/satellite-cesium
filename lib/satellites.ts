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
  tleLine1?: string;
  tleLine2?: string;
}

export const SATELLITE_UPDATE_EVENT = "satellite_data_updated";

const globalSatelliteCache: Record<string, SatelliteData> = {};

export function useSatellites() {
  const [availableNames, setAvailableNames] = useState<string[]>([]);
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const { get, post, patch, del } = useApi();

  const fetchAvailableNames = useCallback(async () => {
    try {
      const data = await get<any[]>("/getSatellites");
      console.log("raw /getSatellites response:", data);

      const names = data?.map(item => typeof item === 'string' ? item : (item.name || item.OBJECT_NAME || 'Unknown')) || [];
      console.log("extracted names for sidebar:", names);

      setAvailableNames(names);
      setIsLoaded(true);
    } catch (err) {
      console.error("Failed to load satellite names:", err);
      setAvailableNames([]);
      setIsLoaded(true);
    }
  }, [get]);

  useEffect(() => {
    fetchAvailableNames();
  }, [fetchAvailableNames]);

  const loadSatellitesByNames = useCallback(async (names: string[]) => {
    if (names.length === 0) {
      setSatellites([]);
      return;
    }
    try {
      const missingNames = names.filter(name => !globalSatelliteCache[name]);

      let newFormattedData: SatelliteData[] = [];
      if (missingNames.length > 0) {
        console.log("fetching tle details for missing names:", missingNames);
        const data = await post<any[]>("/tleNames", { names: missingNames });
        console.log("raw /tleNames response:", data);

        newFormattedData = data.map((sat: any, index: number) => ({
          id: sat.id || `sat-${index}-${sat.name?.replace(/\s+/g, "-")}`,
          name: sat.name || sat.OBJECT_NAME || "Unknown Satellite",
          type: sat.type || "Observation",
          altitudeKm: sat.altitudeKm || 500,
          inclinationDeg: sat.inclinationDeg || 45,
          speedMultiplier: sat.speedMultiplier || 1.0,
          periodSec: sat.periodSec || 90,
          cameras: sat.cameras || [],
          sensors: sat.sensors || [],
          communications: sat.communications || [],
          tleLine1: sat.TLE_LINE1,
          tleLine2: sat.TLE_LINE2,
        }));
      }

      newFormattedData.forEach(sat => {
        globalSatelliteCache[sat.name] = sat;
      });

      // Use the updated cache to construct the final list
      const finalSatellites = names.map(name => globalSatelliteCache[name]).filter(Boolean);
      setSatellites(finalSatellites);

    } catch (err) {
      console.error("Failed to load details for selected satellites:", err);
    }
  }, [post]);

  const updateSatellite = useCallback(async (id: string, updatedData: Partial<SatelliteData>) => {
    // Local update only since these come from an external static API
    setSatellites(prev => prev.map(sat => sat.id === id ? { ...sat, ...updatedData } : sat));
  }, []);

  const addSatellite = useCallback(async (newSat: any) => { }, []);
  const deleteSatellite = useCallback(async (id: string) => { }, []);
  const duplicateSatellite = useCallback(async (id: string) => { return null; }, []);
  const resetToDefaults = useCallback(() => { }, []);

  return {
    availableNames,
    satellites,
    isLoaded,
    loadSatellitesByNames,
    updateSatellite,
    addSatellite,
    deleteSatellite,
    duplicateSatellite,
    resetToDefaults,
  };
}
