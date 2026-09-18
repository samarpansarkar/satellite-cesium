"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SpeedIcon from "@mui/icons-material/Speed";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloseIcon from "@mui/icons-material/Close";

import Navbar from "@/components/Navbar";
import { SatelliteData, useSatellites } from "@/lib/satellites";

const PRESET_COLORS = [
  "#38bdf8", // Sky Blue
  "#0ea5e9", // Electric Blue
  "#34d399", // Emerald Light
  "#10b981", // Teal Green
  "#a7f3d0", // Mint
  "#fbbf24", // Amber Yellow
  "#f59e0b", // Gold
  "#f97316", // Orange
  "#ea580c", // Deep Orange
  "#ef4444", // Crimson Red
  "#c084fc", // Lavender Violet
  "#a855f7", // Deep Purple
  "#ec4899", // Neon Pink
  "#6366f1", // Indigo
];

const COMMON_TYPES = [
  "Space Station",
  "Space Telescope",
  "Earth Observation",
  "Weather",
  "Weather (GEO)",
  "Navigation",
  "Communications",
  "Scientific",
  "Military / Defense",
  "Custom Payload",
];

function getOrbitCategory(altitudeKm: number): "LEO" | "MEO" | "GEO" {
  if (altitudeKm < 2000) return "LEO";
  if (altitudeKm < 35786) return "MEO";
  return "GEO";
}

function getCategoryColor(cat: "LEO" | "MEO" | "GEO"): string {
  switch (cat) {
    case "LEO":
      return "#38bdf8";
    case "MEO":
      return "#fbbf24";
    case "GEO":
      return "#ef4444";
  }
}

interface SatelliteFormData {
  id?: string;
  name: string;
  type: string;
  altitudeKm: number | string;
  inclinationDeg: number | string;
  periodSec: number | string;
  speedMultiplier: number | string;
  colorHex: string;
}

const DEFAULT_FORM: SatelliteFormData = {
  name: "",
  type: "Earth Observation",
  altitudeKm: 550,
  inclinationDeg: 53.0,
  periodSec: 95,
  speedMultiplier: 1.0,
  colorHex: "#38bdf8",
};

export default function SatellitesManagementPage() {
  const {
    satellites,
    addSatellite,
    updateSatellite,
    deleteSatellite,
    duplicateSatellite,
    resetToDefaults,
  } = useSatellites();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [orbitFilter, setOrbitFilter] = useState<"ALL" | "LEO" | "MEO" | "GEO">("ALL");

  // Modal Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SatelliteFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete Confirm Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [satToDelete, setSatToDelete] = useState<SatelliteData | null>(null);

  // Reset Confirm Dialog State
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Notification Toast State
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "info" | "warning" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message: string, severity: "success" | "info" | "warning" | "error" = "success") => {
    setToast({ open: true, message, severity });
  };

  // Stats
  const stats = useMemo(() => {
    const total = satellites.length;
    const leo = satellites.filter((s) => getOrbitCategory(s.altitudeKm) === "LEO").length;
    const meo = satellites.filter((s) => getOrbitCategory(s.altitudeKm) === "MEO").length;
    const geo = satellites.filter((s) => getOrbitCategory(s.altitudeKm) === "GEO").length;
    return { total, leo, meo, geo };
  }, [satellites]);

  // Filtered Satellites
  const filteredSatellites = useMemo(() => {
    return satellites.filter((sat) => {
      const matchesSearch =
        sat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sat.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sat.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (orbitFilter === "ALL") return true;
      return getOrbitCategory(sat.altitudeKm) === orbitFilter;
    });
  }, [satellites, searchTerm, orbitFilter]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (sat: SatelliteData) => {
    setIsEditing(true);
    setFormData({
      id: sat.id,
      name: sat.name,
      type: sat.type,
      altitudeKm: sat.altitudeKm,
      inclinationDeg: sat.inclinationDeg,
      periodSec: sat.periodSec,
      speedMultiplier: sat.speedMultiplier,
      colorHex: sat.colorHex,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Open Duplicate
  const handleDuplicate = (sat: SatelliteData) => {
    const duplicated = duplicateSatellite(sat.id);
    if (duplicated) {
      showToast(`Duplicated "${sat.name}" as "${duplicated.name}"`, "success");
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (sat: SatelliteData) => {
    setSatToDelete(sat);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (satToDelete) {
      deleteSatellite(satToDelete.id);
      showToast(`Deleted satellite "${satToDelete.name}"`, "info");
      setSatToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  // Confirm Reset
  const handleConfirmReset = () => {
    resetToDefaults();
    showToast("Restored fleet to default satellite configuration", "info");
    setResetConfirmOpen(false);
  };

  // Form Validation and Submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = "Satellite name is required";
    }
    const alt = Number(formData.altitudeKm);
    if (isNaN(alt) || alt < 100 || alt > 100000) {
      errors.altitudeKm = "Altitude must be between 100 km and 100,000 km";
    }
    const inc = Number(formData.inclinationDeg);
    if (isNaN(inc) || inc < 0 || inc > 180) {
      errors.inclinationDeg = "Inclination must be between 0° and 180°";
    }
    const period = Number(formData.periodSec);
    if (isNaN(period) || period <= 0) {
      errors.periodSec = "Period must be a positive number";
    }
    const speed = Number(formData.speedMultiplier);
    if (isNaN(speed) || speed <= 0 || speed > 20) {
      errors.speedMultiplier = "Speed multiplier must be between 0.1 and 20";
    }
    if (!formData.colorHex || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(formData.colorHex)) {
      errors.colorHex = "Valid Hex color code required (e.g. #38bdf8)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      type: formData.type.trim() || "Earth Observation",
      altitudeKm: Number(formData.altitudeKm),
      inclinationDeg: Number(formData.inclinationDeg),
      periodSec: Number(formData.periodSec),
      speedMultiplier: Number(formData.speedMultiplier),
      colorHex: formData.colorHex,
    };

    if (isEditing && formData.id) {
      updateSatellite(formData.id, payload);
      showToast(`Updated satellite "${payload.name}"`, "success");
    } else {
      addSatellite(payload);
      showToast(`Added new satellite "${payload.name}"`, "success");
    }

    setDialogOpen(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
        {/* Header section */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 4 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <RocketLaunchIcon sx={{ color: "primary.main", fontSize: 28 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                Fleet Database & Management
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Add new orbital assets, duplicate, edit orbital inclination, or delete satellites in real-time.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RestartAltIcon />}
              onClick={() => setResetConfirmOpen(true)}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px" }}
            >
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "8px",
                px: 2.5,
                bgcolor: "primary.main",
                color: "#090d16",
                boxShadow: "0 0 16px rgba(56, 189, 248, 0.4)",
                "&:hover": { bgcolor: "secondary.main" },
              }}
            >
              Add Satellite
            </Button>
          </Box>
        </Box>

        {/* Stats Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: "12px" }}>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase" }}>
                  Active Satellites
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", mt: 0.5 }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "rgba(56, 189, 248, 0.25)", borderRadius: "12px" }}>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: 600, textTransform: "uppercase" }}>
                    LEO (&lt; 2,000 km)
                  </Typography>
                  <Chip label="Low Orbit" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#38bdf8", mt: 0.5 }}>
                  {stats.leo}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "rgba(251, 191, 36, 0.25)", borderRadius: "12px" }}>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: "#fbbf24", fontWeight: 600, textTransform: "uppercase" }}>
                    MEO (2,000 - 35k km)
                  </Typography>
                  <Chip label="Medium Orbit" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "rgba(251, 191, 36, 0.15)", color: "#fbbf24" }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#fbbf24", mt: 0.5 }}>
                  {stats.meo}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "rgba(239, 68, 68, 0.25)", borderRadius: "12px" }}>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 600, textTransform: "uppercase" }}>
                    GEO (≥ 35,786 km)
                  </Typography>
                  <Chip label="Geostationary" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: "#ef4444", mt: 0.5 }}>
                  {stats.geo}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search & Filter Toolbar */}
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
          <TextField
            placeholder="Search by satellite name, type, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              width: { xs: "100%", sm: 360 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                bgcolor: "background.paper",
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Tabs
            value={orbitFilter}
            onChange={(_, val) => setOrbitFilter(val)}
            sx={{
              minHeight: 40,
              bgcolor: "background.paper",
              borderRadius: "8px",
              p: 0.5,
              border: "1px solid",
              borderColor: "divider",
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                minHeight: 32,
                py: 0.5,
                px: 2,
                fontSize: "0.85rem",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "6px",
                "&.Mui-selected": {
                  bgcolor: "rgba(56, 189, 248, 0.15)",
                  color: "primary.main",
                },
              },
            }}
          >
            <Tab value="ALL" label="All" />
            <Tab value="LEO" label="LEO" />
            <Tab value="MEO" label="MEO" />
            <Tab value="GEO" label="GEO" />
          </Tabs>
        </Box>

        {/* Satellite Data Table */}
        <TableContainer
          component={Paper}
          sx={{
            bgcolor: "background.paper",
            borderRadius: "12px",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            overflowX: "auto",
          }}
        >
          <Table sx={{ minWidth: 750 }}>
            <TableHead sx={{ bgcolor: "rgba(255, 255, 255, 0.02)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary", py: 1.8 }}>SATELLITE NAME & ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>TYPE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>ALTITUDE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>INCLINATION</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>ORBIT PERIOD</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>SPEED</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "text.secondary", pr: 3 }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSatellites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    <Typography variant="body1">No satellites found matching your search or filter.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSatellites.map((sat) => {
                  const orbitCat = getOrbitCategory(sat.altitudeKm);
                  const catColor = getCategoryColor(orbitCat);

                  return (
                    <TableRow
                      key={sat.id}
                      hover
                      sx={{
                        "&:hover": { bgcolor: "rgba(56, 189, 248, 0.04)" },
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          {/* Color Swatch Dot */}
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              bgcolor: sat.colorHex,
                              flexShrink: 0,
                              boxShadow: `0 0 8px ${sat.colorHex}99`,
                            }}
                          />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                              {sat.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.disabled", fontFamily: "monospace" }}>
                              {sat.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip
                            label={orbitCat}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              bgcolor: `${catColor}20`,
                              color: catColor,
                              border: `1px solid ${catColor}50`,
                            }}
                          />
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {sat.type}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                          {sat.altitudeKm.toLocaleString()} km
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {sat.inclinationDeg}°
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {sat.periodSec}s
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={<SpeedIcon sx={{ fontSize: "14px !important", color: "inherit !important" }} />}
                          label={`${sat.speedMultiplier}x`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.72rem",
                            bgcolor: "rgba(255, 255, 255, 0.06)",
                            color: "text.primary",
                          }}
                        />
                      </TableCell>

                      <TableCell align="right" sx={{ pr: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                          {/* Duplicate Action */}
                          <Tooltip title="Duplicate Satellite" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleDuplicate(sat)}
                              sx={{
                                color: "text.secondary",
                                "&:hover": { color: "#38bdf8", bgcolor: "rgba(56, 189, 248, 0.1)" },
                              }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Edit Action */}
                          <Tooltip title="Edit Satellite" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(sat)}
                              sx={{
                                color: "text.secondary",
                                "&:hover": { color: "#fbbf24", bgcolor: "rgba(251, 191, 36, 0.1)" },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Delete Action */}
                          <Tooltip title="Delete Satellite" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDelete(sat)}
                              sx={{
                                color: "text.secondary",
                                "&:hover": { color: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.1)" },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {/* Add / Edit Satellite Modal Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: "background.paper",
              borderRadius: "16px",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            },
          },
        }}
      >
        <DialogTitle component="div" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Typography component="div" variant="h6" sx={{ fontWeight: 700 }}>
            {isEditing ? "Edit Satellite Parameters" : "Add New Satellite Asset"}
          </Typography>
          <IconButton size="small" onClick={() => setDialogOpen(false)} sx={{ color: "text.secondary" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3 }}>
          <Grid container spacing={2.5}>
            {/* Name */}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Satellite Name"
                fullWidth
                size="small"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!formErrors.name}
                helperText={formErrors.name || "e.g. Starlink-4012, ISS (ZARYA), Hubble"}
                required
              />
            </Grid>

            {/* Type */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Satellite Classification"
                fullWidth
                size="small"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {COMMON_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Altitude */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Altitude (km)"
                type="number"
                fullWidth
                size="small"
                value={formData.altitudeKm}
                onChange={(e) => setFormData({ ...formData, altitudeKm: e.target.value })}
                error={!!formErrors.altitudeKm}
                helperText={formErrors.altitudeKm || "LEO: 100-2000, GEO: ~35,786"}
                required
              />
            </Grid>

            {/* Inclination */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Orbit Inclination (°)"
                type="number"
                fullWidth
                size="small"
                value={formData.inclinationDeg}
                onChange={(e) => setFormData({ ...formData, inclinationDeg: e.target.value })}
                error={!!formErrors.inclinationDeg}
                helperText={formErrors.inclinationDeg || "0° (Equatorial) to 90° (Polar)"}
                required
              />
            </Grid>

            {/* Orbit Period */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Orbit Period (seconds)"
                type="number"
                fullWidth
                size="small"
                value={formData.periodSec}
                onChange={(e) => setFormData({ ...formData, periodSec: e.target.value })}
                error={!!formErrors.periodSec}
                helperText={formErrors.periodSec || "Animation cycle period (e.g. 90)"}
                required
              />
            </Grid>

            {/* Speed Multiplier */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Speed Multiplier"
                type="number"
                fullWidth
                size="small"
                value={formData.speedMultiplier}
                onChange={(e) => setFormData({ ...formData, speedMultiplier: e.target.value })}
                error={!!formErrors.speedMultiplier}
                helperText={formErrors.speedMultiplier || "Relative motion speed (e.g. 1.0)"}
                slotProps={{ htmlInput: { step: 0.05, min: 0.05, max: 20 } }}
              />
            </Grid>

            {/* Custom Color Code */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Orbit Color Hex"
                fullWidth
                size="small"
                value={formData.colorHex}
                onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                error={!!formErrors.colorHex}
                helperText={formErrors.colorHex || "Custom hex code (e.g. #38bdf8)"}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: "40%",
                            bgcolor: formData.colorHex || "#fff",
                            border: "1px solid rgba(255,255,255,0.3)",
                          }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            {/* Palette Swatches */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", mb: 1, display: "block", fontWeight: 600 }}>
                ORBIT &amp; MARKER PRESET PALETTE
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {PRESET_COLORS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setFormData({ ...formData, colorHex: c })}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "6px",
                      bgcolor: c,
                      cursor: "pointer",
                      border: formData.colorHex.toLowerCase() === c.toLowerCase() ? "2px solid #fff" : "1px solid rgba(255,255,255,0.15)",
                      transform: formData.colorHex.toLowerCase() === c.toLowerCase() ? "scale(1.15)" : "scale(1)",
                      boxShadow: formData.colorHex.toLowerCase() === c.toLowerCase() ? `0 0 10px ${c}` : "none",
                      transition: "all 0.15s ease",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              bgcolor: "primary.main",
              color: "#090d16",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "8px",
              px: 3,
              "&:hover": { bgcolor: "secondary.main" },
            }}
          >
            {isEditing ? "Update Satellite" : "Create Satellite"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: "background.paper",
              borderRadius: "14px",
              border: "1px solid",
              borderColor: "divider",
            },
          },
        }}
      >
        <DialogTitle component="div" sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "#ef4444" }}>
          <WarningAmberIcon color="error" />
          <Typography component="div" variant="h6" sx={{ fontWeight: 700 }}>
            Delete Satellite?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: "#fff" }}>{satToDelete?.name}</strong>? It will immediately be removed from
            the active Cesium 3D globe visualization.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: "background.paper",
              borderRadius: "14px",
              border: "1px solid",
              borderColor: "divider",
            },
          },
        }}
      >
        <DialogTitle component="div" sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "#f59e0b" }}>
          <RestartAltIcon color="warning" />
          <Typography component="div" variant="h6" sx={{ fontWeight: 700 }}>
            Reset Fleet to Defaults?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            This will reset all custom satellites and restore the original 15 offline space assets (ISS, Tiangong, Hubble, GPS, Sentinel, etc.).
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setResetConfirmOpen(false)} color="inherit" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirmReset}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
          >
            Reset All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px", fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
