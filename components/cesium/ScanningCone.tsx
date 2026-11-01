"use client";

/**
 * cesium/ScanningCone.tsx
 *
 * Renders a clean, elegant volumetric Scanner Cone & Radar effect for satellite sensors.
 *
 * Visual Components:
 * 1. Sensor Transceiver Emitter: Glowing telemetry point at satellite position.
 * 2. Volumetric Radar Shroud: Translucent cone oriented along sensor inclination.
 * 3. 1 Downward Radar Pulse Ring: Single clean wavefront sliding down the cone.
 * 4. Revolving 360° Radar Sweep Needle: Smooth rotating ray scanning the footprint.
 * 5. Ground Range Rings: Outer rim + 50% range ring conforming to Earth's curvature.
 * 6. Ground Footprint Wash: Soft illuminated sensor footprint pool.
 * 7. Central Boresight Axis: Dashed targeting alignment beam.
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
import { TorchLight } from "./TorchLight";

const UNIT_Z = new Cesium.Cartesian3(0, 0, 1);
const UNIT_X = new Cesium.Cartesian3(1, 0, 0);

export interface ScanningConeProps {
  type?: "camera" | "sensor";
  /** Primary radar color (default: orange/amber). */
  color?: Cesium.Color;
  /** Secondary pulse & sweep color (default: gold/bright yellow). */
  accentColor?: Cesium.Color;
  /** Callback returning current satellite Cartesian3 position. */
  satPosCallback: () => Cesium.Cartesian3;
  /** Callback returning current ground footprint center (supports off-nadir inclination). */
  groundPosCallback: () => Cesium.Cartesian3;
  /** Callback returning ground footprint radius in meters. */
  radiusCallback: () => number;
}

export function ScanningCone({
  type = "sensor",
  color = Cesium.Color.ORANGE,
  accentColor = Cesium.Color.GOLD,
  satPosCallback,
  groundPosCallback,
  radiusCallback,
}: ScanningConeProps) {
  // If explicitly requested as camera, delegate to dedicated TorchLight component
  if (type === "camera") {
    return (
      <TorchLight
        color={Cesium.Color.fromCssColorString("#38bdf8")}
        accentColor={Cesium.Color.WHITE}
        satPosCallback={satPosCallback}
        groundPosCallback={groundPosCallback}
        radiusCallback={radiusCallback}
      />
    );
  }

  return (
    <SensorScannerCone
      color={color}
      accentColor={accentColor}
      satPosCallback={satPosCallback}
      groundPosCallback={groundPosCallback}
      radiusCallback={radiusCallback}
    />
  );
}

function SensorScannerCone({
  color,
  accentColor,
  satPosCallback,
  groundPosCallback,
  radiusCallback,
}: {
  color: Cesium.Color;
  accentColor: Cesium.Color;
  satPosCallback: () => Cesium.Cartesian3;
  groundPosCallback: () => Cesium.Cartesian3;
  radiusCallback: () => number;
}) {
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

  // ─── Base Outer Perimeter Rim Ring on Earth ───────────────────────────────
  const outerRimRingProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());
      return getCirclePoints(groundPos, radius, 48, normal, true, 1000);
    }, false);
  }, [groundPosCallback, radiusCallback]);

  // ─── Inner Range Ring (50% on Earth) ──────────────────────────────────────
  const innerRangeRingProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const groundPos = groundPosCallback();
      const radius = radiusCallback() * 0.50;
      const normal = Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());
      return getCirclePoints(groundPos, radius, 36, normal, true, 1200);
    }, false);
  }, [groundPosCallback, radiusCallback]);

  // ─── 1 Downward Radar Pulse Ring ──────────────────────────────────────────
  const pulseRingProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.subtract(satPos, groundPos, new Cesium.Cartesian3());

      const t = (animClock.elapsedTime * 0.6) % 1.0;
      const pulseCenter = Cesium.Cartesian3.lerp(satPos, groundPos, t, new Cesium.Cartesian3());
      const pulseRadius = radius * t;
      return getCirclePoints(pulseCenter, pulseRadius, 28, normal, false);
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── Revolving 360° Radar Sweep Needle ────────────────────────────────────
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

      const angle = animClock.elapsedTime * 2.0;
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

  // ─── Central Boresight Targeting Axis ─────────────────────────────────────
  const centerBeamProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return [satPosCallback(), groundPosCallback()];
    }, false);
  }, [satPosCallback, groundPosCallback]);

  return (
    <React.Fragment>
      {/* ── 0. Sensor Transceiver Emitter at Satellite ──────────────────────── */}
      <Entity position={satPosProperty as unknown as Cesium.Cartesian3}>
        <PointGraphics
          pixelSize={8}
          color={accentColor.withAlpha(0.95)}
          outlineColor={Cesium.Color.WHITE}
          outlineWidth={2}
        />
      </Entity>

      {/* ── 1. Volumetric Scanner Cone Shroud ───────────────────────────────── */}
      <Entity
        position={conePositionProperty as unknown as Cesium.Cartesian3}
        orientation={coneOrientationProperty as unknown as Cesium.Quaternion}
      >
        <CylinderGraphics
          length={coneLengthProperty as unknown as Cesium.Property}
          topRadius={0}
          bottomRadius={radiusProperty as unknown as Cesium.Property}
          slices={48}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.38 + 0.06 * Math.sin(animClock.elapsedTime * 2.2);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 2. Ground Footprint Wash ────────────────────────────────────────── */}
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

      {/* ── 3. Outer Boundary Rim Ring on Earth ─────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={outerRimRingProperty as unknown as Cesium.Cartesian3[]}
          width={2.0}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.75 + 0.12 * Math.sin(animClock.elapsedTime * 2.2);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 4. Inner 50% Range Ring on Earth ────────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={innerRangeRingProperty as unknown as Cesium.Cartesian3[]}
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

      {/* ── 5. Downward Traveling Pulse Ring ────────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={pulseRingProperty as unknown as Cesium.Cartesian3[]}
          width={2.0}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const t = (animClock.elapsedTime * 0.6) % 1.0;
                const alpha = Math.max(0.05, (1.0 - t * 0.6) * 0.75);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 6. Revolving Radar Sweep Needle ─────────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={sweepRayProperty as unknown as Cesium.Cartesian3[]}
          width={2.4}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                return accentColor.withAlpha(0.85);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 7. Central Boresight Targeting Axis ─────────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={centerBeamProperty as unknown as Cesium.Cartesian3[]}
          width={1.2}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.PolylineDashMaterialProperty({
              color: color.withAlpha(0.65),
              dashLength: 20.0,
            })
          }
        />
      </Entity>
    </React.Fragment>
  );
}
