import React from 'react';
import { Box, Typography, Slider, Divider, FormControlLabel, Switch, ToggleButtonGroup, ToggleButton } from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";

interface FooterControlsProps {
  simulationSpeed: number;
  onSimulationSpeedChange: (speed: number) => void;
  showOrbits: boolean;
  onShowOrbitsChange: (show: boolean) => void;
  baseMapMode: "natural" | "grid";
  onBaseMapChange: (mode: "natural" | "grid") => void;
}

export default function FooterControls({
  simulationSpeed, onSimulationSpeedChange,
  showOrbits, onShowOrbitsChange,
  baseMapMode, onBaseMapChange
}: FooterControlsProps) {
  return (
    <Box sx={{ height: 60, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", px: 3, gap: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", width: 300, gap: 2 }}>
        <SpeedIcon fontSize="small" color="action" />
        <Slider
          value={simulationSpeed}
          onChange={(e, newValue) => onSimulationSpeedChange(newValue as number)}
          step={0.5} marks min={0} max={10} size="small" valueLabelDisplay="auto"
        />
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30, textAlign: "right" }}>{simulationSpeed}x</Typography>
      </Box>
      <Divider orientation="vertical" flexItem variant="middle" sx={{ my: 1.5 }} />
      <FormControlLabel
        control={<Switch checked={showOrbits} onChange={(e) => onShowOrbitsChange(e.target.checked)} color="primary" size="small" />}
        label={<Typography variant="body2">Show Orbits</Typography>} sx={{ m: 0 }}
      />
      <Divider orientation="vertical" flexItem variant="middle" sx={{ my: 1.5 }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">Map Layer:</Typography>
        <ToggleButtonGroup
          value={baseMapMode} exclusive onChange={(e, newMode) => newMode && onBaseMapChange(newMode as "natural" | "grid")} size="small"
        >
          <ToggleButton value="natural">Earth</ToggleButton>
          <ToggleButton value="grid">Grid</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}
