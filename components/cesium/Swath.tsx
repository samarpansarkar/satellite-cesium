"use client";

/**
 * cesium/Swath.tsx
 * Renders the compact, dynamic ground swath coverage ribbon that smoothly follows
 * the satellite's live orbital position, styled cleanly like satvis.space.
 *
 * Characteristics:
 *  - Compact swath length (trailing 8% of orbit, leading 1.5% ahead).
 *  - Real-time continuous analytical angle tracking for buttery smooth animation.
 *  - Semi-translucent glowing footprint with crisp edge boundaries.
 */

import React, { useMemo, useRef } from "react";
import { Entity, PolygonGraphics, PolylineGraphics } from "resium";
import * as Cesium from "cesium";
import type { SatelliteData, OrbitPath } from "@/lib/types";
import { animClock } from "./animClock";

/**
 * Calculates the total swath ground width (in kilometres) for a satellite.
 * If sat.swathWidthKm is explicitly specified, returns that.
 * Otherwise, calculates from sensor FOV (or camera FOV, or defaults to 18° for a compact clean corridor).
 */
export function getSatelliteSwathWidthKm(sat: SatelliteData): number {
  if (sat.swathWidthKm && sat.swathWidthKm > 0) {
    return Math.round(sat.swathWidthKm);
  }

  // Default to a tighter, realistic FOV so the swath is compact and elegant
  const fovDeg = sat.sensor?.fovDeg ?? sat.camera?.fovDeg ?? 18;
  const altitudeKm = sat.altitudeKm;
  const halfFovRad = Cesium.Math.toRadians(fovDeg / 2);
  const halfSwathKm = Math.max(altitudeKm * Math.tan(halfFovRad), 30);
  const fullSwathKm = Math.min(halfSwathKm * 2, 1200);
  return Math.round(fullSwathKm);
}

/**
 * Calculates the half-swath ground distance (in metres) for a satellite.
 */
export function getSatelliteSwathWidthMeters(sat: SatelliteData): number {
  return getSatelliteSwathWidthKm(sat) * 1000;
}

/**
 * Computes smooth dynamic swath boundary coordinates (polygon and borders)
 * for a satellite at current simulated time `timeSec`.
 *
 * Designed to be compact:
 *   - trailRatio: 0.08 (~8% of orbit length trailing behind)
 *   - leadRatio: 0.015 (~1.5% of orbit length leading ahead under the satellite)
 *
 * Uses continuous unwrapped analytical orbital coordinates for zero-jitter animation.
 */
export function computeSmoothDynamicSwathGeometry(
  sat: SatelliteData,
  timeSec: number,
  swathWidthMeters: number,
  samples = 54,
  trailRatio = 0.08,
  leadRatio = 0.015
): {
  hierarchy: Cesium.PolygonHierarchy;
  leftBorder: Cesium.Cartesian3[];
  rightBorder: Cesium.Cartesian3[];
  leadingEdge: Cesium.Cartesian3[];
  trailingEdge: Cesium.Cartesian3[];
} {
  const earthRadius = 6_371_000;
  // 1,600 m above Earth MSL to prevent z-fighting with imagery/terrain
  const surfaceRadius = earthRadius + 1_600;
  const halfWidth = swathWidthMeters / 2;
  const incRad = Cesium.Math.toRadians(sat.inclinationDeg);
  const cosInc = Math.cos(incRad);
  const sinInc = Math.sin(incRad);

  // Satellite's continuous orbital angle (unwrapped, perfectly continuous)
  const speed = sat.speedMultiplier || 1;
  const period = Math.max(sat.periodSec, 1);
  const currentAngle = (timeSec * speed * Cesium.Math.TWO_PI) / period;

  // Compact trailing and leading angular extent
  const trailAngle = Cesium.Math.TWO_PI * trailRatio;
  const leadAngle = Cesium.Math.TWO_PI * leadRatio;
  const startAngle = currentAngle - trailAngle;
  const totalAngle = trailAngle + leadAngle;

  const leftPoints: Cesium.Cartesian3[] = new Array(samples + 1);
  const rightPoints: Cesium.Cartesian3[] = new Array(samples + 1);

  for (let i = 0; i <= samples; i++) {
    const fraction = i / samples;
    const u = startAngle + fraction * totalAngle;

    const cosU = Math.cos(u);
    const sinU = Math.sin(u);

    // Sub-satellite ground center point on sphere
    const cx = surfaceRadius * cosU;
    const cy = surfaceRadius * sinU * cosInc;
    const cz = surfaceRadius * sinU * sinInc;
    const center = new Cesium.Cartesian3(cx, cy, cz);

    // Radial surface normal unit vector
    const up = Cesium.Cartesian3.normalize(center, new Cesium.Cartesian3());

    // Instantaneous orbital velocity tangent unit vector
    const tx = -sinU;
    const ty = cosU * cosInc;
    const tz = cosU * sinInc;
    const tangent = Cesium.Cartesian3.normalize(
      new Cesium.Cartesian3(tx, ty, tz),
      new Cesium.Cartesian3()
    );

    // Cross-track normal perpendicular to flight path on surface
    const crossTrack = Cesium.Cartesian3.cross(tangent, up, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(crossTrack, crossTrack);

    // Left boundary offset
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

    // Right boundary offset
    const rightRaw = Cesium.Cartesian3.subtract(center, leftOffset, new Cesium.Cartesian3());
    const rightMag = Cesium.Cartesian3.magnitude(rightRaw);
    const right = Cesium.Cartesian3.multiplyByScalar(
      rightRaw,
      surfaceRadius / rightMag,
      new Cesium.Cartesian3()
    );

    leftPoints[i] = left;
    rightPoints[i] = right;
  }

  // Construct closed boundary polygon: left forwards + right in reverse
  const polygonPoints: Cesium.Cartesian3[] = new Array(leftPoints.length + rightPoints.length);
  for (let i = 0; i < leftPoints.length; i++) {
    polygonPoints[i] = leftPoints[i];
  }
  for (let i = 0; i < rightPoints.length; i++) {
    polygonPoints[leftPoints.length + i] = rightPoints[rightPoints.length - 1 - i];
  }

  const leadingEdge = [leftPoints[leftPoints.length - 1], rightPoints[rightPoints.length - 1]];
  const trailingEdge = [leftPoints[0], rightPoints[0]];

  return {
    hierarchy: new Cesium.PolygonHierarchy(polygonPoints),
    leftBorder: leftPoints,
    rightBorder: rightPoints,
    leadingEdge,
    trailingEdge,
  };
}

export interface SwathProps {
  /** Active satellite record containing id, altitude, inclination, FOV, etc. */
  liveSat: SatelliteData;
  /** Memoised orbit descriptor containing Cesium color. */
  orbit: OrbitPath;
}

export function Swath({ liveSat, orbit }: SwathProps) {
  // Swath color with cyan/satellite glow theme
  const swathColor = useMemo(() => {
    return orbit.cesiumColor || Cesium.Color.fromCssColorString("#38bdf8");
  }, [orbit.cesiumColor]);

  // Per-frame cache to guarantee 60 FPS animation with zero redundant geometry work
  const geomCacheRef = useRef<{
    timeSec: number;
    swathWidth: number;
    data: ReturnType<typeof computeSmoothDynamicSwathGeometry>;
  } | null>(null);

  const getGeometry = () => {
    const timeSec = animClock.elapsedTime;
    const width = getSatelliteSwathWidthMeters(liveSat);
    if (
      !geomCacheRef.current ||
      geomCacheRef.current.timeSec !== timeSec ||
      geomCacheRef.current.swathWidth !== width
    ) {
      geomCacheRef.current = {
        timeSec,
        swathWidth: width,
        data: computeSmoothDynamicSwathGeometry(liveSat, timeSec, width, 54, 0.08, 0.015),
      };
    }
    return geomCacheRef.current.data;
  };

  // Dynamic CallbackProperties for real-time smooth animation
  const hierarchyProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return getGeometry().hierarchy;
    }, false);
  }, [liveSat.id]);

  const leftBorderProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return getGeometry().leftBorder;
    }, false);
  }, [liveSat.id]);

  const rightBorderProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return getGeometry().rightBorder;
    }, false);
  }, [liveSat.id]);

  const leadingEdgeProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return getGeometry().leadingEdge;
    }, false);
  }, [liveSat.id]);

  const trailingEdgeProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return getGeometry().trailingEdge;
    }, false);
  }, [liveSat.id]);

  return (
    <React.Fragment>
      {/* ── Compact Swath Ground Ribbon Polygon ─────────────────────────── */}
      <Entity name={`${liveSat.name} Swath Ribbon`}>
        <PolygonGraphics
          hierarchy={hierarchyProperty as unknown as Cesium.Property}
          material={swathColor.withAlpha(0.24)}
          height={1600}
        />
      </Entity>

      {/* ── Left Swath Edge Boundary Polyline ───────────────────────────── */}
      <Entity name={`${liveSat.name} Swath Left Edge`}>
        <PolylineGraphics
          positions={leftBorderProperty as unknown as Cesium.Cartesian3[]}
          width={1.5}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.PolylineDashMaterialProperty({
              color: swathColor.withAlpha(0.85),
              dashLength: 10.0,
            })
          }
        />
      </Entity>

      {/* ── Right Swath Edge Boundary Polyline ──────────────────────────── */}
      <Entity name={`${liveSat.name} Swath Right Edge`}>
        <PolylineGraphics
          positions={rightBorderProperty as unknown as Cesium.Cartesian3[]}
          width={1.5}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.PolylineDashMaterialProperty({
              color: swathColor.withAlpha(0.85),
              dashLength: 10.0,
            })
          }
        />
      </Entity>

      {/* ── Swath Leading Front Edge Polyline ───────────────────────────── */}
      <Entity name={`${liveSat.name} Swath Front Edge`}>
        <PolylineGraphics
          positions={leadingEdgeProperty as unknown as Cesium.Cartesian3[]}
          width={2.0}
          arcType={Cesium.ArcType.NONE}
          material={swathColor.withAlpha(0.95)}
        />
      </Entity>

      {/* ── Swath Trailing Rear Edge Polyline ───────────────────────────── */}
      <Entity name={`${liveSat.name} Swath Rear Edge`}>
        <PolylineGraphics
          positions={trailingEdgeProperty as unknown as Cesium.Cartesian3[]}
          width={1.5}
          arcType={Cesium.ArcType.NONE}
          material={swathColor.withAlpha(0.5)}
        />
      </Entity>
    </React.Fragment>
  );
}

export default Swath;
