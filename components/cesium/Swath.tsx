"use client";

/**
 * cesium/Swath.tsx
 * Renders a premium, animated ground swath coverage ribbon.
 *
 * Visual design:
 *  - Gradient fade: swath is bright/opaque at the satellite's current position
 *    and smoothly fades to fully transparent at the trailing end — achieved by
 *    rendering 7 stacked polygon segments each with decreasing alpha.
 *  - Dual-layer glowing borders: outer glow (PolylineGlow) + inner crisp dash line.
 *  - Bright solid leading-edge flash exactly at the satellite ground point.
 *  - No trailing-edge cap line — the swath simply dissolves into nothing.
 *  - 80 samples for full border polylines for silky-smooth curves.
 */

import React, { useMemo, useRef } from "react";
import { Entity, PolygonGraphics, PolylineGraphics } from "resium";
import * as Cesium from "cesium";
import type { SatelliteData, OrbitPath } from "@/lib/types";
import { animClock } from "./animClock";

// ─── Width helpers ────────────────────────────────────────────────────────────

/**
 * Calculates the total swath ground width (in kilometres) for a satellite.
 * If sat.swathWidthKm is explicitly specified, returns that.
 * Otherwise, calculates from sensor FOV (or camera FOV, or defaults to 18°).
 */
export function getSatelliteSwathWidthKm(sat: SatelliteData): number {
  if (sat.swathWidthKm && sat.swathWidthKm > 0) {
    return Math.round(sat.swathWidthKm);
  }
  const fovDeg = sat.sensor?.fovDeg ?? sat.camera?.fovDeg ?? 18;
  const altitudeKm = sat.altitudeKm;
  const halfFovRad = Cesium.Math.toRadians(fovDeg / 2);
  const halfSwathKm = Math.max(altitudeKm * Math.tan(halfFovRad), 30);
  const fullSwathKm = Math.min(halfSwathKm * 2, 1200);
  return Math.round(fullSwathKm);
}

/** Calculates the swath ground width in metres. */
export function getSatelliteSwathWidthMeters(sat: SatelliteData): number {
  return getSatelliteSwathWidthKm(sat) * 1000;
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

const EARTH_RADIUS = 6_371_000;
/** Render 1 600 m above MSL so swath sits cleanly above the globe. */
const SURFACE_RADIUS = EARTH_RADIUS + 1_600;

/**
 * Compute left + right boundary arrays for an angular arc of the orbit.
 */
function computeArcBoundary(
  cosInc: number,
  sinInc: number,
  fromAngle: number,
  toAngle: number,
  halfWidth: number,
  samples: number
): { left: Cesium.Cartesian3[]; right: Cesium.Cartesian3[] } {
  const left: Cesium.Cartesian3[] = new Array(samples + 1);
  const right: Cesium.Cartesian3[] = new Array(samples + 1);
  const span = toAngle - fromAngle;

  for (let i = 0; i <= samples; i++) {
    const u = fromAngle + (i / samples) * span;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);

    const cx = SURFACE_RADIUS * cosU;
    const cy = SURFACE_RADIUS * sinU * cosInc;
    const cz = SURFACE_RADIUS * sinU * sinInc;
    const center = new Cesium.Cartesian3(cx, cy, cz);

    const up = Cesium.Cartesian3.normalize(center, new Cesium.Cartesian3());
    const tangent = Cesium.Cartesian3.normalize(
      new Cesium.Cartesian3(-sinU, cosU * cosInc, cosU * sinInc),
      new Cesium.Cartesian3()
    );
    const crossTrack = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.cross(tangent, up, new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );

    const offset = Cesium.Cartesian3.multiplyByScalar(crossTrack, halfWidth, new Cesium.Cartesian3());

    const lRaw = Cesium.Cartesian3.add(center, offset, new Cesium.Cartesian3());
    left[i] = Cesium.Cartesian3.multiplyByScalar(
      lRaw, SURFACE_RADIUS / Cesium.Cartesian3.magnitude(lRaw), new Cesium.Cartesian3()
    );

    const rRaw = Cesium.Cartesian3.subtract(center, offset, new Cesium.Cartesian3());
    right[i] = Cesium.Cartesian3.multiplyByScalar(
      rRaw, SURFACE_RADIUS / Cesium.Cartesian3.magnitude(rRaw), new Cesium.Cartesian3()
    );
  }

  return { left, right };
}

function buildHierarchy(left: Cesium.Cartesian3[], right: Cesium.Cartesian3[]): Cesium.PolygonHierarchy {
  const pts: Cesium.Cartesian3[] = new Array(left.length + right.length);
  for (let i = 0; i < left.length; i++) pts[i] = left[i];
  for (let i = 0; i < right.length; i++) pts[left.length + i] = right[right.length - 1 - i];
  return new Cesium.PolygonHierarchy(pts);
}

// ─── Segmented swath ──────────────────────────────────────────────────────────

const NUM_SEGMENTS = 7;

/** Alpha per segment — index 0 = at satellite (brightest), index N-1 = tail. */
const SEGMENT_ALPHAS = [0.52, 0.40, 0.29, 0.19, 0.12, 0.06, 0.02];

/** Sample count per segment — fewer samples at the tail (performance). */
const SEGMENT_SAMPLES = [18, 16, 14, 12, 10, 8, 6];

interface SwathGeometryData {
  segments: { hierarchy: Cesium.PolygonHierarchy }[];
  leftBorder: Cesium.Cartesian3[];
  rightBorder: Cesium.Cartesian3[];
  leadingEdge: Cesium.Cartesian3[];
}

export function computeSegmentedSwathGeometry(
  sat: SatelliteData,
  timeSec: number,
  swathWidthMeters: number,
  trailRatio = 0.08
): SwathGeometryData {
  const incRad = Cesium.Math.toRadians(sat.inclinationDeg);
  const cosInc = Math.cos(incRad);
  const sinInc = Math.sin(incRad);

  const speed = sat.speedMultiplier || 1;
  const period = Math.max(sat.periodSec, 1);
  const currentAngle = (timeSec * speed * Cesium.Math.TWO_PI) / period;

  const trailAngle = Cesium.Math.TWO_PI * trailRatio;
  const segmentAngle = trailAngle / NUM_SEGMENTS;
  const halfWidth = swathWidthMeters / 2;

  const segments = Array.from({ length: NUM_SEGMENTS }, (_, s) => {
    const segEnd = currentAngle - s * segmentAngle;
    const segStart = segEnd - segmentAngle;
    const { left, right } = computeArcBoundary(cosInc, sinInc, segStart, segEnd, halfWidth, SEGMENT_SAMPLES[s]);
    return { hierarchy: buildHierarchy(left, right) };
  });

  // High-res full-length borders
  const { left: leftBorder, right: rightBorder } = computeArcBoundary(
    cosInc, sinInc, currentAngle - trailAngle, currentAngle, halfWidth, 80
  );

  const leadingEdge = [leftBorder[leftBorder.length - 1], rightBorder[rightBorder.length - 1]];

  return { segments, leftBorder, rightBorder, leadingEdge };
}

// ─── React component ──────────────────────────────────────────────────────────

export interface SwathProps {
  liveSat: SatelliteData;
  orbit: OrbitPath;
}

export function Swath({ liveSat, orbit }: SwathProps) {
  const swathColor = useMemo(() => {
    return orbit.cesiumColor || Cesium.Color.fromCssColorString("#38bdf8");
  }, [orbit.cesiumColor]);

  const geomCacheRef = useRef<{
    timeSec: number;
    swathWidth: number;
    data: SwathGeometryData;
  } | null>(null);

  const getGeometry = (): SwathGeometryData => {
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
        data: computeSegmentedSwathGeometry(liveSat, timeSec, width),
      };
    }
    return geomCacheRef.current.data;
  };

  // One CallbackProperty per gradient segment
  const segmentProperties = useMemo(
    () =>
      Array.from({ length: NUM_SEGMENTS }, (_, s) =>
        new Cesium.CallbackProperty(() => getGeometry().segments[s]?.hierarchy, false)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveSat.id]
  );

  const leftBorderProp = useMemo(
    () => new Cesium.CallbackProperty(() => getGeometry().leftBorder, false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveSat.id]
  );

  const rightBorderProp = useMemo(
    () => new Cesium.CallbackProperty(() => getGeometry().rightBorder, false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveSat.id]
  );

  const leadingEdgeProp = useMemo(
    () => new Cesium.CallbackProperty(() => getGeometry().leadingEdge, false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveSat.id]
  );

  // Outer soft glow border material
  const glowMaterial = useMemo(
    () =>
      new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.28,
        taperPower: 0.55,
        color: swathColor.withAlpha(0.65),
      }),
    [swathColor]
  );

  // Inner crisp dashed border material
  const dashMaterial = useMemo(
    () =>
      new Cesium.PolylineDashMaterialProperty({
        color: swathColor.withAlpha(0.92),
        dashLength: 14.0,
        dashPattern: 0b1111000011110000,
      }),
    [swathColor]
  );

  // Leading-edge glow flash at the satellite position
  const leadingGlowMaterial = useMemo(
    () =>
      new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.55,
        color: swathColor.withAlpha(1.0),
      }),
    [swathColor]
  );

  return (
    <React.Fragment>
      {/* ── Gradient-fade fill: 7 segments, bright at satellite → invisible at tail ── */}
      {segmentProperties.map((prop, s) => (
        <Entity key={`${liveSat.id}-swath-seg-${s}`} name={`${liveSat.name} Swath Seg ${s}`}>
          <PolygonGraphics
            hierarchy={prop as unknown as Cesium.Property}
            material={swathColor.withAlpha(SEGMENT_ALPHAS[s])}
            height={1600}
          />
        </Entity>
      ))}

      {/* ── Outer glow border — left ────────────────────────────────────────── */}
      <Entity name={`${liveSat.name} Swath Glow Left`}>
        <PolylineGraphics
          positions={leftBorderProp as unknown as Cesium.Cartesian3[]}
          width={7}
          arcType={Cesium.ArcType.NONE}
          material={glowMaterial}
        />
      </Entity>

      {/* ── Outer glow border — right ───────────────────────────────────────── */}
      <Entity name={`${liveSat.name} Swath Glow Right`}>
        <PolylineGraphics
          positions={rightBorderProp as unknown as Cesium.Cartesian3[]}
          width={7}
          arcType={Cesium.ArcType.NONE}
          material={glowMaterial}
        />
      </Entity>

      {/* ── Inner dashed border — left ──────────────────────────────────────── */}
      <Entity name={`${liveSat.name} Swath Dash Left`}>
        <PolylineGraphics
          positions={leftBorderProp as unknown as Cesium.Cartesian3[]}
          width={1.4}
          arcType={Cesium.ArcType.NONE}
          material={dashMaterial}
        />
      </Entity>

      {/* ── Inner dashed border — right ─────────────────────────────────────── */}
      <Entity name={`${liveSat.name} Swath Dash Right`}>
        <PolylineGraphics
          positions={rightBorderProp as unknown as Cesium.Cartesian3[]}
          width={1.4}
          arcType={Cesium.ArcType.NONE}
          material={dashMaterial}
        />
      </Entity>

      {/* ── Leading-edge flash — vivid glow exactly at satellite ground point ── */}
      <Entity name={`${liveSat.name} Swath Front Edge`}>
        <PolylineGraphics
          positions={leadingEdgeProp as unknown as Cesium.Cartesian3[]}
          width={4}
          arcType={Cesium.ArcType.NONE}
          material={leadingGlowMaterial}
        />
      </Entity>
    </React.Fragment>
  );
}

export default Swath;
