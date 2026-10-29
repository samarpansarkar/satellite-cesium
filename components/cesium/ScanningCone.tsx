"use client";

import React, { useMemo } from "react";
import { Entity, PolylineGraphics, CylinderGraphics, EllipseGraphics } from "resium";
import * as Cesium from "cesium";
import { animClock } from "./animClock";
import { computeCylinderOrientation } from "./sensorUtils";

const UNIT_Z = new Cesium.Cartesian3(0, 0, 1);
const UNIT_X = new Cesium.Cartesian3(1, 0, 0);

/**
 * Returns an array of Cartesian3 points forming a circle on the plane perpendicular
 * to the given normal vector, centered at `center` with the specified `radius`.
 */
function getCirclePoints(
  center: Cesium.Cartesian3,
  radius: number,
  count: number,
  normal?: Cesium.Cartesian3
): Cesium.Cartesian3[] {
  const n = normal
    ? Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3())
    : Cesium.Cartesian3.normalize(center, new Cesium.Cartesian3());
  const ref = Math.abs(n.z) < 0.9 ? UNIT_Z : UNIT_X;
  const u = Cesium.Cartesian3.cross(n, ref, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(u, u);
  const v = Cesium.Cartesian3.cross(n, u, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(v, v);

  const pts: Cesium.Cartesian3[] = [];
  for (let i = 0; i <= count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const offset = Cesium.Cartesian3.add(
      Cesium.Cartesian3.multiplyByScalar(u, radius * Math.cos(angle), new Cesium.Cartesian3()),
      Cesium.Cartesian3.multiplyByScalar(v, radius * Math.sin(angle), new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );
    pts.push(Cesium.Cartesian3.add(center, offset, new Cesium.Cartesian3()));
  }
  return pts;
}

interface ScanningConeProps {
  type: "camera" | "sensor";
  color: Cesium.Color;
  accentColor: Cesium.Color;
  satPosCallback: () => Cesium.Cartesian3;
  groundPosCallback: () => Cesium.Cartesian3;
  radiusCallback: () => number;
}

/**
 * ScanningCone
 *
 * Renders an illuminated volumetric cone of light (torch / scanner beam):
 * 1. Soft translucent colored volumetric cone body (gives the cone rich color & depth).
 * 2. 8 radiant beam rays framing the cone's luminous facets.
 * 3. Base rim ring on the Earth's surface with illuminated ground wash.
 * 4. Two downward-propagating wave pulse rings expanding down the cone.
 * 5. Revolving 360° radar/scanner sweep needle.
 * 6. Central dashed boresight beam axis.
 */
export function ScanningCone({
  color,
  accentColor,
  satPosCallback,
  groundPosCallback,
  radiusCallback,
}: ScanningConeProps) {
  // ─── 0. Volumetric Cone Properties (Position, Orientation, Length) ───────
  const conePositionProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      return Cesium.Cartesian3.midpoint(satPos, groundPos, new Cesium.Cartesian3());
    }, false);
  }, [satPosCallback, groundPosCallback]);

  const coneOrientationProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      return computeCylinderOrientation(satPos, groundPos);
    }, false);
  }, [satPosCallback, groundPosCallback]);

  const coneLengthProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      return Cesium.Cartesian3.distance(satPos, groundPos);
    }, false);
  }, [satPosCallback, groundPosCallback]);

  const radiusProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return radiusCallback();
    }, false);
  }, [radiusCallback]);

  const groundPosProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return groundPosCallback();
    }, false);
  }, [groundPosCallback]);

  // ─── 1. Radiant Cone Facet Rays (8 balanced beams framing the cone) ───────
  const cageRaysProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.subtract(satPos, groundPos, new Cesium.Cartesian3());
      const rimPts = getCirclePoints(groundPos, radius, 8, normal);

      const cage: Cesium.Cartesian3[] = [];
      for (let i = 0; i < rimPts.length; i++) {
        cage.push(satPos, rimPts[i], satPos);
      }
      return cage;
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── 2. Base Rim Ring (Circular footprint on Earth) ───────────────────────
  const rimRingProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.subtract(satPos, groundPos, new Cesium.Cartesian3());
      return getCirclePoints(groundPos, radius, 36, normal);
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── 3. Downward-Propagating Wave Pulse 1 ──────────────────────────────────
  const pulseRing1Property = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.subtract(satPos, groundPos, new Cesium.Cartesian3());

      const t = (animClock.elapsedTime * 0.75) % 1.0;
      const pulseCenter = Cesium.Cartesian3.lerp(satPos, groundPos, t, new Cesium.Cartesian3());
      const pulseRadius = radius * t;
      return getCirclePoints(pulseCenter, pulseRadius, 28, normal);
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── 4. Downward-Propagating Wave Pulse 2 (half-phase offset) ─────────────
  const pulseRing2Property = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.subtract(satPos, groundPos, new Cesium.Cartesian3());

      const t = (animClock.elapsedTime * 0.75 + 0.5) % 1.0;
      const pulseCenter = Cesium.Cartesian3.lerp(satPos, groundPos, t, new Cesium.Cartesian3());
      const pulseRadius = radius * t;
      return getCirclePoints(pulseCenter, pulseRadius, 28, normal);
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── 5. Revolving Scanner Sweep Needle (360° radar sweep) ─────────────────
  const sweepRayProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.subtract(satPos, groundPos, new Cesium.Cartesian3());

      const n = Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3());
      const ref = Math.abs(n.z) < 0.9 ? UNIT_Z : UNIT_X;
      const u = Cesium.Cartesian3.cross(n, ref, new Cesium.Cartesian3());
      Cesium.Cartesian3.normalize(u, u);
      const v = Cesium.Cartesian3.cross(n, u, new Cesium.Cartesian3());
      Cesium.Cartesian3.normalize(v, v);

      const angle = animClock.elapsedTime * 2.5;
      const sweepPt = Cesium.Cartesian3.add(
        groundPos,
        Cesium.Cartesian3.add(
          Cesium.Cartesian3.multiplyByScalar(u, radius * Math.cos(angle), new Cesium.Cartesian3()),
          Cesium.Cartesian3.multiplyByScalar(v, radius * Math.sin(angle), new Cesium.Cartesian3()),
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      );

      return [satPos, sweepPt, groundPos];
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── 6. Central Boresight Axis Beam ───────────────────────────────────────
  const centerBeamProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return [satPosCallback(), groundPosCallback()];
    }, false);
  }, [satPosCallback, groundPosCallback]);

  return (
    <React.Fragment>
      {/* ── 0. Soft Translucent Volumetric Cone Color Fill ──────────────────── */}
      <Entity
        position={conePositionProperty as unknown as Cesium.Cartesian3}
        orientation={coneOrientationProperty as unknown as Cesium.Quaternion}
      >
        <CylinderGraphics
          length={coneLengthProperty as unknown as Cesium.Property}
          topRadius={0}
          bottomRadius={radiusProperty as unknown as Cesium.Property}
          slices={64}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                // Soft colored translucent light cone body
                const alpha = 0.14 + 0.04 * Math.sin(animClock.elapsedTime * 3.0);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 1. Radiant Cone Facet Rays (8 Beams) ───────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={cageRaysProperty as unknown as Cesium.Cartesian3[]}
          width={1.6}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.55 + 0.15 * Math.sin(animClock.elapsedTime * 3.0);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 2. Base Rim Ring on Ground ──────────────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={rimRingProperty as unknown as Cesium.Cartesian3[]}
          width={2.2}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.85 + 0.15 * Math.sin(animClock.elapsedTime * 4.0);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 3. Soft Illuminated Ground Footprint Wash ───────────────────────── */}
      <Entity position={groundPosProperty as unknown as Cesium.Cartesian3}>
        <EllipseGraphics
          height={0}
          semiMajorAxis={radiusProperty as unknown as Cesium.Property}
          semiMinorAxis={radiusProperty as unknown as Cesium.Property}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.18 + 0.05 * Math.sin(animClock.elapsedTime * 3.0);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 4. Traveling Scanning Wave Pulse 1 ──────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={pulseRing1Property as unknown as Cesium.Cartesian3[]}
          width={2.2}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const t = (animClock.elapsedTime * 0.75) % 1.0;
                const alpha = Math.max(0.05, (1.0 - t * 0.75) * 0.85);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 5. Traveling Scanning Wave Pulse 2 ──────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={pulseRing2Property as unknown as Cesium.Cartesian3[]}
          width={2.2}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const t = (animClock.elapsedTime * 0.75 + 0.5) % 1.0;
                const alpha = Math.max(0.05, (1.0 - t * 0.75) * 0.85);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 6. Revolving Scanner Sweep Needle ───────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={sweepRayProperty as unknown as Cesium.Cartesian3[]}
          width={2.8}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.85 + 0.15 * Math.sin(animClock.elapsedTime * 7.0);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 7. Central Dashed Boresight Beam ─────────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={centerBeamProperty as unknown as Cesium.Cartesian3[]}
          width={1.4}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.PolylineDashMaterialProperty({
              color: color.withAlpha(0.7),
              dashLength: 20.0,
            })
          }
        />
      </Entity>
    </React.Fragment>
  );
}
