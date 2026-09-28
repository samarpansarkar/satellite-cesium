import React from 'react';
import { Card, CardHeader, CardContent, Typography, IconButton, Divider, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { SatelliteData } from "@/lib/satellites";

interface SatelliteInfoPanelProps {
  satellite: SatelliteData | null;
  onClose: () => void;
}

export default function SatelliteInfoPanel({ satellite, onClose }: SatelliteInfoPanelProps) {
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
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>📷 Cameras</Typography>
            {satellite.cameras?.length > 0 ? (
              satellite.cameras.map(c => (
                <Typography key={c.id} variant="body2" sx={{ color: 'text.primary', pl: 2 }}>• {c.name}</Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 2 }}>This satellite doesn't have any cameras attached</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>📡 Sensors</Typography>
            {satellite.sensors?.length > 0 ? (
              satellite.sensors.map(s => (
                <Typography key={s.id} variant="body2" sx={{ color: 'text.primary', pl: 2 }}>• {s.name}</Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 2 }}>This satellite doesn't have any sensors attached</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>🛰️ Communications</Typography>
            {satellite.communications?.length > 0 ? (
              satellite.communications.map(c => (
                <Typography key={c.id} variant="body2" sx={{ color: 'text.primary', pl: 2 }}>• {c.name}</Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 2 }}>This satellite doesn't have any communications attached</Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
