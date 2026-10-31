"use client";

/**
 * components/ControlMenu.tsx
 *
 * Floating Control Menu inspired by mission-control satellite tracking dashboards.
 * Features:
 *   - Expandable / Collapsible sleek glassmorphic vertical panel with `^ Menu` header.
 *   - 9 interactive menu items matching the design:
 *       1. Bookmarks   – Camera viewpoints & saved fly-to targets
 *       2. Satellites  – Quick satellite selection & sidebar toggle
 *       3. Components  – Attachments control (Camera Torch Light, Sensor Scanner Cone, Comm Link)
 *       4. Map         – Base map switcher (Natural Earth, Grid, Lat/Lon overlay)
 *       5. Locations   – Ground stations & launch facilities fly-to
 *       6. Globe       – Earth rendering (Grid, Sun lighting, Atmosphere)
 *       7. Sky         – Celestial environment (Stars, Sun, Sky atmosphere)
 *       8. Graphics    – Simulation speed, Orbits visibility, visual effects
 *       9. About       – System specifications & mission telemetry info
 */

import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Switch,
  Slider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import * as Cesium from "cesium";
import type { SatelliteData } from "@/lib/types";

// ─── Custom Icons Matching Design ─────────────────────────────────────────────

function SatellitesOrbitIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" fill="currentColor" fillOpacity="0.3" />
      <path d="M12 3a9 9 0 0 0-8.5 6" />
      <path d="M12 21a9 9 0 0 0 8.5-6" />
      <circle cx="18.5" cy="6" r="2.2" fill="currentColor" />
      <circle cx="5.5" cy="18" r="2.2" fill="currentColor" />
    </svg>
  );
}

function SatelliteComponentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Central satellite cube */}
      <rect x="9.2" y="9.2" width="5.6" height="5.6" rx="1" transform="rotate(45 12 12)" fill="currentColor" fillOpacity="0.25" />
      {/* Left solar panel array */}
      <path d="M6 8L3 11l4 4 3-3" />
      {/* Right solar panel array */}
      <path d="M14 12l3-3 4 4-3 3" />
      {/* Horizon sensor arc beneath */}
      <path d="M4 20a16 16 0 0 1 16 0" strokeDasharray="2 2" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

function TelescopeSkyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Telescope barrel pointing upward-right */}
      <path d="M16 4l4 3-9 9-4-3 9-9z" fill="currentColor" fillOpacity="0.2" />
      {/* Lens hood */}
      <path d="M18.5 2.5l3.5 2.5" />
      {/* Tripod mount ring */}
      <circle cx="12" cy="13.5" r="1.5" fill="currentColor" />
      {/* Tripod legs */}
      <path d="M12 15L7.5 21.5" />
      <path d="M12 15v6.5" />
      <path d="M12 15l4.5 6.5" />
    </svg>
  );
}

// ─── Types & Props ────────────────────────────────────────────────────────────

type ActiveSubMenu =
  | "bookmarks"
  | "satellites"
  | "components"
  | "map"
  | "locations"
  | "globe"
  | "sky"
  | "graphics"
  | "about"
  | null;

interface ControlMenuProps {
  onToggleSidebar?: () => void;
  satellites?: SatelliteData[];
  selectedSat?: SatelliteData | null;
  onUpdateSatellite?: (id: string, updated: Partial<SatelliteData>) => void;
  // Map Layer Controls
  baseMapMode: "natural" | "grid";
  onBaseMapChange: (mode: "natural" | "grid") => void;
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  // Graphics & Simulation Controls
  showOrbits: boolean;
  onShowOrbitsChange: (show: boolean) => void;
  simulationSpeed: number;
  onSimulationSpeedChange: (speed: number) => void;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
}

// Preset Ground Locations
const LOCATIONS = [
  { name: "Svalbard Satellite Station", country: "Norway", lat: 78.23, lon: 15.41, height: 1_200_000 },
  { name: "Kennedy Space Center", country: "USA", lat: 28.57, lon: -80.65, height: 1_500_000 },
  { name: "Guiana Space Centre", country: "French Guiana", lat: 5.24, lon: -52.78, height: 1_400_000 },
  { name: "Tokyo Ground Station", country: "Japan", lat: 35.68, lon: 139.77, height: 1_800_000 },
  { name: "London Telemetry Facility", country: "UK", lat: 51.51, lon: -0.13, height: 1_800_000 },
  { name: "Canberra Deep Space Center", country: "Australia", lat: -35.40, lon: 148.98, height: 1_500_000 },
];

// Preset Camera Bookmarks
const BOOKMARKS = [
  { id: "global", label: "Global Earth", desc: "Whole-disk orbital overview", lat: 0, lon: 0, height: 26_000_000 },
  { id: "equator", label: "Equatorial Orbit", desc: "Geostationary perspective", lat: 0, lon: 30, height: 18_000_000 },
  { id: "north-pole", label: "North Polar View", desc: "Arctic orbital convergence", lat: 90, lon: 0, height: 20_000_000 },
  { id: "south-pole", label: "South Polar View", desc: "Antarctic passage", lat: -90, lon: 0, height: 20_000_000 },
  { id: "americas", label: "Americas Region", desc: "Western Hemisphere coverage", lat: 15, lon: -85, height: 16_000_000 },
  { id: "eurasia", label: "Eurasia & Africa", desc: "Eastern Hemisphere coverage", lat: 25, lon: 45, height: 16_000_000 },
];

export default function ControlMenu({
  onToggleSidebar,
  satellites = [],
  selectedSat,
  onUpdateSatellite,
  baseMapMode,
  onBaseMapChange,
  showGrid,
  onShowGridChange,
  showOrbits,
  onShowOrbitsChange,
  simulationSpeed,
  onSimulationSpeedChange,
  isPlaying,
  onTogglePlayPause,
}: ControlMenuProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeSubMenu, setActiveSubMenu] = useState<ActiveSubMenu>(null);

  // Globe & Sky environment visual states
  const [enableLighting, setEnableLighting] = useState<boolean>(false);
  const [showAtmosphere, setShowAtmosphere] = useState<boolean>(true);
  const [showStars, setShowStars] = useState<boolean>(true);
  const [showSunMoon, setShowSunMoon] = useState<boolean>(true);

  // Helper to fly camera using Cesium viewer
  const flyTo = (lon: number, lat: number, height: number = 20_000_000) => {
    try {
      const viewer = (window as unknown as { cesiumViewer?: Cesium.Viewer }).cesiumViewer;
      if (viewer && viewer.camera) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
          duration: 2.2,
          maximumHeight: 30_000_000,
        });
      }
    } catch (e) {
      console.warn("Cesium camera flyTo unavailable:", e);
    }
  };

  const toggleGlobeLighting = (val: boolean) => {
    setEnableLighting(val);
    try {
      const viewer = (window as unknown as { cesiumViewer?: Cesium.Viewer }).cesiumViewer;
      if (viewer?.scene?.globe) {
        viewer.scene.globe.enableLighting = val;
      }
    } catch { /* ignore */ }
  };

  const toggleAtmosphere = (val: boolean) => {
    setShowAtmosphere(val);
    try {
      const viewer = (window as unknown as { cesiumViewer?: Cesium.Viewer }).cesiumViewer;
      if (viewer?.scene) {
        if (viewer.scene.globe) viewer.scene.globe.showGroundAtmosphere = val;
        if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = val;
      }
    } catch { /* ignore */ }
  };

  const toggleSkyStars = (val: boolean) => {
    setShowStars(val);
    try {
      const viewer = (window as unknown as { cesiumViewer?: Cesium.Viewer }).cesiumViewer;
      if (viewer?.scene?.skyBox) {
        viewer.scene.skyBox.show = val;
      }
    } catch { /* ignore */ }
  };

  const toggleSunMoon = (val: boolean) => {
    setShowSunMoon(val);
    try {
      const viewer = (window as unknown as { cesiumViewer?: Cesium.Viewer }).cesiumViewer;
      if (viewer?.scene) {
        if (viewer.scene.sun) viewer.scene.sun.show = val;
        if (viewer.scene.moon) viewer.scene.moon.show = val;
      }
    } catch { /* ignore */ }
  };

  const handleMenuItemClick = (id: ActiveSubMenu) => {
    if (id === "satellites") {
      onToggleSidebar?.();
      setActiveSubMenu(null);
      return;
    }
    setActiveSubMenu((prev) => (prev === id ? null : id));
  };

  return (
    <React.Fragment>
      {/* ── Floating Main Menu Panel ────────────────────────────────────────── */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1050,
          width: 196,
          borderRadius: "14px",
          bgcolor: "rgba(18, 19, 24, 0.88)",
          backdropFilter: "blur(18px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.2)",
          userSelect: "none",
          overflow: "hidden",
          transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* ── Top Header Button (^ Menu) ─────────────────────────────────────── */}
        <Box
          onClick={() => setIsExpanded((prev) => !prev)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            px: 1.75,
            py: 1.1,
            cursor: "pointer",
            bgcolor: isExpanded ? "rgba(255, 255, 255, 0.08)" : "transparent",
            borderBottom: isExpanded ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
            transition: "background 0.15s ease",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.14)",
            },
          }}
        >
          {isExpanded ? (
            <KeyboardArrowUpIcon sx={{ fontSize: 22, color: "#cbd5e1" }} />
          ) : (
            <KeyboardArrowDownIcon sx={{ fontSize: 22, color: "#cbd5e1" }} />
          )}
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "0.95rem",
              color: "#e2e8f0",
              letterSpacing: "-0.01em",
            }}
          >
            Menu
          </Typography>
        </Box>

        {/* ── Menu List Items (Shown when expanded) ─────────────────────────── */}
        {isExpanded && (
          <Box sx={{ py: 0.5, display: "flex", flexDirection: "column" }}>
            {/* 1. Bookmarks */}
            <MenuItemRow
              icon={<BookmarkBorderIcon sx={{ fontSize: 20 }} />}
              label="Bookmarks"
              isActive={activeSubMenu === "bookmarks"}
              onClick={() => handleMenuItemClick("bookmarks")}
            />

            {/* 2. Satellites */}
            <MenuItemRow
              icon={<SatellitesOrbitIcon />}
              label="Satellites"
              badge={satellites.length > 0 ? String(satellites.length) : undefined}
              isActive={activeSubMenu === "satellites"}
              onClick={() => handleMenuItemClick("satellites")}
            />

            {/* 3. Components */}
            <MenuItemRow
              icon={<SatelliteComponentIcon />}
              label="Components"
              isActive={activeSubMenu === "components"}
              onClick={() => handleMenuItemClick("components")}
            />

            {/* 4. Map */}
            <MenuItemRow
              icon={<LayersOutlinedIcon sx={{ fontSize: 20 }} />}
              label="Map"
              isActive={activeSubMenu === "map"}
              onClick={() => handleMenuItemClick("map")}
            />

            {/* 5. Locations */}
            <MenuItemRow
              icon={<LocationOnOutlinedIcon sx={{ fontSize: 20 }} />}
              label="Locations"
              isActive={activeSubMenu === "locations"}
              onClick={() => handleMenuItemClick("locations")}
            />

            {/* 6. Globe */}
            <MenuItemRow
              icon={<PublicOutlinedIcon sx={{ fontSize: 20 }} />}
              label="Globe"
              isActive={activeSubMenu === "globe"}
              onClick={() => handleMenuItemClick("globe")}
            />

            {/* 7. Sky */}
            <MenuItemRow
              icon={<TelescopeSkyIcon />}
              label="Sky"
              isActive={activeSubMenu === "sky"}
              onClick={() => handleMenuItemClick("sky")}
            />

            {/* 8. Graphics */}
            <MenuItemRow
              icon={<SpeedOutlinedIcon sx={{ fontSize: 20 }} />}
              label="Graphics"
              isActive={activeSubMenu === "graphics"}
              onClick={() => handleMenuItemClick("graphics")}
            />

            {/* 9. About */}
            <MenuItemRow
              icon={<InfoOutlinedIcon sx={{ fontSize: 20 }} />}
              label="About"
              isActive={activeSubMenu === "about"}
              onClick={() => handleMenuItemClick("about")}
            />
          </Box>
        )}
      </Box>

      {/* ── Contextual Floating Flyout Panel (Positioned next to Menu) ──────── */}
      {isExpanded && activeSubMenu && activeSubMenu !== "satellites" && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: 224,
            zIndex: 1060,
            width: 320,
            maxHeight: "calc(100vh - 120px)",
            bgcolor: "rgba(18, 19, 24, 0.94)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "14px",
            boxShadow: "0 16px 44px rgba(0, 0, 0, 0.75)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "menuFlyout 0.16s ease-out",
            "@keyframes menuFlyout": {
              from: { opacity: 0, transform: "translateX(-8px)" },
              to: { opacity: 1, transform: "translateX(0)" },
            },
          }}
        >
          {/* Flyout Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.25,
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              bgcolor: "rgba(255, 255, 255, 0.04)",
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: "0.88rem", color: "#f8fafc", textTransform: "capitalize" }}>
              {activeSubMenu} Control
            </Typography>
            <IconButton size="small" onClick={() => setActiveSubMenu(null)} sx={{ color: "#94a3b8" }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Flyout Body */}
          <Box sx={{ p: 2, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1.5 }}>
            {/* ── 1. Bookmarks ────────────────────────────────────────────── */}
            {activeSubMenu === "bookmarks" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Select a vantage point to fly the orbital camera:
                </Typography>
                {BOOKMARKS.map((bm) => (
                  <Box
                    key={bm.id}
                    onClick={() => flyTo(bm.lon, bm.lat, bm.height)}
                    sx={{
                      p: 1.2,
                      borderRadius: "8px",
                      bgcolor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: "rgba(56, 189, 248, 0.12)",
                        borderColor: "rgba(56, 189, 248, 0.4)",
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#f1f5f9" }}>
                      {bm.label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                      {bm.desc}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* ── 3. Components ───────────────────────────────────────────── */}
            {activeSubMenu === "components" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Active Satellite Attachments & Visual Effects:
                </Typography>

                {selectedSat ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip label={selectedSat.name} size="small" color="primary" sx={{ height: 22, fontSize: "0.7rem" }} />
                      <Typography sx={{ fontSize: "0.74rem", color: "#94a3b8" }}>{selectedSat.type}</Typography>
                    </Box>

                    {selectedSat.camera && (
                      <ControlToggleRow
                        label="Camera (Torch Light)"
                        description="Volumetric light cone with lens flare"
                        checked={Boolean(selectedSat.camera.isActive)}
                        onChange={(v) =>
                          onUpdateSatellite?.(selectedSat.id, {
                            camera: { ...selectedSat.camera!, isActive: v },
                          })
                        }
                        color="#38bdf8"
                      />
                    )}

                    {selectedSat.sensor && (
                      <ControlToggleRow
                        label="Sensor (Scanner Cone)"
                        description="Rotating radar sweep with telemetry rings"
                        checked={Boolean(selectedSat.sensor.isActive)}
                        onChange={(v) =>
                          onUpdateSatellite?.(selectedSat.id, {
                            sensor: { ...selectedSat.sensor!, isActive: v },
                          })
                        }
                        color="#f97316"
                      />
                    )}

                    {selectedSat.communication && (
                      <ControlToggleRow
                        label="Laser Communication"
                        description="Targeted ground link beam"
                        checked={Boolean(selectedSat.communication.isActive)}
                        onChange={(v) =>
                          onUpdateSatellite?.(selectedSat.id, {
                            communication: { ...selectedSat.communication!, isActive: v },
                          })
                        }
                        color="#ec4899"
                      />
                    )}
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: "0.78rem", color: "#cbd5e1", fontStyle: "italic" }}>
                    Select a satellite on the map or from the Satellites menu to adjust its specific attachments.
                  </Typography>
                )}

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", my: 0.5 }} />

                <Typography variant="caption" sx={{ color: "#94a3b8" }}>Global Overlays:</Typography>
                <ControlToggleRow
                  label="Orbit Trajectories"
                  description="3D orbital rings in space"
                  checked={showOrbits}
                  onChange={onShowOrbitsChange}
                  color="#38bdf8"
                />
              </Box>
            )}

            {/* ── 4. Map ─────────────────────────────────────────────────── */}
            {activeSubMenu === "map" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Base Map Imagery Mode:
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  <Box
                    onClick={() => onBaseMapChange("natural")}
                    sx={{
                      p: 1.5,
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "center",
                      bgcolor: baseMapMode === "natural" ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${baseMapMode === "natural" ? "#38bdf8" : "rgba(255, 255, 255, 0.08)"}`,
                      "&:hover": { bgcolor: "rgba(56, 189, 248, 0.1)" },
                    }}
                  >
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: baseMapMode === "natural" ? "#38bdf8" : "#f1f5f9" }}>
                      Earth
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>Photorealistic</Typography>
                  </Box>

                  <Box
                    onClick={() => onBaseMapChange("grid")}
                    sx={{
                      p: 1.5,
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "center",
                      bgcolor: baseMapMode === "grid" ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${baseMapMode === "grid" ? "#38bdf8" : "rgba(255, 255, 255, 0.08)"}`,
                      "&:hover": { bgcolor: "rgba(56, 189, 248, 0.1)" },
                    }}
                  >
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: baseMapMode === "grid" ? "#38bdf8" : "#f1f5f9" }}>
                      Grid
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>Dark tactical</Typography>
                  </Box>
                </Box>

                <ControlToggleRow
                  label="Lat/Lon Coordinate Grid"
                  description="Overlay degree lines across Earth"
                  checked={showGrid}
                  onChange={onShowGridChange}
                  color="#38bdf8"
                />
              </Box>
            )}

            {/* ── 5. Locations ───────────────────────────────────────────── */}
            {activeSubMenu === "locations" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Fly to strategic ground tracking stations:
                </Typography>
                {LOCATIONS.map((loc) => (
                  <Box
                    key={loc.name}
                    onClick={() => flyTo(loc.lon, loc.lat, loc.height)}
                    sx={{
                      p: 1.2,
                      borderRadius: "8px",
                      bgcolor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: "rgba(56, 189, 248, 0.12)",
                        borderColor: "rgba(56, 189, 248, 0.4)",
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#f1f5f9" }}>
                      {loc.name}
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                      {loc.country} ({loc.lat > 0 ? `${loc.lat}°N` : `${Math.abs(loc.lat)}°S`}, {loc.lon > 0 ? `${loc.lon}°E` : `${Math.abs(loc.lon)}°W`})
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* ── 6. Globe ───────────────────────────────────────────────── */}
            {activeSubMenu === "globe" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Earth Sphere & Lighting Parameters:
                </Typography>

                <ControlToggleRow
                  label="Sunlight Shading"
                  description="Realistic day/night illumination"
                  checked={enableLighting}
                  onChange={toggleGlobeLighting}
                  color="#f59e0b"
                />

                <ControlToggleRow
                  label="Atmospheric Glow"
                  description="Rayleigh scattering Earth halo"
                  checked={showAtmosphere}
                  onChange={toggleAtmosphere}
                  color="#38bdf8"
                />

                <ControlToggleRow
                  label="Coordinate Grid Overlay"
                  description="Latitude and longitude meridians"
                  checked={showGrid}
                  onChange={onShowGridChange}
                  color="#38bdf8"
                />

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => flyTo(0, 0, 25_000_000)}
                  sx={{ mt: 1, borderColor: "rgba(255, 255, 255, 0.2)", color: "#e2e8f0" }}
                >
                  Reset Globe View
                </Button>
              </Box>
            )}

            {/* ── 7. Sky ─────────────────────────────────────────────────── */}
            {activeSubMenu === "sky" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Celestial Space Environment:
                </Typography>

                <ControlToggleRow
                  label="Deep Space Starfield"
                  description="Astronomical star background"
                  checked={showStars}
                  onChange={toggleSkyStars}
                  color="#38bdf8"
                />

                <ControlToggleRow
                  label="Sun & Moon Rendering"
                  description="Visible solar and lunar bodies"
                  checked={showSunMoon}
                  onChange={toggleSunMoon}
                  color="#f59e0b"
                />

                <ControlToggleRow
                  label="Atmospheric Scattering"
                  description="Horizon optical gradient"
                  checked={showAtmosphere}
                  onChange={toggleAtmosphere}
                  color="#38bdf8"
                />
              </Box>
            )}

            {/* ── 8. Graphics ────────────────────────────────────────────── */}
            {activeSubMenu === "graphics" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                  Simulation Engine Controls:
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#f1f5f9" }}>
                    Simulation Engine
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    onClick={onTogglePlayPause}
                    sx={{
                      borderColor: isPlaying ? "rgba(56, 189, 248, 0.5)" : "rgba(255, 255, 255, 0.2)",
                      color: isPlaying ? "#38bdf8" : "#94a3b8",
                      fontSize: "0.74rem",
                    }}
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                </Box>

                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8" }}>Speed Multiplier</Typography>
                    <Typography sx={{ fontSize: "0.78rem", color: "#38bdf8", fontWeight: 600 }}>{simulationSpeed}×</Typography>
                  </Box>
                  <Slider
                    size="small"
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={simulationSpeed}
                    onChange={(_, v) => onSimulationSpeedChange(v as number)}
                    sx={{ color: "#38bdf8" }}
                  />
                </Box>

                <ControlToggleRow
                  label="Render Orbital Trajectories"
                  description="Full Keplerian orbit path geometry"
                  checked={showOrbits}
                  onChange={onShowOrbitsChange}
                  color="#38bdf8"
                />
              </Box>
            )}

            {/* ── 9. About ───────────────────────────────────────────────── */}
            {activeSubMenu === "about" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#38bdf8" }}>
                  Orbit Tracker 3D
                </Typography>
                <Typography sx={{ fontSize: "0.76rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                  High-fidelity orbital tracking and telemetry visualization system powered by CesiumJS, Resium, and Next.js.
                </Typography>
                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />
                <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  • <b>Propagation</b>: Real-time SGP4 Keplerian elements<br />
                  • <b>Attachments</b>: Volumetric Torch Light & Scanner Cone<br />
                  • <b>Coverage</b>: Swath corridor & Ground Track projection<br />
                  • <b>Coordinates</b>: WGS84 ECEF / True Equator Mean Equinox
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </React.Fragment>
  );
}

// ─── Reusable Menu Item Row ───────────────────────────────────────────────────

function MenuItemRow({
  icon,
  label,
  badge,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 1.75,
        py: 0.95,
        cursor: "pointer",
        color: isActive ? "#38bdf8" : "#f1f5f9",
        bgcolor: isActive ? "rgba(56, 189, 248, 0.15)" : "transparent",
        transition: "all 0.15s ease",
        "&:hover": {
          bgcolor: isActive ? "rgba(56, 189, 248, 0.22)" : "rgba(255, 255, 255, 0.08)",
          color: isActive ? "#38bdf8" : "#ffffff",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22 }}>
          {icon}
        </Box>
        <Typography sx={{ fontSize: "0.88rem", fontWeight: 500, letterSpacing: "-0.01em" }}>
          {label}
        </Typography>
      </Box>

      {badge && (
        <Chip
          label={badge}
          size="small"
          sx={{
            height: 18,
            fontSize: "0.68rem",
            fontWeight: 700,
            bgcolor: "rgba(56, 189, 248, 0.2)",
            color: "#38bdf8",
            border: "1px solid rgba(56, 189, 248, 0.4)",
          }}
        />
      )}
    </Box>
  );
}

// ─── Sub-panel Toggle Row ─────────────────────────────────────────────────────

function ControlToggleRow({
  label,
  description,
  checked,
  onChange,
  color = "#38bdf8",
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.25 }}>
      <Box sx={{ pr: 1 }}>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#f1f5f9" }}>{label}</Typography>
        {description && (
          <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>{description}</Typography>
        )}
      </Box>
      <Switch
        size="small"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        sx={{
          "& .MuiSwitch-switchBase.Mui-checked": { color },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: color },
        }}
      />
    </Box>
  );
}

