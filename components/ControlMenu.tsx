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

import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  Switch,
  Slider,
  Button,
  Chip,
  Divider,
  Checkbox,
  Collapse,
  InputBase,
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
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import InfoIcon from "@mui/icons-material/Info";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckIcon from "@mui/icons-material/Check";
import * as Cesium from "cesium";
import type { SatelliteData } from "@/lib/types";
import { formatTimeWithZone } from "./TimeControlBar";

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

export type ActiveSubMenu =
  | "bookmarks"
  | "satellites"
  | "components"
  | "map"
  | "locations"
  | "globe"
  | "sky"
  | "graphics"
  | "timeline"
  | "about"
  | null;

export interface ControlMenuProps {
  initialSubMenu?: ActiveSubMenu;
  defaultExpandedSats?: Record<string, boolean>;
  // Timeline & Timezone Settings
  timeZone?: string;
  onTimeZoneChange?: (tz: string) => void;
  timeFormat24h?: boolean;
  onTimeFormat24hChange?: (is24h: boolean) => void;
  // Satellites Panel Management
  availableNames?: string[];
  selectedNames?: string[];
  onToggleName?: (name: string) => void;
  onOpenInfo?: (sat: SatelliteData) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
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

// Preset Global Timezones
export const POPULAR_TIMEZONES = [
  { id: "UTC", label: "UTC", city: "Universal", offset: "UTC+00:00", desc: "Coordinated Universal Time (Default)" },
  { id: "Asia/Kolkata", label: "IST", city: "India / New Delhi", offset: "UTC+05:30", desc: "Indian Standard Time" },
  { id: "America/New_York", label: "EST / EDT", city: "New York / Eastern", offset: "UTC-05:00", desc: "Eastern Time (US & Canada)" },
  { id: "America/Chicago", label: "CST / CDT", city: "Chicago / Central", offset: "UTC-06:00", desc: "Central Time" },
  { id: "America/Denver", label: "MST / MDT", city: "Denver / Mountain", offset: "UTC-07:00", desc: "Mountain Time" },
  { id: "America/Los_Angeles", label: "PST / PDT", city: "Los Angeles / Pacific", offset: "UTC-08:00", desc: "Pacific Time" },
  { id: "Europe/London", label: "GMT / BST", city: "London / UK", offset: "UTC+00:00", desc: "Greenwich Mean Time" },
  { id: "Europe/Paris", label: "CET / CEST", city: "Paris / Berlin / Rome", offset: "UTC+01:00", desc: "Central European Time" },
  { id: "Asia/Dubai", label: "GST", city: "Dubai / Gulf", offset: "UTC+04:00", desc: "Gulf Standard Time" },
  { id: "Asia/Singapore", label: "SGT", city: "Singapore", offset: "UTC+08:00", desc: "Singapore Standard Time" },
  { id: "Asia/Tokyo", label: "JST", city: "Tokyo / Japan", offset: "UTC+09:00", desc: "Japan Standard Time" },
  { id: "Australia/Sydney", label: "AEST / AEDT", city: "Sydney / Melbourne", offset: "UTC+10:00", desc: "Australian Eastern Time" },
  { id: "Pacific/Auckland", label: "NZST / NZDT", city: "Auckland / New Zealand", offset: "UTC+12:00", desc: "New Zealand Time" },
  { id: "Pacific/Honolulu", label: "HST", city: "Honolulu / Hawaii", offset: "UTC-10:00", desc: "Hawaii Standard Time" },
];

export default function ControlMenu({
  availableNames = [],
  selectedNames = [],
  onToggleName,
  onOpenInfo,
  onSelectAll,
  onClearAll,
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
  initialSubMenu = null,
  defaultExpandedSats = {},
  timeZone = "UTC",
  onTimeZoneChange,
  timeFormat24h = true,
  onTimeFormat24hChange,
}: ControlMenuProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeSubMenu, setActiveSubMenu] = useState<ActiveSubMenu>(initialSubMenu);
  const [satelliteSearch, setSatelliteSearch] = useState<string>("");
  const [expandedSats, setExpandedSats] = useState<Record<string, boolean>>(defaultExpandedSats);
  const [timezoneSearch, setTimezoneSearch] = useState<string>("");

  const allSupportedTimezones = useMemo(() => {
    if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone");
    }
    return POPULAR_TIMEZONES.map((t) => t.id);
  }, []);

  const filteredTimezones = useMemo(() => {
    if (!timezoneSearch.trim()) return [];
    const q = timezoneSearch.toLowerCase().trim();
    return allSupportedTimezones.filter((tz) => tz.toLowerCase().includes(q));
  }, [allSupportedTimezones, timezoneSearch]);

  const toggleSatExpand = (id: string) => {
    setExpandedSats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredNames = useMemo(() => {
    if (!satelliteSearch.trim()) return availableNames;
    const q = satelliteSearch.toLowerCase();
    return availableNames.filter((n) => n.toLowerCase().includes(q));
  }, [availableNames, satelliteSearch]);

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

            {/* 9. Timeline Settings */}
            <MenuItemRow
              icon={<AccessTimeOutlinedIcon sx={{ fontSize: 20 }} />}
              label="Timeline"
              badge={timeZone === "UTC" ? "UTC" : timeZone === "Asia/Kolkata" ? "IST" : "Custom"}
              isActive={activeSubMenu === "timeline"}
              onClick={() => handleMenuItemClick("timeline")}
            />

            {/* 10. About */}
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
      {isExpanded && activeSubMenu && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: 224,
            zIndex: 1060,
            width: activeSubMenu === "satellites" ? 360 : activeSubMenu === "timeline" ? 370 : 320,
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

            {/* ── 2. Satellites Management Attached Panel ────────────────── */}
            {activeSubMenu === "satellites" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {/* Search / Filter Input */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "8px",
                    px: 1.25,
                    py: 0.5,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <SearchIcon sx={{ fontSize: 18, color: "#94a3b8", mr: 1 }} />
                  <InputBase
                    placeholder="Search satellites..."
                    value={satelliteSearch}
                    onChange={(e) => setSatelliteSearch(e.target.value)}
                    sx={{ fontSize: "0.82rem", color: "#f8fafc", width: "100%" }}
                  />
                  {satelliteSearch && (
                    <IconButton size="small" onClick={() => setSatelliteSearch("")} sx={{ p: 0.25, color: "#94a3b8" }}>
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  )}
                </Box>

                {/* Batch Actions & Summary */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    {selectedNames.length} / {availableNames.length} Tracked
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.75 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={onSelectAll}
                      sx={{
                        fontSize: "0.7rem",
                        py: 0.25,
                        px: 1,
                        minWidth: 0,
                        borderColor: "rgba(56, 189, 248, 0.4)",
                        color: "#38bdf8",
                        "&:hover": { bgcolor: "rgba(56, 189, 248, 0.1)" },
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={onClearAll}
                      sx={{
                        fontSize: "0.7rem",
                        py: 0.25,
                        px: 1,
                        minWidth: 0,
                        borderColor: "rgba(245, 158, 11, 0.4)",
                        color: "#f59e0b",
                        "&:hover": { bgcolor: "rgba(245, 158, 11, 0.1)" },
                      }}
                    >
                      Clear All
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", my: 0.25 }} />

                {/* Satellite Items List */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, maxHeight: "calc(100vh - 280px)", overflowY: "auto", pr: 0.5 }}>
                  {filteredNames.length === 0 ? (
                    <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", textAlign: "center", py: 2, fontStyle: "italic" }}>
                      No satellites match &quot;{satelliteSearch}&quot;
                    </Typography>
                  ) : (
                    filteredNames.map((name) => {
                      const isSelected = selectedNames.includes(name);
                      const satData = satellites.find((s) => s.name === name || s.name === name.toUpperCase());
                      const hasAttachments = Boolean(satData);
                      const isSatExpanded = satData ? Boolean(expandedSats[satData.id]) : false;

                      return (
                        <Box
                          key={name}
                          sx={{
                            borderRadius: "8px",
                            bgcolor: isSelected ? "rgba(56, 189, 248, 0.06)" : "rgba(255, 255, 255, 0.02)",
                            border: `1px solid ${isSelected ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.05)"}`,
                            overflow: "hidden",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 0.75 }}>
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              onChange={() => onToggleName?.(name)}
                              sx={{
                                p: 0.5,
                                mr: 0.75,
                                color: "rgba(255, 255, 255, 0.3)",
                                "&.Mui-checked": { color: "#38bdf8" },
                              }}
                            />

                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: satData ? "#38bdf8" : "#64748b",
                                mr: 1.25,
                                boxShadow: satData ? "0 0 6px #38bdf8" : "none",
                              }}
                            />

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {name}
                              </Typography>
                              <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                                {satData ? satData.type : "Not Loaded"}
                              </Typography>
                            </Box>

                            {satData && (
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <IconButton
                                  size="small"
                                  onClick={() => onOpenInfo?.(satData)}
                                  sx={{ color: "#94a3b8", p: 0.5, "&:hover": { color: "#38bdf8" } }}
                                  title="View Telemetry & Info"
                                >
                                  <InfoIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                {hasAttachments && (
                                  <IconButton
                                    size="small"
                                    onClick={() => toggleSatExpand(satData.id)}
                                    sx={{ color: "#94a3b8", p: 0.5, "&:hover": { color: "#f8fafc" } }}
                                    title="Expand Tracks & Attachments"
                                  >
                                    {isSatExpanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                                  </IconButton>
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* Expanded Tracks & Attachments Controls */}
                          {hasAttachments && (
                            <Collapse in={isSatExpanded} timeout="auto" unmountOnExit>
                              <Box
                                sx={{
                                  pl: 4,
                                  pr: 1.5,
                                  py: 1,
                                  bgcolor: "rgba(0, 0, 0, 0.25)",
                                  borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.75,
                                }}
                              >
                                {/* Tracks Header */}
                                <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase" }}>
                                  Tracks
                                </Typography>

                                <ControlToggleRow
                                  label="Ground Track"
                                  checked={Boolean(satData!.showGroundTrack)}
                                  onChange={(v) => onUpdateSatellite?.(satData!.id, { showGroundTrack: v })}
                                  color="#f59e0b"
                                />

                                <ControlToggleRow
                                  label="Swath Track"
                                  checked={Boolean(satData!.showSwath)}
                                  onChange={(v) => onUpdateSatellite?.(satData!.id, { showSwath: v })}
                                  color="#06b6d4"
                                />

                                <ControlToggleRow
                                  label="Orbit Path"
                                  checked={Boolean(satData!.showOrbit)}
                                  onChange={(v) => onUpdateSatellite?.(satData!.id, { showOrbit: v })}
                                  color="#38bdf8"
                                />

                                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.05)", my: 0.25 }} />

                                {/* Attachments Header */}
                                <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#94a3b8", letterSpacing: 0.6, textTransform: "uppercase" }}>
                                  Attachments
                                </Typography>

                                {satData!.camera && (
                                  <ControlToggleRow
                                    label="Camera (Torch Light)"
                                    checked={Boolean(satData!.camera.isActive)}
                                    onChange={(v) =>
                                      onUpdateSatellite?.(satData!.id, {
                                        camera: { ...satData!.camera!, isActive: v },
                                      })
                                    }
                                    color="#38bdf8"
                                  />
                                )}

                                {satData!.sensor && (
                                  <ControlToggleRow
                                    label="Sensor (Scanner Cone)"
                                    checked={Boolean(satData!.sensor.isActive)}
                                    onChange={(v) =>
                                      onUpdateSatellite?.(satData!.id, {
                                        sensor: { ...satData!.sensor!, isActive: v },
                                      })
                                    }
                                    color="#f97316"
                                  />
                                )}

                                {satData!.communication && (
                                  <ControlToggleRow
                                    label="Communication"
                                    checked={Boolean(satData!.communication.isActive)}
                                    onChange={(v) =>
                                      onUpdateSatellite?.(satData!.id, {
                                        communication: { ...satData!.communication!, isActive: v },
                                      })
                                    }
                                    color="#ec4899"
                                  />
                                )}

                                {!satData!.camera && !satData!.sensor && !satData!.communication && (
                                  <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontStyle: "italic", py: 0.25 }}>
                                    No attachments installed
                                  </Typography>
                                )}
                              </Box>
                            </Collapse>
                          )}
                        </Box>
                      );
                    })
                  )}
                </Box>
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

            {/* ── 9. Timeline Settings ─────────────────────────────────────── */}
            {activeSubMenu === "timeline" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#f8fafc" }}>
                    Timeline Settings
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    Configure timeline clock timezone & display format
                  </Typography>
                </Box>

                {/* Live Preview Card */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "10px",
                    bgcolor: "rgba(56, 189, 248, 0.06)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Active Timezone
                    </Typography>
                    <Chip
                      size="small"
                      label={timeZone === "UTC" ? "UTC (Default)" : timeZone === "Asia/Kolkata" ? "IST (Indian Standard)" : timeZone}
                      sx={{
                        height: 20,
                        fontSize: "0.68rem",
                        bgcolor: "rgba(56, 189, 248, 0.15)",
                        color: "#38bdf8",
                        fontWeight: 600,
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontFamily: "monospace", fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc", mt: 0.25 }}>
                    {formatTimeWithZone(Date.now(), 0, timeZone, timeFormat24h).timeStr}
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                    {formatTimeWithZone(Date.now(), 0, timeZone, timeFormat24h).dateStr}
                  </Typography>
                </Box>

                {/* Primary Presets: UTC & Indian Standard Time */}
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.5 }}>
                  Standard Timezones
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  {/* UTC Button */}
                  <Box
                    onClick={() => onTimeZoneChange?.("UTC")}
                    sx={{
                      p: 1.25,
                      borderRadius: "8px",
                      cursor: "pointer",
                      bgcolor: timeZone === "UTC" ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${timeZone === "UTC" ? "#38bdf8" : "rgba(255, 255, 255, 0.08)"}`,
                      transition: "all 0.15s ease",
                      "&:hover": { bgcolor: "rgba(56, 189, 248, 0.08)" },
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: timeZone === "UTC" ? "#38bdf8" : "#f1f5f9" }}>
                        UTC
                      </Typography>
                      {timeZone === "UTC" && <CheckIcon sx={{ fontSize: 16, color: "#38bdf8" }} />}
                    </Box>
                    <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                      UTC+00:00 (Universal)
                    </Typography>
                    <Typography sx={{ fontSize: "0.62rem", color: "#64748b", fontStyle: "italic", mt: 0.25 }}>
                      Default baseline
                    </Typography>
                  </Box>

                  {/* IST (India) Button */}
                  <Box
                    onClick={() => onTimeZoneChange?.("Asia/Kolkata")}
                    sx={{
                      p: 1.25,
                      borderRadius: "8px",
                      cursor: "pointer",
                      bgcolor: timeZone === "Asia/Kolkata" ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${timeZone === "Asia/Kolkata" ? "#f59e0b" : "rgba(255, 255, 255, 0.08)"}`,
                      transition: "all 0.15s ease",
                      "&:hover": { bgcolor: "rgba(245, 158, 11, 0.1)" },
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: timeZone === "Asia/Kolkata" ? "#f59e0b" : "#f1f5f9" }}>
                        IST (India)
                      </Typography>
                      {timeZone === "Asia/Kolkata" && <CheckIcon sx={{ fontSize: 16, color: "#f59e0b" }} />}
                    </Box>
                    <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                      UTC+05:30 (New Delhi)
                    </Typography>
                    <Typography sx={{ fontSize: "0.62rem", color: "#f59e0b", fontStyle: "italic", mt: 0.25 }}>
                      Indian Standard Time
                    </Typography>
                  </Box>
                </Box>

                {/* Popular Global Zones Chips */}
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.05em", mt: 0.5 }}>
                  World Regions
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {POPULAR_TIMEZONES.filter(t => t.id !== "UTC" && t.id !== "Asia/Kolkata").map((item) => {
                    const isSelected = timeZone === item.id;
                    return (
                      <Chip
                        key={item.id}
                        label={`${item.label} (${item.city.split(" / ")[0]})`}
                        onClick={() => onTimeZoneChange?.(item.id)}
                        variant={isSelected ? "filled" : "outlined"}
                        size="small"
                        sx={{
                          fontSize: "0.72rem",
                          bgcolor: isSelected ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.03)",
                          borderColor: isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.12)",
                          color: isSelected ? "#38bdf8" : "#cbd5e1",
                          fontWeight: isSelected ? 600 : 400,
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: isSelected ? "rgba(56, 189, 248, 0.3)" : "rgba(255, 255, 255, 0.08)",
                          },
                        }}
                      />
                    );
                  })}
                </Box>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", my: 0.5 }} />

                {/* Search Any Timezone */}
                <Box>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>
                    Select Any Timezone (400+ IANA)
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      bgcolor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      px: 1,
                      py: 0.4,
                    }}
                  >
                    <SearchIcon sx={{ fontSize: 16, color: "#94a3b8", mr: 0.75 }} />
                    <InputBase
                      placeholder="Type city or country (e.g. Tokyo, Denver, Cairo...)"
                      value={timezoneSearch}
                      onChange={(e) => setTimezoneSearch(e.target.value)}
                      sx={{ fontSize: "0.8rem", color: "#f8fafc", width: "100%" }}
                    />
                    {timezoneSearch && (
                      <IconButton size="small" onClick={() => setTimezoneSearch("")} sx={{ p: 0.25, color: "#94a3b8" }}>
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </Box>

                  {/* Search Results Dropdown List */}
                  {timezoneSearch.trim() && (
                    <Box
                      sx={{
                        mt: 0.75,
                        maxHeight: 140,
                        overflowY: "auto",
                        bgcolor: "rgba(15, 20, 28, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "8px",
                        p: 0.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.25,
                      }}
                    >
                      {filteredTimezones.length === 0 ? (
                        <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8", textAlign: "center", py: 1 }}>
                          No timezones match &quot;{timezoneSearch}&quot;
                        </Typography>
                      ) : (
                        filteredTimezones.slice(0, 30).map((tz) => {
                          const isSelected = timeZone === tz;
                          return (
                            <Box
                              key={tz}
                              onClick={() => {
                                onTimeZoneChange?.(tz);
                                setTimezoneSearch("");
                              }}
                              sx={{
                                px: 1,
                                py: 0.6,
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                bgcolor: isSelected ? "rgba(56, 189, 248, 0.15)" : "transparent",
                                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
                              }}
                            >
                              <Typography sx={{ fontSize: "0.76rem", color: isSelected ? "#38bdf8" : "#f1f5f9", fontWeight: isSelected ? 600 : 400 }}>
                                {tz}
                              </Typography>
                              {isSelected && <CheckIcon sx={{ fontSize: 14, color: "#38bdf8" }} />}
                            </Box>
                          );
                        })
                      )}
                    </Box>
                  )}
                </Box>

                <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", my: 0.5 }} />

                {/* Format Options */}
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Time Format
                </Typography>
                <ControlToggleRow
                  label="24-Hour Military Format"
                  description={timeFormat24h ? "17:09:20 (24-hour standard)" : "05:09:20 PM (12-hour AM/PM)"}
                  checked={timeFormat24h}
                  onChange={onTimeFormat24hChange || (() => {})}
                  color="#38bdf8"
                />
              </Box>
            )}

            {/* ── 10. About ───────────────────────────────────────────────── */}
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

