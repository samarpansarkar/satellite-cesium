"use client";

/**
 * SatelliteInfoPanel.tsx
 * Floating telemetry HUD card for inspected satellite.
 * Structured with dedicated tabs: Info, Tracks, and Attachments.
 * Styled with the same glassmorphic aesthetic as ControlMenu.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Divider,
  IconButton,
  InputBase,
  Slider,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import RemoveIcon from "@mui/icons-material/Remove";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import TimelineIcon from "@mui/icons-material/Timeline";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import SensorsIcon from "@mui/icons-material/Sensors";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import SettingsInputAntennaIcon from "@mui/icons-material/SettingsInputAntenna";
import SpeedIcon from "@mui/icons-material/Speed";
import type { SatelliteData } from "@/lib/types";

// ─── Design Tokens Matching ControlMenu ───────────────────────────────────────
const C = {
  bg: "rgba(18, 19, 24, 0.94)",
  surface: "rgba(255, 255, 255, 0.04)",
  border: "rgba(255, 255, 255, 0.12)",
  subBorder: "rgba(255, 255, 255, 0.06)",
  label: "#94a3b8",
  value: "#f1f5f9",
  accent: "#38bdf8",
  accentBg: "rgba(56, 189, 248, 0.15)",
  warning: "#f59e0b",
  warningBg: "rgba(245, 158, 11, 0.15)",
  cardBg: "rgba(255, 255, 255, 0.02)",
} as const;

export type PanelTab = "info" | "tracks" | "attachments";

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Label + value pair used in orbital parameters */
function ParamRow({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 0.65,
        borderBottom: `1px solid ${C.subBorder}`,
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Box>
        <Typography sx={{ fontSize: "0.78rem", color: C.label }}>{label}</Typography>
        {subtext && (
          <Typography sx={{ fontSize: "0.64rem", color: "#64748b" }}>{subtext}</Typography>
        )}
      </Box>
      <Typography
        sx={{
          fontSize: "0.82rem",
          fontWeight: 600,
          color: C.value,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

/** Section heading with cyan accent matching ControlMenu */
function SectionHeader({
  icon,
  title,
  caption,
}: {
  icon: React.ReactNode;
  title: string;
  caption?: string;
}) {
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box sx={{ color: C.accent, display: "flex", alignItems: "center" }}>
          {icon}
        </Box>
        <Typography
          sx={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: C.accent,
          }}
        >
          {title}
        </Typography>
      </Box>
      {caption && (
        <Typography sx={{ fontSize: "0.68rem", color: C.label, mt: 0.25 }}>
          {caption}
        </Typography>
      )}
    </Box>
  );
}

/** Glassmorphic Number Input */
function NumberInput({
  value,
  unit,
  min,
  max,
  step,
  width = 54,
  onChange,
}: {
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  width?: number;
  onChange: (v: number) => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        bgcolor: "rgba(255, 255, 255, 0.04)",
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        px: 1,
        py: 0.25,
        "&:focus-within": {
          borderColor: C.accent,
          bgcolor: "rgba(56, 189, 248, 0.05)",
        },
        transition: "all 0.15s ease",
      }}
    >
      <InputBase
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        inputProps={{ min, max, step }}
        sx={{
          width,
          fontSize: "0.8rem",
          color: C.value,
          fontFamily: "ui-monospace, monospace",
          "& input": {
            p: 0,
            textAlign: "right",
            MozAppearance: "textfield",
            "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
              WebkitAppearance: "none",
              margin: 0,
            },
          },
        }}
      />
      <Typography sx={{ fontSize: "0.72rem", color: C.label }}>{unit}</Typography>
    </Box>
  );
}

/** Slider matching ControlMenu styling */
const sliderSx = {
  color: C.accent,
  height: 3,
  py: 1,
  "& .MuiSlider-thumb": {
    width: 12,
    height: 12,
    bgcolor: "#f8fafc",
    border: "2px solid #0284c7",
    boxShadow: "0 0 8px rgba(56, 189, 248, 0.5)",
    "&:hover, &.Mui-focusVisible": {
      boxShadow: "0 0 12px rgba(56, 189, 248, 0.8)",
    },
  },
  "& .MuiSlider-rail": {
    bgcolor: "rgba(255, 255, 255, 0.1)",
  },
  "& .MuiSlider-track": {
    bgcolor: C.accent,
  },
} as const;

/** Toggle row styled with ControlMenu card aesthetic */
function ToggleCardRow({
  label,
  description,
  checked,
  accentColor = C.accent,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  accentColor?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
        px: 1.25,
        py: 0.8,
        borderRadius: "8px",
        bgcolor: checked ? "rgba(56, 189, 248, 0.06)" : "rgba(255, 255, 255, 0.02)",
        border: `1px solid ${checked ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.05)"}`,
        transition: "all 0.15s ease",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: C.value, lineHeight: 1.3 }}>
          {label}
        </Typography>
        {description && (
          <Typography sx={{ fontSize: "0.68rem", color: C.label, lineHeight: 1.3, mt: 0.2 }}>
            {description}
          </Typography>
        )}
      </Box>
      <Switch
        size="small"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        sx={{
          flexShrink: 0,
          "& .MuiSwitch-switchBase.Mui-checked": { color: accentColor },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: accentColor,
            opacity: 0.8,
          },
        }}
      />
    </Box>
  );
}

/** Header for subsystem attachments */
function SubsystemCardHeader({
  icon,
  label,
  hasDevice,
  checked,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  hasDevice: boolean;
  checked: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: hasDevice ? 1 : 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ color: hasDevice ? C.accent : C.label, display: "flex", alignItems: "center" }}>
          {icon}
        </Box>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: hasDevice ? C.value : C.label }}>
          {label}
        </Typography>
        {!hasDevice && (
          <Typography sx={{ fontSize: "0.68rem", color: C.label, fontStyle: "italic" }}>
            not installed
          </Typography>
        )}
      </Box>
      {hasDevice && (
        <Switch
          size="small"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": { color: C.accent },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: C.accent,
              opacity: 0.8,
            },
          }}
        />
      )}
    </Box>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrbitRegime(altitudeKm: number): string {
  if (altitudeKm < 2000) return "LEO (Low Earth Orbit)";
  if (altitudeKm < 35000) return "MEO (Medium Earth Orbit)";
  if (Math.abs(altitudeKm - 35786) < 1000) return "GEO (Geostationary)";
  return "HEO (High Earth Orbit)";
}

function formatPeriod(periodSec: number): string {
  const h = Math.floor(periodSec / 3600);
  const m = Math.floor((periodSec % 3600) / 60);
  const s = periodSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SatelliteInfoPanelProps {
  satellite: SatelliteData | null;
  onClose: () => void;
  isPlaying?: boolean;
  onTogglePlayPause?: () => void;
  onUpdateSatellite?: (id: string, data: Partial<SatelliteData>) => void;
  onUpdateFov?: (id: string, type: "camera" | "sensor", fovDeg: number) => void;
  onUpdateSensorInclination?: (id: string, inclinationDeg: number) => void;
  initialTab?: PanelTab;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SatelliteInfoPanel({
  satellite,
  onClose,
  isPlaying = true,
  onTogglePlayPause,
  onUpdateSatellite,
  onUpdateFov,
  onUpdateSensorInclination,
  initialTab = "info",
}: SatelliteInfoPanelProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, mouseX: 0, mouseY: 0, initX: 0, initY: 0 });
  const rafRef = useRef<number | null>(null);
  const [positioned, setPositioned] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>(initialTab);

  const handleToggleMinimize = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsMinimized((prev) => {
      const next = !prev;
      if (!next && cardRef.current) {
        cardRef.current.style.height = "auto";
      }
      return next;
    });
  };

  useEffect(() => {
    if (!satellite || positioned || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = window.innerWidth - rect.width - 24;
    const y = 80;
    posRef.current = { x, y };
    cardRef.current.style.left = `${x}px`;
    cardRef.current.style.top = `${y}px`;
    setPositioned(true);
  }, [satellite, positioned]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, input, [role='slider']")) return;
    dragRef.current = {
      active: true,
      mouseX: e.clientX,
      mouseY: e.clientY,
      initX: posRef.current.x,
      initY: posRef.current.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.mouseX;
    const dy = e.clientY - dragRef.current.mouseY;
    posRef.current = {
      x: Math.max(0, Math.min(window.innerWidth - 100, dragRef.current.initX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.initY + dy)),
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.left = `${posRef.current.x}px`;
        cardRef.current.style.top = `${posRef.current.y}px`;
      }
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  if (!satellite) return null;

  const defaultSwathKm = Math.round(
    Math.min(
      Math.max(
        satellite.altitudeKm * Math.tan((((satellite.camera?.fovDeg ?? 30) / 2) * Math.PI) / 180),
        30
      ) * 2,
      1200
    )
  );
  const swathKm = satellite.swathWidthKm ?? defaultSwathKm;

  // Active counts for tab badges
  const activeTracksCount = [satellite.showOrbit, satellite.showGroundTrack, satellite.showSwath].filter(Boolean).length;
  const activeAttachmentsCount = [satellite.camera?.isActive, satellite.sensor?.isActive, satellite.communication?.isActive].filter(Boolean).length;

  return (
    <Box
      ref={cardRef}
      sx={{
        position: "fixed",
        top: positioned ? undefined : "80px",
        right: positioned ? undefined : "24px",
        width: 360,
        maxHeight: isMinimized ? "none" : "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        zIndex: 1200,
        bgcolor: C.bg,
        backdropFilter: "blur(18px) saturate(180%)",
        border: `1px solid ${C.border}`,
        borderRadius: "14px",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.2)",
        userSelect: "none",
        willChange: "top, left",
        overflow: "hidden",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleToggleMinimize}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.75,
          py: 1.2,
          borderBottom: isMinimized ? "none" : `1px solid rgba(255, 255, 255, 0.08)`,
          bgcolor: C.surface,
          cursor: "grab",
          "&:active": { cursor: "grabbing" },
          touchAction: "none",
          flexShrink: 0,
        }}
      >
        <DragIndicatorIcon sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.3)", mr: -0.25 }} />

        {/* Orbit indicator glow dot */}
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: C.accent,
            boxShadow: `0 0 8px ${C.accent}`,
            flexShrink: 0,
          }}
        />

        {/* Name + type */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.92rem",
              fontWeight: 700,
              color: "#f8fafc",
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            {satellite.name}
          </Typography>
          <Typography sx={{ fontSize: "0.7rem", color: C.label, lineHeight: 1.2 }}>
            {satellite.type ?? "Satellite"}
          </Typography>
        </Box>

        {/* Window controls: Play/Pause, Minimize/Restore & Close */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          {onTogglePlayPause && (
            <Tooltip title={isPlaying ? "Pause simulation" : "Resume simulation"}>
              <IconButton
                size="small"
                onClick={onTogglePlayPause}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label={isPlaying ? "Pause simulation" : "Resume simulation"}
                sx={{
                  color: isPlaying ? C.accent : C.label,
                  bgcolor: isPlaying ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.04)",
                  border: `1px solid ${isPlaying ? "rgba(56, 189, 248, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
                  borderRadius: "6px",
                  p: 0.5,
                  "&:hover": {
                    bgcolor: isPlaying ? "rgba(56, 189, 248, 0.22)" : "rgba(255, 255, 255, 0.1)",
                    color: isPlaying ? "#7dd3fc" : C.value,
                  },
                }}
              >
                {isPlaying ? <PauseIcon sx={{ fontSize: 16 }} /> : <PlayArrowIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={isMinimized ? "Restore to actual size" : "Minimize panel"}>
            <IconButton
              size="small"
              onClick={handleToggleMinimize}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={isMinimized ? "Restore panel" : "Minimize panel"}
              sx={{
                color: C.label,
                bgcolor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                p: 0.5,
                "&:hover": { color: C.value, bgcolor: "rgba(255, 255, 255, 0.1)" },
              }}
            >
              {isMinimized ? <CropSquareIcon sx={{ fontSize: 15 }} /> : <RemoveIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Close">
            <IconButton
              size="small"
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Close panel"
              sx={{
                color: C.label,
                bgcolor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "6px",
                p: 0.5,
                "&:hover": { color: "#f87171", bgcolor: "rgba(239, 68, 68, 0.15)", borderColor: "rgba(239, 68, 68, 0.3)" },
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Section Tabs Navigation Bar ─────────────────────────────────────── */}
      {!isMinimized && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 0.75,
            px: 1.5,
            py: 0.85,
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            bgcolor: "rgba(255, 255, 255, 0.02)",
            flexShrink: 0,
          }}
        >
          {/* Tab 1: Info */}
          <Box
            onClick={() => setActiveTab("info")}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.6,
              py: 0.6,
              px: 0.75,
              borderRadius: "8px",
              cursor: "pointer",
              bgcolor: activeTab === "info" ? "rgba(56, 189, 248, 0.14)" : "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${activeTab === "info" ? "#38bdf8" : "rgba(255, 255, 255, 0.06)"}`,
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: activeTab === "info" ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.06)",
              },
            }}
          >
            <PublicOutlinedIcon sx={{ fontSize: 14, color: activeTab === "info" ? "#38bdf8" : "#94a3b8" }} />
            <Typography
              sx={{
                fontSize: "0.76rem",
                fontWeight: activeTab === "info" ? 700 : 500,
                color: activeTab === "info" ? "#38bdf8" : "#cbd5e1",
              }}
            >
              Info
            </Typography>
          </Box>

          {/* Tab 2: Tracks */}
          <Box
            onClick={() => setActiveTab("tracks")}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.6,
              py: 0.6,
              px: 0.75,
              borderRadius: "8px",
              cursor: "pointer",
              bgcolor: activeTab === "tracks" ? "rgba(56, 189, 248, 0.14)" : "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${activeTab === "tracks" ? "#38bdf8" : "rgba(255, 255, 255, 0.06)"}`,
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: activeTab === "tracks" ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.06)",
              },
            }}
          >
            <TimelineIcon sx={{ fontSize: 14, color: activeTab === "tracks" ? "#38bdf8" : "#94a3b8" }} />
            <Typography
              sx={{
                fontSize: "0.76rem",
                fontWeight: activeTab === "tracks" ? 700 : 500,
                color: activeTab === "tracks" ? "#38bdf8" : "#cbd5e1",
              }}
            >
              Tracks
            </Typography>
            {activeTracksCount > 0 && (
              <Box
                sx={{
                  px: 0.5,
                  py: 0.05,
                  borderRadius: "10px",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  bgcolor: "rgba(56, 189, 248, 0.25)",
                  color: "#38bdf8",
                }}
              >
                {activeTracksCount}
              </Box>
            )}
          </Box>

          {/* Tab 3: Attachments */}
          <Box
            onClick={() => setActiveTab("attachments")}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.6,
              py: 0.6,
              px: 0.75,
              borderRadius: "8px",
              cursor: "pointer",
              bgcolor: activeTab === "attachments" ? "rgba(56, 189, 248, 0.14)" : "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${activeTab === "attachments" ? "#38bdf8" : "rgba(255, 255, 255, 0.06)"}`,
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: activeTab === "attachments" ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.06)",
              },
            }}
          >
            <SensorsIcon sx={{ fontSize: 14, color: activeTab === "attachments" ? "#38bdf8" : "#94a3b8" }} />
            <Typography
              sx={{
                fontSize: "0.76rem",
                fontWeight: activeTab === "attachments" ? 700 : 500,
                color: activeTab === "attachments" ? "#38bdf8" : "#cbd5e1",
              }}
            >
              Attachments
            </Typography>
            {activeAttachmentsCount > 0 && (
              <Box
                sx={{
                  px: 0.5,
                  py: 0.05,
                  borderRadius: "10px",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  bgcolor: "rgba(56, 189, 248, 0.25)",
                  color: "#38bdf8",
                }}
              >
                {activeAttachmentsCount}
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* ── Body (Tab Panels) ──────────────────────────────────────────────── */}
      <Box
        onPointerDown={(e) => e.stopPropagation()}
        sx={{
          display: isMinimized ? "none" : "block",
          p: 1.75,
          overflowY: "auto",
          flexGrow: 1,
          minHeight: 0,
          userSelect: "text",
          scrollbarWidth: "thin",
          scrollbarColor: `rgba(255, 255, 255, 0.15) transparent`,
          "&::-webkit-scrollbar": { width: "5px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(255, 255, 255, 0.15)", borderRadius: "3px" },
        }}
      >
        {/* ── TAB 1: INFO (Telemetry & Orbital Mechanics) ───────────────────── */}
        <Box sx={{ display: activeTab === "info" ? "flex" : "none", flexDirection: "column", gap: 1.5 }}>
          {/* Orbital Parameters */}
          <Box>
            <SectionHeader
              icon={<PublicOutlinedIcon sx={{ fontSize: 15 }} />}
              title="Orbital Parameters"
              caption="Live Keplerian elements and trajectory metrics"
            />
            <Box
              sx={{
                p: 1.25,
                borderRadius: "10px",
                bgcolor: C.cardBg,
                border: `1px solid ${C.subBorder}`,
              }}
            >
              <ParamRow label="Altitude" value={`${satellite.altitudeKm.toLocaleString()} km`} subtext="Distance above Earth surface" />
              <ParamRow label="Inclination" value={`${satellite.inclinationDeg}°`} subtext="Orbital plane tilt vs equator" />
              <ParamRow label="Orbital Period" value={`${satellite.periodSec} s`} subtext={`Approx: ${formatPeriod(satellite.periodSec)}`} />
              <ParamRow label="Speed Multiplier" value={`${satellite.speedMultiplier}×`} subtext="Relative orbital velocity factor" />
            </Box>
          </Box>

          <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

          {/* Classification & Orbit Regime */}
          <Box>
            <SectionHeader
              icon={<SpeedIcon sx={{ fontSize: 15 }} />}
              title="Classification & Regime"
            />
            <Box
              sx={{
                p: 1.25,
                borderRadius: "10px",
                bgcolor: C.cardBg,
                border: `1px solid ${C.subBorder}`,
              }}
            >
              <ParamRow label="Type / Mission" value={satellite.type ?? "Earth Observation"} />
              <ParamRow label="Orbital Regime" value={getOrbitRegime(satellite.altitudeKm)} />
              <ParamRow label="Catalog ID" value={satellite.id} />
            </Box>
          </Box>

          {/* TLE Data (if present) */}
          {satellite.tleLine1 && satellite.tleLine2 && (
            <>
              <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />
              <Box>
                <SectionHeader
                  icon={<DragIndicatorIcon sx={{ fontSize: 15 }} />}
                  title="TLE Telemetry Elements"
                />
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: "8px",
                    bgcolor: "rgba(0, 0, 0, 0.3)",
                    border: `1px solid ${C.subBorder}`,
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "0.68rem",
                    color: "#cbd5e1",
                    overflowX: "auto",
                    whiteSpace: "pre",
                  }}
                >
                  {satellite.tleLine1}
                  {"\n"}
                  {satellite.tleLine2}
                </Box>
              </Box>
            </>
          )}
        </Box>

        {/* ── TAB 2: TRACKS (Coverage & Surface Trajectories) ───────────────── */}
        <Box sx={{ display: activeTab === "tracks" ? "flex" : "none", flexDirection: "column", gap: 1.25 }}>
          <SectionHeader
            icon={<TimelineIcon sx={{ fontSize: 15 }} />}
            title="Coverage & Tracks"
            caption="Toggle orbital paths and surface ground tracks"
          />

          <ToggleCardRow
            label="Orbit Path"
            description="Orbital trajectory line in space"
            checked={Boolean(satellite.showOrbit)}
            accentColor={C.accent}
            onChange={(v) => onUpdateSatellite?.(satellite.id, { showOrbit: v })}
          />

          <ToggleCardRow
            label="Ground Track"
            description="Project orbit onto Earth surface"
            checked={Boolean(satellite.showGroundTrack)}
            accentColor={C.warning}
            onChange={(v) => onUpdateSatellite?.(satellite.id, { showGroundTrack: v })}
          />

          <ToggleCardRow
            label="Ground Swath"
            description="Coverage corridor along orbital track"
            checked={Boolean(satellite.showSwath)}
            accentColor={C.accent}
            onChange={(v) => onUpdateSatellite?.(satellite.id, { showSwath: v })}
          />

          {satellite.showSwath && (
            <Box
              sx={{
                p: 1.25,
                borderRadius: "8px",
                bgcolor: "rgba(56, 189, 248, 0.04)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                mt: 0.5,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={{ fontSize: "0.78rem", color: C.label }}>Swath Width</Typography>
                <NumberInput
                  value={swathKm}
                  unit="km"
                  min={10}
                  max={3000}
                  step={25}
                  width={54}
                  onChange={(v) => onUpdateSatellite?.(satellite.id, { swathWidthKm: v })}
                />
              </Box>
              <Slider
                size="small"
                min={50}
                max={2500}
                step={25}
                value={swathKm}
                onChange={(_, v) => onUpdateSatellite?.(satellite.id, { swathWidthKm: v as number })}
                sx={sliderSx}
              />
            </Box>
          )}
        </Box>

        {/* ── TAB 3: ATTACHMENTS (Sensors, Cameras, Comm) ──────────────────── */}
        <Box sx={{ display: activeTab === "attachments" ? "flex" : "none", flexDirection: "column", gap: 1.25 }}>
          <SectionHeader
            icon={<SensorsIcon sx={{ fontSize: 15 }} />}
            title="Attachments"
            caption="Visual sensory payloads and downlink antennas"
          />

          {/* Camera */}
          <Box
            sx={{
              p: 1.25,
              borderRadius: "10px",
              bgcolor: satellite.camera?.isActive ? "rgba(56, 189, 248, 0.04)" : C.cardBg,
              border: `1px solid ${satellite.camera?.isActive ? "rgba(56, 189, 248, 0.25)" : C.subBorder}`,
              transition: "all 0.15s ease",
            }}
          >
            <SubsystemCardHeader
              icon={<VideocamOutlinedIcon sx={{ fontSize: 16 }} />}
              label="Camera (Torch Light)"
              hasDevice={Boolean(satellite.camera)}
              checked={Boolean(satellite.camera?.isActive)}
              onToggle={(v) =>
                onUpdateSatellite?.(satellite.id, { camera: { ...satellite.camera!, isActive: v } })
              }
            />
            {satellite.camera && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: "0.74rem", color: C.label }}>Field of View</Typography>
                  <NumberInput
                    value={satellite.camera.fovDeg ?? 30}
                    unit="°"
                    min={5}
                    max={120}
                    step={1}
                    width={44}
                    onChange={(v) => {
                      onUpdateFov?.(satellite.id, "camera", v);
                      onUpdateSatellite?.(satellite.id, { camera: { ...satellite.camera!, fovDeg: v } });
                    }}
                  />
                </Box>
                <Slider
                  size="small"
                  min={5}
                  max={120}
                  step={1}
                  value={satellite.camera.fovDeg ?? 30}
                  onChange={(_, v) => {
                    const n = v as number;
                    onUpdateFov?.(satellite.id, "camera", n);
                    onUpdateSatellite?.(satellite.id, { camera: { ...satellite.camera!, fovDeg: n } });
                  }}
                  sx={sliderSx}
                />
              </Box>
            )}
          </Box>

          {/* Sensor */}
          <Box
            sx={{
              p: 1.25,
              borderRadius: "10px",
              bgcolor: satellite.sensor?.isActive ? "rgba(56, 189, 248, 0.04)" : C.cardBg,
              border: `1px solid ${satellite.sensor?.isActive ? "rgba(56, 189, 248, 0.25)" : C.subBorder}`,
              transition: "all 0.15s ease",
            }}
          >
            <SubsystemCardHeader
              icon={<SensorsIcon sx={{ fontSize: 16 }} />}
              label="Sensor (Scanner Cone)"
              hasDevice={Boolean(satellite.sensor)}
              checked={Boolean(satellite.sensor?.isActive)}
              onToggle={(v) =>
                onUpdateSatellite?.(satellite.id, { sensor: { ...satellite.sensor!, isActive: v } })
              }
            />
            {satellite.sensor && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.5 }}>
                {/* FOV */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: "0.74rem", color: C.label }}>Field of View</Typography>
                    <NumberInput
                      value={satellite.sensor.fovDeg ?? 60}
                      unit="°"
                      min={5}
                      max={120}
                      step={1}
                      width={44}
                      onChange={(v) => {
                        onUpdateFov?.(satellite.id, "sensor", v);
                        onUpdateSatellite?.(satellite.id, { sensor: { ...satellite.sensor!, fovDeg: v } });
                      }}
                    />
                  </Box>
                  <Slider
                    size="small"
                    min={5}
                    max={120}
                    step={1}
                    value={satellite.sensor.fovDeg ?? 60}
                    onChange={(_, v) => {
                      const n = v as number;
                      onUpdateFov?.(satellite.id, "sensor", n);
                      onUpdateSatellite?.(satellite.id, { sensor: { ...satellite.sensor!, fovDeg: n } });
                    }}
                    sx={sliderSx}
                  />
                </Box>

                {/* Inclination */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: "0.74rem", color: C.label }}>Inclination</Typography>
                    <NumberInput
                      value={satellite.sensor.inclinationDeg ?? satellite.sensor.inclinationDegree ?? 0}
                      unit="°"
                      min={0}
                      max={180}
                      step={0.5}
                      width={44}
                      onChange={(v) => {
                        onUpdateSensorInclination?.(satellite.id, v);
                        onUpdateSatellite?.(satellite.id, {
                          sensor: { ...satellite.sensor!, inclinationDeg: v, inclinationDegree: v },
                        });
                      }}
                    />
                  </Box>
                  <Slider
                    size="small"
                    min={0}
                    max={180}
                    step={0.5}
                    value={satellite.sensor.inclinationDeg ?? satellite.sensor.inclinationDegree ?? 0}
                    onChange={(_, v) => {
                      const n = v as number;
                      onUpdateSensorInclination?.(satellite.id, n);
                      onUpdateSatellite?.(satellite.id, {
                        sensor: { ...satellite.sensor!, inclinationDeg: n, inclinationDegree: n },
                      });
                    }}
                    sx={sliderSx}
                  />
                </Box>
              </Box>
            )}
          </Box>

          {/* Communication */}
          <Box
            sx={{
              p: 1.25,
              borderRadius: "10px",
              bgcolor: satellite.communication?.isActive ? "rgba(56, 189, 248, 0.04)" : C.cardBg,
              border: `1px solid ${satellite.communication?.isActive ? "rgba(56, 189, 248, 0.25)" : C.subBorder}`,
              transition: "all 0.15s ease",
            }}
          >
            <SubsystemCardHeader
              icon={<SettingsInputAntennaIcon sx={{ fontSize: 16 }} />}
              label="Communication"
              hasDevice={Boolean(satellite.communication)}
              checked={Boolean(satellite.communication?.isActive)}
              onToggle={(v) =>
                onUpdateSatellite?.(satellite.id, {
                  communication: { ...satellite.communication!, isActive: v },
                })
              }
            />
            {satellite.communication?.targetStation ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 0.5 }}>
                <Typography sx={{ fontSize: "0.74rem", color: C.label }}>
                  Target Ground Station
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {/* Longitude */}
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      bgcolor: "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${C.border}`,
                      borderRadius: "6px",
                      px: 1,
                      py: 0.35,
                      "&:focus-within": { borderColor: C.accent },
                      transition: "border-color 0.15s",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.68rem", color: C.label, fontWeight: 600 }}>Lon</Typography>
                    <InputBase
                      type="number"
                      value={satellite.communication.targetStation[0]}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        const lat = satellite.communication!.targetStation![1];
                        onUpdateSatellite?.(satellite.id, {
                          communication: { ...satellite.communication!, targetStation: [v, lat] },
                        });
                      }}
                      inputProps={{ min: -180, max: 180, step: 0.1 }}
                      sx={{
                        flex: 1,
                        fontSize: "0.78rem",
                        color: C.value,
                        fontFamily: "ui-monospace, monospace",
                        "& input": {
                          p: 0,
                          textAlign: "right",
                          MozAppearance: "textfield",
                          "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                            WebkitAppearance: "none",
                            margin: 0,
                          },
                        },
                      }}
                    />
                    <Typography sx={{ fontSize: "0.68rem", color: C.label }}>°</Typography>
                  </Box>

                  {/* Latitude */}
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      bgcolor: "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${C.border}`,
                      borderRadius: "6px",
                      px: 1,
                      py: 0.35,
                      "&:focus-within": { borderColor: C.accent },
                      transition: "border-color 0.15s",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.68rem", color: C.label, fontWeight: 600 }}>Lat</Typography>
                    <InputBase
                      type="number"
                      value={satellite.communication.targetStation[1]}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        const lon = satellite.communication!.targetStation![0];
                        onUpdateSatellite?.(satellite.id, {
                          communication: { ...satellite.communication!, targetStation: [lon, v] },
                        });
                      }}
                      inputProps={{ min: -90, max: 90, step: 0.1 }}
                      sx={{
                        flex: 1,
                        fontSize: "0.78rem",
                        color: C.value,
                        fontFamily: "ui-monospace, monospace",
                        "& input": {
                          p: 0,
                          textAlign: "right",
                          MozAppearance: "textfield",
                          "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                            WebkitAppearance: "none",
                            margin: 0,
                          },
                        },
                      }}
                    />
                    <Typography sx={{ fontSize: "0.68rem", color: C.label }}>°</Typography>
                  </Box>
                </Box>
              </Box>
            ) : satellite.communication ? (
              <Typography sx={{ fontSize: "0.72rem", color: C.label, fontStyle: "italic", mt: 0.5 }}>
                No target station assigned
              </Typography>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
