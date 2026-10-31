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

const UNIT_Z = new Cesium.Cartesian3(0, 0, 1);
const UNIT_X = new Cesium.Cartesian3(1, 0, 0);

/**
 * Computes the orientation quaternion for a Cesium cylinder or cone entity.
 * In Cesium, a default cylinder is aligned with its height along local Z (+Z = top, -Z = bottom).
 * With topRadius = 0 (cone tip at satellite) and bottomRadius = R (cone base at ground footprint),
 * the vector from bottom to top is (satPos - groundPos).
 * This function returns the rotation that aligns (0, 0, 1) with normalize(satPos - groundPos).
 */
export function computeCylinderOrientation(
  satPos: Cesium.Cartesian3,
  groundPos: Cesium.Cartesian3,
  result = new Cesium.Quaternion()
): Cesium.Quaternion {
  const dir = Cesium.Cartesian3.subtract(satPos, groundPos, new Cesium.Cartesian3());
  if (Cesium.Cartesian3.magnitudeSquared(dir) < 1e-8) {
    return Cesium.Quaternion.clone(Cesium.Quaternion.IDENTITY, result);
  }
  Cesium.Cartesian3.normalize(dir, dir);

  const dot = Cesium.Cartesian3.dot(UNIT_Z, dir);
  if (dot >= 0.999999) {
    return Cesium.Quaternion.clone(Cesium.Quaternion.IDENTITY, result);
  }
  if (dot <= -0.999999) {
    return Cesium.Quaternion.fromAxisAngle(UNIT_X, Math.PI, result);
  }

  const axis = Cesium.Cartesian3.cross(UNIT_Z, dir, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(axis, axis);
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
  return Cesium.Quaternion.fromAxisAngle(axis, angle, result);
}

/**
 * Computes a 3D Cartesian point on the perimeter of a circular ground footprint.
 * Used for edge rays and animated rotating scanner sweep needles.
 */
export function getFootprintPerimeterPoint(
  groundPos: Cesium.Cartesian3,
  radius: number,
  angleRad: number,
  normal?: Cesium.Cartesian3
): Cesium.Cartesian3 {
  const n = normal
    ? Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
    : Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());
  const ref = Math.abs(n.z) < 0.9 ? UNIT_Z : UNIT_X;
  const u = Cesium.Cartesian3.cross(n, ref, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(u, u);
  const v = Cesium.Cartesian3.cross(n, u, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(v, v);

  const offset = Cesium.Cartesian3.add(
    Cesium.Cartesian3.multiplyByScalar(u, radius * Math.cos(angleRad), new Cesium.Cartesian3()),
    Cesium.Cartesian3.multiplyByScalar(v, radius * Math.sin(angleRad), new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );
  return Cesium.Cartesian3.add(groundPos, offset, new Cesium.Cartesian3());
}

/**
 * Returns an array of Cartesian3 points forming a circle on the plane perpendicular
 * to the given normal vector, centered at `center` with the specified `radius`.
 * When `conformToSphere` is true, points are projected onto the spherical globe
 * surface with an altitude offset so the ring drapes smoothly over the Earth.
 */
export function getCirclePoints(
  center: Cesium.Cartesian3,
  radius: number,
  count: number,
  normal?: Cesium.Cartesian3,
  conformToSphere: boolean = false,
  altitudeOffsetMeters: number = 1000
): Cesium.Cartesian3[] {
  const n = normal
    ? Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
    : Cesium.Cartesian3.normalize(center, new Cesium.Cartesian3());
  const ref = Math.abs(n.z) < 0.9 ? UNIT_Z : UNIT_X;
  const u = Cesium.Cartesian3.cross(n, ref, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(u, u);
  const v = Cesium.Cartesian3.cross(n, u, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(v, v);

  const centerDist = Cesium.Cartesian3.magnitude(center);
  const targetDist = centerDist + altitudeOffsetMeters;

  const pts: Cesium.Cartesian3[] = [];
  for (let i = 0; i <= count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const offset = Cesium.Cartesian3.add(
      Cesium.Cartesian3.multiplyByScalar(u, radius * Math.cos(angle), new Cesium.Cartesian3()),
      Cesium.Cartesian3.multiplyByScalar(v, radius * Math.sin(angle), new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );
    const rawPt = Cesium.Cartesian3.add(center, offset, new Cesium.Cartesian3());
    if (conformToSphere) {
      const dir = Cesium.Cartesian3.normalize(rawPt, new Cesium.Cartesian3());
      pts.push(Cesium.Cartesian3.multiplyByScalar(dir, targetDist, new Cesium.Cartesian3()));
    } else {
      pts.push(rawPt);
    }
  }
  return pts;
}

/**
 * Returns an array of Cartesian3 points forming a 4-way crosshair target reticle
 * across `center` with radius `radius`.
 */
export function getCrosshairPoints(
  center: Cesium.Cartesian3,
  radius: number,
  normal?: Cesium.Cartesian3,
  conformToSphere: boolean = true,
  altitudeOffsetMeters: number = 1100
): Cesium.Cartesian3[] {
  const n = normal
    ? Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
    : Cesium.Cartesian3.normalize(center, new Cesium.Cartesian3());
  const ref = Math.abs(n.z) < 0.9 ? UNIT_Z : UNIT_X;
  const u = Cesium.Cartesian3.cross(n, ref, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(u, u);
  const v = Cesium.Cartesian3.cross(n, u, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(v, v);

  const centerDist = Cesium.Cartesian3.magnitude(center);
  const targetDist = centerDist + altitudeOffsetMeters;

  const project = (rawPt: Cesium.Cartesian3) => {
    if (!conformToSphere) return rawPt;
    const dir = Cesium.Cartesian3.normalize(rawPt, new Cesium.Cartesian3());
    return Cesium.Cartesian3.multiplyByScalar(dir, targetDist, new Cesium.Cartesian3());
  };

  const c = project(center);
  const p1 = project(
    Cesium.Cartesian3.add(center, Cesium.Cartesian3.multiplyByScalar(u, radius, new Cesium.Cartesian3()), new Cesium.Cartesian3())
  );
  const p2 = project(
    Cesium.Cartesian3.add(center, Cesium.Cartesian3.multiplyByScalar(u, -radius, new Cesium.Cartesian3()), new Cesium.Cartesian3())
  );
  const p3 = project(
    Cesium.Cartesian3.add(center, Cesium.Cartesian3.multiplyByScalar(v, radius, new Cesium.Cartesian3()), new Cesium.Cartesian3())
  );
  const p4 = project(
    Cesium.Cartesian3.add(center, Cesium.Cartesian3.multiplyByScalar(v, -radius, new Cesium.Cartesian3()), new Cesium.Cartesian3())
  );

  return [p1, c, p2, c, p3, c, p4];
}


