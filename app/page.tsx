"use client";

import React, { useState, useEffect } from "react";
import CesiumWrapper from "@/components/CesiumWrapper";
import { SatelliteData, useSatellites } from "@/lib/satellites";
import { Box } from "@mui/material";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import FooterControls from "@/components/FooterControls";
import SatelliteInfoPanel from "@/components/SatelliteInfoPanel";

export default function Home() {
  const { satellites, updateSatellite, isLoaded } = useSatellites();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hiddenSatellites, setHiddenSatellites] = useState<string[]>([]);
  const [hasInitializedHidden, setHasInitializedHidden] = useState(false);
  const [selectedSatInfo, setSelectedSatInfo] = useState<SatelliteData | null>(null);

  // Initialize hiddenSatellites to hide all satellites on first load and turn off attachments
  useEffect(() => {
    if (isLoaded && !hasInitializedHidden && satellites.length > 0) {
      setHiddenSatellites(satellites.map((sat) => sat.id));
      setHasInitializedHidden(true);
      
      // Turn off all attachments by default on load
      satellites.forEach((sat) => {
        const hasActiveAttachment = 
          sat.cameras.some((c) => c.active) || 
          sat.sensors.some((s) => s.active) || 
          sat.communications.some((c) => c.active);
          
        if (hasActiveAttachment) {
          updateSatellite(sat.id, {
            cameras: sat.cameras.map((c) => ({ ...c, active: false })),
            sensors: sat.sensors.map((s) => ({ ...s, active: false })),
            communications: sat.communications.map((c) => ({ ...c, active: false })),
          });
        }
      });
    }
  }, [isLoaded, hasInitializedHidden, satellites, updateSatellite]);

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
    setHiddenSatellites(satellites.map((sat) => sat.id));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar onMenuClick={() => setDrawerOpen(!drawerOpen)} />
      
      <Sidebar 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        satellites={satellites}
        hiddenSatellites={hiddenSatellites} 
        onToggleSatellite={handleToggleSatellite} 
        onUpdateSatellite={updateSatellite}
        onOpenInfo={setSelectedSatInfo} 
        onShowAll={handleShowAll}
        onHideAll={handleHideAll}
      />

      <Box sx={{ flexGrow: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        
        {/* 3D Map Container */}
        <Box sx={{ flexGrow: 1, position: "relative", overflow: "hidden" }}>
          <CesiumWrapper 
            satellites={satellites}
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
