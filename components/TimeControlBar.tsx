"use client";

/**
 * TimeControlBar.tsx — Compact single-strip mission timeline.
 *
 * Layout (one row, ~52px tall):
 *   [⏮ ◀ −15m  ▶/⏸  +15m ▶ ⏭]  [scrubber]  [0.5× 1× 2× 5× 10× 60× 1K×]  [T+HH:MM:SS · UTC time]
 *
 * Everything lives on one line — no vertical stacking.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { animClock } from "./cesium/animClock";

// ─── Constants ────────────────────────────────────────────────────────────────
const WINDOW_SEC = 24 * 3600; // 24-hour window

const SPEED_PRESETS = [0.5, 1, 2, 5, 10, 60, 1000] as const;
type SpeedPreset = (typeof SPEED_PRESETS)[number];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  simulationSpeed: number;
  onSimulationSpeedChange: (s: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtElapsed(sec: number): string {
  const a = Math.abs(Math.round(sec));
  const h = Math.floor(a / 3600);
  const m = Math.floor((a % 3600) / 60);
  const s = a % 60;
  return `T+${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtUtc(epoch: number, sec: number): string {
  return new Date(epoch + sec * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function fmtLabel(sec: number): string {
  const h = Math.floor(sec / 3600);
  return `${h}h`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TimeControlBar({
  isPlaying,
  onTogglePlayPause,
  simulationSpeed,
  onSimulationSpeedChange,
}: Props) {
  const [epoch] = useState(() => Date.now());
  const [disp, setDisp] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Sync display from clock at 80 ms
  useEffect(() => {
    const id = setInterval(() => {
      if (!draggingRef.current) setDisp(animClock.elapsedTime);
    }, 80);
    return () => clearInterval(id);
  }, []);

  const clamped = Math.min(Math.max(disp, 0), WINDOW_SEC);
  const pct = (clamped / WINDOW_SEC) * 100;

  // ── Scrubbing ──────────────────────────────────────────────────────────────
  const scrubTo = useCallback((cx: number) => {
    if (!trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const t = Math.min(Math.max((cx - r.left) / r.width, 0), 1) * WINDOW_SEC;
    animClock.elapsedTime = t;
    setDisp(t);
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => { draggingRef.current = true; setDragging(true); scrubTo(e.clientX); },
    [scrubTo]
  );

  useEffect(() => {
    const mv = (e: MouseEvent) => { if (draggingRef.current) scrubTo(e.clientX); };
    const up = () => { draggingRef.current = false; setDragging(false); };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, [scrubTo]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => { draggingRef.current = true; setDragging(true); scrubTo(e.touches[0].clientX); },
    [scrubTo]
  );
  useEffect(() => {
    const mv = (e: TouchEvent) => { if (draggingRef.current) scrubTo(e.touches[0].clientX); };
    const up = () => { draggingRef.current = false; setDragging(false); };
    window.addEventListener("touchmove", mv);
    window.addEventListener("touchend", up);
    return () => { window.removeEventListener("touchmove", mv); window.removeEventListener("touchend", up); };
  }, [scrubTo]);

  // ── Step ──────────────────────────────────────────────────────────────────
  const step = (d: number) => {
    const t = Math.min(Math.max(animClock.elapsedTime + d, 0), WINDOW_SEC);
    animClock.elapsedTime = t;
    setDisp(t);
  };

  // ── Tick marks: every 4 h major, every 1 h minor ─────────────────────────
  const ticks = Array.from({ length: 25 }, (_, i) => i * 3600);
  // Only show labels every 4 h to avoid clutter
  const labelTicks = ticks.filter((s) => s % (4 * 3600) === 0 && s > 0 && s < WINDOW_SEC);

  return (
    <div className="tcb-root">
      {/* ── Transport ──────────────────────────────────────────────────────── */}
      <div className="tcb-transport">
        {/* Jump to start */}
        <button className="tcb-btn" onClick={() => { animClock.elapsedTime = 0; setDisp(0); }} title="Jump to T+0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>

        {/* −15 min */}
        <button className="tcb-btn" onClick={() => step(-900)} title="−15 min">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/></svg>
        </button>

        {/* Play / Pause */}
        <button
          className="tcb-play"
          onClick={onTogglePlayPause}
          title={isPlaying ? "Pause" : "Play"}
          data-playing={isPlaying}
        >
          {isPlaying && <span className="tcb-pulse" />}
        {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#38bdf8' }}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#7a90a8' }}><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>

        {/* +15 min */}
        <button className="tcb-btn" onClick={() => step(900)} title="+15 min">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
        </button>

        {/* Jump to end */}
        <button className="tcb-btn" onClick={() => { animClock.elapsedTime = WINDOW_SEC; setDisp(WINDOW_SEC); }} title="Jump to T+24h">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm.5-6L15 18V6l-8.5 6zM16 6v12h2V6h-2z"/></svg>
        </button>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <div className="tcb-sep" />

      {/* ── Scrubber ───────────────────────────────────────────────────────── */}
      <div className="tcb-scrubber">
        {/* Labels row above track */}
        <div className="tcb-labels" aria-hidden="true">
          <span className="tcb-endlabel">T+0</span>
          {labelTicks.map((s) => (
            <span
              key={s}
              className="tcb-ticklabel"
              style={{ left: `${(s / WINDOW_SEC) * 100}%` }}
            >
              {fmtLabel(s)}
            </span>
          ))}
          <span className="tcb-endlabel tcb-endlabel--right">T+24h</span>
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          className="tcb-track"
          style={{ cursor: dragging ? "grabbing" : "grab" }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          role="slider"
          aria-label="Mission timeline"
          aria-valuemin={0}
          aria-valuemax={WINDOW_SEC}
          aria-valuenow={clamped}
        >
          {/* Rail */}
          <div className="tcb-rail" />

          {/* Tick marks */}
          {ticks.map((s) => (
            <div
              key={s}
              className="tcb-tick"
              style={{
                left: `${(s / WINDOW_SEC) * 100}%`,
                height: s % (4 * 3600) === 0 ? 8 : 4,
                opacity: s % (4 * 3600) === 0 ? 0.45 : 0.18,
              }}
            />
          ))}

          {/* Fill */}
          <div className="tcb-fill" style={{ width: `${pct}%` }} />

          {/* Thumb */}
          <div
            className="tcb-thumb"
            style={{
              left: `${pct}%`,
              boxShadow: isPlaying
                ? "0 0 10px 3px rgba(56,189,248,0.65)"
                : "0 0 5px 1px rgba(56,189,248,0.35)",
            }}
          />
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <div className="tcb-sep" />

      {/* ── Speed presets ──────────────────────────────────────────────────── */}
      <div className="tcb-speed">
        <span className="tcb-speed-label">SPEED</span>
        {SPEED_PRESETS.map((spd) => (
          <button
            key={spd}
            className="tcb-preset"
            data-active={simulationSpeed === spd}
            onClick={() => onSimulationSpeedChange(spd)}
            title={`${spd}× speed`}
          >
            {(spd as SpeedPreset) >= 1000 ? "1K" : spd}×
          </button>
        ))}
      </div>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <div className="tcb-sep" />

      {/* ── Clocks ─────────────────────────────────────────────────────────── */}
      <div className="tcb-clocks">
        <span className="tcb-elapsed">{fmtElapsed(disp)}</span>
        <span className="tcb-dot">·</span>
        <span className="tcb-utc">{fmtUtc(epoch, disp)}</span>
      </div>
    </div>
  );
}
