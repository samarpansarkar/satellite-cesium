import React, { useState } from 'react';
import { Drawer, Box, Typography, List, ListItem, IconButton, ListItemIcon, Checkbox, ListItemText, Button, Collapse, Switch, FormControlLabel } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { OFFLINE_SATELLITES, SatelliteData } from "@/lib/satellites";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  satellites?: SatelliteData[];
  hiddenSatellites: string[];
  onToggleSatellite: (id: string) => void;
  onUpdateSatellite?: (id: string, updatedData: Partial<SatelliteData>) => void;
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
  onUpdateSatellite,
  onOpenInfo,
  onShowAll,
  onHideAll,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };
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
          const isExpanded = !!expanded[sat.id];
          return (
            <React.Fragment key={sat.id}>
            <ListItem
              disablePadding
              divider
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    edge="end"
                    aria-label="info"
                    onClick={() => onOpenInfo(sat)}
                    size="small"
                    sx={{ color: 'text.secondary', mr: 0.5 }}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="expand"
                    onClick={() => toggleExpand(sat.id)}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                  >
                    {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </Box>
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
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 7, pr: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, letterSpacing: 0.5 }}>
                  SYSTEMS
                </Typography>
                {(!sat.cameras?.length && !sat.sensors?.length && !sat.communications?.length) ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1, py: 1 }}>
                    No systems installed
                  </Typography>
                ) : (
                  <>
                    {sat.cameras?.map(cam => (
                      <FormControlLabel
                        key={cam.id}
                        control={<Switch size="small" checked={cam.active} onChange={(e) => onUpdateSatellite?.(sat.id, { cameras: sat.cameras.map(c => c.id === cam.id ? { ...c, active: e.target.checked } : c) })} />}
                        label={<Typography variant="body2" sx={{ color: cam.colorHex || 'text.primary' }}>[CAM] {cam.name}</Typography>}
                      />
                    ))}
                    {sat.sensors?.map(sens => (
                      <FormControlLabel
                        key={sens.id}
                        control={<Switch size="small" checked={sens.active} onChange={(e) => onUpdateSatellite?.(sat.id, { sensors: sat.sensors.map(s => s.id === sens.id ? { ...s, active: e.target.checked } : s) })} />}
                        label={<Typography variant="body2" sx={{ color: sens.colorHex || 'text.primary' }}>[SNS] {sens.name}</Typography>}
                      />
                    ))}
                    {sat.communications?.map(comm => (
                      <FormControlLabel
                        key={comm.id}
                        control={<Switch size="small" checked={comm.active} onChange={(e) => onUpdateSatellite?.(sat.id, { communications: sat.communications.map(c => c.id === comm.id ? { ...c, active: e.target.checked } : c) })} />}
                        label={<Typography variant="body2" sx={{ color: comm.colorHex || 'text.primary' }}>[COM] {comm.name}</Typography>}
                      />
                    ))}
                  </>
                )}
              </Box>
            </Collapse>
            </React.Fragment>
          );
        })}
      </List>
    </Drawer>
  );
}
