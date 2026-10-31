"use client";

/**
 * TimeControlBar.tsx
 * Orbital Reticle Timebar HUD inspired by professional flight and space mission dashboards.
 *
 * Features:
 *   - Protruding top tab with:
 *       1. Solid white circular Play/Pause button
 *       2. Large UTC time readout (HH:MM:SS) with pulsing green live dot and UTC date
 *       3. Speedometer button with floating speed preset popover (0.5× – 1000×, jump to live)
 *   - Centered amber reticle needle (#fbbf24) with glowing vertical line
 *   - Continuous scrolling tape ruler with 10-minute minor ticks, 30-minute mid ticks,
 *     and labeled hour major ticks (10:00, 11:00, 12:00, etc.)
 *   - Smooth drag-scrubbing, click-to-seek, and wheel scrubbing
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { animClock } from "./cesium/animClock";

const PX_PER_HOUR = 220; // Visual density of hours along ruler
const PX_PER_SEC = PX_PER_HOUR / 3600;
const SPEED_PRESETS = [0.5, 1, 2, 5, 10, 60, 1000] as const;

interface Props {
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  simulationSpeed: number;
  onSimulationSpeedChange: (s: number) => void;
}

function formatUtc(epoch: number, elapsedSec: number) {
  const d = new Date(epoch + elapsedSec * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayName = days[d.getUTCDay()];
  const dayNum = d.getUTCDate();
  const monthName = months[d.getUTCMonth()];

  return {
    timeStr: `${hh}:${mm}:${ss}`,
    dateStr: `${dayName} ${dayNum} ${monthName} UTC`,
  };
}

export default function TimeControlBar({
  isPlaying,
  onTogglePlayPause,
  simulationSpeed,
  onSimulationSpeedChange,
}: Props) {
  // Epoch anchor (synced on client mount)
  const [epoch, setEpoch] = useState<number>(0);
  const [disp, setDisp] = useState<number>(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [rulerWidth, setRulerWidth] = useState<number>(1200);

  const rulerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartDispRef = useRef<number>(0);

  // Sync epoch on mount to eliminate SSR hydration discrepancy
  useEffect(() => {
    setEpoch(Date.now());
  }, []);

  // Update ruler width on mount & window resize
  useEffect(() => {
    if (!rulerRef.current) return;
    const measure = () => {
      if (rulerRef.current) {
        setRulerWidth(rulerRef.current.clientWidth);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Close speed popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
    };
    if (showSpeedMenu) {
      window.addEventListener("mousedown", handleOutsideClick);
    }
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [showSpeedMenu]);

  // Sync display from animClock every 50 ms when not user-dragging
  useEffect(() => {
    const id = setInterval(() => {
      if (!draggingRef.current) {
        setDisp(animClock.elapsedTime);
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  // ── Drag & Scrub Interactions ─────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    draggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartDispRef.current = animClock.elapsedTime;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    draggingRef.current = true;
    dragStartXRef.current = e.touches[0].clientX;
    dragStartDispRef.current = animClock.elapsedTime;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const deltaX = e.clientX - dragStartXRef.current;
      const deltaSec = -deltaX / PX_PER_SEC;
      const nextSec = Math.max(0, dragStartDispRef.current + deltaSec);
      animClock.elapsedTime = nextSec;
      setDisp(nextSec);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - dragStartXRef.current;
      const deltaSec = -deltaX / PX_PER_SEC;
      const nextSec = Math.max(0, dragStartDispRef.current + deltaSec);
      animClock.elapsedTime = nextSec;
      setDisp(nextSec);
    };

    const onEnd = () => {
      draggingRef.current = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  // Click to seek directly
  const handleRulerClick = useCallback((e: React.MouseEvent) => {
    // Only seek if was a direct click (not an extensive drag)
    if (Math.abs(e.clientX - dragStartXRef.current) > 3) return;
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const deltaXFromCenter = clickX - rect.width / 2;
    const deltaSec = deltaXFromCenter / PX_PER_SEC;
    const nextSec = Math.max(0, animClock.elapsedTime + deltaSec);
    animClock.elapsedTime = nextSec;
    setDisp(nextSec);
  }, []);

  // Wheel scrubbing
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    const deltaSec = delta * 1.5;
    const nextSec = Math.max(0, animClock.elapsedTime + deltaSec);
    animClock.elapsedTime = nextSec;
    setDisp(nextSec);
  }, []);

  // Step helper
  const handleStep = (seconds: number) => {
    const nextSec = Math.max(0, animClock.elapsedTime + seconds);
    animClock.elapsedTime = nextSec;
    setDisp(nextSec);
  };

  const handleJumpToLive = () => {
    animClock.elapsedTime = 0;
    setEpoch(Date.now());
    setDisp(0);
    setShowSpeedMenu(false);
  };

  // ── Ruler Geometry Calculation ────────────────────────────────────────────
  const currentTotalSec = (epoch ? epoch / 1000 : 0) + disp;
  const halfWidth = rulerWidth / 2;
  const visibleSecSpan = halfWidth / PX_PER_SEC + 3600; // Buffer 1 hr each side
  const startSec = Math.floor((currentTotalSec - visibleSecSpan) / 600) * 600;
  const endSec = Math.ceil((currentTotalSec + visibleSecSpan) / 600) * 600;

  const ticks: Array<{
    sec: number;
    left: number;
    type: "major" | "mid" | "minor";
    label?: string;
  }> = [];

  for (let s = startSec; s <= endSec; s += 600) {
    const left = halfWidth + (s - currentTotalSec) * PX_PER_SEC;
    const isHour = s % 3600 === 0;
    const isHalfHour = s % 1800 === 0 && !isHour;

    if (isHour) {
      const d = new Date(s * 1000);
      const hh = String(d.getUTCHours()).padStart(2, "0");
      ticks.push({
        sec: s,
        left,
        type: "major",
        label: `${hh}:00`,
      });
    } else if (isHalfHour) {
      ticks.push({
        sec: s,
        left,
        type: "mid",
      });
    } else {
      ticks.push({
        sec: s,
        left,
        type: "minor",
      });
    }
  }

  const { timeStr, dateStr } = formatUtc(epoch, disp);

  return (
    <div className="tcb-container">
      {/* ── Raised Center Tab ──────────────────────────────────────────────── */}
      <div className="tcb-tab">
        {/* 1. White Circular Play/Pause Button */}
        <button
          className="tcb-play-btn"
          onClick={onTogglePlayPause}
          title={isPlaying ? "Pause simulation" : "Play simulation"}
          aria-label={isPlaying ? "pause simulation" : "play simulation"}
        >
          {isPlaying ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* 2. Central Time & Date Display */}
        <div className="tcb-display" suppressHydrationWarning>
          <div className="tcb-time-row">
            <span className="tcb-time-text" suppressHydrationWarning>
              {timeStr}
            </span>
            <span
              className="tcb-status-dot"
              data-playing={isPlaying}
              title={isPlaying ? "Live Simulation Active" : "Simulation Paused"}
            />
          </div>
          <span className="tcb-date-text" suppressHydrationWarning>
            {dateStr}
          </span>
        </div>

        {/* 3. Speedometer Circular Button */}
        <div style={{ position: "relative" }} ref={popoverRef}>
          <button
            className="tcb-speed-btn"
            onClick={() => setShowSpeedMenu((prev) => !prev)}
            data-active={showSpeedMenu || simulationSpeed !== 1}
            title={`Simulation Speed (${simulationSpeed}×)`}
            aria-label="Simulation speed settings"
          >
            {/* Speedometer Gauge SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="M20 12h2" />
              <path d="m19.07 4.93-1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
              <path d="m14 14 3-3" />
            </svg>
          </button>

          {/* Floating Speed & Jump Popover */}
          {showSpeedMenu && (
            <div className="tcb-speed-popover">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="tcb-popover-title">Simulation Speed</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#38bdf8" }}>
                  {simulationSpeed}×
                </span>
              </div>

              {/* Presets Grid */}
              <div className="tcb-presets-row">
                {SPEED_PRESETS.map((spd) => (
                  <button
                    key={spd}
                    className="tcb-preset-btn"
                    data-selected={simulationSpeed === spd}
                    onClick={() => {
                      onSimulationSpeedChange(spd);
                      setShowSpeedMenu(false);
                    }}
                  >
                    {spd >= 1000 ? "1K" : spd}×
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="tcb-popover-actions">
                <button className="tcb-action-btn" onClick={() => handleStep(-900)} title="Step backward 15 minutes">
                  −15m
                </button>
                <button className="tcb-action-btn" onClick={handleJumpToLive} title="Sync to live real-time">
                  Live (Now)
                </button>
                <button className="tcb-action-btn" onClick={() => handleStep(900)} title="Step forward 15 minutes">
                  +15m
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Reticle Needle (Centered Amber Indicator Line) ─────────────────── */}
      <div className="tcb-needle" />

      {/* ── Timeline Ruler & Scrubbing Surface ─────────────────────────────── */}
      <div
        ref={rulerRef}
        className="tcb-ruler"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleRulerClick}
        onWheel={handleWheel}
        title="Drag left/right or scroll to scrub time • Click to seek"
      >
        {ticks.map((tick) => (
          <div
            key={tick.sec}
            className="tcb-tick-item"
            style={{ left: `${tick.left}px` }}
          >
            {tick.label && (
              <span className="tcb-tick-label">{tick.label}</span>
            )}
            <div
              className={`tcb-tick-line tcb-tick-line--${tick.type}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
