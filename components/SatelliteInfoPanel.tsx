import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  IconButton,
  Divider,
  Box,
  Switch,
  Slider,
  InputBase,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import type { SatelliteData } from "@/lib/types";

interface SatelliteInfoPanelProps {
  satellite: SatelliteData | null;
  onClose: () => void;
  isPlaying?: boolean;
  onTogglePlayPause?: () => void;
  onUpdateSatellite?: (id: string, updatedData: Partial<SatelliteData>) => void;
  onUpdateFov?: (id: string, type: "camera" | "sensor", fovDeg: number) => void;
  onUpdateSensorInclination?: (id: string, inclinationDeg: number) => void;
}

export default function SatelliteInfoPanel({ 
  satellite, 
  onClose, 
  isPlaying = true, 
  onTogglePlayPause,
  onUpdateSatellite, 
  onUpdateFov, 
  onUpdateSensorInclination 
}: SatelliteInfoPanelProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 0,
    initialY: 0,
  });
  const rafIdRef = useRef<number | null>(null);

  // Keep panel within screen bounds on resize if positioned
  useEffect(() => {
    const handleResize = () => {
      if (!cardRef.current || position === null) return;
      const rect = cardRef.current.getBoundingClientRect();
      const maxX = Math.max(0, window.innerWidth - rect.width);
      const maxY = Math.max(0, window.innerHeight - rect.height);
      setPosition((prev) => {
        if (!prev) return null;
        const bounded = {
          x: Math.min(Math.max(10, prev.x), maxX - 10),
          y: Math.min(Math.max(10, prev.y), maxY - 10),
        };
        posRef.current = bounded;
        return bounded;
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (!cardRef.current) return;

    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch {
      // ignore in older browsers
    }

    const rect = cardRef.current.getBoundingClientRect();
    isDraggingRef.current = true;

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: rect.left,
      initialY: rect.top,
    };
    posRef.current = { x: rect.left, y: rect.top };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current || !cardRef.current) return;

      const deltaX = moveEvent.clientX - dragStartRef.current.mouseX;
      const deltaY = moveEvent.clientY - dragStartRef.current.mouseY;

      const cardWidth = rect.width;
      const cardHeight = rect.height;
      const minX = 10;
      const minY = 60; // beneath top navbar
      const maxX = window.innerWidth - cardWidth - 10;
      const maxY = window.innerHeight - cardHeight - 10;

      const newX = Math.min(Math.max(minX, dragStartRef.current.initialX + deltaX), maxX);
      const newY = Math.min(Math.max(minY, dragStartRef.current.initialY + deltaY), maxY);
      posRef.current = { x: newX, y: newY };

      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(() => {
          if (cardRef.current) {
            cardRef.current.style.left = `${posRef.current.x}px`;
            cardRef.current.style.top = `${posRef.current.y}px`;
            cardRef.current.style.right = 'auto';
          }
          rafIdRef.current = null;
        });
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      isDraggingRef.current = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      try {
        targetEl.releasePointerCapture(upEvent.pointerId);
      } catch {
        // ignore
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      // Commit final position to React state cleanly
      setPosition({ x: posRef.current.x, y: posRef.current.y });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  if (!satellite) return null;

  return (
    <Card 
      ref={cardRef}
      sx={{ 
        position: "fixed", 
        top: position !== null ? `${position.y}px` : "80px", 
        left: position !== null ? `${position.x}px` : "auto", 
        right: position !== null ? "auto" : "24px", 
        width: 400, 
        maxHeight: "min(580px, calc(100vh - 120px))",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 1200, 
        bgcolor: "background.paper", 
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        userSelect: "none",
        willChange: "top, left",
      }}
    >
      {/* Header with Dragger */}
      <CardHeader
        onPointerDown={handlePointerDown}
        sx={{ 
          py: 1.5,
          px: 2.5, 
          flexShrink: 0, 
          cursor: "grab", 
          "&:active": { cursor: "grabbing" },
          bgcolor: "background.default",
          borderBottom: "1px solid",
          borderColor: "divider",
          touchAction: "none",
        }}
        avatar={
          <Tooltip title="Drag to reposition">
            <DragIndicatorIcon sx={{ color: "text.disabled", fontSize: 20, cursor: "grab" }} />
          </Tooltip>
        }
        title={
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary" }}>
            {satellite.name}
          </Typography>
        }
        subheader={satellite.type}
        action={
          <Box 
            onPointerDown={(e) => e.stopPropagation()} 
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
          >
            {onTogglePlayPause && (
              <Tooltip title={isPlaying ? "Pause simulation" : "Resume simulation"}>
                <IconButton
                  aria-label={isPlaying ? "pause simulation" : "play simulation"}
                  size="small"
                  onClick={onTogglePlayPause}
                  sx={{ color: "text.secondary" }}
                >
                  {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
            <IconButton 
              aria-label="close" 
              onClick={onClose}
              size="small"
              sx={{ color: "text.secondary" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      />

      {/* Main Body */}
      <CardContent 
        onPointerDown={(e) => e.stopPropagation()}
        sx={{ 
          userSelect: "text",
          overflowY: "auto", 
          flexGrow: 1,
          minHeight: 0,
          p: 2.5,
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(56, 189, 248, 0.4) rgba(10, 25, 47, 0.3)",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "rgba(10, 25, 47, 0.3)" },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(56, 189, 248, 0.3)",
            borderRadius: "4px",
            "&:hover": { background: "rgba(56, 189, 248, 0.5)" },
          },
        }}
      >
        {/* Orbital Parameters List */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">Altitude</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
              {satellite.altitudeKm.toLocaleString()} km
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">Orbital Inclination</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
              {satellite.inclinationDeg}&deg;
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">Orbital Period</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
              {satellite.periodSec} s
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">Speed Multiplier</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
              {satellite.speedMultiplier}x
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Ground Track Section */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
                Ground Track
              </Typography>
              {satellite.showGroundTrack && (
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.15,
                    borderRadius: 1,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    bgcolor: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                  }}
                >
                  Active
                </Box>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Project orbit trajectory onto Earth surface
            </Typography>
          </Box>
          <Switch 
            size="small" 
            checked={Boolean(satellite.showGroundTrack)} 
            onChange={(e) => onUpdateSatellite?.(satellite.id, { showGroundTrack: e.target.checked })}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#f59e0b",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#f59e0b",
              },
            }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Attachments Section */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary", mb: 1.5 }}>
          Attachments
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Camera Subsystem */}
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                Camera
              </Typography>
              {satellite.camera && (
                <Switch 
                  size="small" 
                  checked={satellite.camera.isActive} 
                  onChange={(e) => onUpdateSatellite?.(satellite.id, { camera: { ...satellite.camera!, isActive: e.target.checked } })}
                />
              )}
            </Box>

            {satellite.camera ? (
              <Box sx={{ mt: 1.25, display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    Field of View
                  </Typography>

                  {/* Clean number input field */}
                  <Box 
                    sx={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 0.5,
                      bgcolor: "background.default",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      px: 1,
                      py: 0.35,
                      transition: "border-color 0.2s",
                      "&:focus-within": {
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <InputBase
                      type="number"
                      value={satellite.camera.fovDeg ?? 30}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateFov?.(satellite.id, "camera", val);
                        onUpdateSatellite?.(satellite.id, {
                          camera: {
                            ...satellite.camera!,
                            fovDeg: val
                          }
                        });
                      }}
                      inputProps={{ min: 5, max: 120, step: 1 }}
                      sx={{
                        width: 48,
                        fontSize: "0.8rem",
                        color: "text.primary",
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
                    <Typography variant="caption" color="text.secondary">&deg;</Typography>
                  </Box>
                </Box>

                <Slider 
                  size="small"
                  min={5}
                  max={120}
                  step={1}
                  value={satellite.camera.fovDeg ?? 30}
                  onChange={(_, val) => {
                    const numVal = val as number;
                    onUpdateFov?.(satellite.id, "camera", numVal);
                    onUpdateSatellite?.(satellite.id, {
                      camera: {
                        ...satellite.camera!,
                        fovDeg: numVal
                      }
                    });
                  }}
                />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", mt: 0.5 }}>
                No camera attached
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Sensor Subsystem */}
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                Sensor
              </Typography>
              {satellite.sensor && (
                <Switch 
                  size="small" 
                  checked={satellite.sensor.isActive} 
                  onChange={(e) => onUpdateSatellite?.(satellite.id, { sensor: { ...satellite.sensor!, isActive: e.target.checked } })}
                />
              )}
            </Box>

            {satellite.sensor ? (
              <Box sx={{ mt: 1.25, display: "flex", flexDirection: "column", gap: 1.5 }}>
                {/* FOV */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" color="text.secondary">
                      Field of View
                    </Typography>

                    <Box 
                      sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 0.5,
                        bgcolor: "background.default",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        px: 1,
                        py: 0.35,
                        transition: "border-color 0.2s",
                        "&:focus-within": {
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <InputBase
                        type="number"
                        value={satellite.sensor.fovDeg ?? 60}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          onUpdateFov?.(satellite.id, "sensor", val);
                          onUpdateSatellite?.(satellite.id, {
                            sensor: {
                              ...satellite.sensor!,
                              fovDeg: val
                            }
                          });
                        }}
                        inputProps={{ min: 5, max: 120, step: 1 }}
                        sx={{
                          width: 48,
                          fontSize: "0.8rem",
                          color: "text.primary",
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
                      <Typography variant="caption" color="text.secondary">&deg;</Typography>
                    </Box>
                  </Box>

                  <Slider 
                    size="small"
                    min={5}
                    max={120}
                    step={1}
                    value={satellite.sensor.fovDeg ?? 60}
                    onChange={(_, val) => {
                      const numVal = val as number;
                      onUpdateFov?.(satellite.id, "sensor", numVal);
                      onUpdateSatellite?.(satellite.id, {
                        sensor: {
                          ...satellite.sensor!,
                          fovDeg: numVal
                        }
                      });
                    }}
                  />
                </Box>

                {/* Inclination */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" color="text.secondary">
                      Sensor Inclination
                    </Typography>

                    <Box 
                      sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 0.5,
                        bgcolor: "background.default",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        px: 1,
                        py: 0.35,
                        transition: "border-color 0.2s",
                        "&:focus-within": {
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <InputBase
                        type="number"
                        value={satellite.sensor.inclinationDeg ?? satellite.sensor.inclinationDegree ?? 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          onUpdateSensorInclination?.(satellite.id, val);
                          onUpdateSatellite?.(satellite.id, {
                            sensor: {
                              ...satellite.sensor!,
                              inclinationDeg: val,
                              inclinationDegree: val
                            }
                          });
                        }}
                        inputProps={{ min: 0, max: 180, step: 0.5 }}
                        sx={{
                          width: 48,
                          fontSize: "0.8rem",
                          color: "text.primary",
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
                      <Typography variant="caption" color="text.secondary">&deg;</Typography>
                    </Box>
                  </Box>

                  <Slider 
                    size="small"
                    min={0}
                    max={180}
                    step={0.5}
                    value={satellite.sensor.inclinationDeg ?? satellite.sensor.inclinationDegree ?? 0}
                    onChange={(_, val) => {
                      const numVal = val as number;
                      onUpdateSensorInclination?.(satellite.id, numVal);
                      onUpdateSatellite?.(satellite.id, {
                        sensor: {
                          ...satellite.sensor!,
                          inclinationDeg: numVal,
                          inclinationDegree: numVal
                        }
                      });
                    }}
                  />
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", mt: 0.5 }}>
                No sensor attached
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Communication Subsystem */}
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                Communication
              </Typography>
              {satellite.communication && (
                <Switch 
                  size="small" 
                  checked={satellite.communication.isActive} 
                  onChange={(e) => onUpdateSatellite?.(satellite.id, { communication: { ...satellite.communication!, isActive: e.target.checked } })}
                />
              )}
            </Box>

            {satellite.communication ? (
              satellite.communication.targetStation ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Target Ground Station [Lon, Lat]
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {/* Longitude */}
                    <Box 
                      sx={{ 
                        flex: 1,
                        display: "flex", 
                        alignItems: "center", 
                        gap: 0.5,
                        bgcolor: "background.default", 
                        border: "1px solid", 
                        borderColor: "divider", 
                        borderRadius: 1,
                        px: 1,
                        py: 0.35,
                        transition: "border-color 0.2s",
                        "&:focus-within": {
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>Lon:</Typography>
                      <InputBase
                        type="number"
                        value={satellite.communication.targetStation[0]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const lat = satellite.communication?.targetStation ? satellite.communication.targetStation[1] : 0;
                          onUpdateSatellite?.(satellite.id, {
                            communication: {
                              ...satellite.communication!,
                              targetStation: [val, lat]
                            }
                          });
                        }}
                        inputProps={{ min: -180, max: 180, step: 0.1 }}
                        sx={{
                          flex: 1,
                          fontSize: "0.8rem",
                          color: "text.primary",
                          "& input": { 
                            p: 0, 
                            textAlign: "right",
                            fontFamily: "monospace",
                            MozAppearance: "textfield",
                            "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                              WebkitAppearance: "none",
                              margin: 0,
                            },
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">&deg;</Typography>
                    </Box>

                    {/* Latitude */}
                    <Box 
                      sx={{ 
                        flex: 1,
                        display: "flex", 
                        alignItems: "center", 
                        gap: 0.5,
                        bgcolor: "background.default", 
                        border: "1px solid", 
                        borderColor: "divider", 
                        borderRadius: 1,
                        px: 1,
                        py: 0.35,
                        transition: "border-color 0.2s",
                        "&:focus-within": {
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>Lat:</Typography>
                      <InputBase
                        type="number"
                        value={satellite.communication.targetStation[1]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const lon = satellite.communication?.targetStation ? satellite.communication.targetStation[0] : 0;
                          onUpdateSatellite?.(satellite.id, {
                            communication: {
                              ...satellite.communication!,
                              targetStation: [lon, val]
                            }
                          });
                        }}
                        inputProps={{ min: -90, max: 90, step: 0.1 }}
                        sx={{
                          flex: 1,
                          fontSize: "0.8rem",
                          color: "text.primary",
                          "& input": { 
                            p: 0, 
                            textAlign: "right",
                            fontFamily: "monospace",
                            MozAppearance: "textfield",
                            "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                              WebkitAppearance: "none",
                              margin: 0,
                            },
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">&deg;</Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  No target station assigned
                </Typography>
              )
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", mt: 0.5 }}>
                No communication attached
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
