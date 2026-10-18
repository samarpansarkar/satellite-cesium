"use client";

/**
 * cesium/GroundTrack.tsx
 * Renders the ground track on Earth's surface for a satellite:
 *   1. Full orbital ground track polyline projected onto the Earth's surface (WGS84).
 *   2. Sub-satellite nadir point marker (current overhead position on the ground).
 *   3. Vertical nadir plumb line connecting the satellite down to its ground track point.
 */

import React, { useMemo } from "react";
import { Entity, PolylineGraphics, PointGraphics } from "resium";
import * as Cesium from "cesium";
import type { SatelliteData, OrbitPath } from "@/lib/types";
import { animClock } from "./animClock";
import { getCachedSatPosition, getCachedSubPosition } from "./orbitUtils";

// ─── Math & Geometry Helper ───────────────────────────────────────────────────

/**
 * Generate ground track surface points for a satellite orbit.
 * Projects the orbit points onto the Earth's surface at a safe elevation
 * (1,500 m) above mean sea level to prevent depth fighting with terrain/imagery.
 *
 * @param altitudeKm      Orbit altitude in kilometres.
 * @param inclinationDeg  Orbit inclination in degrees.
 * @param samples         Number of sample points along the track (default 360).
 */
export function generateGroundTrackPath(
  altitudeKm: number,
  inclinationDeg: number,
  samples = 360
): Cesium.Cartesian3[] {
  const points: Cesium.Cartesian3[] = [];
  const earthRadius = 6_371_000;
  // 1,500 meters above surface prevents z-fighting with base map tiles
  const surfaceRadius = earthRadius + 1_500;
  const incRad = Cesium.Math.toRadians(inclinationDeg);

  for (let i = 0; i <= samples; i++) {
    const u = (i / samples) * Cesium.Math.TWO_PI;
    const x = surfaceRadius * Math.cos(u);
    const y = surfaceRadius * Math.sin(u) * Math.cos(incRad);
    const z = surfaceRadius * Math.sin(u) * Math.sin(incRad);
    points.push(new Cesium.Cartesian3(x, y, z));
  }
  return points;
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface GroundTrackProps {
  /** Active satellite record containing id, altitude, inclination, etc. */
  liveSat: SatelliteData;
  /** Memoised orbit descriptor containing position and subPosition properties. */
  orbit: OrbitPath;
  /** Optional custom color for the ground track (default: Amber #f59e0b). */
  color?: Cesium.Color;
}

// ─── Ground Track Component ───────────────────────────────────────────────────

export function GroundTrack({
  liveSat,
  orbit,
  color = Cesium.Color.fromCssColorString("#f59e0b"),
}: GroundTrackProps) {
  // Recompute surface track only if altitude or inclination changes
  const groundTrackPoints = useMemo(() => {
    return generateGroundTrackPath(liveSat.altitudeKm, liveSat.inclinationDeg, 360);
  }, [liveSat.altitudeKm, liveSat.inclinationDeg]);

  // Dynamic vertical plumb line from satellite in orbit down to ground track point
  const nadirLineProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const pos = getCachedSatPosition(liveSat, animClock.elapsedTime);
      const subPos = getCachedSubPosition(liveSat, animClock.elapsedTime);
      return [pos, subPos];
    }, false);
  }, [liveSat]);

  return (
    <React.Fragment>
      {/* ── Surface Ground Track Path ──────────────────────────────────────── */}
      <Entity name={`${liveSat.name} Ground Track`}>
        <PolylineGraphics
          positions={groundTrackPoints}
          width={2.5}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.PolylineDashMaterialProperty({
              color: color.withAlpha(0.9),
              gapColor: Cesium.Color.TRANSPARENT,
              dashLength: 18.0,
            })
          }
        />
      </Entity>

      {/* ── Sub-Satellite Nadir Point Marker ───────────────────────────────── */}
      <Entity
        name={`${liveSat.name} Nadir Point`}
        position={orbit.subPositionProperty as unknown as Cesium.Cartesian3}
      >
        <PointGraphics
          pixelSize={8}
          color={color}
          outlineColor={Cesium.Color.BLACK}
          outlineWidth={2}
        />
      </Entity>

      {/* ── Vertical Plumb Line (Satellite to Ground Point) ────────────────── */}
      <Entity name={`${liveSat.name} Nadir Plumb Line`}>
        <PolylineGraphics
          positions={nadirLineProperty as unknown as Cesium.Cartesian3[]}
          width={1.5}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.PolylineDashMaterialProperty({
              color: color.withAlpha(0.6),
              gapColor: Cesium.Color.TRANSPARENT,
              dashLength: 14.0,
            })
          }
        />
      </Entity>
    </React.Fragment>
  );
}

export default GroundTrack;
