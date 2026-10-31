import React, { useState } from 'react';
import {
  Drawer, Box, Typography, List, ListItem, IconButton,
  ListItemIcon, Checkbox, ListItemText, Button, Collapse,
  Switch, FormControlLabel, Divider,
} from "@mui/material";
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
  satellites: SatelliteData[];
  onUpdateSatellite?: (id: string, updatedData: Partial<SatelliteData>) => void;
  onOpenInfo: (sat: SatelliteData) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  defaultExpanded?: Record<string, boolean> | boolean;
  ModalProps?: React.ComponentProps<typeof Drawer>["ModalProps"];
}

const DRAWER_WIDTH = 320;

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
  defaultExpanded,
  ModalProps,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    if (typeof defaultExpanded === "boolean") {
      return defaultExpanded ? Object.fromEntries(satellites.map((s) => [s.id, true])) : {};
    }
    return defaultExpanded || {};
  });

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={ModalProps}
      sx={{
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          bgcolor: "background.default",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(56, 189, 248, 0.45) rgba(10, 25, 47, 0.3)",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "rgba(10, 25, 47, 0.3)" },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(56, 189, 248, 0.4)",
            borderRadius: "4px",
            "&:hover": { background: "rgba(56, 189, 248, 0.7)" },
          },
        },
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ p: 3, pb: 2, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", position: "sticky", top: 0, zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Satellites</Typography>
          <Typography variant="body2" color="text.secondary">{availableNames.length} Available</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Select satellites to display on map
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" color="primary" onClick={onSelectAll} fullWidth>Select All</Button>
          <Button size="small" variant="outlined" color="warning" onClick={onClearAll} fullWidth>Clear All</Button>
        </Box>
      </Box>

      {/* ── Satellite List ──────────────────────────────────────────────────── */}
      <List sx={{ p: 0 }}>
        {availableNames.map((name) => {
          const isSelected = selectedNames.includes(name);
          const satData = satellites.find(s => s.name === name || s.name === name.toUpperCase());
          const hasAttachments = Boolean(satData);
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
                      {hasAttachments && (
                        <IconButton
                          edge="end"
                          aria-label="expand attachments"
                          onClick={() => toggleExpand(satData.id)}
                          size="small"
                          sx={{ color: 'text.secondary' }}
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
                    display: 'flex', alignItems: 'center', width: '100%',
                    px: 2, py: 1,
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'action.hover' },
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

                  <Box sx={{
                    width: 10, height: 10, borderRadius: '50%',
                    bgcolor: satData ? '#38bdf8' : '#888', mr: 2,
                    boxShadow: satData ? '0 0 4px #38bdf880' : 'none',
                  }} />

                  <ListItemText
                    primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{name}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">{satData ? satData.type : "Not Loaded"}</Typography>}
                  />
                </Box>
              </ListItem>

              {/* ── Tracks & Attachments Toggles ─────────────────────────── */}
              {hasAttachments && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{
                    pl: 6, pr: 2.5, py: 1.5,
                    display: 'flex', flexDirection: 'column', gap: 1.25,
                    bgcolor: 'action.hover',
                    borderBottom: '1px solid', borderColor: 'divider',
                  }}>
                    {/* ── 1. Tracks Section ──────────────────────────────── */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 700,
                          letterSpacing: 0.8,
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          mb: 0.25,
                        }}
                      >
                        Tracks
                      </Typography>

                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={Boolean(satData!.showGroundTrack)}
                            onChange={(e) => onUpdateSatellite?.(satData!.id, {
                              showGroundTrack: e.target.checked,
                            })}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#f59e0b",
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "#f59e0b",
                              },
                            }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Ground Track</Typography>}
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={Boolean(satData!.showSwath)}
                            onChange={(e) => onUpdateSatellite?.(satData!.id, {
                              showSwath: e.target.checked,
                            })}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#06b6d4",
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "#06b6d4",
                              },
                            }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Swath Track</Typography>}
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={Boolean(satData!.showOrbit)}
                            onChange={(e) => onUpdateSatellite?.(satData!.id, {
                              showOrbit: e.target.checked,
                            })}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#38bdf8",
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "#38bdf8",
                              },
                            }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Orbit Path</Typography>}
                      />
                    </Box>

                    <Divider sx={{ borderColor: 'divider', my: 0.25 }} />

                    {/* ── 2. Attachments Section ─────────────────────────── */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 700,
                          letterSpacing: 0.8,
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          mb: 0.25,
                        }}
                      >
                        Attachments
                      </Typography>

                      {satData!.camera && (
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={Boolean(satData!.camera.isActive)}
                              onChange={(e) => onUpdateSatellite?.(satData!.id, {
                                camera: { ...satData!.camera!, isActive: e.target.checked },
                              })}
                              sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": {
                                  color: "#38bdf8",
                                },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                  backgroundColor: "#38bdf8",
                                },
                              }}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>Camera</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>(Torch Light)</Typography>
                            </Box>
                          }
                        />
                      )}

                      {satData!.sensor && (
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={Boolean(satData!.sensor.isActive)}
                              onChange={(e) => onUpdateSatellite?.(satData!.id, {
                                sensor: { ...satData!.sensor!, isActive: e.target.checked },
                              })}
                              sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": {
                                  color: "#f97316",
                                },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                  backgroundColor: "#f97316",
                                },
                              }}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>Sensor</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>(Scanner Cone)</Typography>
                            </Box>
                          }
                        />
                      )}

                      {satData!.communication && (
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={Boolean(satData!.communication.isActive)}
                              onChange={(e) => onUpdateSatellite?.(satData!.id, {
                                communication: { ...satData!.communication!, isActive: e.target.checked },
                              })}
                              sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": {
                                  color: "#ec4899",
                                },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                  backgroundColor: "#ec4899",
                                },
                              }}
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Communication</Typography>}
                        />
                      )}

                      {!satData!.camera && !satData!.sensor && !satData!.communication && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 0.5 }}>
                          No attachments installed
                        </Typography>
                      )}
                    </Box>
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
