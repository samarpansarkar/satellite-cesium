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
import RestartAltIcon from "@mui/icons-material/RestartAlt";

interface ResetConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResetConfirmDialog({
  open,
  onClose,
  onConfirm,
}: ResetConfirmDialogProps) {
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
        <Button onClick={onClose} color="inherit" sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={onConfirm}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
        >
          Reset All
        </Button>
      </DialogActions>
    </Dialog>
  );
}
