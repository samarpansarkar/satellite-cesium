"use client";

import React, { useState } from "react";
import CesiumWrapper from "@/components/CesiumWrapper";
import type { SatelliteData } from "@/lib/types";
import { useSatellites } from "@/lib/satellites";
import { Box } from "@mui/material";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import FooterControls from "@/components/FooterControls";
import SatelliteInfoPanel from "@/components/SatelliteInfoPanel";

export default function Home() {
  const { availableNames, satellites, loadSatellitesByNames, updateSatellite, updateAttachmentFov, updateSensorInclination } = useSatellites();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [selectedSatId, setSelectedSatId] = useState<string | null>(null);
  const selectedSatInfo = satellites.find(s => s.id === selectedSatId) || null;

  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [baseMapMode, setBaseMapMode] = useState<"natural" | "grid">("natural");

  const handleTogglePlayPause = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next && simulationSpeed === 0) {
        setSimulationSpeed(1);
      }
      return next;
    });
  };

  const handleSimulationSpeedChange = (speed: number) => {
    setSimulationSpeed(speed);
    if (speed > 0 && !isPlaying) {
      setIsPlaying(true);
    } else if (speed === 0) {
      setIsPlaying(false);
    }
  };

  const handleToggleName = (name: string) => {
    setSelectedNames((prev) => {
      const newNames = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
      loadSatellitesByNames(newNames);
      return newNames;
    });
  };

  const handleSelectAll = () => {
    setSelectedNames([...availableNames]);
    loadSatellitesByNames([...availableNames]);
  };

  const handleClearAll = () => {
    setSelectedNames([]);
    loadSatellitesByNames([]);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar onMenuClick={() => setDrawerOpen(!drawerOpen)} />
      
      <Sidebar 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        availableNames={availableNames}
        selectedNames={selectedNames}
        satellites={satellites}
        onToggleName={handleToggleName}
        onUpdateSatellite={updateSatellite}
        onUpdateSensorInclination={updateSensorInclination}
        onUpdateFov={updateAttachmentFov}
        onOpenInfo={(sat) => setSelectedSatId(sat.id)} 
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />

      <Box sx={{ flexGrow: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        
        {/* 3D Map Container */}
        <Box sx={{ flexGrow: 1, position: "relative", overflow: "hidden" }}>
          <CesiumWrapper 
            satellites={satellites}
            hiddenSatellites={[]} // We don't need hiddenSatellites anymore, as unselected ones just won't be fetched
            simulationSpeed={simulationSpeed}
            isPlaying={isPlaying}
            showOrbits={showOrbits}
            showGrid={showGrid}
            baseMapMode={baseMapMode}
          />

          <SatelliteInfoPanel 
            satellite={selectedSatInfo} 
            onClose={() => setSelectedSatId(null)} 
            isPlaying={isPlaying}
            onTogglePlayPause={handleTogglePlayPause}
            onUpdateSatellite={updateSatellite}
            onUpdateFov={updateAttachmentFov}
            onUpdateSensorInclination={updateSensorInclination}
          />
        </Box>

        <FooterControls 
          simulationSpeed={simulationSpeed} 
          onSimulationSpeedChange={handleSimulationSpeedChange} 
          isPlaying={isPlaying}
          onTogglePlayPause={handleTogglePlayPause}
          showOrbits={showOrbits} 
          onShowOrbitsChange={setShowOrbits} 
          showGrid={showGrid}
          onShowGridChange={setShowGrid}
          baseMapMode={baseMapMode} 
          onBaseMapChange={setBaseMapMode} 
        />
      </Box>
    </Box>
  );
}
