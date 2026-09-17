"use client";

import React, { useState } from "react";
import CesiumWrapper from "@/components/CesiumWrapper";
import { SatelliteData, OFFLINE_SATELLITES } from "@/lib/satellites";
import { Box } from "@mui/material";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import FooterControls from "@/components/FooterControls";
import SatelliteInfoPanel from "@/components/SatelliteInfoPanel";

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hiddenSatellites, setHiddenSatellites] = useState<string[]>(
    OFFLINE_SATELLITES.map((sat) => sat.id)
  );
  const [selectedSatInfo, setSelectedSatInfo] = useState<SatelliteData | null>(null);

  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [baseMapMode, setBaseMapMode] = useState<"natural" | "grid">("natural");

  const handleToggleSatellite = (id: string) => {
    setHiddenSatellites((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleShowAll = () => {
    setHiddenSatellites([]);
  };

  const handleHideAll = () => {
    setHiddenSatellites(OFFLINE_SATELLITES.map((sat) => sat.id));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar onMenuClick={() => setDrawerOpen(!drawerOpen)} />
      
      <Sidebar 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        hiddenSatellites={hiddenSatellites} 
        onToggleSatellite={handleToggleSatellite} 
        onOpenInfo={setSelectedSatInfo} 
        onShowAll={handleShowAll}
        onHideAll={handleHideAll}
      />

      <Box sx={{ flexGrow: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        
        {/* 3D Map Container */}
        <Box sx={{ flexGrow: 1, position: "relative", overflow: "hidden" }}>
          <CesiumWrapper 
            hiddenSatellites={hiddenSatellites} 
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
