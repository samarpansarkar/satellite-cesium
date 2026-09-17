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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";

const DRAWER_WIDTH = 300;

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hiddenSatellites, setHiddenSatellites] = useState<string[]>([]);
  const [selectedSatInfo, setSelectedSatInfo] = useState<SatelliteData | null>(null);

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
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }} gutterBottom>
            Satellites
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Toggle visibility and view details.
          </Typography>
        </Box>
        <Divider />
        <List>
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
      <Box sx={{ flexGrow: 1, position: "relative", overflow: "hidden" }}>
        <CesiumWrapper hiddenSatellites={hiddenSatellites} />

        {/* Top Right Info Panel */}
        {selectedSatInfo && (
          <Card
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 300,
              zIndex: 10,
              bgcolor: "background.paper",
              boxShadow: 3,
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
                <strong>Altitude:</strong> {selectedSatInfo.altitudeKm} km
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
    </Box>
  );
}
