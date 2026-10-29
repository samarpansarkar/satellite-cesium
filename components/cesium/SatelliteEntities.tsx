"use client";

/**
 * cesium/SatelliteEntities.tsx
 * Renders all Cesium Entity elements for a single satellite:
 *   – Orbit path polyline
 *   – Billboard icon + label
 *   – Sensor radar footprint ellipse + beam dashed line
 *   – Camera scanner cone ellipse + beam dashed line
 *   – Communication laser-link glow polyline
 */
import React from "react";
import {
  Entity,
  PolylineGraphics,
  BillboardGraphics,
  LabelGraphics,
} from "resium";
import * as Cesium from "cesium";
import type { SatelliteData, OrbitPath } from "@/lib/types";
import { SATELLITE_ICON } from "./config";
import { GroundTrack } from "./GroundTrack";
import { Swath } from "./Swath";
import { animClock } from "./animClock";

import { ScanningCone } from "./ScanningCone";
import { TorchLight } from "./TorchLight";
import { getCachedSatPosition, getCachedSubPosition } from "./orbitUtils";
import { getSensorFootprintCenter } from "./sensorUtils";

interface SatelliteEntitiesProps {
  /** Memoised orbit path descriptor for this satellite. */
  orbit: OrbitPath;
  /** Live (latest) satellite data for reading reactive state like isActive. */
  liveSat: SatelliteData;
  /** Whether orbit path rings should be rendered. */
  showOrbits: boolean;
}

/**
 * Renders all Cesium Entities associated with one satellite.
 * Wrapped in a React.Fragment so callers keep a flat entity hierarchy.
 */
export function SatelliteEntities({ orbit, liveSat, showOrbits }: SatelliteEntitiesProps) {
  return (
    <React.Fragment>
      {/* ── Orbit Path ─────────────────────────────────────────────────────── */}
      {showOrbits && (liveSat.showOrbit !== false) && (
        <Entity name={`${orbit.name} Orbit`}>
          <PolylineGraphics
            positions={orbit.path}
            width={1.5}
            material={orbit.cesiumColor.withAlpha(0.7)}
            arcType={Cesium.ArcType.NONE}
          />
        </Entity>
      )}

      {/* ── Ground Track ──────────────────────────────────────────────────── */}
      {liveSat.showGroundTrack && (
        <GroundTrack liveSat={liveSat} orbit={orbit} />
      )}

      {/* ── Swath Coverage ─────────────────────────────────────────────────── */}
      {liveSat.showSwath && (
        <Swath liveSat={liveSat} orbit={orbit} />
      )}

      {/* ── Satellite Icon & Label ──────────────────────────────────────────── */}
      <Entity
        name={orbit.name}
        position={orbit.positionProperty as unknown as Cesium.Cartesian3}
      >
        <BillboardGraphics image={SATELLITE_ICON} scale={0.8} />
        <LabelGraphics
          text={orbit.name}
          font="bold 14px sans-serif"
          fillColor={Cesium.Color.WHITE}
          style={Cesium.LabelStyle.FILL}
          showBackground={true}
          backgroundColor={Cesium.Color.BLACK.withAlpha(0.6)}
          backgroundPadding={new Cesium.Cartesian2(7, 5)}
          pixelOffset={new Cesium.Cartesian2(0, -20)}
          horizontalOrigin={Cesium.HorizontalOrigin.CENTER}
        />
      </Entity>

      {/* ── Sensor Scanner Cone Effect ────────────────────────────────────── */}
      {orbit.sensorWithProps && liveSat.sensor?.isActive && (
        <ScanningCone
          type="sensor"
          color={Cesium.Color.ORANGE}
          accentColor={Cesium.Color.GOLD}
          satPosCallback={() => getCachedSatPosition(liveSat, animClock.elapsedTime)}
          groundPosCallback={() => getSensorFootprintCenter(liveSat, animClock.elapsedTime)}
          radiusCallback={() => {
            const fov = liveSat.sensor?.fovDeg || 60;
            const altM = liveSat.altitudeKm * 1000;
            return Math.max(altM * Math.tan(Cesium.Math.toRadians(fov / 2)), 100_000);
          }}
        />
      )}

      {/* ── Camera Torch Light Effect ───────────────────────────────────────── */}
      {orbit.cameraWithProps && liveSat.camera?.isActive && (
        <TorchLight
          color={Cesium.Color.fromCssColorString("#38bdf8")}
          accentColor={Cesium.Color.WHITE}
          satPosCallback={() => getCachedSatPosition(liveSat, animClock.elapsedTime)}
          groundPosCallback={() => getCachedSubPosition(liveSat, animClock.elapsedTime)}
          radiusCallback={() => {
            const fov = liveSat.camera?.fovDeg || 30;
            const altM = liveSat.altitudeKm * 1000;
            return Math.max(altM * Math.tan(Cesium.Math.toRadians(fov / 2)), 50_000);
          }}
        />
      )}

      {/* ── Communication Laser Link ───────────────────────────────────────── */}
      {orbit.commWithProps && liveSat.communication?.isActive && (
        <Entity>
          <PolylineGraphics
            show={orbit.commWithProps.linkShowProperty as unknown as Cesium.Property}
            positions={orbit.commWithProps.linkProperty as unknown as Cesium.Cartesian3[]}
            width={3}
            arcType={Cesium.ArcType.NONE}
            material={
              new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.25,
                color: Cesium.Color.MAGENTA,
              })
            }
          />
        </Entity>
      )}
    </React.Fragment>
  );
}
