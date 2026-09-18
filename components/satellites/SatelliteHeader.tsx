"use client";

import React from "react";
import { Box, Typography, Button } from "@mui/material";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AddIcon from "@mui/icons-material/Add";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

interface SatelliteHeaderProps {
  onAddClick: () => void;
  onResetClick: () => void;
}

export default function SatelliteHeader({ onAddClick, onResetClick }: SatelliteHeaderProps) {
  return (
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
          onClick={onResetClick}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: "8px" }}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddClick}
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
  );
}
