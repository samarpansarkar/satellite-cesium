"use client";

import React from "react";
import { Box, TextField, InputAdornment, Tabs, Tab } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { OrbitCategory } from "./types";

interface SatelliteFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  orbitFilter: OrbitCategory;
  onOrbitFilterChange: (val: OrbitCategory) => void;
}

export default function SatelliteFilters({
  searchTerm,
  onSearchChange,
  orbitFilter,
  onOrbitFilterChange,
}: SatelliteFiltersProps) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
      <TextField
        placeholder="Search by satellite name, type, or ID..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
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
        onChange={(_, val) => onOrbitFilterChange(val)}
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
  );
}
