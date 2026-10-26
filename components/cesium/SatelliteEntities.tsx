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
  EllipseGraphics,
} from "resium";
import * as Cesium from "cesium";
import type { SatelliteData, OrbitPath } from "@/lib/types";
import { SATELLITE_ICON } from "./config";
import { GroundTrack } from "./GroundTrack";
import { Swath } from "./Swath";

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
      {showOrbits && (
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

      {/* ── Sensor Radar Footprint & Beam ──────────────────────────────────── */}
      {orbit.sensorWithProps && liveSat.sensor?.isActive && (
        <React.Fragment>
          {/* Footprint ellipse on the ground */}
          <Entity
            position={
              orbit.sensorWithProps.footprintCenterProperty as unknown as Cesium.Cartesian3
            }
          >
            <EllipseGraphics
              height={0}
              semiMajorAxis={
                orbit.sensorWithProps.semiMajorProperty as unknown as Cesium.Property
              }
              semiMinorAxis={
                orbit.sensorWithProps.semiMinorProperty as unknown as Cesium.Property
              }
              rotation={
                orbit.sensorWithProps.rotationProperty as unknown as Cesium.Property
              }
              material={
                new Cesium.ColorMaterialProperty(Cesium.Color.ORANGE.withAlpha(0.25))
              }
              outline={true}
              outlineColor={Cesium.Color.ORANGE.withAlpha(0.95)}
              outlineWidth={3}
            />
          </Entity>

          {/* Dashed beam line from satellite to footprint centre */}
          <Entity>
            <PolylineGraphics
              positions={
                orbit.sensorWithProps.beamProperty as unknown as Cesium.Cartesian3[]
              }
              width={2.5}
              arcType={Cesium.ArcType.NONE}
              material={
                new Cesium.PolylineDashMaterialProperty({
                  color: Cesium.Color.ORANGE.withAlpha(0.75),
                  dashLength: 25.0,
                })
              }
            />
          </Entity>
        </React.Fragment>
      )}

      {/* ── Camera Scanner Cone & Beam ─────────────────────────────────────── */}
      {orbit.cameraWithProps && liveSat.camera?.isActive && (
        <React.Fragment>
          {/* Footprint ellipse on the ground */}
          <Entity
            position={
              orbit.cameraWithProps.subPositionProperty as unknown as Cesium.Cartesian3
            }
          >
            <EllipseGraphics
              semiMajorAxis={
                orbit.cameraWithProps.radiusProperty as unknown as Cesium.Property
              }
              semiMinorAxis={
                orbit.cameraWithProps.radiusProperty as unknown as Cesium.Property
              }
              material={Cesium.Color.CYAN.withAlpha(0.5)}
              outline={true}
              outlineColor={Cesium.Color.CYAN.withAlpha(0.9)}
              outlineWidth={3}
            />
          </Entity>

          {/* Dashed beam line from satellite to ground point */}
          <Entity>
            <PolylineGraphics
              positions={
                orbit.cameraWithProps.beamProperty as unknown as Cesium.Cartesian3[]
              }
              width={4}
              arcType={Cesium.ArcType.NONE}
              material={
                new Cesium.PolylineDashMaterialProperty({
                  color: Cesium.Color.CYAN.withAlpha(0.8),
                  dashLength: 40.0,
                })
              }
            />
          </Entity>
        </React.Fragment>
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
