"use client";

import React, { useState } from "react";
import CesiumWrapper from "@/components/CesiumWrapper";
import { OFFLINE_SATELLITES, SatelliteData } from "@/lib/satellites";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Slider,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import SpeedIcon from "@mui/icons-material/Speed";

const DRAWER_WIDTH = 340;

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hiddenSatellites, setHiddenSatellites] = useState<string[]>([]);
  const [selectedSatInfo, setSelectedSatInfo] = useState<SatelliteData | null>(null);

  // New Global Controls
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [baseMapMode, setBaseMapMode] = useState<"natural" | "grid">("grid");

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleToggleSatellite = (id: string) => {
    setHiddenSatellites((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleOpenInfo = (sat: SatelliteData) => {
    setSelectedSatInfo(sat);
  };

  const handleCloseInfo = () => {
    setSelectedSatInfo(null);
  };

  const handleBaseMapChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: "natural" | "grid" | null
  ) => {
    if (newMode !== null) {
      setBaseMapMode(newMode);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Navbar */}
      <AppBar position="static" color="default" elevation={1} sx={{ bgcolor: "background.paper" }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            Satellite Cesium
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: "background.default",
          },
        }}
      >
        {/* Satellites List Section */}
        <Box sx={{ p: 2, pb: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }} gutterBottom>
            Satellites ({OFFLINE_SATELLITES.length})
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Toggle visibility and view live telemetry.
          </Typography>
        </Box>
        <List sx={{ pt: 0 }}>
          {OFFLINE_SATELLITES.map((sat) => {
            const isVisible = !hiddenSatellites.includes(sat.id);
            return (
              <ListItem
                key={sat.id}
                disablePadding
                secondaryAction={
                  <IconButton edge="end" aria-label="info" onClick={() => handleOpenInfo(sat)}>
                    <InfoIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={isVisible}
                    onChange={() => handleToggleSatellite(sat.id)}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ color: sat.colorHex, fontWeight: "bold" }}>
                      {sat.name}
                    </Typography>
                  }
                  secondary={sat.type}
                />
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        
        {/* 3D Map Container */}
        <Box sx={{ flexGrow: 1, position: "relative", overflow: "hidden" }}>
          <CesiumWrapper 
            hiddenSatellites={hiddenSatellites} 
            simulationSpeed={simulationSpeed}
            showOrbits={showOrbits}
            baseMapMode={baseMapMode}
          />

          {/* Top Right Info Panel */}
          {selectedSatInfo && (
            <Card
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 320,
                zIndex: 10,
                bgcolor: "background.paper",
                boxShadow: 6,
              }}
            >
              <CardHeader
                title={
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: selectedSatInfo.colorHex }}>
                    {selectedSatInfo.name}
                  </Typography>
                }
                subheader={selectedSatInfo.type}
                action={
                  <IconButton aria-label="close" onClick={handleCloseInfo}>
                    <CloseIcon />
                  </IconButton>
                }
              />
              <Divider />
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Altitude:</strong> {selectedSatInfo.altitudeKm.toLocaleString()} km
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Inclination:</strong> {selectedSatInfo.inclinationDeg}&deg;
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Orbital Period:</strong> {selectedSatInfo.periodSec} seconds
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Speed Multiplier:</strong> {selectedSatInfo.speedMultiplier}x
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Footer Controls */}
        <Box 
          sx={{ 
            height: 60, 
            bgcolor: "background.paper", 
            borderTop: "1px solid", 
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            px: 3,
            gap: 4
          }}
        >
          {/* Speed Control */}
          <Box sx={{ display: "flex", alignItems: "center", width: 300, gap: 2 }}>
            <SpeedIcon fontSize="small" color="action" />
            <Slider
              value={simulationSpeed}
              onChange={(e, newValue) => setSimulationSpeed(newValue as number)}
              step={0.5}
              marks
              min={0}
              max={10}
              size="small"
              valueLabelDisplay="auto"
            />
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30, textAlign: "right" }}>
              {simulationSpeed}x
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem variant="middle" sx={{ my: 1.5 }} />

          {/* Orbits Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={showOrbits}
                onChange={(e) => setShowOrbits(e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={<Typography variant="body2">Show Orbits</Typography>}
            sx={{ m: 0 }}
          />

          <Divider orientation="vertical" flexItem variant="middle" sx={{ my: 1.5 }} />

          {/* Map Layer Toggle */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Map Layer:
            </Typography>
            <ToggleButtonGroup
              value={baseMapMode}
              exclusive
              onChange={handleBaseMapChange}
              size="small"
            >
              <ToggleButton value="natural">Earth</ToggleButton>
              <ToggleButton value="grid">Grid</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
