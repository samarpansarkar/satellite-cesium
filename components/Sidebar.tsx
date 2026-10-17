import React, { useState } from 'react';
import { Drawer, Box, Typography, List, ListItem, IconButton, ListItemIcon, Checkbox, ListItemText, Button, Collapse, Switch, FormControlLabel, TextField, Slider } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type { SatelliteData } from "@/lib/types";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  availableNames: string[];
  selectedNames: string[];
  onToggleName: (name: string) => void;
  satellites: SatelliteData[]; // Detailed data when loaded
  onUpdateSatellite?: (id: string, updatedData: Partial<SatelliteData>) => void;
  onUpdateSensorInclination?: (id: string, inclinationDeg: number) => void;
  onUpdateFov?: (id: string, type: "camera" | "sensor", fovDeg: number) => void;
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
  onUpdateSensorInclination,
  onUpdateFov,
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
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(56, 189, 248, 0.45) rgba(10, 25, 47, 0.3)",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(10, 25, 47, 0.3)",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(56, 189, 248, 0.4)",
            borderRadius: "4px",
            "&:hover": {
              background: "rgba(56, 189, 248, 0.7)",
            },
          },
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: 'rgba(56, 189, 248, 0.06)', p: 1, borderRadius: 1.5, my: 0.5, border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <FormControlLabel
                            control={<Switch size="small" checked={satData.camera.isActive} onChange={(e) => onUpdateSatellite?.(satData.id, { camera: { ...satData.camera!, isActive: e.target.checked } })} />}
                            label={<Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>Camera</Typography>}
                          />
                          <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700, fontFamily: 'monospace' }}>
                            {satData.camera.fovDeg}°
                          </Typography>
                        </Box>
                        
                        <Box sx={{ px: 0.5, mt: -0.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              FOV Angle:
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              variant="outlined"
                              sx={{ width: 68, '& .MuiInputBase-input': { p: '1px 4px', fontSize: '0.72rem', textAlign: 'right' } }}
                              value={satData.camera.fovDeg}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                onUpdateFov?.(satData.id, "camera", val);
                                onUpdateSatellite?.(satData.id, {
                                  camera: {
                                    ...satData.camera!,
                                    fovDeg: val
                                  }
                                });
                              }}
                            />
                          </Box>
                          <Slider
                            size="small"
                            min={5}
                            max={120}
                            step={1}
                            value={satData.camera.fovDeg}
                            onChange={(_, val) => {
                              const numVal = val as number;
                              onUpdateFov?.(satData.id, "camera", numVal);
                              onUpdateSatellite?.(satData.id, {
                                camera: {
                                  ...satData.camera!,
                                  fovDeg: numVal
                                }
                              });
                            }}
                            sx={{ color: '#0284c7', py: 0.5 }}
                          />
                        </Box>
                      </Box>
                    )}

                    {satData.sensor && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: 'rgba(249, 115, 22, 0.06)', p: 1, borderRadius: 1.5, my: 0.5, border: '1px solid rgba(249, 115, 22, 0.15)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <FormControlLabel
                            control={<Switch size="small" checked={satData.sensor.isActive} onChange={(e) => onUpdateSatellite?.(satData.id, { sensor: { ...satData.sensor!, isActive: e.target.checked } })} />}
                            label={<Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>Sensor</Typography>}
                          />
                          <Typography variant="caption" sx={{ color: '#f97316', fontWeight: 700, fontFamily: 'monospace' }}>
                            {(satData.sensor.inclinationDeg ?? satData.sensor.inclinationDegree ?? 90)}°
                          </Typography>
                        </Box>

                        {/* Sensor FOV Control */}
                        <Box sx={{ px: 0.5, mt: -0.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              FOV Angle:
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              variant="outlined"
                              sx={{ width: 68, '& .MuiInputBase-input': { p: '1px 4px', fontSize: '0.72rem', textAlign: 'right' } }}
                              value={satData.sensor.fovDeg}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                onUpdateFov?.(satData.id, "sensor", val);
                                onUpdateSatellite?.(satData.id, {
                                  sensor: {
                                    ...satData.sensor!,
                                    fovDeg: val
                                  }
                                });
                              }}
                            />
                          </Box>
                          <Slider
                            size="small"
                            min={5}
                            max={120}
                            step={1}
                            value={satData.sensor.fovDeg}
                            onChange={(_, val) => {
                              const numVal = val as number;
                              onUpdateFov?.(satData.id, "sensor", numVal);
                              onUpdateSatellite?.(satData.id, {
                                sensor: {
                                  ...satData.sensor!,
                                  fovDeg: numVal
                                }
                              });
                            }}
                            sx={{ color: '#f97316', py: 0.5 }}
                          />
                        </Box>
                        
                        {/* Sensor Inclination / Steering Control */}
                        <Box sx={{ px: 0.5, borderTop: '1px dashed rgba(249, 115, 22, 0.2)', pt: 0.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Inclination (Aim):
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              variant="outlined"
                              sx={{ width: 68, '& .MuiInputBase-input': { p: '1px 4px', fontSize: '0.72rem', textAlign: 'right' } }}
                              value={satData.sensor.inclinationDeg ?? satData.sensor.inclinationDegree ?? 90}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                onUpdateSensorInclination?.(satData.id, val);
                                onUpdateSatellite?.(satData.id, {
                                  sensor: {
                                    ...satData.sensor!,
                                    inclinationDeg: val,
                                    inclinationDegree: val
                                  }
                                });
                              }}
                            />
                          </Box>
                          <Slider
                            size="small"
                            min={0}
                            max={180}
                            step={0.5}
                            value={satData.sensor.inclinationDeg ?? satData.sensor.inclinationDegree ?? 90}
                            onChange={(_, val) => {
                              const numVal = val as number;
                              onUpdateSensorInclination?.(satData.id, numVal);
                              onUpdateSatellite?.(satData.id, {
                                sensor: {
                                  ...satData.sensor!,
                                  inclinationDeg: numVal,
                                  inclinationDegree: numVal
                                }
                              });
                            }}
                            sx={{ color: '#f97316', py: 0.5 }}
                          />
                        </Box>
                      </Box>
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
