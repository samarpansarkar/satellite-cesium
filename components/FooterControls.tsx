import React from 'react';
import { Box, Typography, Slider, Divider, FormControlLabel, Switch, ToggleButtonGroup, ToggleButton, IconButton, Tooltip } from "@mui/material";
import SpeedIcon from "@mui/icons-material/Speed";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";

interface FooterControlsProps {
  simulationSpeed: number;
  onSimulationSpeedChange: (speed: number) => void;
  isPlaying?: boolean;
  onTogglePlayPause?: () => void;
  showOrbits: boolean;
  onShowOrbitsChange: (show: boolean) => void;
  showGrid?: boolean;
  onShowGridChange?: (show: boolean) => void;
  baseMapMode: "natural" | "grid";
  onBaseMapChange: (mode: "natural" | "grid") => void;
}

export default function FooterControls({
  simulationSpeed, onSimulationSpeedChange,
  isPlaying = true, onTogglePlayPause,
  showOrbits, onShowOrbitsChange,
  showGrid = false, onShowGridChange,
  baseMapMode, onBaseMapChange
}: FooterControlsProps) {
  return (
    <Box sx={{ height: 60, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", px: 3, gap: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", width: 340, gap: 1.5 }}>
        <Tooltip title={isPlaying ? "Pause simulation" : "Resume simulation"}>
          <IconButton
            size="small"
            onClick={onTogglePlayPause}
            aria-label={isPlaying ? "pause simulation" : "play simulation"}
            sx={{
              bgcolor: isPlaying ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.08)",
              border: "1px solid",
              borderColor: isPlaying ? "rgba(56, 189, 248, 0.4)" : "rgba(255, 255, 255, 0.15)",
              color: isPlaying ? "#38bdf8" : "text.secondary",
              "&:hover": {
                bgcolor: isPlaying ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.15)",
              },
              width: 32,
              height: 32,
            }}
          >
            {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <SpeedIcon fontSize="small" color="action" />
        <Slider
          value={simulationSpeed}
          onChange={(e, newValue) => onSimulationSpeedChange(newValue as number)}
          step={0.5} marks min={0} max={10} size="small" valueLabelDisplay="auto"
        />
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 35, textAlign: "right", fontWeight: 500 }}>
          {simulationSpeed}x
        </Typography>
      </Box>
      <Divider orientation="vertical" flexItem variant="middle" sx={{ my: 1.5 }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <FormControlLabel
          control={<Switch checked={showOrbits} onChange={(e) => onShowOrbitsChange(e.target.checked)} color="primary" size="small" />}
          label={<Typography variant="body2">Show Orbits</Typography>} sx={{ m: 0 }}
        />
        <FormControlLabel
          control={<Switch checked={showGrid} onChange={(e) => onShowGridChange?.(e.target.checked)} color="primary" size="small" />}
          label={<Typography variant="body2">Show Grid</Typography>} sx={{ m: 0 }}
        />
      </Box>
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
