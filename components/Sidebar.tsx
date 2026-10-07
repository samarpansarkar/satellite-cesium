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
          Select satellites to display on map
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <Button size="small" variant="outlined" color="primary" onClick={onSelectAll} fullWidth>
            Select All
          </Button>
          <Button size="small" variant="outlined" color="warning" onClick={onClearAll} fullWidth>
            Clear All
          </Button>
        </Box>
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
                      {(satData.camera || satData.sensor || satData.communication) && (
                        <IconButton
                          edge="end"
                          aria-label="expand"
                          onClick={() => toggleExpand(satData.id)}
                          size="small"
                          sx={{ color: 'text.secondary', ml: 0.5 }}
                        >
                          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                      )}
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
              
              {satData && (satData.camera || satData.sensor || satData.communication) && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ pl: 7, pr: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, letterSpacing: 0.5 }}>
                      ATTACHMENTS
                    </Typography>

                    {satData.camera && (
                      <FormControlLabel
                        control={<Switch size="small" checked={satData.camera.isActive} onChange={(e) => onUpdateSatellite?.(satData.id, { camera: { ...satData.camera!, isActive: e.target.checked } })} />}
                        label={<Typography variant="body2" sx={{ color: 'text.primary' }}>Camera</Typography>}
                      />
                    )}

                    {satData.sensor && (
                      <FormControlLabel
                        control={<Switch size="small" checked={satData.sensor.isActive} onChange={(e) => onUpdateSatellite?.(satData.id, { sensor: { ...satData.sensor!, isActive: e.target.checked } })} />}
                        label={<Typography variant="body2" sx={{ color: 'text.primary' }}>Sensor</Typography>}
                      />
                    )}

                    {satData.communication && (
                      <FormControlLabel
                        control={<Switch size="small" checked={satData.communication.isActive} onChange={(e) => onUpdateSatellite?.(satData.id, { communication: { ...satData.communication!, isActive: e.target.checked } })} />}
                        label={<Typography variant="body2" sx={{ color: 'text.primary' }}>Communication</Typography>}
                      />
                    )}
                  </Box>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </List>
    </Drawer>
  );
}
