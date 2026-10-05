"use client";

import React, { useState } from "react";
import CesiumWrapper from "@/components/CesiumWrapper";
import { SatelliteData, useSatellites } from "@/lib/satellites";
import { Box } from "@mui/material";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import FooterControls from "@/components/FooterControls";
import SatelliteInfoPanel from "@/components/SatelliteInfoPanel";

export default function Home() {
  const { availableNames, satellites, isLoaded, loadSatellitesByNames, updateSatellite } = useSatellites();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [selectedSatInfo, setSelectedSatInfo] = useState<SatelliteData | null>(null);

  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [baseMapMode, setBaseMapMode] = useState<"natural" | "grid">("natural");

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
        onOpenInfo={setSelectedSatInfo} 
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
            showOrbits={showOrbits}
            baseMapMode={baseMapMode}
          />

          <SatelliteInfoPanel 
            satellite={selectedSatInfo} 
            onClose={() => setSelectedSatInfo(null)} 
          />
        </Box>

        <FooterControls 
          simulationSpeed={simulationSpeed} 
          onSimulationSpeedChange={setSimulationSpeed} 
          showOrbits={showOrbits} 
          onShowOrbitsChange={setShowOrbits} 
          baseMapMode={baseMapMode} 
          onBaseMapChange={setBaseMapMode} 
        />
      </Box>
    </Box>
  );
}
