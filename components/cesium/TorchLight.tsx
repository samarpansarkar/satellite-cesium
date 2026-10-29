"use client";

/**
 * cesium/TorchLight.tsx
 *
 * Renders a high-intensity volumetric Torch Light / Spotlight effect for satellite cameras.
 *
 * Visual Components:
 * 1. Satellite Aperture Lens Flare: Bright glowing emitter at the satellite position.
 * 2. Inner Hotspot Core Cone: Dense, luminous volumetric light cone piercing through space.
 * 3. Outer Penumbra Light Cone: Soft atmospheric light falloff surrounding the core beam.
 * 4. Ground Spotlight Footprint:
 *    - Bright central hotspot disc (umbra/focus)
 *    - Soft illuminated outer halo pool (penumbra)
 *    - Smooth perimeter rim ring conforming to Earth's curvature
 *    - Inner hotspot perimeter ring
 * 5. Crepuscular Light Shaft Rays: Longitudinal light rays framing the torch beam.
 * 6. Central Camera Optical Boresight: Fine axial line for targeting alignment.
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
import { computeCylinderOrientation, getCirclePoints } from "./sensorUtils";

export interface TorchLightProps {
  /** Base light beam color (default: radiant cyan/daylight white). */
  color?: Cesium.Color;
  /** Core highlight & lens flare color (default: pure white). */
  accentColor?: Cesium.Color;
  /** Callback returning current satellite Cartesian3 position. */
  satPosCallback: () => Cesium.Cartesian3;
  /** Callback returning current ground target point directly beneath camera. */
  groundPosCallback: () => Cesium.Cartesian3;
  /** Callback returning ground illumination radius in meters. */
  radiusCallback: () => number;
}

export function TorchLight({
  color = Cesium.Color.fromCssColorString("#38bdf8"),
  accentColor = Cesium.Color.WHITE,
  satPosCallback,
  groundPosCallback,
  radiusCallback,
}: TorchLightProps) {
  // ─── 0. Volumetric Cone Properties ─────────────────────────────────────────
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
      return radiusCallback() * 0.45;
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

  // ─── 1. Crepuscular Light Shaft Rays (Longitudinal framing rays) ───────────
  const shaftRaysProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());
      const rimPts = getCirclePoints(groundPos, radius, 8, normal, true, 1200);

      const shafts: Cesium.Cartesian3[] = [];
      for (let i = 0; i < rimPts.length; i++) {
        shafts.push(satPos, rimPts[i], satPos);
      }
      return shafts;
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── 2. Base Perimeter Rim Ring (Outer illuminated halo on Earth) ─────────
  const outerRimRingProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());
      return getCirclePoints(groundPos, radius, 48, normal, true, 1200);
    }, false);
  }, [groundPosCallback, radiusCallback]);

  // ─── 3. Inner Hotspot Rim Ring (Focused center boundary) ───────────────────
  const innerRimRingProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const groundPos = groundPosCallback();
      const radius = radiusCallback() * 0.45;
      const normal = Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());
      return getCirclePoints(groundPos, radius, 36, normal, true, 1400);
    }, false);
  }, [groundPosCallback, radiusCallback]);

  // ─── 4. Central Optical Boresight Focus Axis ──────────────────────────────
  const centerBeamProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return [satPosCallback(), groundPosCallback()];
    }, false);
  }, [satPosCallback, groundPosCallback]);

  return (
    <React.Fragment>
      {/* ── 0. Aperture Lens Flare / Torch Bulb Emitter at Satellite ────────── */}
      <Entity position={satPosProperty as unknown as Cesium.Cartesian3}>
        <PointGraphics
          pixelSize={10}
          color={accentColor.withAlpha(0.95)}
          outlineColor={color.withAlpha(0.75)}
          outlineWidth={3}
        />
      </Entity>

      {/* ── 1. Outer Soft Volumetric Light Cone Body ────────────────────────── */}
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
                const alpha = 0.15 + 0.03 * Math.sin(animClock.elapsedTime * 2.2);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 2. Inner Hotspot Core Volumetric Light Cone ──────────────────────── */}
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
                const alpha = 0.22 + 0.04 * Math.sin(animClock.elapsedTime * 2.2);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 3. Crepuscular Light Shaft Rays ─────────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={shaftRaysProperty as unknown as Cesium.Cartesian3[]}
          width={1.4}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.40 + 0.10 * Math.sin(animClock.elapsedTime * 2.2);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 4. Outer Soft Illuminated Ground Pool (Penumbra) ────────────────── */}
      <Entity position={groundPosProperty as unknown as Cesium.Cartesian3}>
        <EllipseGraphics
          height={0}
          semiMajorAxis={radiusProperty as unknown as Cesium.Property}
          semiMinorAxis={radiusProperty as unknown as Cesium.Property}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.14 + 0.03 * Math.sin(animClock.elapsedTime * 2.2);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 5. Inner Bright Spotlight Hotspot Disc (Umbra/Focus) ─────────────── */}
      <Entity position={groundPosProperty as unknown as Cesium.Cartesian3}>
        <EllipseGraphics
          height={0}
          semiMajorAxis={coreRadiusProperty as unknown as Cesium.Property}
          semiMinorAxis={coreRadiusProperty as unknown as Cesium.Property}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.30 + 0.05 * Math.sin(animClock.elapsedTime * 2.2);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 6. Outer Illuminated Perimeter Ring on Ground ───────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={outerRimRingProperty as unknown as Cesium.Cartesian3[]}
          width={2.2}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.75 + 0.15 * Math.sin(animClock.elapsedTime * 2.2);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 7. Inner Hotspot Perimeter Ring on Ground ───────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={innerRimRingProperty as unknown as Cesium.Cartesian3[]}
          width={1.4}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.50 + 0.10 * Math.sin(animClock.elapsedTime * 2.2);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 8. Central Camera Optical Boresight Focus Axis ──────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={centerBeamProperty as unknown as Cesium.Cartesian3[]}
          width={1.2}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.WHITE.withAlpha(0.65),
              dashLength: 28.0,
            })
          }
        />
      </Entity>
    </React.Fragment>
  );
}

