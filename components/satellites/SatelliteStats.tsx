"use client";

import React from "react";
import { Grid, Card, CardContent, Typography, Box, Chip } from "@mui/material";

interface SatelliteStatsProps {
  stats: {
    total: number;
    leo: number;
    meo: number;
    geo: number;
  };
}

export default function SatelliteStats({ stats }: SatelliteStatsProps) {
  return (
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
  );
}
