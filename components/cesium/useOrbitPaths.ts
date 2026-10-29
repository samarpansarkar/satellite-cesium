/**
 * cesium/useOrbitPaths.ts
 * React hook that builds the memoised per-satellite orbit path descriptors.
 *
 * Returns an array of objects that contain:
 * - Static data: id, name, cesium colour, orbit path geometry.
 * - Dynamic Cesium CallbackProperty instances for position, sub-satellite
 *   point, sensor footprint, camera cone, and communications link.
 *
 * The array is recomputed only when the set of satellite IDs changes
 * (controlled by the `satIds` dependency).
 */
import { useMemo, useRef } from "react";
import * as Cesium from "cesium";
import type { SatelliteData, OrbitPath } from "@/lib/types";
import { animClock } from "./animClock";
import { generateOrbitPath, getCachedSatPosition, getCachedSubPosition } from "./orbitUtils";
import {
  getSensorFootprintCenter,
  computeCylinderOrientation,
  getFootprintPerimeterPoint,
} from "./sensorUtils";
import { GROUND_STATION } from "./config";

// Re-export so existing imports from this file continue to work
export type { OrbitPath } from "@/lib/types";

/**
 * Build and memoize orbit path descriptors for the provided satellite list.
 *
 * @param satellites  Current satellite data array.
 * @returns           Memoised array of OrbitPath descriptors.
 */
export function useOrbitPaths(satellites: SatelliteData[]): OrbitPath[] {
  /** O(1) lookup map so CallbackProperty closures always read the latest data. */
  const satMapRef = useRef(new Map<string, SatelliteData>());
  satMapRef.current = new Map(satellites.map((s) => [s.id, s]));

  // Recompute descriptors only when the satellite ID set changes.
  const satIds = satellites.map((s) => s.id).join(",");

  return useMemo(() => {
    return satellites.map((initialSat) => {
      const color = Cesium.Color.fromCssColorString("#38bdf8");

      /** Always return the freshest version of this satellite. */
      const getSat = () => satMapRef.current.get(initialSat.id) || initialSat;

      // ── Core position callbacks ────────────────────────────────────────────
      const positionProperty = new Cesium.CallbackProperty(
        () => getCachedSatPosition(getSat(), animClock.elapsedTime),
        false
      );

      const subPositionProperty = new Cesium.CallbackProperty(
        () => getCachedSubPosition(getSat(), animClock.elapsedTime),
        false
      );

      // ── Camera cone callbacks ──────────────────────────────────────────────
      const cameraWithProps = initialSat.camera
        ? {
            conePositionProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const satPos = getCachedSatPosition(sat, animClock.elapsedTime);
              const groundPos = getCachedSubPosition(sat, animClock.elapsedTime);
              return Cesium.Cartesian3.midpoint(satPos, groundPos, new Cesium.Cartesian3());
            }, false),
            coneOrientationProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const satPos = getCachedSatPosition(sat, animClock.elapsedTime);
              const groundPos = getCachedSubPosition(sat, animClock.elapsedTime);
              return computeCylinderOrientation(satPos, groundPos);
            }, false),
            coneLengthProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const satPos = getCachedSatPosition(sat, animClock.elapsedTime);
              const groundPos = getCachedSubPosition(sat, animClock.elapsedTime);
              return Cesium.Cartesian3.distance(satPos, groundPos);
            }, false),
            beamProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              return [
                getCachedSatPosition(sat, animClock.elapsedTime),
                getCachedSubPosition(sat, animClock.elapsedTime),
              ];
            }, false),
            sweepRayProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const satPos = getCachedSatPosition(sat, animClock.elapsedTime);
              const groundPos = getCachedSubPosition(sat, animClock.elapsedTime);
              const fov = sat.camera?.fovDeg || 30;
              const altM = sat.altitudeKm * 1000;
              const radius = Math.max(altM * Math.tan(Cesium.Math.toRadians(fov / 2)), 50_000);
              const angle = animClock.elapsedTime * 2.5;
              const sweepPt = getFootprintPerimeterPoint(groundPos, radius, angle);
              return [satPos, sweepPt, groundPos];
            }, false),
            subPositionProperty: new Cesium.CallbackProperty(() => {
              return getCachedSubPosition(getSat(), animClock.elapsedTime);
            }, false),
            radiusProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const fov = sat.camera?.fovDeg || 30;
              const altM = sat.altitudeKm * 1000;
              return Math.max(altM * Math.tan(Cesium.Math.toRadians(fov / 2)), 50_000);
            }, false),
          }
        : null;

      // ── Sensor footprint callbacks ─────────────────────────────────────────
      const sensorWithProps = initialSat.sensor
        ? {
            conePositionProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const satPos = getCachedSatPosition(sat, animClock.elapsedTime);
              const groundPos = getSensorFootprintCenter(sat, animClock.elapsedTime);
              return Cesium.Cartesian3.midpoint(satPos, groundPos, new Cesium.Cartesian3());
            }, false),
            coneOrientationProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const satPos = getCachedSatPosition(sat, animClock.elapsedTime);
              const groundPos = getSensorFootprintCenter(sat, animClock.elapsedTime);
              return computeCylinderOrientation(satPos, groundPos);
            }, false),
            coneLengthProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const satPos = getCachedSatPosition(sat, animClock.elapsedTime);
              const groundPos = getSensorFootprintCenter(sat, animClock.elapsedTime);
              return Cesium.Cartesian3.distance(satPos, groundPos);
            }, false),
            footprintCenterProperty: new Cesium.CallbackProperty(() => {
              return getSensorFootprintCenter(getSat(), animClock.elapsedTime);
            }, false),
            beamProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              return [
                getCachedSatPosition(sat, animClock.elapsedTime),
                getSensorFootprintCenter(sat, animClock.elapsedTime),
              ];
            }, false),
            sweepRayProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const satPos = getCachedSatPosition(sat, animClock.elapsedTime);
              const groundPos = getSensorFootprintCenter(sat, animClock.elapsedTime);
              const fov = sat.sensor?.fovDeg || 60;
              const altM = sat.altitudeKm * 1000;
              const radius = Math.max(altM * Math.tan(Cesium.Math.toRadians(fov / 2)), 100_000);
              const angle = animClock.elapsedTime * 2.0;
              const sweepPt = getFootprintPerimeterPoint(groundPos, radius, angle);
              return [satPos, sweepPt, groundPos];
            }, false),
            radiusProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const fov = sat.sensor?.fovDeg || 60;
              const altM = sat.altitudeKm * 1000;
              return Math.max(altM * Math.tan(Cesium.Math.toRadians(fov / 2)), 100_000);
            }, false),
            semiMajorProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const fov = sat.sensor?.fovDeg || 60;
              const altM = sat.altitudeKm * 1000;
              return Math.max(altM * Math.tan(Cesium.Math.toRadians(fov / 2)), 100_000);
            }, false),
            semiMinorProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const fov = sat.sensor?.fovDeg || 60;
              const altM = sat.altitudeKm * 1000;
              return Math.max(altM * Math.tan(Cesium.Math.toRadians(fov / 2)), 100_000);
            }, false),
            rotationProperty: new Cesium.CallbackProperty(() => 0, false),
          }
        : null;

      // ── Communication link callbacks ───────────────────────────────────────
      const commWithProps = initialSat.communication
        ? {
            linkProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const pos = getCachedSatPosition(sat, animClock.elapsedTime);
              const comm = sat.communication;
              const target =
                comm?.targetStation
                  ? Cesium.Cartesian3.fromDegrees(comm.targetStation[0], comm.targetStation[1], 0)
                  : GROUND_STATION;
              return [pos, target];
            }, false),
            linkShowProperty: new Cesium.CallbackProperty(() => {
              const sat = getSat();
              const pos = getCachedSatPosition(sat, animClock.elapsedTime);
              const comm = sat.communication;
              const target =
                comm?.targetStation
                  ? Cesium.Cartesian3.fromDegrees(comm.targetStation[0], comm.targetStation[1], 0)
                  : GROUND_STATION;
              const distance = Cesium.Cartesian3.distance(pos, target);
              const R = 6_371_000;
              const h = sat.altitudeKm * 1000;
              const maxVisibleDist = Math.sqrt((R + h) ** 2 - R ** 2);
              return distance <= maxVisibleDist + 500_000;
            }, false),
          }
        : null;

      return {
        id: initialSat.id,
        name: initialSat.name,
        path: generateOrbitPath(initialSat.altitudeKm, initialSat.inclinationDeg),
        cesiumColor: color,
        positionProperty,
        subPositionProperty,
        cameraWithProps,
        sensorWithProps,
        commWithProps,
      } satisfies OrbitPath;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satIds]);
}
