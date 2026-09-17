import React from 'react';
import { Card, CardHeader, CardContent, Typography, IconButton, Divider } from "@mui/material";
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
        title={<Typography variant="subtitle1" sx={{ fontWeight: "bold", color: satellite.colorHex }}>{satellite.name}</Typography>}
        subheader={satellite.type}
        action={<IconButton aria-label="close" onClick={onClose}><CloseIcon /></IconButton>}
      />
      <Divider />
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom><strong>Altitude:</strong> {satellite.altitudeKm.toLocaleString()} km</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom><strong>Inclination:</strong> {satellite.inclinationDeg}&deg;</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom><strong>Orbital Period:</strong> {satellite.periodSec} seconds</Typography>
        <Typography variant="body2" color="text.secondary"><strong>Speed Multiplier:</strong> {satellite.speedMultiplier}x</Typography>
      </CardContent>
    </Card>
  );
}
