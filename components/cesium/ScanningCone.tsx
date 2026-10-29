"use client";

/**
 * cesium/ScanningCone.tsx
 *
 * Renders a high-tech volumetric Scanner Cone effect for satellite sensors.
 *
 * Visual Components:
 * 1. Sensor Transceiver Emitter: Glowing telemetry point at satellite position.
 * 2. Volumetric Radar Shroud: Holographic translucent cone body oriented with sensor inclination.
 * 3. 3 Traveling Downward Wave Pulse Rings: Concentric radar wavefronts propagating down the cone.
 * 4. Revolving 360° Radar Sweep Needle: Rotating sweep ray scanning the ground footprint.
 * 5. Sweeping Contact Blip: Highlighting the active scanning point on the perimeter.
 * 6. Concentric Ground Range Rings: Outer rim + 66% + 33% range rings conforming to Earth's curvature.
 * 7. Crosshair Target Reticle: 4-way targeting crosshair axes centered on the ground footprint.
 * 8. Ground Scanner Wash: Translucent illuminated sensor footprint wash.
 * 9. Framing Radar Cage Beams: 8 luminous framing rays along the cone boundary.
 * 10. Central Boresight Targeting Axis: Dashed telemetry beam.
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
  getCrosshairPoints,
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

  const satPosProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      return satPosCallback();
    }, false);
  }, [satPosCallback]);

  // ─── 1. Radiant Cone Facet Cage Rays (8 Framing Beams) ───────────────────
  const cageRaysProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());
      const rimPts = getCirclePoints(groundPos, radius, 8, normal, true, 1000);

      const cage: Cesium.Cartesian3[] = [];
      for (let i = 0; i < rimPts.length; i++) {
        cage.push(satPos, rimPts[i], satPos);
      }
      return cage;
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── 2. Base Outer Boundary Rim Ring on Ground (Conforming to Sphere) ────
  const outerRimRingProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());
      return getCirclePoints(groundPos, radius, 48, normal, true, 1000);
    }, false);
  }, [groundPosCallback, radiusCallback]);

  // ─── 3. Concentric Range Ring 66% on Ground ──────────────────────────────
  const midRangeRingProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const groundPos = groundPosCallback();
      const radius = radiusCallback() * 0.66;
      const normal = Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());
      return getCirclePoints(groundPos, radius, 36, normal, true, 1200);
    }, false);
  }, [groundPosCallback, radiusCallback]);

  // ─── 4. Concentric Range Ring 33% on Ground ──────────────────────────────
  const innerRangeRingProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const groundPos = groundPosCallback();
      const radius = radiusCallback() * 0.33;
      const normal = Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());
      return getCirclePoints(groundPos, radius, 28, normal, true, 1400);
    }, false);
  }, [groundPosCallback, radiusCallback]);

  // ─── 5. Ground Crosshair Target Reticle ───────────────────────────────────
  const crosshairProperty = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.normalize(groundPos, new Cesium.Cartesian3());
      return getCrosshairPoints(groundPos, radius, normal, true, 1200);
    }, false);
  }, [groundPosCallback, radiusCallback]);

  // ─── 6. Downward-Propagating Wave Pulse 1 ──────────────────────────────────
  const pulseRing1Property = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.subtract(satPos, groundPos, new Cesium.Cartesian3());

      const t = (animClock.elapsedTime * 0.75) % 1.0;
      const pulseCenter = Cesium.Cartesian3.lerp(satPos, groundPos, t, new Cesium.Cartesian3());
      const pulseRadius = radius * t;
      return getCirclePoints(pulseCenter, pulseRadius, 28, normal, false);
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── 7. Downward-Propagating Wave Pulse 2 (phase offset 0.33) ──────────────
  const pulseRing2Property = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.subtract(satPos, groundPos, new Cesium.Cartesian3());

      const t = (animClock.elapsedTime * 0.75 + 0.33) % 1.0;
      const pulseCenter = Cesium.Cartesian3.lerp(satPos, groundPos, t, new Cesium.Cartesian3());
      const pulseRadius = radius * t;
      return getCirclePoints(pulseCenter, pulseRadius, 28, normal, false);
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── 8. Downward-Propagating Wave Pulse 3 (phase offset 0.67) ──────────────
  const pulseRing3Property = useMemo(() => {
    return new Cesium.CallbackProperty(() => {
      const satPos = satPosCallback();
      const groundPos = groundPosCallback();
      const radius = radiusCallback();
      const normal = Cesium.Cartesian3.subtract(satPos, groundPos, new Cesium.Cartesian3());

      const t = (animClock.elapsedTime * 0.75 + 0.67) % 1.0;
      const pulseCenter = Cesium.Cartesian3.lerp(satPos, groundPos, t, new Cesium.Cartesian3());
      const pulseRadius = radius * t;
      return getCirclePoints(pulseCenter, pulseRadius, 28, normal, false);
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── 9. Revolving Radar Sweep Needle (360° radar sweep) ───────────────────
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

      const angle = animClock.elapsedTime * 2.6;
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

  // ─── 10. Revolving Sweep Contact Blip on Perimeter ─────────────────────────
  const sweepBlipPositionProperty = useMemo(() => {
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

      const angle = animClock.elapsedTime * 2.6;
      const rawSweepPt = Cesium.Cartesian3.add(
        groundPos,
        Cesium.Cartesian3.add(
          Cesium.Cartesian3.multiplyByScalar(u, radius * Math.cos(angle), new Cesium.Cartesian3()),
          Cesium.Cartesian3.multiplyByScalar(v, radius * Math.sin(angle), new Cesium.Cartesian3()),
          new Cesium.Cartesian3()
        ),
        new Cesium.Cartesian3()
      );

      const dir = Cesium.Cartesian3.normalize(rawSweepPt, new Cesium.Cartesian3());
      const dist = Cesium.Cartesian3.magnitude(groundPos) + 1200;
      return Cesium.Cartesian3.multiplyByScalar(dir, dist, new Cesium.Cartesian3());
    }, false);
  }, [satPosCallback, groundPosCallback, radiusCallback]);

  // ─── 11. Central Boresight Targeting Axis ─────────────────────────────────
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

      {/* ── 1. Holographic Volumetric Scanner Cone Shroud ───────────────────── */}
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
                const alpha = 0.13 + 0.04 * Math.sin(animClock.elapsedTime * 3.5);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 2. Radiant Radar Cage Facet Rays (8 Framing Beams) ──────────────── */}
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

      {/* ── 3. Base Outer Perimeter Rim Ring on Earth ───────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={outerRimRingProperty as unknown as Cesium.Cartesian3[]}
          width={2.4}
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

      {/* ── 4. Concentric Range Ring 66% on Earth ───────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={midRangeRingProperty as unknown as Cesium.Cartesian3[]}
          width={1.6}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.60 + 0.15 * Math.sin(animClock.elapsedTime * 3.0);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 5. Concentric Range Ring 33% on Earth ───────────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={innerRangeRingProperty as unknown as Cesium.Cartesian3[]}
          width={1.6}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.70 + 0.15 * Math.sin(animClock.elapsedTime * 3.0);
                return color.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 6. Crosshair Target Reticle Axes on Footprint ────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={crosshairProperty as unknown as Cesium.Cartesian3[]}
          width={1.5}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const alpha = 0.65 + 0.15 * Math.sin(animClock.elapsedTime * 2.5);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 7. Soft Illuminated Ground Footprint Wash ───────────────────────── */}
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

      {/* ── 8. Traveling Wave Pulse 1 ───────────────────────────────────────── */}
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

      {/* ── 9. Traveling Wave Pulse 2 (phase offset 0.33) ───────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={pulseRing2Property as unknown as Cesium.Cartesian3[]}
          width={2.2}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const t = (animClock.elapsedTime * 0.75 + 0.33) % 1.0;
                const alpha = Math.max(0.05, (1.0 - t * 0.75) * 0.85);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 10. Traveling Wave Pulse 3 (phase offset 0.67) ──────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={pulseRing3Property as unknown as Cesium.Cartesian3[]}
          width={2.2}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.ColorMaterialProperty(
              new Cesium.CallbackProperty(() => {
                const t = (animClock.elapsedTime * 0.75 + 0.67) % 1.0;
                const alpha = Math.max(0.05, (1.0 - t * 0.75) * 0.85);
                return accentColor.withAlpha(alpha);
              }, false)
            )
          }
        />
      </Entity>

      {/* ── 11. Revolving Radar Sweep Needle ────────────────────────────────── */}
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

      {/* ── 12. Sweeping Contact Blip on Perimeter ──────────────────────────── */}
      <Entity position={sweepBlipPositionProperty as unknown as Cesium.Cartesian3}>
        <PointGraphics
          pixelSize={7}
          color={Cesium.Color.WHITE}
          outlineColor={accentColor}
          outlineWidth={2}
        />
      </Entity>

      {/* ── 13. Central Dashed Boresight Targeting Beam ─────────────────────── */}
      <Entity>
        <PolylineGraphics
          positions={centerBeamProperty as unknown as Cesium.Cartesian3[]}
          width={1.5}
          arcType={Cesium.ArcType.NONE}
          material={
            new Cesium.PolylineDashMaterialProperty({
              color: color.withAlpha(0.75),
              dashLength: 20.0,
            })
          }
        />
      </Entity>
    </React.Fragment>
  );
}
