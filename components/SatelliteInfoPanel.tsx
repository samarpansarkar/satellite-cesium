import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Typography, IconButton, Divider, Box, Switch, FormControlLabel, TextField, Slider, Chip, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import { SatelliteData } from "@/lib/satellites";

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
  if (!satellite) return null;

  return (
    <Card 
      sx={{ 
        position: "absolute", 
        top: 80, 
        right: 24, 
        width: 330, 
        maxHeight: "min(520px, calc(100vh - 140px))",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 10, 
        bgcolor: "background.paper", 
        boxShadow: 8,
        borderRadius: 2,
      }}
    >
      <CardHeader
        title={<Typography variant="subtitle1" sx={{ fontWeight: "bold", color: '#38bdf8' }}>{satellite.name}</Typography>}
        subheader={satellite.type}
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {onTogglePlayPause && (
              <Tooltip title={isPlaying ? "Pause simulation" : "Resume simulation"}>
                <IconButton
                  aria-label={isPlaying ? "pause simulation" : "play simulation"}
                  size="small"
                  onClick={onTogglePlayPause}
                  sx={{
                    bgcolor: isPlaying ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.08)",
                    border: "1px solid",
                    borderColor: isPlaying ? "rgba(56, 189, 248, 0.4)" : "divider",
                    color: isPlaying ? "#38bdf8" : "text.secondary",
                    "&:hover": {
                      bgcolor: isPlaying ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.15)",
                    },
                    width: 30,
                    height: 30,
                  }}
                >
                  {isPlaying ? <PauseIcon sx={{ fontSize: 18 }} /> : <PlayArrowIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
            )}
            <IconButton aria-label="close" onClick={onClose}><CloseIcon /></IconButton>
          </Box>
        }
        sx={{ pb: 1, flexShrink: 0 }}
      />
      <Divider />
      <CardContent 
        sx={{ 
          overflowY: "auto", 
          flexGrow: 1,
          minHeight: 0,
          pt: 1.5,
          pb: 2,
          "&:last-child": { pb: 2 },
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(56, 189, 248, 0.5) rgba(10, 25, 47, 0.3)",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(10, 25, 47, 0.3)",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(56, 189, 248, 0.45)",
            borderRadius: "4px",
            "&:hover": {
              background: "rgba(56, 189, 248, 0.75)",
            },
          },
        }}
      >
        <Typography variant="body2" color="text.secondary" gutterBottom><strong>Altitude:</strong> {satellite.altitudeKm.toLocaleString()} km</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom><strong>Inclination:</strong> {satellite.inclinationDeg}&deg;</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom><strong>Orbital Period:</strong> {satellite.periodSec} seconds</Typography>
        <Typography variant="body2" color="text.secondary"><strong>Speed Multiplier:</strong> {satellite.speedMultiplier}x</Typography>
        
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Attachments:</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>📷 Camera</Typography>
            {satellite.camera ? (
              <Box sx={{ pl: 2, display: "flex", flexDirection: "column" }}>
                <FormControlLabel
                  control={<Switch size="small" checked={satellite.camera.isActive} onChange={(e) => onUpdateSatellite?.(satellite.id, { camera: { ...satellite.camera!, isActive: e.target.checked } })} />}
                  label={<Typography variant="body2">{satellite.camera.isActive ? "Active" : "Inactive"}</Typography>}
                />
                {/* Interactive Camera FOV Control */}
                <Box sx={{ bgcolor: 'rgba(56, 189, 248, 0.08)', p: 1.2, borderRadius: 1.5, border: '1px solid rgba(56, 189, 248, 0.2)', mt: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#0284c7' }}>
                      Camera FOV (Cone):
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TextField 
                        size="small"
                        type="number"
                        variant="outlined"
                        sx={{ width: 75, '& .MuiInputBase-input': { p: '2px 4px', fontSize: '0.75rem', textAlign: 'right' } }}
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
                      />
                      <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600 }}>&deg;</Typography>
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
                    sx={{ color: '#0284c7', my: 0.5 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.2 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                      Optical Beam Coverage
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>
                      {satellite.camera.fovDeg}&deg; Cone
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 2 }}>No camera attached</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>📡 Sensor</Typography>
            {satellite.sensor ? (
              <Box sx={{ pl: 2, display: "flex", flexDirection: "column", gap: 1, mt: 0.5 }}>
                <FormControlLabel
                  control={<Switch size="small" checked={satellite.sensor.isActive} onChange={(e) => onUpdateSatellite?.(satellite.id, { sensor: { ...satellite.sensor!, isActive: e.target.checked } })} />}
                  label={<Typography variant="body2">{satellite.sensor.isActive ? "Active (Radar Swath Visible)" : "Inactive"}</Typography>}
                />
                
                {/* Interactive Sensor FOV Control */}
                <Box sx={{ bgcolor: 'rgba(249, 115, 22, 0.08)', p: 1.2, borderRadius: 1.5, border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#f97316' }}>
                      Sensor FOV (Beam Width):
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TextField 
                        size="small"
                        type="number"
                        variant="outlined"
                        sx={{ width: 75, '& .MuiInputBase-input': { p: '2px 4px', fontSize: '0.75rem', textAlign: 'right' } }}
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
                      />
                      <Typography variant="caption" sx={{ color: '#f97316', fontWeight: 600 }}>&deg;</Typography>
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
                    sx={{ color: '#f97316', my: 0.5 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.2 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                      Radar Swath Aperture
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#f97316', fontWeight: 600 }}>
                      {satellite.sensor.fovDeg}&deg; Swath
                    </Typography>
                  </Box>
                </Box>

                {/* Interactive Sensor Inclination Control with Live UI Feedback */}
                <Box sx={{ bgcolor: 'rgba(249, 115, 22, 0.08)', p: 1.2, borderRadius: 1.5, border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#f97316' }}>
                      Sensor Inclination:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TextField 
                        size="small"
                        type="number"
                        variant="outlined"
                        sx={{ width: 75, '& .MuiInputBase-input': { p: '2px 4px', fontSize: '0.75rem', textAlign: 'right' } }}
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
                      />
                      <Typography variant="caption" sx={{ color: '#f97316', fontWeight: 600 }}>&deg;</Typography>
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
                    sx={{ color: '#f97316', my: 0.5 }}
                  />

                  {/* Real-time Telemetry & Swath Behavior indicator */}
                  {(() => {
                    const inc = satellite.sensor.inclinationDeg ?? satellite.sensor.inclinationDegree ?? 90;
                    const delta = inc - 90;
                    const mode = 
                      Math.abs(delta) < 0.5 ? "Direct Nadir (Below Sat)" :
                      delta > 0 ? `Right Swath (+${delta.toFixed(1)}°)` :
                      `Left Swath (${delta.toFixed(1)}°)`;
                    return (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Chip
                          size="small"
                          label={mode}
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: 'rgba(249, 115, 22, 0.15)',
                            color: '#f97316',
                            border: '1px solid rgba(249, 115, 22, 0.4)',
                          }}
                        />
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                          Sensor Angle: <strong>{inc}°</strong>
                        </Typography>
                      </Box>
                    );
                  })()}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 2 }}>No sensor attached</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>🛰️ Communication</Typography>
            {satellite.communication ? (
              <Box sx={{ pl: 2, display: "flex", flexDirection: "column" }}>
                <FormControlLabel
                  control={<Switch size="small" checked={satellite.communication.isActive} onChange={(e) => onUpdateSatellite?.(satellite.id, { communication: { ...satellite.communication!, isActive: e.target.checked } })} />}
                  label={<Typography variant="body2">{satellite.communication.isActive ? "Active" : "Inactive"}</Typography>}
                />
                {satellite.communication.targetStation && (
                  <Typography variant="caption" color="text.secondary">
                    Target Station: [{satellite.communication.targetStation[0].toFixed(2)}, {satellite.communication.targetStation[1].toFixed(2)}]
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 2 }}>No communication attached</Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
