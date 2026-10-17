/**
 * cesium/orbitUtils.ts
 * Pure math helpers for satellite orbit calculations and a per-frame cache.
 */
import * as Cesium from "cesium";
import type { SatelliteData } from "@/lib/types";

// ─── Orbit Path Generation ────────────────────────────────────────────────────

/**
 * Generate a closed orbit trajectory as an array of Cartesian3 points.
 * @param altitudeKm   Orbit altitude above Earth surface in kilometres.
 * @param inclinationDeg  Orbital inclination in degrees.
 * @param samples      Number of sample points along the full orbit (default 120).
 */
export function generateOrbitPath(
  altitudeKm: number,
  inclinationDeg: number,
  samples = 120
): Cesium.Cartesian3[] {
  const points: Cesium.Cartesian3[] = [];
  const earthRadius = 6_371_000;
  const orbitRadius = earthRadius + altitudeKm * 1000;
  const incRad = Cesium.Math.toRadians(inclinationDeg);

  for (let i = 0; i <= samples; i++) {
    const u = (i / samples) * Cesium.Math.TWO_PI;
    const x = orbitRadius * Math.cos(u);
    const y = orbitRadius * Math.sin(u) * Math.cos(incRad);
    const z = orbitRadius * Math.sin(u) * Math.sin(incRad);
    points.push(new Cesium.Cartesian3(x, y, z));
  }
  return points;
}

// ─── Instantaneous Position ───────────────────────────────────────────────────

/**
 * Calculate a satellite's 3-D position at a given simulation time.
 * @param sat      Satellite descriptor (altitude, inclination, period, speedMultiplier).
 * @param timeSec  Simulated elapsed seconds.
 */
export function calculateSatPosition(
  sat: SatelliteData,
  timeSec: number
): Cesium.Cartesian3 {
  const earthRadius = 6_371_000;
  const orbitRadius = earthRadius + sat.altitudeKm * 1000;
  const incRad = Cesium.Math.toRadians(sat.inclinationDeg);

  // speedMultiplier varies each satellite's apparent velocity relative to real-time
  const effectiveTime = timeSec * sat.speedMultiplier;
  const angle =
    ((effectiveTime % sat.periodSec) / sat.periodSec) * Cesium.Math.TWO_PI;

  const x = orbitRadius * Math.cos(angle);
  const y = orbitRadius * Math.sin(angle) * Math.cos(incRad);
  const z = orbitRadius * Math.sin(angle) * Math.sin(incRad);
  return new Cesium.Cartesian3(x, y, z);
}

// ─── Per-Frame Cache ──────────────────────────────────────────────────────────

/**
 * Cache that stores calculated positions for the current animation frame.
 * Cleared automatically whenever `timeSec` changes.
 */
const frameCache = {
  timeSec: -1,
  positions: new Map<string, Cesium.Cartesian3>(),
  subPositions: new Map<string, Cesium.Cartesian3>(),
};

/** Return (and cache) the satellite's 3-D orbit position for `timeSec`. */
export function getCachedSatPosition(
  sat: SatelliteData,
  timeSec: number
): Cesium.Cartesian3 {
  if (frameCache.timeSec !== timeSec) {
    frameCache.timeSec = timeSec;
    frameCache.positions.clear();
    frameCache.subPositions.clear();
  }
  let pos = frameCache.positions.get(sat.id);
  if (!pos) {
    pos = calculateSatPosition(sat, timeSec);
    frameCache.positions.set(sat.id, pos);
  }
  return pos;
}

/** Return (and cache) the sub-satellite point projected onto Earth's surface. */
export function getCachedSubPosition(
  sat: SatelliteData,
  timeSec: number
): Cesium.Cartesian3 {
  // Ensure the positions cache is in sync (getCachedSatPosition handles this)
  getCachedSatPosition(sat, timeSec);

  let subPos = frameCache.subPositions.get(sat.id);
  if (!subPos) {
    const pos = frameCache.positions.get(sat.id)!;
    const earthRadius = 6_371_000;
    const mag = Cesium.Cartesian3.magnitude(pos);
    subPos = Cesium.Cartesian3.multiplyByScalar(
      pos,
      earthRadius / mag,
      new Cesium.Cartesian3()
    );
    frameCache.subPositions.set(sat.id, subPos);
  }
  return subPos;
}
