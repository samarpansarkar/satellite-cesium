"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Viewer, ImageryLayer, Entity, PolylineGraphics, BillboardGraphics, LabelGraphics, Scene, Globe, type CesiumComponentRef } from "resium";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { OFFLINE_SATELLITES, SatelliteData } from "@/lib/satellites";
import { Box, CircularProgress, Typography } from "@mui/material";

// Configure Cesium asset base path to point to /cesium in public folder
if (typeof window !== "undefined") {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";
}

const SATELLITE_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M21,11H18V7h-2.59l-1.2-1.2a1,1,0,0,0-1.42,0L10,8.59,8.59,10a1,1,0,0,0,0,1.42L9.79,12.6,7,15.4V19H3.4l-1.1,1.1a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0L4.8,20.4H8.4V16.8l2.8-2.8,1.2,1.2a1,1,0,0,0,1.42,0l4.2-4.2a1,1,0,0,0,0-1.42L16.8,8.4H21a1,1,0,0,0,0-2Z'/%3E%3C/svg%3E";

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

interface CesiumViewerProps {
  hiddenSatellites: string[];
}

export default function CesiumViewer({ hiddenSatellites }: CesiumViewerProps) {
  const viewerRef = useRef<CesiumComponentRef<Cesium.Viewer>>(null);
  const [mounted, setMounted] = useState(false);
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



  // Compute satellite orbit paths
  const orbitPaths = useMemo(() => {
    return OFFLINE_SATELLITES.map((sat) => ({
      ...sat,
      path: generateOrbitPath(sat.altitudeKm, sat.inclinationDeg),
      cesiumColor: Cesium.Color.fromCssColorString(sat.colorHex),
    }));
  }, []);

  if (!mounted || !naturalEarthProvider) {
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

  const visibleSats = orbitPaths.filter((sat) => !hiddenSatellites.includes(sat.id));

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      <div id="cesium-credit-container" style={{ display: "none" }} />
      <Viewer
        ref={viewerRef}
        full
        // @ts-expect-error - resium types are outdated, imageryProvider=false is needed to prevent default Ion/Bing network requests
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

        <ImageryLayer
          imageryProvider={naturalEarthProvider}
          brightness={1.1}
          contrast={1.1}
        />

        {/* Orbits and Satellites */}
        {visibleSats.map((sat) => {
          const currentPos = calculateSatPosition(sat, elapsedTime);
          return (
            <React.Fragment key={sat.id}>
              {/* Orbit Path */}
              <Entity name={`${sat.name} Orbit`}>
                <PolylineGraphics
                  positions={sat.path}
                  width={1.5}
                  material={sat.cesiumColor.withAlpha(0.7)}
                  arcType={Cesium.ArcType.NONE}
                />
              </Entity>

              {/* Satellite Icon & Label */}
              <Entity name={sat.name} position={currentPos}>
                <BillboardGraphics
                  image={SATELLITE_ICON}
                  scale={0.8}
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
            </React.Fragment>
          );
        })}
      </Viewer>
    </Box>
  );
}
