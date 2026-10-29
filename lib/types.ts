/**
 * lib/types.ts
 * Central type definitions for the Orbit Tracker application.
 *
 * All shared interfaces and types are declared here and imported
 * throughout the app. Component-local prop interfaces stay co-located
 * with their component files.
 */

// ─── Satellite Payload Types ──────────────────────────────────────────────────

/** Payload for a camera or sensor attachment on a satellite. */
export interface CameraSensorPayload {
  isActive: boolean;
  fovDeg: number;
  inclinationDeg?: number;
  inclinationDegree?: number;
}

/** Payload for the communication system of a satellite. */
export interface CommunicationPayload {
  isActive: boolean;
  /** [longitude, latitude] of the target ground station. */
  targetStation?: [number, number];
}

// ─── Core Satellite Data ──────────────────────────────────────────────────────

/** Normalised satellite record used throughout the application. */
export interface SatelliteData {
  id: string;
  name: string;
  type: string;
  altitudeKm: number;
  inclinationDeg: number;
  speedMultiplier: number;
  periodSec: number;
  camera?: CameraSensorPayload;
  sensor?: CameraSensorPayload;
  communication?: CommunicationPayload;
  tleLine1?: string;
  tleLine2?: string;
  showGroundTrack?: boolean;
  showSwath?: boolean;
  swathWidthKm?: number;
  showOrbit?: boolean;
}

/** Raw response shape from the API before normalisation. */
export interface RawSatelliteResponse {
  id?: string;
  name?: string;
  OBJECT_NAME?: string;
  type?: string;
  altitudeKm?: number;
  inclinationDeg?: number;
  speedMultiplier?: number;
  periodSec?: number;
  camera?: CameraSensorPayload;
  sensor?: CameraSensorPayload;
  communication?: CommunicationPayload;
  TLE_LINE1?: string;
  TLE_LINE2?: string;
  showGroundTrack?: boolean;
  showSwath?: boolean;
  swathWidthKm?: number;
  showOrbit?: boolean;
}

/** A single item from the `/getSatellites` name-list endpoint. */
export type RawSatelliteNameResponse = string | RawSatelliteResponse;

// ─── Cesium / Viewer Types ────────────────────────────────────────────────────

import type * as Cesium from "cesium";

/** All imagery and terrain providers created by `useImageryProviders`. */
export interface ImageryProviders {
  /** Offline NASA Natural Earth II raster tiles bundled with Cesium. */
  naturalEarthProvider: Promise<Cesium.TileMapServiceImageryProvider> | undefined;
  /** Transparent lat/lon grid overlay for the Natural Earth base map. */
  earthGridOverlayProvider: Cesium.GridImageryProvider | undefined;
  /** Solid dark background with amber grid lines (the "grid" map mode). */
  gridProvider: Cesium.GridImageryProvider | undefined;
  /** XYZ raster tiles: GET http://localhost:8080/tiles/{z}/{x}/{y}.png */
  dockerXYZProvider: Cesium.UrlTemplateImageryProvider | undefined;
  /** TMS (Tile Map Service) 1.0 tiles from a local MapProxy / GeoServer (async). */
  dockerTMSProvider: Promise<Cesium.TileMapServiceImageryProvider> | undefined;
  /** Quantized-Mesh 3-D terrain from a local Cesium Terrain Server (async). */
  dockerTerrainProvider: Promise<Cesium.CesiumTerrainProvider | undefined> | undefined;
  /** OGC WMS from a local GeoServer / MapServer instance. */
  dockerWMSProvider: Cesium.WebMapServiceImageryProvider | undefined;
}

/** Memoised per-satellite orbit path descriptor built by `useOrbitPaths`. */
export interface OrbitPath {
  id: string;
  name: string;
  path: Cesium.Cartesian3[];
  cesiumColor: Cesium.Color;
  positionProperty: Cesium.CallbackProperty;
  subPositionProperty: Cesium.CallbackProperty;

  cameraWithProps: {
    conePositionProperty: Cesium.CallbackProperty;
    coneOrientationProperty: Cesium.CallbackProperty;
    coneLengthProperty: Cesium.CallbackProperty;
    beamProperty: Cesium.CallbackProperty;
    sweepRayProperty: Cesium.CallbackProperty;
    subPositionProperty: Cesium.CallbackProperty;
    radiusProperty: Cesium.CallbackProperty;
  } | null;

  sensorWithProps: {
    conePositionProperty: Cesium.CallbackProperty;
    coneOrientationProperty: Cesium.CallbackProperty;
    coneLengthProperty: Cesium.CallbackProperty;
    footprintCenterProperty: Cesium.CallbackProperty;
    beamProperty: Cesium.CallbackProperty;
    sweepRayProperty: Cesium.CallbackProperty;
    radiusProperty: Cesium.CallbackProperty;
    semiMajorProperty: Cesium.CallbackProperty;
    semiMinorProperty: Cesium.CallbackProperty;
    rotationProperty: Cesium.CallbackProperty;
  } | null;

  commWithProps: {
    linkProperty: Cesium.CallbackProperty;
    linkShowProperty: Cesium.CallbackProperty;
  } | null;
}
