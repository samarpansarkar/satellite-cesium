"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Button,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { SatelliteFormData, COMMON_TYPES, PRESET_COLORS } from "./types";

interface SatelliteFormDialogProps {
  open: boolean;
  isEditing: boolean;
  formData: SatelliteFormData;
  formErrors: Record<string, string>;
  onClose: () => void;
  onChange: (data: SatelliteFormData) => void;
  onSave: () => void;
}

export default function SatelliteFormDialog({
  open,
  isEditing,
  formData,
  formErrors,
  onClose,
  onChange,
  onSave,
}: SatelliteFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
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
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
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
              onChange={(e) => onChange({ ...formData, type: e.target.value })}
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
              onChange={(e) => onChange({ ...formData, altitudeKm: e.target.value })}
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
              onChange={(e) => onChange({ ...formData, inclinationDeg: e.target.value })}
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
              onChange={(e) => onChange({ ...formData, periodSec: e.target.value })}
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
              onChange={(e) => onChange({ ...formData, speedMultiplier: e.target.value })}
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
              onChange={(e) => onChange({ ...formData, colorHex: e.target.value })}
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
                  onClick={() => onChange({ ...formData, colorHex: c })}
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
        <Button onClick={onClose} color="inherit" sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
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
  );
}
