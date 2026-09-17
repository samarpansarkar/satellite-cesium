"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Viewer, ImageryLayer, Entity, PolylineGraphics, BillboardGraphics, LabelGraphics, Scene, Globe, type CesiumComponentRef } from "resium";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// Configure Cesium asset base path to point to /cesium in public folder
if (typeof window !== "undefined") {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";
}

const SATELLITE_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M21,11H18V7h-2.59l-1.2-1.2a1,1,0,0,0-1.42,0L10,8.59,8.59,10a1,1,0,0,0,0,1.42L9.79,12.6,7,15.4V19H3.4l-1.1,1.1a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0L4.8,20.4H8.4V16.8l2.8-2.8,1.2,1.2a1,1,0,0,0,1.42,0l4.2-4.2a1,1,0,0,0,0-1.42L16.8,8.4H21a1,1,0,0,0,0-2Z'/%3E%3C/svg%3E";


// Sample satellite orbital data calculated purely locally (offline math)
interface SatelliteData {
  id: string;
  name: string;
  type: string;
  altitudeKm: number;
  inclinationDeg: number;
  color: Cesium.Color;
  speedMultiplier: number;
  periodSec: number;
}

const OFFLINE_SATELLITES: SatelliteData[] = [
  {
    id: "iss",
    name: "ISS (ZARYA)",
    type: "Space Station",
    altitudeKm: 420,
    inclinationDeg: 51.64,
    color: Cesium.Color.fromCssColorString("#38bdf8"), // Sky blue
    speedMultiplier: 1.0,
    periodSec: 90,
  },
  {
    id: "landsat-9",
    name: "LANDSAT 9",
    type: "Earth Observation",
    altitudeKm: 705,
    inclinationDeg: 98.2,
    color: Cesium.Color.fromCssColorString("#34d399"), // Emerald green
    speedMultiplier: 0.85,
    periodSec: 110,
  },
  {
    id: "navstar-gps",
    name: "GPS BIIF-10",
    type: "Navigation",
    altitudeKm: 20180,
    inclinationDeg: 55.0,
    color: Cesium.Color.fromCssColorString("#fbbf24"), // Amber
    speedMultiplier: 0.35,
    periodSec: 240,
  },
  {
    id: "hubble",
    name: "HST (Hubble)",
    type: "Space Telescope",
    altitudeKm: 535,
    inclinationDeg: 28.5,
    color: Cesium.Color.fromCssColorString("#c084fc"), // Purple
    speedMultiplier: 0.95,
    periodSec: 96,
  },
];

// Generate orbit trajectory points for a given altitude and inclination
function generateOrbitPath(altitudeKm: number, inclinationDeg: number, samples = 120): Cesium.Cartesian3[] {
  const points: Cesium.Cartesian3[] = [];
  const earthRadius = 6371000;
  const orbitRadius = earthRadius + altitudeKm * 1000;
  const incRad = Cesium.Math.toRadians(inclinationDeg);

  for (let i = 0; i <= samples; i++) {
    const u = (i / samples) * Cesium.Math.TWO_PI;
    const x = orbitRadius * Math.cos(u);
    const y = orbitRadius * Math.sin(u) * Math.cos(incRad);
    const z = orbitRadius * Math.sin(u) * Math.sin(incRad);
    points.push(new Cesium.Cartesian3(x, y, z));
  }
  return points;
}

// Calculate instantaneous satellite position based on elapsed time
function calculateSatPosition(sat: SatelliteData, timeSec: number): Cesium.Cartesian3 {
  const earthRadius = 6371000;
  const orbitRadius = earthRadius + sat.altitudeKm * 1000;
  const incRad = Cesium.Math.toRadians(sat.inclinationDeg);
  const angle = ((timeSec % sat.periodSec) / sat.periodSec) * Cesium.Math.TWO_PI;

  const x = orbitRadius * Math.cos(angle);
  const y = orbitRadius * Math.sin(angle) * Math.cos(incRad);
  const z = orbitRadius * Math.sin(angle) * Math.sin(incRad);
  return new Cesium.Cartesian3(x, y, z);
}

export default function CesiumViewer() {
  const viewerRef = useRef<CesiumComponentRef<Cesium.Viewer>>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedSat, setSelectedSat] = useState<SatelliteData>(OFFLINE_SATELLITES[0]);
  const [layerMode, setLayerMode] = useState<"natural" | "grid">("natural");
  const [showOrbits, setShowOrbits] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // 100% Offline: Clear Cesium Ion token to guarantee zero external requests
    Cesium.Ion.defaultAccessToken = "";
    setMounted(true);

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 0.5);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Offline imagery providers
  const naturalEarthProvider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return Cesium.TileMapServiceImageryProvider.fromUrl(
      Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")
    );
  }, []);

  const gridProvider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return new Cesium.GridImageryProvider({
      backgroundColor: Cesium.Color.fromCssColorString("#090d16"),
      color: Cesium.Color.fromCssColorString("#0284c7").withAlpha(0.6),
      cells: 8,
    });
  }, []);

  // Offline terrain provider (Ellipsoid WGS84 - 0 network requests)
  const offlineTerrainProvider = useMemo(() => {
    return new Cesium.EllipsoidTerrainProvider();
  }, []);

  // Compute satellite orbit paths
  const orbitPaths = useMemo(() => {
    return OFFLINE_SATELLITES.map((sat) => ({
      ...sat,
      path: generateOrbitPath(sat.altitudeKm, sat.inclinationDeg),
    }));
  }, []);

  if (!mounted || !naturalEarthProvider) {
    return (
      <div className="w-full h-[650px] flex flex-col items-center justify-center bg-zinc-900/70 rounded-2xl border border-zinc-800 backdrop-blur-md">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          <div className="absolute w-7 h-7 rounded-full border border-emerald-400/30 animate-ping" />
        </div>
        <p className="mt-5 text-zinc-300 text-sm font-mono tracking-wider">
          Initializing High-Quality Offline Engine...
        </p>
        <span className="mt-1.5 text-xs text-emerald-400/90 font-mono">
          HDPI &bull; MSAA 4x &bull; Atmospheric Glow
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border border-zinc-800/90 shadow-2xl bg-zinc-950 flex flex-col">
      {/* HUD Control Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-xs pointer-events-auto">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Offline Basemap
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              HDPI Optimized
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLayerMode("natural")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${layerMode === "natural"
                ? "bg-cyan-500 text-zinc-950 font-semibold shadow-md shadow-cyan-500/20"
                : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                }`}
            >
              Natural Earth II
            </button>
            <button
              onClick={() => setLayerMode("grid")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${layerMode === "grid"
                ? "bg-cyan-500 text-zinc-950 font-semibold shadow-md shadow-cyan-500/20"
                : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                }`}
            >
              Coordinate Grid
            </button>
          </div>
        </div>

        {/* Orbit Toggles & Satellites */}
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Satellites ({OFFLINE_SATELLITES.length})
            </span>
            <button
              onClick={() => setShowOrbits(!showOrbits)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
            >
              {showOrbits ? "Hide Orbits" : "Show Orbits"}
            </button>
          </div>
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
            {OFFLINE_SATELLITES.map((sat) => {
              const isSelected = selectedSat.id === sat.id;
              return (
                <button
                  key={sat.id}
                  onClick={() => setSelectedSat(sat)}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition-all ${isSelected
                    ? "bg-zinc-800 border border-zinc-600 text-zinc-100"
                    : "hover:bg-zinc-800/50 text-zinc-400"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: sat.color.toCssColorString() }}
                    />
                    <span className="font-medium">{sat.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {sat.altitudeKm} km
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Satellite Telemetry Badge */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 rounded-xl p-3.5 shadow-lg min-w-[220px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: selectedSat.color.toCssColorString() }}
          />
          <h3 className="text-xs font-bold text-zinc-100 tracking-wide">
            {selectedSat.name}
          </h3>
        </div>
        <div className="space-y-1 text-[11px] font-mono text-zinc-400">
          <div className="flex justify-between">
            <span className="text-zinc-500">Class:</span>
            <span className="text-zinc-300">{selectedSat.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Altitude:</span>
            <span className="text-cyan-400">{selectedSat.altitudeKm} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Inclination:</span>
            <span className="text-zinc-300">{selectedSat.inclinationDeg}&deg;</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Telemetry:</span>
            <span className="text-emerald-400">Offline Math Engine</span>
          </div>
        </div>
      </div>

      {/* Cesium Viewer */}
      <Viewer
        ref={viewerRef}
        full
        baseLayer={false}
        terrainProvider={offlineTerrainProvider}
        baseLayerPicker={false}
        geocoder={false}
        timeline={false}
        animation={false}
        navigationHelpButton={false}
        homeButton={true}
        sceneModePicker={true}
        infoBox={false}
        selectionIndicator={false}
        className="w-full h-full"
        // High-Quality Rendering Flags
        resolutionScale={window.devicePixelRatio || 1.0}
        msaaSamples={4}
      >
        <Scene highDynamicRange={false} />
        <Globe
          enableLighting={false}
          showGroundAtmosphere={false}
          maximumScreenSpaceError={1.5}
        />

        {/* Offline Base Layer */}
        {layerMode === "natural" && (
          <ImageryLayer
            imageryProvider={naturalEarthProvider}
            // Add a little brightness to compensate for the low-res texture
            brightness={1.1}
            contrast={1.1}
          />
        )}
        {layerMode === "grid" && gridProvider && (
          <ImageryLayer imageryProvider={gridProvider} />
        )}

        {/* Offline Orbit Paths */}
        {showOrbits &&
          orbitPaths.map((sat) => (
            <Entity
              key={`orbit-${sat.id}`}
              name={`${sat.name} Orbit`}
            >
              <PolylineGraphics
                positions={sat.path}
                width={1.5}
                material={sat.color.withAlpha(0.7)}
                arcType={Cesium.ArcType.NONE}
              />
            </Entity>
          ))}

        {/* Dynamic Satellite Positions */}
        {OFFLINE_SATELLITES.map((sat) => {
          const currentPos = calculateSatPosition(sat, elapsedTime);
          const isSelected = selectedSat.id === sat.id;

          return (
            <Entity
              key={`sat-${sat.id}`}
              name={sat.name}
              position={currentPos}
            >
              <BillboardGraphics
                image={SATELLITE_ICON}
                scale={isSelected ? 1.2 : 0.8}
              />
              <LabelGraphics
                text={sat.name}
                font="11px monospace"
                fillColor={Cesium.Color.WHITE}
                outlineColor={Cesium.Color.BLACK}
                outlineWidth={2}
                style={Cesium.LabelStyle.FILL_AND_OUTLINE}
                pixelOffset={new Cesium.Cartesian2(0, -14)}
                horizontalOrigin={Cesium.HorizontalOrigin.CENTER}
              />
            </Entity>
          );
        })}
      </Viewer>
    </div>
  );
}
