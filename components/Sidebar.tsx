import React from 'react';
import { Drawer, Box, Typography, List, ListItem, IconButton, ListItemIcon, Checkbox, ListItemText, Button } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { OFFLINE_SATELLITES, SatelliteData } from "@/lib/satellites";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  satellites?: SatelliteData[];
  hiddenSatellites: string[];
  onToggleSatellite: (id: string) => void;
  onOpenInfo: (sat: SatelliteData) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

const DRAWER_WIDTH = 340;

export default function Sidebar({
  open,
  onClose,
  satellites = OFFLINE_SATELLITES,
  hiddenSatellites,
  onToggleSatellite,
  onOpenInfo,
  onShowAll,
  onHideAll,
}: SidebarProps) {
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Satellites
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {satellites.length} Total
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Select satellites to display on map
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" color="primary" onClick={onShowAll} fullWidth>
            Show All
          </Button>
          <Button size="small" variant="outlined" color="warning" onClick={onHideAll} fullWidth>
            Hide All
          </Button>
        </Box>
      </Box>

      <List sx={{ p: 0 }}>
        {satellites.map((sat) => {
          const isVisible = !hiddenSatellites.includes(sat.id);
          return (
            <ListItem
              key={sat.id}
              disablePadding
              divider
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="info"
                  onClick={() => onOpenInfo(sat)}
                  size="small"
                  sx={{ color: 'text.secondary' }}
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              }
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  px: 2,
                  py: 1,
                  transition: 'background-color 0.2s',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Checkbox
                    edge="start"
                    checked={isVisible}
                    onChange={() => onToggleSatellite(sat.id)}
                    size="small"
                    sx={{ color: 'text.disabled', '&.Mui-checked': { color: 'primary.main' } }}
                  />
                </ListItemIcon>

                {/* Color Indicator Dot */}
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: sat.colorHex,
                    mr: 2,
                    boxShadow: `0 0 4px ${sat.colorHex}80`
                  }}
                />

                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{sat.name}</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">{sat.type}</Typography>}
                />
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
