"use client";

/**
 * cesium/TorchLight.tsx
 *
 * Renders a deep, high-visibility volumetric Torch Light / Spotlight cone for satellite cameras.
 *
 * Visual Components:
 * 1. Satellite Lens Emitter: Crisp glowing aperture point at the satellite.
 * 2. Deep Volumetric Light Cone: Rich, high-opacity volumetric cone linking satellite to Earth.
 * 3. Inner Hotspot Core Beam: Luminous dense core running down the center of the cone.
 * 4. 4 Silhouette Framing Rays: High-visibility edge lines defining the cone boundary in 3D space.
 * 5. Ground Footprint Pool: High-contrast illuminated surface disc.
 * 6. Ground Perimeter Rim Ring: Solid boundary ring conforming to Earth's curvature.
 * 7. Central Optical Boresight: Dashed alignment targeting beam.
 */

import React, { useMemo } from "react";
import {
  Entity,
  PolylineGraphics,
  CylinderGraphics,
  EllipseGraphics,
  PointGraphics,
} from "resium";
import * as Cesium from "cesium";
import { animClock } from "./animClock";
import {
  computeCylinderOrientation,
  getCirclePoints,
} from "./sensorUtils";

const UNIT_Z = new Cesium.Cartesian3(0, 0, 1);
const UNIT_X = new Cesium.Cartesian3(1, 0, 0);

export interface TorchLightProps {
  /** Base light beam color (default: deep electric cyan/cobalt blue). */
  color?: Cesium.Color;
  /** Core highlight & emitter color (default: radiant daylight white). */
  accentColor?: Cesium.Color;
  /** Callback returning current satellite Cartesian3 position. */
  satPosCallback: () => Cesium.Cartesian3;
  /** Callback returning current ground target point directly beneath camera. */
  groundPosCallback: () => Cesium.Cartesian3;
  /** Callback returning ground illumination radius in meters. */
  radiusCallback: () => number;
}

export function TorchLight({
  color = Cesium.Color.fromCssColorString("#0099ff"),
  accentColor = Cesium.Color.fromCssColorString("#e0f2fe"),
  satPosCallback,
  groundPosCallback,
  radiusCallback,
}: TorchLightProps) {
  // ─── Volumetric Cone Geometry Properties ──────────────────────────────────
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

  const coreRadiusProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return radiusCallback() * 0.40;
    }, false);
  }, [radiusCallback]);

  const groundPosProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return groundPosCallback();
    }, false);
  }, [groundPosCallback]);

  const satPosProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return satPosCallback();
    }, false);
  }, [satPosCallback]);

  // ─── 4 Silhouette Framing Boundary Rays (Ensures 100% 3D Visibility) ───────
  const framingRaysProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());

      const ref = Math.abs(normal.z) < 0.9 ? UNIT_Z : UNIT_X;
      const u = Cesium.Cartesian3.cross(normal, ref, new Cesium.Cartesian3());
      Cesium.Cartesian3.normalize(u, u);
      const v = Cesium.Cartesian3.cross(normal, u, new Cesium.Cartesian3());
      Cesium.Cartesian3.normalize(v, v);

      const centerDist = Cesium.Cartesian3.magnitude(groundPos);
      const targetDist = centerDist + 1200;

      const project = (offsetVec: Cesium.Cartesian3) => {
        const rawPt = Cesium.Cartesian3.add(groundPos, offsetVec, new Cesium.Cartesian3());
        const dir = Cesium.Cartesian3.normalize(rawPt, new Cesium.Cartesian3());
        return Cesium.Cartesian3.multiplyByScalar(dir, targetDist, new Cesium.Cartesian3());
      };

      const p1 = project(Cesium.Cartesian3.multiplyByScalar(u, radius, new Cesium.Cartesian3()));
      const p2 = project(Cesium.Cartesian3.multiplyByScalar(u, -radius, new Cesium.Cartesian3()));
      const p3 = project(Cesium.Cartesian3.multiplyByScalar(v, radius, new Cesium.Cartesian3()));
      const p4 = project(Cesium.Cartesian3.multiplyByScalar(v, -radius, new Cesium.Cartesian3()));

      return [satPos, p1, satPos, p2, satPos, p3, satPos, p4];
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── Ground Perimeter Rim Ring (Conforming to Earth curvature) ─────────────
  const rimRingProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());
      return getCirclePoints(groundPos, radius, 48, normal, true, 1200);
    }, false);
  }, [groundPosCallback, radiusCallback]);

  // ─── Central Optical Boresight Line ────────────────────────────────────────
  const centerBeamProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return [satPosCallback(), groundPosCallback()];
    }, false);
  }, [satPosCallback, groundPosCallback]);

  return (
    <React.Fragment>
      {/* ── 0. Satellite Aperture Emitter ──────────────────────────────────── */}
      <Entity position={satPosProperty as unknown as Cesium.Cartesian3}>
        <PointGraphics
          pixelSize={10}
          color={accentColor.withAlpha(0.98)}
          outlineColor={color.withAlpha(0.95)}
          outlineWidth={3}
        />
      </Entity>

      {/* ── 1. Deep Primary Volumetric Light Cone Body ──────────────────────── */}
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
                // High-visibility deep cyan/blue with gentle breathing
                const alpha = 0.44 + 0.08 * Math.sin(animClock.elapsedTime * 2.0);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 2. Inner Hotspot Core Volumetric Cone ────────────────────────────── */}
      <Entity
        position={conePositionProperty as unknown as Cesium.Cartesian3}
        orientation={coneOrientationProperty as unknown as Cesium.Quaternion}
      >
        <CylinderGraphics
          length={coneLengthProperty as unknown as Cesium.Property}
          topRadius={0}
          bottomRadius={coreRadiusProperty as unknown as Cesium.Property}
          slices={48}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                // Bright luminous core
                const alpha = 0.58 + 0.08 * Math.sin(animClock.elapsedTime * 2.0);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 3. Silhouette Framing Boundary Rays ─────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={framingRaysProperty as unknown as Cesium.Cartesian3[]}
          width={2.2}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.85 + 0.10 * Math.sin(animClock.elapsedTime * 2.0);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 4. Ground Illuminated Footprint Pool ───────────────────────────── */}
      <Entity position={groundPosProperty as unknown as Cesium.Cartesian3}>
        <EllipseGraphics
          height={0}
          semiMajorAxis={radiusProperty as unknown as Cesium.Property}
          semiMinorAxis={radiusProperty as unknown as Cesium.Property}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.36 + 0.06 * Math.sin(animClock.elapsedTime * 2.0);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 5. Ground Perimeter Rim Ring ───────────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={rimRingProperty as unknown as Cesium.Cartesian3[]}
          width={2.8}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.90 + 0.08 * Math.sin(animClock.elapsedTime * 2.0);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 6. Central Optical Boresight Targeting Axis ─────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={centerBeamProperty as unknown as Cesium.Cartesian3[]}
          width={1.6}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.WHITE.withAlpha(0.85),
              dashLength: 20.0,
            })
          }
        />
      </Entity>
    </React.Fragment>
  );
}
