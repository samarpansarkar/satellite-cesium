/**
 * cesium/sensorUtils.ts
 * Sensor footprint geometry helpers.
 */
import * as Cesium from "cesium";
import type { SatelliteData } from "@/lib/types";
import { getCachedSatPosition, getCachedSubPosition, calculateSatPosition } from "./orbitUtils";

/**
 * Compute the ground area scanned by the sensor based on its attachment inclination angle.
 *
 * - 90° points directly nadir (directly below satellite).
 * - Angles deviating from 90° point off-nadir (cross-track scan),
 *   steering the footprint to scan different ground areas.
 */
export function getSensorFootprintCenter(
  sat: SatelliteData,
  timeSec: number
): Cesium.Cartesian3 {
  const subPos = getCachedSubPosition(sat, timeSec);
  const inc = sat.sensor?.inclinationDeg ?? sat.sensor?.inclinationDegree ?? 90;

  // Angle difference from nadir (90° = 0 offset, perfectly below)
  const deltaDeg = inc - 90;
  if (Math.abs(deltaDeg) < 0.05) {
    return subPos;
  }

  const satPos = getCachedSatPosition(sat, timeSec);
  const altitudeMeters = sat.altitudeKm * 1000;
  const earthRadius = 6_371_000;

  // Off-nadir pointing angle in radians
  const deltaRad = Cesium.Math.toRadians(deltaDeg);

  // Ground displacement distance across-track: h * tan(off-nadir angle)
  // Clamped to avoid scanning past the earth horizon
  const maxDisplacement = Math.min(altitudeMeters * 3.5, 2_500_000);
  const displacement = Math.max(
    -maxDisplacement,
    Math.min(maxDisplacement, altitudeMeters * Math.tan(deltaRad))
  );

  // Up vector (radial from Earth center)
  const up = Cesium.Cartesian3.normalize(satPos, new Cesium.Cartesian3());

  // Tangent / velocity approximation by checking a slight time advance
  const nextSatPos = calculateSatPosition(sat, timeSec + 0.1);
  const vel = Cesium.Cartesian3.subtract(nextSatPos, satPos, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(vel, vel);

  // Cross-track direction = cross(vel, up)
  const crossTrack = Cesium.Cartesian3.cross(vel, up, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(crossTrack, crossTrack);

  // New footprint centre with cross-track offset
  const offsetPos = Cesium.Cartesian3.add(
    subPos,
    Cesium.Cartesian3.multiplyByScalar(crossTrack, displacement, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );

  // Re-project onto Earth surface sphere
  const offsetMag = Cesium.Cartesian3.magnitude(offsetPos);
  return Cesium.Cartesian3.multiplyByScalar(
    offsetPos,
    earthRadius / offsetMag,
    new Cesium.Cartesian3()
  );
}
