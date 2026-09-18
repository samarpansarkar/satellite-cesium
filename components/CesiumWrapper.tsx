"use client";

import dynamic from "next/dynamic";
import { Box, CircularProgress, Typography } from "@mui/material";
import { SatelliteData } from "@/lib/satellites";

const CesiumViewer = dynamic(() => import("./CesiumViewer"), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CircularProgress color="primary" />
      <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
        Loading CesiumJS 3D Globe Engine...
      </Typography>
    </Box>
  ),
});

interface CesiumWrapperProps {
  satellites?: SatelliteData[];
  hiddenSatellites: string[];
  simulationSpeed: number;
  showOrbits: boolean;
  baseMapMode: "natural" | "grid";
}

export default function CesiumWrapper(props: CesiumWrapperProps) {
  return <CesiumViewer {...props} />;
}
