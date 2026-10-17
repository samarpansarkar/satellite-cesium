import { useState, useEffect, useCallback } from "react";
import { useFetch } from "@/hooks/useFetch";

// All shared types live in lib/types.ts — re-exported here for backward compatibility
export type {
  CameraSensorPayload,
  CommunicationPayload,
  SatelliteData,
  RawSatelliteResponse,
  RawSatelliteNameResponse,
} from "@/lib/types";
import type {
  SatelliteData,
  RawSatelliteResponse,
  RawSatelliteNameResponse,
} from "@/lib/types";

export const SATELLITE_UPDATE_EVENT = "satellite_data_updated";


const globalSatelliteCache: Record<string, SatelliteData> = {};

export function useSatellites() {
  const [availableNames, setAvailableNames] = useState<string[]>([]);
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const { get, post } = useFetch();

  const fetchAvailableNames = useCallback(async () => {
    try {
      const data = await get<RawSatelliteNameResponse[]>("/getSatellites");
      console.log("raw /getSatellites response:", data);

      const names =
        data?.map((item) =>
          typeof item === "string"
            ? item
            : item.name || item.OBJECT_NAME || "Unknown"
        ) || [];
      console.log("extracted names for sidebar:", names);

      setAvailableNames(names);
    } catch (err) {
      console.error("Failed to load satellite names:", err);
      setAvailableNames([]);
    }
  }, [get]);

  useEffect(() => {
    fetchAvailableNames();
  }, [fetchAvailableNames]);

  const loadSatellitesByNames = useCallback(
    async (names: string[]) => {
      if (names.length === 0) {
        setSatellites([]);
        return;
      }
      try {
        const missingNames = names.filter((name) => !globalSatelliteCache[name]);

        let newFormattedData: SatelliteData[] = [];
        if (missingNames.length > 0) {
          console.log("fetching tle details for missing names:", missingNames);
          const data = await post<RawSatelliteResponse[]>("/tleNames", {
            names: missingNames,
          });
          console.log("raw /tleNames response:", data);

          newFormattedData = data.map(
            (sat: RawSatelliteResponse, index: number) => ({
              id: sat.id || `sat-${index}-${sat.name?.replace(/\s+/g, "-")}`,
              name: sat.name || sat.OBJECT_NAME || "Unknown Satellite",
              type: sat.type || "Observation",
              altitudeKm: sat.altitudeKm || 500,
              inclinationDeg: sat.inclinationDeg || 45,
              speedMultiplier: sat.speedMultiplier || 1.0,
              periodSec: sat.periodSec || 90,
              camera: sat.camera,
              sensor: sat.sensor
                ? {
                    ...sat.sensor,
                    inclinationDeg:
                      sat.sensor.inclinationDeg ?? sat.sensor.inclinationDegree,
                    inclinationDegree:
                      sat.sensor.inclinationDegree ?? sat.sensor.inclinationDeg,
                  }
                : undefined,
              communication: sat.communication,
              tleLine1: sat.TLE_LINE1,
              tleLine2: sat.TLE_LINE2,
            })
          );
        }

        newFormattedData.forEach((sat) => {
          globalSatelliteCache[sat.name] = sat;
        });

        const finalSatellites = names
          .map((name) => globalSatelliteCache[name])
          .filter(Boolean);
        setSatellites(finalSatellites);
      } catch (err) {
        console.error("Failed to load details for selected satellites:", err);
      }
    },
    [post]
  );

  const updateSatellite = useCallback(
    async (id: string, updatedData: Partial<SatelliteData>) => {
      // Local update only – satellites are served from an external static API
      setSatellites((prev) =>
        prev.map((sat) => (sat.id === id ? { ...sat, ...updatedData } : sat))
      );
    },
    []
  );

  const updateAttachmentFov = useCallback(
    async (id: string, type: "camera" | "sensor", fovDeg: number) => {
      try {
        await post("/updateFov", { id, type, fovDeg });
        setSatellites((prev) =>
          prev.map((sat) => {
            if (sat.id === id && sat[type]) {
              return { ...sat, [type]: { ...sat[type]!, fovDeg } };
            }
            return sat;
          })
        );
      } catch (err) {
        console.error("Failed to update FOV:", err);
      }
    },
    [post]
  );

  const updateSensorInclination = useCallback(
    (id: string, inclinationDeg: number) => {
      // Purely local UI state update – no API call needed
      setSatellites((prev) =>
        prev.map((sat) => {
          if (sat.id === id && sat.sensor) {
            return {
              ...sat,
              sensor: {
                ...sat.sensor,
                inclinationDeg,
                inclinationDegree: inclinationDeg,
              },
            };
          }
          return sat;
        })
      );
    },
    []
  );

  return {
    availableNames,
    satellites,
    loadSatellitesByNames,
    updateSatellite,
    updateAttachmentFov,
    updateSensorInclination,
  };
}
