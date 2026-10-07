import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Typography, IconButton, Divider, Box, Switch, FormControlLabel, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { SatelliteData } from "@/lib/satellites";

interface SatelliteInfoPanelProps {
  satellite: SatelliteData | null;
  onClose: () => void;
  onUpdateSatellite?: (id: string, updatedData: Partial<SatelliteData>) => void;
  onUpdateFov?: (id: string, type: "camera" | "sensor", fovDeg: number) => void;
}

export default function SatelliteInfoPanel({ satellite, onClose, onUpdateSatellite, onUpdateFov }: SatelliteInfoPanelProps) {
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
              <Box sx={{ pl: 2, display: "flex", flexDirection: "column" }}>
                <FormControlLabel
                  control={<Switch size="small" checked={satellite.sensor.isActive} onChange={(e) => onUpdateSatellite?.(satellite.id, { sensor: { ...satellite.sensor!, isActive: e.target.checked } })} />}
                  label={<Typography variant="body2">{satellite.sensor.isActive ? "Active" : "Inactive"}</Typography>}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">FOV (Degrees):</Typography>
                  <TextField 
                    size="small"
                    type="number"
                    variant="outlined"
                    sx={{ width: 80, '& .MuiInputBase-input': { p: 0.5, fontSize: '0.75rem' } }}
                    defaultValue={satellite.sensor.fovDeg}
                    onBlur={(e) => onUpdateFov?.(satellite.id, "sensor", Number(e.target.value))}
                  />
                  <Typography variant="caption" color="text.secondary">&deg;</Typography>
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
