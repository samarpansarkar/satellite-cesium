"use client";

/**
 * cesium/Swath.tsx
 * Renders the ground swath coverage corridor along the satellite's orbital track on Earth.
 *
 * A swath represents the ground area observed/covered by the satellite's sensor/payload
 * as it orbits Earth. It is rendered as a surface polygon ribbon bounded by left and right
 * ground tracks offset perpendicularly from the orbital track.
 */

import React, { useMemo } from "react";
import { Entity, PolygonGraphics, PolylineGraphics } from "resium";
import * as Cesium from "cesium";
import type { SatelliteData, OrbitPath } from "@/lib/types";

/**
 * Calculates the total swath ground width (in kilometres) for a satellite.
 * If sat.swathWidthKm is explicitly specified, returns that.
 * Otherwise, calculates from sensor FOV (or camera FOV, or defaults to 25°).
 */
export function getSatelliteSwathWidthKm(sat: SatelliteData): number {
  if (sat.swathWidthKm && sat.swathWidthKm > 0) {
    return Math.round(sat.swathWidthKm);
  }

  const fovDeg = sat.sensor?.fovDeg ?? sat.camera?.fovDeg ?? 25;
  const altitudeKm = sat.altitudeKm;
  const halfFovRad = Cesium.Math.toRadians(fovDeg / 2);
  const halfSwathKm = Math.max(altitudeKm * Math.tan(halfFovRad), 50);
  const fullSwathKm = Math.min(halfSwathKm * 2, 3000);
  return Math.round(fullSwathKm);
}

/**
 * Calculates the half-swath ground distance (in metres) for a satellite.
 */
export function getSatelliteSwathWidthMeters(sat: SatelliteData): number {
  return getSatelliteSwathWidthKm(sat) * 1000;
}

/**
 * Generate boundary points for the swath ribbon across the orbital ground track.
 *
 * @param altitudeKm      Orbit altitude in kilometres.
 * @param inclinationDeg  Orbit inclination in degrees.
 * @param swathWidthMeters Full width of swath across track in metres.
 * @param samples         Number of samples along the orbit track (default 180).
 */
export function generateSwathCoordinates(
  altitudeKm: number,
  inclinationDeg: number,
  swathWidthMeters: number,
  samples = 180
): {
  polygonHierarchy: Cesium.PolygonHierarchy;
  leftBorder: Cesium.Cartesian3[];
  rightBorder: Cesium.Cartesian3[];
} {
  const earthRadius = 6_371_000;
  // 1,800 m above Earth MSL to prevent z-fighting with globe imagery/terrain
  const surfaceRadius = earthRadius + 1_800;
  const incRad = Cesium.Math.toRadians(inclinationDeg);
  const halfWidth = swathWidthMeters / 2;

  const leftPoints: Cesium.Cartesian3[] = [];
  const rightPoints: Cesium.Cartesian3[] = [];

  for (let i = 0; i <= samples; i++) {
    const u = (i / samples) * Cesium.Math.TWO_PI;
    // Central ground track point
    const cx = surfaceRadius * Math.cos(u);
    const cy = surfaceRadius * Math.sin(u) * Math.cos(incRad);
    const cz = surfaceRadius * Math.sin(u) * Math.sin(incRad);
    const center = new Cesium.Cartesian3(cx, cy, cz);

    // Radial up vector
    const up = Cesium.Cartesian3.normalize(center, new Cesium.Cartesian3());

    // Tangent velocity vector along orbit direction: d/du [cos(u), sin(u)cos(i), sin(u)sin(i)]
    const tx = -Math.sin(u);
    const ty = Math.cos(u) * Math.cos(incRad);
    const tz = Math.cos(u) * Math.sin(incRad);
    const tangent = Cesium.Cartesian3.normalize(
      new Cesium.Cartesian3(tx, ty, tz),
      new Cesium.Cartesian3()
    );

    // Cross-track normal perpendicular to track on surface = cross(tangent, up)
    const crossTrack = Cesium.Cartesian3.cross(tangent, up, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(crossTrack, crossTrack);

    // Left point: center + halfWidth * crossTrack
    const leftOffset = Cesium.Cartesian3.multiplyByScalar(
      crossTrack,
      halfWidth,
      new Cesium.Cartesian3()
    );
    const leftRaw = Cesium.Cartesian3.add(center, leftOffset, new Cesium.Cartesian3());
    const leftMag = Cesium.Cartesian3.magnitude(leftRaw);
    const left = Cesium.Cartesian3.multiplyByScalar(
      leftRaw,
      surfaceRadius / leftMag,
      new Cesium.Cartesian3()
    );

    // Right point: center - halfWidth * crossTrack
    const rightRaw = Cesium.Cartesian3.subtract(center, leftOffset, new Cesium.Cartesian3());
    const rightMag = Cesium.Cartesian3.magnitude(rightRaw);
    const right = Cesium.Cartesian3.multiplyByScalar(
      rightRaw,
      surfaceRadius / rightMag,
      new Cesium.Cartesian3()
    );

    leftPoints.push(left);
    rightPoints.push(right);
  }

  // Build closed polygon boundary: left boundary forwards + right boundary backwards
  const polygonPoints = [...leftPoints, ...[...rightPoints].reverse()];

  return {
    polygonHierarchy: new Cesium.PolygonHierarchy(polygonPoints),
    leftBorder: leftPoints,
    rightBorder: rightPoints,
  };
}

export interface SwathProps {
  /** Active satellite record containing id, altitude, inclination, FOV, etc. */
  liveSat: SatelliteData;
  /** Memoised orbit descriptor containing Cesium color. */
  orbit: OrbitPath;
}

export function Swath({ liveSat, orbit }: SwathProps) {
  const swathWidth = useMemo(() => {
    return getSatelliteSwathWidthMeters(liveSat);
  }, [liveSat]);

  const { polygonHierarchy, leftBorder, rightBorder } = useMemo(() => {
    return generateSwathCoordinates(
      liveSat.altitudeKm,
      liveSat.inclinationDeg,
      swathWidth,
      180
    );
  }, [liveSat.altitudeKm, liveSat.inclinationDeg, swathWidth]);

  // Use cyan / satellite color theme for swath with translucent fill
  const swathColor = useMemo(() => {
    return orbit.cesiumColor || Cesium.Color.CYAN;
  }, [orbit.cesiumColor]);

  return (
    <React.Fragment>
      {/* ── Swath Ground Ribbon Surface Polygon ──────────────────────────── */}
      <Entity name={`${liveSat.name} Swath Ribbon`}>
        <PolygonGraphics
          hierarchy={polygonHierarchy}
          material={swathColor.withAlpha(0.18)}
          height={1800}
        />
      </Entity>

      {/* ── Left Swath Edge Boundary Polyline ────────────────────────────── */}
      <Entity name={`${liveSat.name} Swath Left Edge`}>
        <PolylineGraphics
          positions={leftBorder}
          width={1.5}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.PolylineDashMaterialProperty({
              color: swathColor.withAlpha(0.65),
              dashLength: 12.0,
            })
          }
        />
      </Entity>

      {/* ── Right Swath Edge Boundary Polyline ───────────────────────────── */}
      <Entity name={`${liveSat.name} Swath Right Edge`}>
        <PolylineGraphics
          positions={rightBorder}
          width={1.5}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.PolylineDashMaterialProperty({
              color: swathColor.withAlpha(0.65),
              dashLength: 12.0,
            })
          }
        />
      </Entity>
    </React.Fragment>
  );
}

export default Swath;
