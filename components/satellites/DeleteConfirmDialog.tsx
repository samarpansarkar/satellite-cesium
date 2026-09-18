"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { SatelliteData } from "@/lib/satellites";

interface DeleteConfirmDialogProps {
  open: boolean;
  satellite: SatelliteData | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmDialog({
  open,
  satellite,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          <strong style={{ color: "#fff" }}>{satellite?.name}</strong>? It will immediately be removed from
          the active Cesium 3D globe visualization.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
        >
          Confirm Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
