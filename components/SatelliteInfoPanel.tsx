import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Typography, IconButton, Divider, Box, Switch, FormControlLabel, TextField, Slider, Chip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { SatelliteData } from "@/lib/satellites";

interface SatelliteInfoPanelProps {
  satellite: SatelliteData | null;
  onClose: () => void;
  onUpdateSatellite?: (id: string, updatedData: Partial<SatelliteData>) => void;
  onUpdateFov?: (id: string, type: "camera" | "sensor", fovDeg: number) => void;
  onUpdateSensorInclination?: (id: string, inclinationDeg: number) => void;
}

export default function SatelliteInfoPanel({ satellite, onClose, onUpdateSatellite, onUpdateFov, onUpdateSensorInclination }: SatelliteInfoPanelProps) {
  if (!satellite) return null;

  return (
    <Card sx={{ position: "absolute", top: 80, right: 24, width: 320, zIndex: 10, bgcolor: "background.paper", boxShadow: 6 }}>
      <CardHeader
        title={<Typography variant="subtitle1" sx={{ fontWeight: "bold", color: '#38bdf8' }}>{satellite.name}</Typography>}
        subheader={satellite.type}
        action={<IconButton aria-label="close" onClick={onClose}><CloseIcon /></IconButton>}
      />
      <Divider />
      <CardContent>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">FOV (Degrees):</Typography>
                  <TextField 
                    size="small"
                    type="number"
                    variant="outlined"
                    sx={{ width: 80, '& .MuiInputBase-input': { p: 0.5, fontSize: '0.75rem' } }}
                    key={`camera-fov-${satellite.id}-${satellite.camera.fovDeg}`}
                    defaultValue={satellite.camera.fovDeg}
                    onBlur={(e) => onUpdateFov?.(satellite.id, "camera", Number(e.target.value))}
                  />
                  <Typography variant="caption" color="text.secondary">&deg;</Typography>
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
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">FOV (Degrees):</Typography>
                  <TextField 
                    size="small"
                    type="number"
                    variant="outlined"
                    sx={{ width: 80, '& .MuiInputBase-input': { p: 0.5, fontSize: '0.75rem' } }}
                    key={`sensor-fov-${satellite.id}-${satellite.sensor.fovDeg}`}
                    defaultValue={satellite.sensor.fovDeg}
                    onBlur={(e) => onUpdateFov?.(satellite.id, "sensor", Number(e.target.value))}
                  />
                  <Typography variant="caption" color="text.secondary">&deg;</Typography>
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
                      Math.abs(delta) < 0.5 ? "Direct Nadir (Below)" :
                      delta > 0 ? `Right Cross-Track (+${delta.toFixed(1)}°)` :
                      `Left Cross-Track (${delta.toFixed(1)}°)`;
                    const offNadirRad = Math.abs((delta * Math.PI) / 180);
                    const ovalRatio = ((1.5 + 2.5 * Math.sin(offNadirRad)) / Math.max(1 - 0.2 * Math.sin(offNadirRad), 0.65)).toFixed(1);
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
                          Swath: <strong>{ovalRatio}:1</strong> ({inc}°)
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
