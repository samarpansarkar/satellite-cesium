"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBar, Toolbar, IconButton, Box, Typography, Button, Chip } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import PublicIcon from "@mui/icons-material/Public";
import TuneIcon from "@mui/icons-material/Tune";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const isManagementPage = pathname === "/satellites";

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", zIndex: 1100 }}>
      <Toolbar sx={{ minHeight: '64px', px: { xs: 2, sm: 3 } }}>
        {onMenuClick && !isManagementPage && (
          <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2, '&:hover': { color: 'primary.main' } }} onClick={onMenuClick}>
            <MenuIcon />
          </IconButton>
        )}
        
        <Box 
          component={Link} 
          href="/" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none', 
            gap: 1.5,
            cursor: 'pointer'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: 36, 
            height: 36, 
            borderRadius: '8px', 
            background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', 
            color: '#fff',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)'
          }}>
            <SatelliteAltIcon fontSize="small" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff 0%, #e2e8f0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Orbit Tracker
            </Typography>
            <Chip 
              label="3D Live" 
              size="small" 
              sx={{ 
                height: 20, 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                bgcolor: 'rgba(56, 189, 248, 0.12)', 
                color: '#38bdf8', 
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: { xs: 'none', sm: 'inline-flex' }
              }} 
            />
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isManagementPage ? (
            <Button
              component={Link}
              href="/"
              variant="contained"
              startIcon={<PublicIcon />}
              sx={{
                bgcolor: 'primary.main',
                color: '#090d16',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '8px',
                px: 2,
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)',
                '&:hover': {
                  bgcolor: 'secondary.main',
                  boxShadow: '0 0 24px rgba(56, 189, 248, 0.55)',
                }
              }}
            >
              Back to 3D Globe
            </Button>
          ) : (
            <Button
              component={Link}
              href="/satellites"
              variant="outlined"
              startIcon={<TuneIcon />}
              sx={{
                borderColor: 'rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                bgcolor: 'rgba(56, 189, 248, 0.05)',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                px: 2,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: '#38bdf8',
                  bgcolor: 'rgba(56, 189, 248, 0.15)',
                  boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Manage Satellites
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
