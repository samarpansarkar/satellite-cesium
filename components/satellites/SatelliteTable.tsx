"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SpeedIcon from "@mui/icons-material/Speed";

import { SatelliteData } from "@/lib/satellites";
import { getOrbitCategory, getCategoryColor } from "./types";

interface SatelliteTableProps {
  satellites: SatelliteData[];
  onDuplicate: (sat: SatelliteData) => void;
  onEdit: (sat: SatelliteData) => void;
  onDelete: (sat: SatelliteData) => void;
}

export default function SatelliteTable({
  satellites,
  onDuplicate,
  onEdit,
  onDelete,
}: SatelliteTableProps) {
  return (
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
            <TableCell sx={{ fontWeight: 700, color: "text.secondary", py: 1.8 }}>SATELLITE NAME &amp; ID</TableCell>
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
          {satellites.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                <Typography variant="body1">No satellites found matching your search or filter.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            satellites.map((sat) => {
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
                          onClick={() => onDuplicate(sat)}
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
                          onClick={() => onEdit(sat)}
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
                          onClick={() => onDelete(sat)}
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
  );
}
