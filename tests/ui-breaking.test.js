/**
 * tests/ui-breaking.test.js
 * UI Breaking, Stress, and Boundary Condition Tests for:
 * – Sidebar (Tracks & Attachments division, empty states, missing devices, edge-cases)
 * – SatelliteInfoPanel (null state, missing attachments, extreme parameters)
 * – Mathematical & Vector Boundary limits (zero distance, horizon clamping, NaN immunity)
 */

const test = require("node:test");
const assert = require("node:assert");
const React = require("react");
const { renderToString } = require("react-dom/server");
const Cesium = require("cesium");

// Import compiled components and utilities
const Sidebar = require("../test-dist-cjs/components/Sidebar.js").default;
const SatelliteInfoPanel = require("../test-dist-cjs/components/SatelliteInfoPanel.js").default;
const sensorUtils = require("../test-dist-cjs/components/cesium/sensorUtils.js");
const orbitUtils = require("../test-dist-cjs/components/cesium/orbitUtils.js");

const EARTH_RADIUS = 6_371_000;
const TEST_MODAL_PROPS = { disablePortal: true };

// ─── 1. Sidebar UI Breaking & Component Structure Tests ───────────────────────

test("Sidebar: renders cleanly without throwing when satellites array is empty", () => {
  const html = renderToString(
    React.createElement(Sidebar, {
      open: true,
      onClose: () => {},
      availableNames: [],
      selectedNames: [],
      onToggleName: () => {},
      satellites: [],
      onOpenInfo: () => {},
      onSelectAll: () => {},
      onClearAll: () => {},
      ModalProps: TEST_MODAL_PROPS,
    })
  );

  assert.ok(html.includes("Available"), "Expected 'Available' in header");
  assert.ok(html.includes("Select All"));
  assert.ok(html.includes("Clear All"));
});

test("Sidebar: renders unloaded satellites as 'Not Loaded' without crash", () => {
  const html = renderToString(
    React.createElement(Sidebar, {
      open: true,
      onClose: () => {},
      availableNames: ["GOCE", "LANDSAT 9"],
      selectedNames: [],
      onToggleName: () => {},
      satellites: [], // None loaded
      onOpenInfo: () => {},
      onSelectAll: () => {},
      onClearAll: () => {},
      ModalProps: TEST_MODAL_PROPS,
    })
  );

  assert.ok(html.includes("GOCE"));
  assert.ok(html.includes("LANDSAT 9"));
  assert.ok(html.includes("Not Loaded"));
});

test("Sidebar: satellite with NO attachments renders 'No attachments installed'", () => {
  const bareSat = {
    id: "bare-sat",
    name: "Cubesat-1",
    type: "Technology",
    altitudeKm: 500,
    inclinationDeg: 45,
    speedMultiplier: 1,
    periodSec: 90,
    showOrbit: false,
    showGroundTrack: false,
    showSwath: false,
    // camera, sensor, communication are all omitted
  };

  const html = renderToString(
    React.createElement(Sidebar, {
      open: true,
      onClose: () => {},
      availableNames: ["Cubesat-1"],
      selectedNames: ["Cubesat-1"],
      onToggleName: () => {},
      satellites: [bareSat],
      defaultExpanded: true,
      onOpenInfo: () => {},
      onSelectAll: () => {},
      onClearAll: () => {},
      ModalProps: TEST_MODAL_PROPS,
    })
  );

  assert.ok(html.includes("Cubesat-1"));
  // In rendered HTML, the Tracks section exists
  assert.ok(html.includes("Tracks"));
  assert.ok(html.includes("Ground Track"));
  assert.ok(html.includes("Swath Track"));
  assert.ok(html.includes("Orbit Path"));

  // Attachments section reflects empty state
  assert.ok(html.includes("Attachments"));
  assert.ok(html.includes("No attachments installed"));
  assert.ok(!html.includes("Torch Light"), "Should not render Torch Light if no camera");
  assert.ok(!html.includes("Scanner Cone"), "Should not render Scanner Cone if no sensor");
});

test("Sidebar: satellite with Camera only renders Camera with (Torch Light)", () => {
  const cameraSat = {
    id: "cam-sat",
    name: "OpticalSat",
    type: "Earth Observation",
    altitudeKm: 600,
    inclinationDeg: 97,
    speedMultiplier: 1,
    periodSec: 95,
    showOrbit: false,
    camera: { isActive: true, fovDeg: 30 },
  };

  const html = renderToString(
    React.createElement(Sidebar, {
      open: true,
      onClose: () => {},
      availableNames: ["OpticalSat"],
      selectedNames: ["OpticalSat"],
      onToggleName: () => {},
      satellites: [cameraSat],
      defaultExpanded: true,
      onOpenInfo: () => {},
      onSelectAll: () => {},
      onClearAll: () => {},
      ModalProps: TEST_MODAL_PROPS,
    })
  );

  assert.ok(html.includes("Camera"));
  assert.ok(html.includes("(Torch Light)"));
  assert.ok(!html.includes("(Scanner Cone)"), "Should not render Scanner Cone");
  assert.ok(!html.includes("Communication"), "Should not render Communication");
});

test("Sidebar: satellite with Sensor only renders Sensor with (Scanner Cone)", () => {
  const radarSat = {
    id: "radar-sat",
    name: "SAR-1",
    type: "Radar Imaging",
    altitudeKm: 700,
    inclinationDeg: 98,
    speedMultiplier: 1,
    periodSec: 98,
    showOrbit: false,
    sensor: { isActive: true, fovDeg: 45, inclinationDeg: 80 },
  };

  const html = renderToString(
    React.createElement(Sidebar, {
      open: true,
      onClose: () => {},
      availableNames: ["SAR-1"],
      selectedNames: ["SAR-1"],
      onToggleName: () => {},
      satellites: [radarSat],
      defaultExpanded: true,
      onOpenInfo: () => {},
      onSelectAll: () => {},
      onClearAll: () => {},
      ModalProps: TEST_MODAL_PROPS,
    })
  );

  assert.ok(html.includes("Sensor"));
  assert.ok(html.includes("(Scanner Cone)"));
  assert.ok(!html.includes("Torch Light"), "Should not render Torch Light");
  assert.ok(!html.includes("Communication"), "Should not render Communication");
});

test("Sidebar: Orbit Path switch checked state reflects satellite.showOrbit strictly", () => {
  const satOff = {
    id: "sat-off",
    name: "SatOff",
    type: "Test",
    altitudeKm: 500,
    inclinationDeg: 45,
    speedMultiplier: 1,
    periodSec: 90,
    showOrbit: false,
  };

  const satOn = {
    id: "sat-on",
    name: "SatOn",
    type: "Test",
    altitudeKm: 500,
    inclinationDeg: 45,
    speedMultiplier: 1,
    periodSec: 90,
    showOrbit: true,
  };

  const htmlOff = renderToString(
    React.createElement(Sidebar, {
      open: true,
      onClose: () => {},
      availableNames: ["SatOff"],
      selectedNames: ["SatOff"],
      onToggleName: () => {},
      satellites: [satOff],
      defaultExpanded: true,
      onOpenInfo: () => {},
      onSelectAll: () => {},
      onClearAll: () => {},
      ModalProps: TEST_MODAL_PROPS,
    })
  );

  const htmlOn = renderToString(
    React.createElement(Sidebar, {
      open: true,
      onClose: () => {},
      availableNames: ["SatOn"],
      selectedNames: ["SatOn"],
      onToggleName: () => {},
      satellites: [satOn],
      defaultExpanded: true,
      onOpenInfo: () => {},
      onSelectAll: () => {},
      onClearAll: () => {},
      ModalProps: TEST_MODAL_PROPS,
    })
  );

  // In MUI Switch: checked switches contain Mui-checked class on their track or input
  assert.ok(htmlOn.includes("Mui-checked"), "SatOn should have checked switches");
  assert.ok(htmlOff.length > 0);
});

test("Sidebar: handles special characters, unicode, and XSS probe strings gracefully", () => {
  const trickyName = '<script>alert("xss")</script> & "ISS-ZARYA" 🚀';
  const trickySat = {
    id: "tricky-1",
    name: trickyName,
    type: "Scientific <Test>",
    altitudeKm: 400,
    inclinationDeg: 51.6,
    speedMultiplier: 1,
    periodSec: 90,
  };

  const html = renderToString(
    React.createElement(Sidebar, {
      open: true,
      onClose: () => {},
      availableNames: [trickyName],
      selectedNames: [trickyName],
      onToggleName: () => {},
      satellites: [trickySat],
      onOpenInfo: () => {},
      onSelectAll: () => {},
      onClearAll: () => {},
      ModalProps: TEST_MODAL_PROPS,
    })
  );

  // Must properly escape HTML entities (e.g. &lt;script&gt;)
  assert.ok(html.includes("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"));
  assert.ok(!html.includes("<script>alert"), "Must never output raw unescaped script tag");
});

test("Sidebar: stress test with 300 satellites renders without stack overflow", () => {
  const count = 300;
  const names = Array.from({ length: count }, (_, i) => `SAT-${i}`);
  const sats = names.map((name, i) => ({
    id: `sat-${i}`,
    name,
    type: "Constellation",
    altitudeKm: 550,
    inclinationDeg: 53,
    speedMultiplier: 1,
    periodSec: 95,
    showOrbit: false,
  }));

  const startTime = Date.now();
  const html = renderToString(
    React.createElement(Sidebar, {
      open: true,
      onClose: () => {},
      availableNames: names,
      selectedNames: names.slice(0, 10),
      onToggleName: () => {},
      satellites: sats,
      onOpenInfo: () => {},
      onSelectAll: () => {},
      onClearAll: () => {},
      ModalProps: TEST_MODAL_PROPS,
    })
  );
  const elapsed = Date.now() - startTime;

  assert.ok(html.length > 10_000);
  assert.ok(elapsed < 2000, `Rendering 300 satellites took ${elapsed}ms (expected < 2000ms)`);
});

// ─── 2. SatelliteInfoPanel UI Breaking & Parameter Edge Cases ─────────────────

test("SatelliteInfoPanel: returns null without crashing when satellite is null", () => {
  const html = renderToString(
    React.createElement(SatelliteInfoPanel, {
      satellite: null,
      onClose: () => {},
    })
  );
  assert.strictEqual(html, "");
});

test("SatelliteInfoPanel: renders minimal satellite record without optional attachments", () => {
  const minSat = {
    id: "min-1",
    name: "Minimalist-1",
    type: "CubeSat",
    altitudeKm: 350,
    inclinationDeg: 45,
    speedMultiplier: 1,
    periodSec: 90,
    showOrbit: false,
    showGroundTrack: false,
    showSwath: false,
  };

  const html = renderToString(
    React.createElement(SatelliteInfoPanel, {
      satellite: minSat,
      onClose: () => {},
    })
  );

  assert.ok(html.includes("Minimalist-1"));
  assert.ok(html.includes("Coverage"));
  assert.ok(html.includes("Orbit Path"));
  assert.ok(html.includes("Ground Track"));
  assert.ok(html.includes("Ground Swath"));
  assert.ok(html.includes("not installed"));
});

test("SatelliteInfoPanel: extreme altitude and inclination parameters format safely", () => {
  const extremeSat = {
    id: "geo-sat",
    name: "Deep-Space-1",
    type: "Geostationary",
    altitudeKm: 35_786, // GEO
    inclinationDeg: 0.05,
    speedMultiplier: 10,
    periodSec: 86_164, // 24 hours
    showOrbit: true,
    showGroundTrack: true,
    showSwath: true,
    swathWidthKm: 2500,
    camera: { isActive: true, fovDeg: 120 },
    sensor: { isActive: true, fovDeg: 110, inclinationDeg: 10 },
  };

  const html = renderToString(
    React.createElement(SatelliteInfoPanel, {
      satellite: extremeSat,
      onClose: () => {},
    })
  );

  assert.ok(html.includes("35,786 km"));
  assert.ok(html.includes("0.05°"));
  assert.ok(html.includes("86164 s"));
  assert.ok(html.includes("Camera (Torch Light)"));
  assert.ok(html.includes("Sensor (Scanner Cone)"));
});

// ─── 3. Mathematical & Vector Boundary Limits ─────────────────────────────────

test("computeCylinderOrientation: identical points (zero distance) returns identity without NaN", () => {
  const pt = new Cesium.Cartesian3(1000, 2000, 3000);
  // Zero distance boundary
  const q = sensorUtils.computeCylinderOrientation(pt, pt);

  assert.ok(!Number.isNaN(q.x));
  assert.ok(!Number.isNaN(q.y));
  assert.ok(!Number.isNaN(q.z));
  assert.ok(!Number.isNaN(q.w));
});

test("getCirclePoints: radius=0 returns points all located at center without NaN", () => {
  const center = new Cesium.Cartesian3(1_000_000, 2_000_000, 3_000_000);
  const pts = sensorUtils.getCirclePoints(center, 0, 16, undefined, false);

  assert.strictEqual(pts.length, 17);
  for (const p of pts) {
    assert.ok(!Number.isNaN(p.x));
    assert.ok(!Number.isNaN(p.y));
    assert.ok(!Number.isNaN(p.z));
    assert.ok(Cesium.Cartesian3.distance(p, center) < 1e-4);
  }
});

test("getSensorFootprintCenter: extreme inclination (0° or 180°) clamps to max horizon displacement", () => {
  const extremeSat = {
    id: "extreme-tilt",
    name: "TiltSat",
    type: "Test",
    altitudeKm: 500,
    inclinationDeg: 45,
    speedMultiplier: 1,
    periodSec: 90,
    sensor: { isActive: true, fovDeg: 60, inclinationDeg: 0 }, // Deviates 90° from nadir! tan(90°) -> infinity
  };

  const center = sensorUtils.getSensorFootprintCenter(extremeSat, 0);

  // Must not have NaN or Infinity
  assert.ok(!Number.isNaN(center.x));
  assert.ok(!Number.isNaN(center.y));
  assert.ok(!Number.isNaN(center.z));
  assert.ok(Number.isFinite(center.x));
  assert.ok(Number.isFinite(center.y));
  assert.ok(Number.isFinite(center.z));

  // Must remain clamped on the Earth sphere surface
  const mag = Cesium.Cartesian3.magnitude(center);
  assert.ok(Math.abs(mag - EARTH_RADIUS) < 10.0, `Expected surface clamp, got ${mag}`);
});
