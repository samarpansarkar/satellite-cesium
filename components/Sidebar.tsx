import React, { useState } from 'react';
import { Drawer, Box, Typography, List, ListItem, IconButton, ListItemIcon, Checkbox, ListItemText, Button, Collapse, Switch, FormControlLabel } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { SatelliteData } from "@/lib/satellites";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  availableNames: string[];
  selectedNames: string[];
  onToggleName: (name: string) => void;
  onSubmit: () => void;
  satellites: SatelliteData[]; // Detailed data when loaded
  onUpdateSatellite?: (id: string, updatedData: Partial<SatelliteData>) => void;
  onOpenInfo: (sat: SatelliteData) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

const DRAWER_WIDTH = 340;

export default function Sidebar({
  open,
  onClose,
  availableNames = [],
  selectedNames = [],
  onToggleName,
  onSubmit,
  satellites = [],
  onUpdateSatellite,
  onOpenInfo,
  onSelectAll,
  onClearAll,
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
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }
      }}
    >
      <Box sx={{ p: 3, pb: 2, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", position: "sticky", top: 0, zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Satellites
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {availableNames.length} Available
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Select satellites and submit to display on map
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <Button size="small" variant="outlined" color="primary" onClick={onSelectAll} fullWidth>
            Select All
          </Button>
          <Button size="small" variant="outlined" color="warning" onClick={onClearAll} fullWidth>
            Clear All
          </Button>
        </Box>
        <Button variant="contained" color="primary" onClick={onSubmit} fullWidth>
          Submit Selected ({selectedNames.length})
        </Button>
      </Box>

      <List sx={{ p: 0 }}>
        {availableNames.map((name) => {
          const isSelected = selectedNames.includes(name);
          const satData = satellites.find(s => s.name === name || s.name === name.toUpperCase());
          const isExpanded = satData ? !!expanded[satData.id] : false;
          
          return (
            <React.Fragment key={name}>
              <ListItem
                disablePadding
                divider
                secondaryAction={
                  satData && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        edge="end"
                        aria-label="info"
                        onClick={() => onOpenInfo(satData)}
                        size="small"
                        sx={{ color: 'text.secondary', mr: 0.5 }}
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                      {/* 
                      <IconButton
                        edge="end"
                        aria-label="expand"
                        onClick={() => toggleExpand(satData.id)}
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                      */}
                    </Box>
                  )
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
                      checked={isSelected}
                      onChange={() => onToggleName(name)}
                      size="small"
                      sx={{ color: 'text.disabled', '&.Mui-checked': { color: 'primary.main' } }}
                    />
                  </ListItemIcon>

                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: satData ? '#38bdf8' : '#888',
                      mr: 2,
                      boxShadow: satData ? `0 0 4px #38bdf880` : 'none'
                    }}
                  />

                  <ListItemText
                    primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{name}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">{satData ? satData.type : "Not Loaded"}</Typography>}
                  />
                </Box>
              </ListItem>
              
              {/* satData && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ pl: 7, pr: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, letterSpacing: 0.5, mt: 1 }}>
                      CAMERAS
                    </Typography>
                    {satData.cameras?.length > 0 ? (
                      satData.cameras.map(cam => (
                        <FormControlLabel
                          key={cam.id}
                          control={<Switch size="small" checked={cam.active} onChange={(e) => onUpdateSatellite?.(satData.id, { cameras: satData.cameras.map(c => c.id === cam.id ? { ...c, active: e.target.checked } : c) })} />}
                          label={<Typography variant="body2" sx={{ color: 'text.primary' }}>{cam.name}</Typography>}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>
                        No cameras attached
                      </Typography>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, letterSpacing: 0.5, mt: 1 }}>
                      SENSORS
                    </Typography>
                    {satData.sensors?.length > 0 ? (
                      satData.sensors.map(sens => (
                        <FormControlLabel
                          key={sens.id}
                          control={<Switch size="small" checked={sens.active} onChange={(e) => onUpdateSatellite?.(satData.id, { sensors: satData.sensors.map(s => s.id === sens.id ? { ...s, active: e.target.checked } : s) })} />}
                          label={<Typography variant="body2" sx={{ color: 'text.primary' }}>{sens.name}</Typography>}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>
                        No sensors attached
                      </Typography>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, letterSpacing: 0.5, mt: 1 }}>
                      COMMUNICATIONS
                    </Typography>
                    {satData.communications?.length > 0 ? (
                      satData.communications.map(comm => (
                        <FormControlLabel
                          key={comm.id}
                          control={<Switch size="small" checked={comm.active} onChange={(e) => onUpdateSatellite?.(satData.id, { communications: satData.communications.map(c => c.id === comm.id ? { ...c, active: e.target.checked } : c) })} />}
                          label={<Typography variant="body2" sx={{ color: 'text.primary' }}>{comm.name}</Typography>}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pl: 1 }}>
                        No communications attached
                      </Typography>
                    )}
                  </Box>
                </Collapse>
              ) */}
            </React.Fragment>
          );
        })}
      </List>
    </Drawer>
  );
}
