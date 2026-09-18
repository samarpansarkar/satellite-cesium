"use client";

import React, { useState, useMemo } from "react";
import { Box, Container, Snackbar, Alert } from "@mui/material";

import Navbar from "@/components/Navbar";
import { SatelliteData, useSatellites } from "@/lib/satellites";
import { OrbitCategory, SatelliteFormData, DEFAULT_FORM, getOrbitCategory } from "@/components/satellites/types";
import SatelliteHeader from "@/components/satellites/SatelliteHeader";
import SatelliteStats from "@/components/satellites/SatelliteStats";
import SatelliteFilters from "@/components/satellites/SatelliteFilters";
import SatelliteTable from "@/components/satellites/SatelliteTable";
import SatelliteFormDialog from "@/components/satellites/SatelliteFormDialog";
import DeleteConfirmDialog from "@/components/satellites/DeleteConfirmDialog";
import ResetConfirmDialog from "@/components/satellites/ResetConfirmDialog";

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
  const [orbitFilter, setOrbitFilter] = useState<OrbitCategory>("ALL");

  // Modal Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SatelliteFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete & Reset Confirm Dialog States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [satToDelete, setSatToDelete] = useState<SatelliteData | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Notification Toast State
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "info" | "warning" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message: string, severity: "success" | "info" | "warning" | "error" = "success") => {
    setToast({ open: true, message, severity });
  };

  // Compute fleet statistics
  const stats = useMemo(() => {
    const total = satellites.length;
    const leo = satellites.filter((s) => getOrbitCategory(s.altitudeKm) === "LEO").length;
    const meo = satellites.filter((s) => getOrbitCategory(s.altitudeKm) === "MEO").length;
    const geo = satellites.filter((s) => getOrbitCategory(s.altitudeKm) === "GEO").length;
    return { total, leo, meo, geo };
  }, [satellites]);

  // Compute filtered satellites list
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

  // Dialog Handlers
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setDialogOpen(true);
  };

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

  const handleDuplicate = (sat: SatelliteData) => {
    const duplicated = duplicateSatellite(sat.id);
    if (duplicated) {
      showToast(`Duplicated "${sat.name}" as "${duplicated.name}"`, "success");
    }
  };

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
        {/* Page Header and Action Buttons */}
        <SatelliteHeader
          onAddClick={handleOpenCreate}
          onResetClick={() => setResetConfirmOpen(true)}
        />

        {/* Fleet Statistics Overview */}
        <SatelliteStats stats={stats} />

        {/* Search & Orbit Category Filters */}
        <SatelliteFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          orbitFilter={orbitFilter}
          onOrbitFilterChange={setOrbitFilter}
        />

        {/* Satellites Data Table */}
        <SatelliteTable
          satellites={filteredSatellites}
          onDuplicate={handleDuplicate}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
        />
      </Container>

      {/* Add / Edit Satellite Modal Dialog */}
      <SatelliteFormDialog
        open={dialogOpen}
        isEditing={isEditing}
        formData={formData}
        formErrors={formErrors}
        onClose={() => setDialogOpen(false)}
        onChange={setFormData}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        satellite={satToDelete}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Reset Confirmation Dialog */}
      <ResetConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
      />

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
