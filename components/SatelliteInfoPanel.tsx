import React, { useEffect, useRef, useState } from 'react';
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
import type { SatelliteData } from "@/lib/types";

// ─── Design tokens ────────────────────────────────────────────────────────────
// All values are local constants so they form a coherent, consistent system.
const C = {
  bg:        "#0b0e18",   // panel background
  surface:   "#0d1121",   // header surface
  border:    "#1e2640",   // borders / dividers
  label:     "#8b9ab0",   // secondary label  — readable against dark bg
  value:     "#dce4ef",   // primary value    — near-white, high contrast
  accent:    "#38bdf8",   // active / slider accent
  accentBg:  "#0e1f33",   // accent tint for focus rings
  warning:   "#d97706",   // ground-track amber
  warningBg: "#1a1200",
} as const;

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Label + value pair used in the orbital parameters table. */
function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", py: "4px", borderBottom: `1px solid ${C.border}`, "&:last-child": { borderBottom: "none" } }}>
      <Typography sx={{ fontSize: "0.82rem", color: C.label, lineHeight: 1.6 }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.82rem", color: C.value, fontFamily: "'Courier New', monospace", fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}

/** Section heading — small caps, muted, consistent. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: C.label,
        mb: 1,
      }}
    >
      {children}
    </Typography>
  );
}

/** Inline number input with unit suffix — used for FOV, swath width, etc. */
function NumberInput({
  value,
  unit,
  min,
  max,
  step,
  width = 52,
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
        background: "#080b14",
        border: `1px solid ${C.border}`,
        borderRadius: "3px",
        px: "8px",
        py: "2px",
        "&:focus-within": { borderColor: C.accent },
        transition: "border-color 0.15s",
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
          fontSize: "0.82rem",
          color: C.value,
          fontFamily: "'Courier New', monospace",
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
      <Typography sx={{ fontSize: "0.75rem", color: C.label }}>{unit}</Typography>
    </Box>
  );
}

/** Thin MUI slider styled to match the design system. */
const sliderSx = {
  color: C.accent,
  height: 2,
  py: "10px",
  "& .MuiSlider-thumb": {
    width: 10,
    height: 10,
    "&:hover, &.Mui-focusVisible": { boxShadow: `0 0 0 6px ${C.accentBg}` },
  },
  "& .MuiSlider-rail": { background: C.border },
} as const;

/** Row with a label, description, and a toggle switch. */
function ToggleRow({
  label,
  description,
  checked,
  accentColor,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  accentColor?: string;
  onChange: (v: boolean) => void;
}) {
  const color = accentColor ?? C.accent;
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, py: "2px" }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 500, color: C.value, lineHeight: 1.4 }}>{label}</Typography>
        {description && (
          <Typography sx={{ fontSize: "0.72rem", color: C.label, lineHeight: 1.3 }}>{description}</Typography>
        )}
      </Box>
      <Switch
        size="small"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        sx={{
          flexShrink: 0,
          "& .MuiSwitch-switchBase.Mui-checked": { color },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: color },
        }}
      />
    </Box>
  );
}

// ─── Subsystem block ──────────────────────────────────────────────────────────

function SubsystemHeader({
  label,
  hasDevice,
  checked,
  onToggle,
}: {
  label: string;
  hasDevice: boolean;
  checked: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: hasDevice ? 0.75 : 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 600, color: hasDevice ? C.value : C.label }}>
          {label}
        </Typography>
        {!hasDevice && (
          <Typography sx={{ fontSize: "0.72rem", color: C.label, fontStyle: "italic" }}>not installed</Typography>
        )}
      </Box>
      {hasDevice && (
        <Switch
          size="small"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": { color: C.accent },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: C.accent },
          }}
        />
      )}
    </Box>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SatelliteInfoPanelProps {
  satellite: SatelliteData | null;
  onClose: () => void;
  isPlaying?: boolean;
  onTogglePlayPause?: () => void;
  onUpdateSatellite?: (id: string, data: Partial<SatelliteData>) => void;
  onUpdateFov?: (id: string, type: "camera" | "sensor", fovDeg: number) => void;
  onUpdateSensorInclination?: (id: string, inclinationDeg: number) => void;
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
}: SatelliteInfoPanelProps) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const posRef   = useRef({ x: 0, y: 0 });
  const dragRef  = useRef({ active: false, mouseX: 0, mouseY: 0, initX: 0, initY: 0 });
  const rafRef   = useRef<number | null>(null);
  const [positioned, setPositioned] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleToggleMinimize = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsMinimized((prev) => {
      const next = !prev;
      if (!next && cardRef.current) {
        requestAnimationFrame(() => {
          if (!cardRef.current) return;
          const rect = cardRef.current.getBoundingClientRect();
          if (rect.bottom > window.innerHeight - 10) {
            const newY = Math.max(60, window.innerHeight - rect.height - 10);
            posRef.current.y = newY;
            cardRef.current.style.top = `${newY}px`;
          }
        });
      }
      return next;
    });
  };

  // Keep within viewport on resize
  useEffect(() => {
    const onResize = () => {
      if (!cardRef.current || !positioned) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = Math.min(posRef.current.x, window.innerWidth  - rect.width  - 10);
      const y = Math.min(posRef.current.y, window.innerHeight - rect.height - 10);
      posRef.current = { x: Math.max(10, x), y: Math.max(60, y) };
      if (cardRef.current) {
        cardRef.current.style.left = `${posRef.current.x}px`;
        cardRef.current.style.top  = `${posRef.current.y}px`;
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [positioned]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (!cardRef.current) return;
    const el = e.currentTarget as HTMLElement;
    try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }

    const rect = cardRef.current.getBoundingClientRect();
    dragRef.current = { active: true, mouseX: e.clientX, mouseY: e.clientY, initX: rect.left, initY: rect.top };
    posRef.current  = { x: rect.left, y: rect.top };

    const onMove = (me: PointerEvent) => {
      if (!dragRef.current.active || !cardRef.current) return;
      const dx = me.clientX - dragRef.current.mouseX;
      const dy = me.clientY - dragRef.current.mouseY;
      const w  = cardRef.current.offsetWidth;
      const h  = cardRef.current.offsetHeight;
      posRef.current = {
        x: Math.min(Math.max(10, dragRef.current.initX + dx), window.innerWidth  - w - 10),
        y: Math.min(Math.max(60, dragRef.current.initY + dy), window.innerHeight - h - 10),
      };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          if (cardRef.current) {
            cardRef.current.style.left  = `${posRef.current.x}px`;
            cardRef.current.style.top   = `${posRef.current.y}px`;
            cardRef.current.style.right = "auto";
          }
          rafRef.current = null;
        });
      }
    };

    const onUp = (ue: PointerEvent) => {
      dragRef.current.active = false;
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      try { el.releasePointerCapture(ue.pointerId); } catch { /* ignore */ }
      setPositioned(true);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup",   onUp);
    window.addEventListener("pointercancel", onUp);
  };

  if (!satellite) return null;

  // Swath default width
  const defaultSwathKm = Math.round(
    Math.min(3000, Math.max(50,
      satellite.altitudeKm *
      Math.tan(((satellite.sensor?.fovDeg ?? satellite.camera?.fovDeg ?? 25) * Math.PI) / 360) * 2
    ))
  );
  const swathKm = satellite.swathWidthKm ?? defaultSwathKm;

  return (
    <Box
      ref={cardRef}
      sx={{
        position:   "fixed",
        top:        positioned ? undefined : "76px",
        right:      positioned ? undefined : "20px",
        width:      340,
        maxHeight:  isMinimized ? "none" : "calc(100vh - 112px)",
        display:    "flex",
        flexDirection: "column",
        zIndex:     1200,
        background: C.bg,
        border:     `1px solid ${C.border}`,
        borderRadius: "4px",
        boxShadow:  isMinimized ? "0 4px 16px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.6)",
        userSelect: "none",
        willChange: "top, left",
        overflow:   "hidden",
        transition: "box-shadow 0.15s ease",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box
        onPointerDown={handlePointerDown}
        onDoubleClick={handleToggleMinimize}
        sx={{
          display:      "flex",
          alignItems:   "center",
          gap:          1,
          px:           1.5,
          py:           1,
          borderBottom: isMinimized ? "none" : `1px solid ${C.border}`,
          background:   C.surface,
          cursor:       "grab",
          "&:active":   { cursor: "grabbing" },
          touchAction:  "none",
          flexShrink:   0,
        }}
      >
        <DragIndicatorIcon sx={{ fontSize: 16, color: C.border, mr: 0.25 }} />

        {/* Name + type */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{ fontSize: "0.9rem", fontWeight: 600, color: C.value, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {satellite.name}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: C.label, lineHeight: 1.3 }}>
            {satellite.type ?? "Satellite"}
          </Typography>
        </Box>

        {/* Window controls: Play/Pause, Minimize/Restore & Close */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
                  border: `1px solid ${isPlaying ? "rgba(56, 189, 248, 0.35)" : C.border}`,
                  borderRadius: "3px",
                  p: "3px",
                  "&:hover": {
                    bgcolor: isPlaying ? "rgba(56, 189, 248, 0.22)" : "rgba(255, 255, 255, 0.08)",
                    color: isPlaying ? "#7dd3fc" : C.value,
                  },
                }}
              >
                {isPlaying ? (
                  <PauseIcon sx={{ fontSize: 15 }} />
                ) : (
                  <PlayArrowIcon sx={{ fontSize: 15 }} />
                )}
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
                "&:hover": { color: C.value, backgroundColor: "rgba(255,255,255,0.06)" },
                p: "4px",
              }}
            >
              {isMinimized ? (
                <CropSquareIcon sx={{ fontSize: 14 }} />
              ) : (
                <RemoveIcon sx={{ fontSize: 16 }} />
              )}
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
                "&:hover": { color: C.value, backgroundColor: "rgba(255,255,255,0.06)" },
                p: "4px",
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <Box
        onPointerDown={(e) => e.stopPropagation()}
        sx={{
          display:       isMinimized ? "none" : "block",
          overflowY:     "auto",
          flexGrow:      1,
          minHeight:     0,
          userSelect:    "text",
          scrollbarWidth: "thin",
          scrollbarColor: `${C.border} ${C.bg}`,
          "&::-webkit-scrollbar":       { width: "5px" },
          "&::-webkit-scrollbar-track": { background: C.bg },
          "&::-webkit-scrollbar-thumb": { background: C.border, borderRadius: "2px" },
        }}
      >
        {/* ── Orbital Parameters ──────────────────────────────────────────── */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1.25 }}>
          <SectionLabel>Orbital Parameters</SectionLabel>
          <Box>
            <ParamRow label="Altitude"        value={`${satellite.altitudeKm.toLocaleString()} km`} />
            <ParamRow label="Inclination"      value={`${satellite.inclinationDeg}°`} />
            <ParamRow label="Orbital Period"   value={`${satellite.periodSec} s`} />
            <ParamRow label="Speed Multiplier" value={`${satellite.speedMultiplier}×`} />
          </Box>
        </Box>

        <Divider sx={{ borderColor: C.border }} />

        {/* ── Coverage ────────────────────────────────────────────────────── */}
        <Box sx={{ px: 2, pt: 1.25, pb: 1.25, display: "flex", flexDirection: "column", gap: 1 }}>
          <SectionLabel>Coverage</SectionLabel>

          <ToggleRow
            label="Ground Track"
            description="Project orbit onto Earth surface"
            checked={Boolean(satellite.showGroundTrack)}
            accentColor={C.warning}
            onChange={(v) => onUpdateSatellite?.(satellite.id, { showGroundTrack: v })}
          />

          <ToggleRow
            label="Ground Swath"
            description="Coverage corridor along orbital track"
            checked={Boolean(satellite.showSwath)}
            onChange={(v) => onUpdateSatellite?.(satellite.id, { showSwath: v })}
          />

          {satellite.showSwath && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
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

        <Divider sx={{ borderColor: C.border }} />

        {/* ── Attachments ─────────────────────────────────────────────────── */}
        <Box sx={{ px: 2, pt: 1.25, pb: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <SectionLabel>Attachments</SectionLabel>

          {/* Camera */}
          <Box>
            <SubsystemHeader
              label="Camera (Torch Light)"
              hasDevice={Boolean(satellite.camera)}
              checked={Boolean(satellite.camera?.isActive)}
              onToggle={(v) =>
                onUpdateSatellite?.(satellite.id, { camera: { ...satellite.camera!, isActive: v } })
              }
            />
            {satellite.camera && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: "0.72rem", color: C.label }}>Field of View</Typography>
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

          <Divider sx={{ borderColor: C.border }} />

          {/* Sensor */}
          <Box>
            <SubsystemHeader
              label="Sensor (Scanner Cone)"
              hasDevice={Boolean(satellite.sensor)}
              checked={Boolean(satellite.sensor?.isActive)}
              onToggle={(v) =>
                onUpdateSatellite?.(satellite.id, { sensor: { ...satellite.sensor!, isActive: v } })
              }
            />
            {satellite.sensor && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {/* FOV */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: "0.72rem", color: C.label }}>Field of View</Typography>
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
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: "0.72rem", color: C.label }}>Inclination</Typography>
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

          <Divider sx={{ borderColor: C.border }} />

          {/* Communication */}
          <Box>
            <SubsystemHeader
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
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                <Typography sx={{ fontSize: "0.75rem", color: C.label, mb: 0.5 }}>
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
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: "3px",
                      px: 1,
                      py: "3px",
                      "&:focus-within": { borderColor: C.accent },
                      transition: "border-color 0.15s",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.68rem", color: C.label }}>Lon</Typography>
                    <InputBase
                      type="number"
                      value={satellite.communication.targetStation[0]}
                      onChange={(e) => {
                        const v   = parseFloat(e.target.value) || 0;
                        const lat = satellite.communication!.targetStation![1];
                        onUpdateSatellite?.(satellite.id, {
                          communication: { ...satellite.communication!, targetStation: [v, lat] },
                        });
                      }}
                      inputProps={{ min: -180, max: 180, step: 0.1 }}
                      sx={{
                        flex: 1,
                        fontSize: "0.75rem",
                        color: C.value,
                        fontFamily: "monospace",
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
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: "3px",
                      px: 1,
                      py: "3px",
                      "&:focus-within": { borderColor: C.accent },
                      transition: "border-color 0.15s",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.68rem", color: C.label }}>Lat</Typography>
                    <InputBase
                      type="number"
                      value={satellite.communication.targetStation[1]}
                      onChange={(e) => {
                        const v   = parseFloat(e.target.value) || 0;
                        const lon = satellite.communication!.targetStation![0];
                        onUpdateSatellite?.(satellite.id, {
                          communication: { ...satellite.communication!, targetStation: [lon, v] },
                        });
                      }}
                      inputProps={{ min: -90, max: 90, step: 0.1 }}
                      sx={{
                        flex: 1,
                        fontSize: "0.75rem",
                        color: C.value,
                        fontFamily: "monospace",
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
