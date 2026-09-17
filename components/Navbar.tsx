import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
      <Toolbar sx={{ minHeight: '64px' }}>
        <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2, '&:hover': { color: 'primary.main' } }} onClick={onMenuClick}>
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '8px', background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', color: '#fff' }}>
            <SatelliteAltIcon fontSize="small" />
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff 0%, #e2e8f0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Orbit Tracker
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
