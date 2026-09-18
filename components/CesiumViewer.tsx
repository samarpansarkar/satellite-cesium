"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Viewer, ImageryLayer, Entity, PolylineGraphics, BillboardGraphics, LabelGraphics, Scene, Globe, EllipseGraphics, type CesiumComponentRef } from "resium";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { OFFLINE_SATELLITES, SatelliteData } from "@/lib/satellites";
import { Box, CircularProgress, Typography } from "@mui/material";

// Configure Cesium asset base path to point to /cesium in public folder and clear Ion tokens
if (typeof window !== "undefined") {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";
  Cesium.Ion.defaultAccessToken = "";
  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(20.0, -40.0, 140.0, 60.0);
}

const SATELLITE_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M21,11H18V7h-2.59l-1.2-1.2a1,1,0,0,0-1.42,0L10,8.59,8.59,10a1,1,0,0,0,0,1.42L9.79,12.6,7,15.4V19H3.4l-1.1,1.1a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0L4.8,20.4H8.4V16.8l2.8-2.8,1.2,1.2a1,1,0,0,0,1.42,0l4.2-4.2a1,1,0,0,0,0-1.42L16.8,8.4H21a1,1,0,0,0,0-2Z'/%3E%3C/svg%3E";

// Dedicated animation clock container for CesiumJS render loop
const animClock = {
  elapsedTime: 0,
  speed: 1,
};

const GROUND_STATION = Cesium.Cartesian3.fromDegrees(77.2090, 28.6139, 0); // Ground station for communications


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
  
  // Use speedMultiplier from data to vary relative speeds
  const effectiveTime = timeSec * sat.speedMultiplier;
  const angle = ((effectiveTime % sat.periodSec) / sat.periodSec) * Cesium.Math.TWO_PI;

  const x = orbitRadius * Math.cos(angle);
  const y = orbitRadius * Math.sin(angle) * Math.cos(incRad);
  const z = orbitRadius * Math.sin(angle) * Math.sin(incRad);
  return new Cesium.Cartesian3(x, y, z);
}

interface CesiumViewerProps {
  satellites?: SatelliteData[];
  hiddenSatellites: string[];
  simulationSpeed: number;
  showOrbits: boolean;
  baseMapMode: "natural" | "grid";
}

export default function CesiumViewer({
  satellites = OFFLINE_SATELLITES,
  hiddenSatellites,
  simulationSpeed,
  showOrbits,
  baseMapMode,
}: CesiumViewerProps) {
  const viewerRef = useRef<CesiumComponentRef<Cesium.Viewer>>(null);

  // Keep animation clock speed in sync with prop
  useEffect(() => {
    animClock.speed = simulationSpeed;
  }, [simulationSpeed]);

  useEffect(() => {
    let lastTime = performance.now();
    let frameId: number;

    const tick = (time: number) => {
      const deltaMs = time - lastTime;
      lastTime = time;
      // Update elapsed time based on real time delta and simulation speed
      animClock.elapsedTime += (deltaMs / 1000) * animClock.speed;
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
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

  // Compute satellite orbit paths
  const orbitPaths = useMemo(() => {
    return satellites.map((sat) => {
      let color = Cesium.Color.fromCssColorString("#38bdf8");
      try {
        if (sat.colorHex) {
          color = Cesium.Color.fromCssColorString(sat.colorHex);
        }
      } catch {
        color = Cesium.Color.fromCssColorString("#38bdf8");
      }

      return {
        ...sat,
        path: generateOrbitPath(sat.altitudeKm, sat.inclinationDeg),
        cesiumColor: color,
        // CallbackProperty queries the out-of-band animation clock directly
        positionProperty: new Cesium.CallbackProperty(() => calculateSatPosition(sat, animClock.elapsedTime), false),
        subPositionProperty: new Cesium.CallbackProperty(() => {
          const pos = calculateSatPosition(sat, animClock.elapsedTime);
          const earthRadius = 6371000;
          const mag = Cesium.Cartesian3.magnitude(pos);
          return Cesium.Cartesian3.multiplyByScalar(pos, earthRadius / mag, new Cesium.Cartesian3());
        }, false),
        cameraBeamProperty: new Cesium.CallbackProperty(() => {
          const pos = calculateSatPosition(sat, animClock.elapsedTime);
          const earthRadius = 6371000;
          const mag = Cesium.Cartesian3.magnitude(pos);
          const subPos = Cesium.Cartesian3.multiplyByScalar(pos, earthRadius / mag, new Cesium.Cartesian3());
          return [pos, subPos];
        }, false),
        commLinkProperty: new Cesium.CallbackProperty(() => {
          const pos = calculateSatPosition(sat, animClock.elapsedTime);
          return [pos, GROUND_STATION];
        }, false),
        commLinkShowProperty: new Cesium.CallbackProperty(() => {
          const pos = calculateSatPosition(sat, animClock.elapsedTime);
          const distance = Cesium.Cartesian3.distance(pos, GROUND_STATION);
          
          // Scientifically accurate line-of-sight check:
          // Maximum visible distance to horizon from satellite = sqrt((R+h)^2 - R^2)
          const R = 6371000; // Earth radius in meters
          const h = sat.altitudeKm * 1000; // Satellite altitude in meters
          const maxVisibleDist = Math.sqrt(Math.pow(R + h, 2) - Math.pow(R, 2));
          
          // Add a tiny buffer (e.g., 500km) to simulate signal refraction or atmospheric limits
          return distance <= (maxVisibleDist + 500000);
        }, false),
        sensorRadiusProperty: new Cesium.CallbackProperty(() => {
          // Animate from 0 to 1200km over 2 simulated seconds
          const cycle = (animClock.elapsedTime % 2.0) / 2.0;
          return cycle * 1200000; 
        }, false)
      };
    });
  }, [satellites]);

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

        {/* Selected Base Map Layer */}
        {baseMapMode === "natural" && (
          <ImageryLayer
            imageryProvider={naturalEarthProvider}
            brightness={1.1}
            contrast={1.1}
          />
        )}
        {baseMapMode === "grid" && (
          <ImageryLayer imageryProvider={gridProvider} />
        )}

        {/* Orbits and Satellites */}
        {visibleSats.map((sat) => {
          return (
            <React.Fragment key={sat.id}>
              {/* Orbit Path */}
              {showOrbits && (
                <Entity name={`${sat.name} Orbit`}>
                  <PolylineGraphics
                    positions={sat.path}
                    width={1.5}
                    material={sat.cesiumColor.withAlpha(0.7)}
                    arcType={Cesium.ArcType.NONE}
                  />
                </Entity>
              )}

              {/* Satellite Icon & Label */}
              <Entity name={sat.name} position={sat.positionProperty as unknown as Cesium.Cartesian3}>
                <BillboardGraphics
                  image={SATELLITE_ICON}
                  scale={0.8}
                />
                <LabelGraphics
                  text={sat.name}
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

              {/* Sensor Radar Pulse Effect */}
              {sat.sensor && (
                <Entity position={sat.positionProperty as unknown as Cesium.Cartesian3}>
                  <EllipseGraphics
                    semiMajorAxis={sat.sensorRadiusProperty as unknown as number}
                    semiMinorAxis={sat.sensorRadiusProperty as unknown as number}
                    material={new Cesium.ColorMaterialProperty(Cesium.Color.ORANGE.withAlpha(0.2))}
                    outline={true}
                    outlineColor={Cesium.Color.ORANGE.withAlpha(1.0)}
                    outlineWidth={4}
                  />
                </Entity>
              )}

              {/* Camera Scanner Cone Effect */}
              {sat.camera && (
                <>
                  <Entity position={sat.subPositionProperty as unknown as Cesium.Cartesian3}>
                    <EllipseGraphics
                      semiMajorAxis={400000}
                      semiMinorAxis={400000}
                      material={Cesium.Color.CYAN.withAlpha(0.5)}
                      outline={true}
                      outlineColor={Cesium.Color.CYAN.withAlpha(0.9)}
                      outlineWidth={3}
                    />
                  </Entity>
                  <Entity>
                    <PolylineGraphics
                      positions={sat.cameraBeamProperty as unknown as Cesium.Cartesian3[]}
                      width={4}
                      arcType={Cesium.ArcType.NONE}
                      material={new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.CYAN.withAlpha(0.8),
                        dashLength: 40.0,
                      })}
                    />
                  </Entity>
                </>
              )}

              {/* Communication Laser Link Effect */}
              {sat.communication && (
                <Entity>
                  <PolylineGraphics
                    show={sat.commLinkShowProperty as unknown as Cesium.Property}
                    positions={sat.commLinkProperty as unknown as Cesium.Cartesian3[]}
                    width={3}
                    arcType={Cesium.ArcType.NONE}
                    material={new Cesium.PolylineGlowMaterialProperty({
                      glowPower: 0.25,
                      color: Cesium.Color.MAGENTA,
                    })}
                  />
                </Entity>
              )}
            </React.Fragment>
          );
        })}
      </Viewer>
    </Box>
  );
}
