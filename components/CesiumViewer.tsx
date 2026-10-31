"use client";

/**
 * CesiumViewer.tsx
 * Thin orchestrator component.
 *
 * Responsibilities:
 *   1. Drive the out-of-band animation clock (requestAnimationFrame loop).
 *   2. Resolve imagery providers.
 *   3. Build per-satellite orbit path descriptors.
 *   4. Render the Cesium <Viewer> shell + base map layers.
 *   5. Delegate per-satellite entity rendering to <SatelliteEntities>.
 *
 * All heavy logic lives in the `cesium/` sub-folder:
 *   cesium/config.ts              – Cesium global setup & constants
 *   cesium/animClock.ts           – Animation clock singleton
 *   cesium/orbitUtils.ts          – Orbit math & per-frame position cache
 *   cesium/sensorUtils.ts         – Sensor footprint geometry
 *   cesium/useImageryProviders.ts – All imagery / terrain provider hooks
 *   cesium/useOrbitPaths.ts       – Per-satellite CallbackProperty builders
 *   cesium/SatelliteEntities.tsx  – Cesium Entity JSX for one satellite
 */

import React, { useEffect, useRef, useMemo } from "react";
import {
  Viewer,
  ImageryLayer,
  Scene,
  Globe,
  type CesiumComponentRef,
} from "resium";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import type { SatelliteData } from "@/lib/types";
import { Box, CircularProgress, Typography } from "@mui/material";

// Sub-module imports
import "@/components/cesium/config"; // side-effect: sets CESIUM_BASE_URL & Ion token
import { animClock } from "@/components/cesium/animClock";
import { useImageryProviders } from "@/components/cesium/useImageryProviders";
import { useOrbitPaths } from "@/components/cesium/useOrbitPaths";
import { SatelliteEntities } from "@/components/cesium/SatelliteEntities";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CesiumViewerProps {
  satellites?: SatelliteData[];
  hiddenSatellites: string[];
  simulationSpeed: number;
  isPlaying?: boolean;
  showOrbits: boolean;
  showGrid?: boolean;
  baseMapMode: "natural" | "grid";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CesiumViewer({
  satellites = [],
  hiddenSatellites,
  simulationSpeed,
  isPlaying = true,
  showOrbits,
  showGrid = false,
  baseMapMode,
}: CesiumViewerProps) {
  const viewerRef = useRef<CesiumComponentRef<Cesium.Viewer>>(null);

  // Attach Cesium viewer instance for camera flyTo & environment controls
  useEffect(() => {
    if (viewerRef.current?.cesiumElement) {
      (window as unknown as { cesiumViewer?: Cesium.Viewer }).cesiumViewer =
        viewerRef.current.cesiumElement;
    }
    return () => {
      delete (window as unknown as { cesiumViewer?: Cesium.Viewer }).cesiumViewer;
    };
  });

  // ── Animation clock sync ──────────────────────────────────────────────────
  useEffect(() => {
    animClock.speed = isPlaying ? simulationSpeed : 0;
  }, [simulationSpeed, isPlaying]);

  useEffect(() => {
    let lastTime = performance.now();
    let frameId: number;

    const tick = (time: number) => {
      const deltaMs = time - lastTime;
      lastTime = time;
      animClock.elapsedTime += (deltaMs / 1000) * animClock.speed;
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // ── Imagery providers ─────────────────────────────────────────────────────
  const { naturalEarthProvider, earthGridOverlayProvider, gridProvider } =
    useImageryProviders();

  // ── Orbit paths ───────────────────────────────────────────────────────────
  const orbitPaths = useOrbitPaths(satellites);

  // ── Satellite map (O(1) live-data lookup) ─────────────────────────────────
  const satMap = useMemo(() => new Map(satellites.map((s) => [s.id, s])), [satellites]);

  // ── Loading guard ─────────────────────────────────────────────────────────
  if (!naturalEarthProvider || !gridProvider) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.paper",
        }}
      >
        <CircularProgress color="primary" />
        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
          Initializing High-Quality Offline Engine...
        </Typography>
      </Box>
    );
  }

  const visibleSats = orbitPaths.filter(
    (orbit) => !hiddenSatellites.includes(orbit.id)
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      <div id="cesium-credit-container" style={{ display: "none" }} />

      <Viewer
        ref={viewerRef}
        full
        // @ts-expect-error resium types are outdated; imageryProvider=false prevents default Ion/Bing requests
        imageryProvider={false}
        creditContainer="cesium-credit-container"
        baseLayerPicker={false}
        geocoder={false}
        timeline={false}
        animation={false}
        navigationHelpButton={false}
        homeButton={true}
        sceneModePicker={true}
        infoBox={false}
        selectionIndicator={false}
      >
        <Scene highDynamicRange={false} />
        <Globe
          enableLighting={false}
          showGroundAtmosphere={false}
          maximumScreenSpaceError={1.5}
        />

        {/* ── Base Map Layer ─────────────────────────────────────────────── */}
        {baseMapMode === "natural" && (
          <React.Fragment>
            <ImageryLayer
              imageryProvider={naturalEarthProvider}
              brightness={1.1}
              contrast={1.1}
            />
            {showGrid && earthGridOverlayProvider && (
              <ImageryLayer
                imageryProvider={earthGridOverlayProvider}
                alpha={0.75}
              />
            )}
          </React.Fragment>
        )}
        {baseMapMode === "grid" && (
          <ImageryLayer imageryProvider={gridProvider} />
        )}

        {/* ── Satellite Entities ─────────────────────────────────────────── */}
        {visibleSats.map((orbit) => {
          const liveSat = satMap.get(orbit.id);
          if (!liveSat) return null;

          return (
            <SatelliteEntities
              key={orbit.id}
              orbit={orbit}
              liveSat={liveSat}
              showOrbits={showOrbits}
            />
          );
        })}
      </Viewer>
    </Box>
  );
}
