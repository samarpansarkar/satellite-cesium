import React from 'react';
import { Drawer, Box, Typography, List, ListItem, IconButton, ListItemIcon, Checkbox, ListItemText } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { OFFLINE_SATELLITES, SatelliteData } from "@/lib/satellites";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  hiddenSatellites: string[];
  onToggleSatellite: (id: string) => void;
  onOpenInfo: (sat: SatelliteData) => void;
}

const DRAWER_WIDTH = 340;

export default function Sidebar({ open, onClose, hiddenSatellites, onToggleSatellite, onOpenInfo }: SidebarProps) {
  return (
    <Drawer 
      anchor="left" 
      open={open} 
      onClose={onClose} 
      sx={{ 
        "& .MuiDrawer-paper": { 
          width: DRAWER_WIDTH, 
          boxSizing: "border-box", 
          bgcolor: "background.default",
          /* Hide scrollbar for Chrome, Safari and Opera */
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          /* Hide scrollbar for IE, Edge and Firefox */
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        } 
      }}
    >
      <Box sx={{ p: 3, pb: 2, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{ width: 8, height: 24, borderRadius: 4, background: 'linear-gradient(to bottom, #38bdf8, #0ea5e9)' }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Active Trackers</Typography>
          <Typography variant="caption" sx={{ bgcolor: 'primary.main', color: '#fff', px: 1.5, py: 0.5, borderRadius: 4, fontWeight: 'bold', ml: 'auto' }}>
            {OFFLINE_SATELLITES.length}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">Manage satellite visibility and telemetry overlays.</Typography>
      </Box>
      <List sx={{ p: 2, pt: 2 }}>
        {OFFLINE_SATELLITES.map((sat) => {
          const isVisible = !hiddenSatellites.includes(sat.id);
          return (
            <ListItem key={sat.id} disablePadding sx={{ mb: 1.5 }} secondaryAction={
              <IconButton edge="end" aria-label="info" onClick={() => onOpenInfo(sat)} sx={{ color: 'text.secondary', bgcolor: 'background.default', '&:hover': { color: sat.colorHex, bgcolor: 'background.paper' } }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            }>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 6, p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderLeft: `4px solid ${sat.colorHex}`, transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', '&:hover': { borderColor: sat.colorHex, transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${sat.colorHex}22` } }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Checkbox edge="start" checked={isVisible} onChange={() => onToggleSatellite(sat.id)} sx={{ color: 'text.disabled', '&.Mui-checked': { color: sat.colorHex } }} />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{sat.name}</Typography>}
                  secondary={<Typography variant="caption" sx={{ color: sat.colorHex, bgcolor: `${sat.colorHex}15`, px: 1, py: 0.25, borderRadius: 1, fontWeight: 600, display: 'inline-block' }}>{sat.type.toUpperCase()}</Typography>}
                />
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
