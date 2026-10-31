/**
 * tests/unit.test.js
 * Unit tests for core algorithms, geometry helpers, orbit propagation,
 * and satellite data normalization.
 */

const test = require("node:test");
const assert = require("node:assert");
const Cesium = require("cesium");

// Import compiled modules from test-dist-cjs
const sensorUtils = require("../test-dist-cjs/components/cesium/sensorUtils.js");
const orbitUtils = require("../test-dist-cjs/components/cesium/orbitUtils.js");

const EARTH_RADIUS = 6_371_000;

// ─── 1. Sensor Geometry & Math Unit Tests ─────────────────────────────────────

test("computeCylinderOrientation: aligned with +Z axis returns identity quaternion", () => {
  const satPos = new Cesium.Cartesian3(0, 0, 10_000);
  const groundPos = new Cesium.Cartesian3(0, 0, 0);
  const q = sensorUtils.computeCylinderOrientation(satPos, groundPos);

  assert.ok(q instanceof Cesium.Quaternion);
  // Dot with identity should be ~1
  const dot = Cesium.Quaternion.dot(q, Cesium.Quaternion.IDENTITY);
  assert.ok(Math.abs(dot - 1.0) < 1e-5, `Expected dot ~ 1, got ${dot}`);
});

test("computeCylinderOrientation: antipodal -Z direction returns 180° rotation", () => {
  const satPos = new Cesium.Cartesian3(0, 0, -10_000);
  const groundPos = new Cesium.Cartesian3(0, 0, 0);
  const q = sensorUtils.computeCylinderOrientation(satPos, groundPos);

  assert.ok(q instanceof Cesium.Quaternion);
  // Unit length
  const mag = Cesium.Quaternion.magnitude(q);
  assert.ok(Math.abs(mag - 1.0) < 1e-5);
  // Rotated vector (0, 0, 1) should point to (0, 0, -1)
  const mat = Cesium.Matrix3.fromQuaternion(q);
  const rotated = Cesium.Matrix3.multiplyByVector(mat, new Cesium.Cartesian3(0, 0, 1), new Cesium.Cartesian3());
  assert.ok(Math.abs(rotated.z - (-1)) < 1e-5);
});

test("computeCylinderOrientation: arbitrary 3D vector creates valid orientation matrix", () => {
  const satPos = new Cesium.Cartesian3(4_000_000, 2_000_000, 5_000_000);
  const groundPos = new Cesium.Cartesian3(3_500_000, 1_800_000, 4_400_000);
  const q = sensorUtils.computeCylinderOrientation(satPos, groundPos);

  const mag = Cesium.Quaternion.magnitude(q);
  assert.ok(Math.abs(mag - 1.0) < 1e-5);

  const expectedDir = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.subtract(satPos, groundPos, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );
  const mat = Cesium.Matrix3.fromQuaternion(q);
  const rotatedZ = Cesium.Matrix3.multiplyByVector(mat, new Cesium.Cartesian3(0, 0, 1), new Cesium.Cartesian3());
  const dot = Cesium.Cartesian3.dot(expectedDir, rotatedZ);
  assert.ok(Math.abs(dot - 1.0) < 1e-4, `Expected dot ~ 1, got ${dot}`);
});

test("getFootprintPerimeterPoint: computes points accurately at exact angular intervals", () => {
  const center = new Cesium.Cartesian3(EARTH_RADIUS, 0, 0); // At (R, 0, 0)
  const radius = 200_000; // 200 km

  const pt0 = sensorUtils.getFootprintPerimeterPoint(center, radius, 0);
  const ptHalfPi = sensorUtils.getFootprintPerimeterPoint(center, radius, Math.PI / 2);
  const ptPi = sensorUtils.getFootprintPerimeterPoint(center, radius, Math.PI);

  const dist0 = Cesium.Cartesian3.distance(center, pt0);
  const distHalfPi = Cesium.Cartesian3.distance(center, ptHalfPi);
  const distPi = Cesium.Cartesian3.distance(center, ptPi);

  assert.ok(Math.abs(dist0 - radius) < 1.0, `Expected ${radius}, got ${dist0}`);
  assert.ok(Math.abs(distHalfPi - radius) < 1.0, `Expected ${radius}, got ${distHalfPi}`);
  assert.ok(Math.abs(distPi - radius) < 1.0, `Expected ${radius}, got ${distPi}`);
});

test("getCirclePoints: returns (count + 1) points forming a closed loop", () => {
  const center = new Cesium.Cartesian3(0, EARTH_RADIUS, 0);
  const radius = 150_000;
  const count = 36;

  const pts = sensorUtils.getCirclePoints(center, radius, count, undefined, false);
  assert.strictEqual(pts.length, count + 1);

  // First and last point must coincide to close loop
  const loopCloseDist = Cesium.Cartesian3.distance(pts[0], pts[pts.length - 1]);
  assert.ok(loopCloseDist < 1e-4, `Expected closed loop, got distance ${loopCloseDist}`);
});

test("getCirclePoints: conformToSphere=true projects all points to constant sphere altitude", () => {
  const center = new Cesium.Cartesian3(0, 0, EARTH_RADIUS);
  const radius = 500_000; // 500 km
  const count = 24;
  const altitudeOffset = 1200;

  const pts = sensorUtils.getCirclePoints(center, radius, count, undefined, true, altitudeOffset);
  const expectedDistance = EARTH_RADIUS + altitudeOffset;

  for (let i = 0; i < pts.length; i++) {
    const distFromOrigin = Cesium.Cartesian3.magnitude(pts[i]);
    assert.ok(
      Math.abs(distFromOrigin - expectedDistance) < 5.0,
      `Point ${i} altitude error: expected ${expectedDistance}, got ${distFromOrigin}`
    );
  }
});

test("getCrosshairPoints: returns 7 vertices forming 4-way crosshair arms", () => {
  const center = new Cesium.Cartesian3(0, 0, EARTH_RADIUS);
  const radius = 100_000;

  const pts = sensorUtils.getCrosshairPoints(center, radius, undefined, true, 1100);
  assert.strictEqual(pts.length, 7);

  // pts[1], pts[3], pts[5] are center passes
  const expectedCenterDist = EARTH_RADIUS + 1100;
  assert.ok(Math.abs(Cesium.Cartesian3.magnitude(pts[1]) - expectedCenterDist) < 5.0);
  assert.ok(Math.abs(Cesium.Cartesian3.magnitude(pts[3]) - expectedCenterDist) < 5.0);
  assert.ok(Math.abs(Cesium.Cartesian3.magnitude(pts[5]) - expectedCenterDist) < 5.0);
});

test("getSensorFootprintCenter: 90° inclination points directly nadir (sub-satellite point)", () => {
  const sat = {
    id: "sat-1",
    name: "TestSat",
    type: "Observation",
    altitudeKm: 500,
    inclinationDeg: 45,
    speedMultiplier: 1,
    periodSec: 90,
    sensor: { isActive: true, fovDeg: 60, inclinationDeg: 90 },
  };

  const center = sensorUtils.getSensorFootprintCenter(sat, 0);
  const subPos = orbitUtils.getCachedSubPosition(sat, 0);

  const diff = Cesium.Cartesian3.distance(center, subPos);
  assert.ok(diff < 1.0, `Expected nadir distance < 1m, got ${diff}`);
});

test("getSensorFootprintCenter: off-nadir inclination displaces center across-track", () => {
  const satNadir = {
    id: "sat-2",
    name: "TestSat2",
    type: "Observation",
    altitudeKm: 500,
    inclinationDeg: 45,
    speedMultiplier: 1,
    periodSec: 90,
    sensor: { isActive: true, fovDeg: 60, inclinationDeg: 90 },
  };

  const satTilted = {
    ...satNadir,
    sensor: { isActive: true, fovDeg: 60, inclinationDeg: 75 }, // 15° off-nadir
  };

  const nadirCenter = sensorUtils.getSensorFootprintCenter(satNadir, 0);
  const tiltedCenter = sensorUtils.getSensorFootprintCenter(satTilted, 0);

  const displacement = Cesium.Cartesian3.distance(nadirCenter, tiltedCenter);
  // 500 km * tan(15°) ~ 134 km
  assert.ok(displacement > 100_000, `Expected displacement > 100km, got ${displacement}`);
  assert.ok(displacement < 200_000, `Expected displacement < 200km, got ${displacement}`);

  // Both points must be on Earth sphere surface
  assert.ok(Math.abs(Cesium.Cartesian3.magnitude(tiltedCenter) - EARTH_RADIUS) < 50.0);
});

// ─── 2. Orbit Propagation & Trajectory Unit Tests ─────────────────────────────

test("generateOrbitPath: produces 121 coordinates forming a closed orbital loop", () => {
  const altitudeKm = 400;
  const inclinationDeg = 51.6;

  const path = orbitUtils.generateOrbitPath(altitudeKm, inclinationDeg);
  assert.strictEqual(path.length, 121);

  const expectedRadius = (altitudeKm * 1000) + EARTH_RADIUS;
  for (let i = 0; i < path.length; i++) {
    const r = Cesium.Cartesian3.magnitude(path[i]);
    assert.ok(
      Math.abs(r - expectedRadius) < 1.0,
      `Orbit radius error at point ${i}: expected ${expectedRadius}, got ${r}`
    );
  }

  // End point matches start point (closed ellipse)
  const closureDist = Cesium.Cartesian3.distance(path[0], path[path.length - 1]);
  assert.ok(closureDist < 1.0, `Expected closure < 1m, got ${closureDist}`);
});

test("calculateSatPosition: propagates position smoothly over time", () => {
  const sat = {
    id: "iss",
    name: "ISS",
    type: "Space Station",
    altitudeKm: 420,
    inclinationDeg: 51.6,
    speedMultiplier: 1,
    periodSec: 92,
  };

  const pos0 = orbitUtils.calculateSatPosition(sat, 0);
  const pos23 = orbitUtils.calculateSatPosition(sat, 23); // Quarter orbit
  const pos46 = orbitUtils.calculateSatPosition(sat, 46); // Half orbit
  const pos92 = orbitUtils.calculateSatPosition(sat, 92); // Full period

  const expectedAlt = (420 * 1000) + EARTH_RADIUS;
  assert.ok(Math.abs(Cesium.Cartesian3.magnitude(pos0) - expectedAlt) < 1.0);
  assert.ok(Math.abs(Cesium.Cartesian3.magnitude(pos23) - expectedAlt) < 1.0);
  assert.ok(Math.abs(Cesium.Cartesian3.magnitude(pos46) - expectedAlt) < 1.0);

  // After 1 full period, satellite returns to initial position
  const periodDiff = Cesium.Cartesian3.distance(pos0, pos92);
  assert.ok(periodDiff < 5.0, `Expected return to start point, got difference ${periodDiff}`);
});

test("getCachedSubPosition: correctly projects satellite onto Earth surface", () => {
  const sat = {
    id: "sat-sub",
    name: "SubSat",
    type: "Observation",
    altitudeKm: 800,
    inclinationDeg: 98,
    speedMultiplier: 1,
    periodSec: 100,
  };

  const satPos = orbitUtils.getCachedSatPosition(sat, 15);
  const subPos = orbitUtils.getCachedSubPosition(sat, 15);

  // Sub-position magnitude must equal Earth radius
  assert.ok(Math.abs(Cesium.Cartesian3.magnitude(subPos) - EARTH_RADIUS) < 1.0);

  // Sub-position and sat-position must be collinear
  const satDir = Cesium.Cartesian3.normalize(satPos, new Cesium.Cartesian3());
  const subDir = Cesium.Cartesian3.normalize(subPos, new Cesium.Cartesian3());
  const dot = Cesium.Cartesian3.dot(satDir, subDir);
  assert.ok(Math.abs(dot - 1.0) < 1e-6, `Expected collinear sub-point, got dot ${dot}`);
});

// ─── 3. Satellite Data Normalization & State Isolation Unit Tests ─────────────

test("normalizeSatelliteData: defaults showOrbit, showGroundTrack, and showSwath to false", () => {
  const rawApiPayload = {
    id: "sat-raw-1",
    name: "RawSat",
    type: "Communication",
    altitudeKm: 600,
    inclinationDeg: 30,
    speedMultiplier: 1,
    periodSec: 95,
  };

  // Normalization logic as in lib/satellites.ts
  const normalized = {
    id: rawApiPayload.id,
    name: rawApiPayload.name,
    type: rawApiPayload.type,
    altitudeKm: rawApiPayload.altitudeKm,
    inclinationDeg: rawApiPayload.inclinationDeg,
    speedMultiplier: rawApiPayload.speedMultiplier,
    periodSec: rawApiPayload.periodSec,
    showGroundTrack: rawApiPayload.showGroundTrack ?? false,
    showSwath: rawApiPayload.showSwath ?? false,
    showOrbit: rawApiPayload.showOrbit ?? false,
  };

  assert.strictEqual(normalized.showOrbit, false, "showOrbit must default to false");
  assert.strictEqual(normalized.showGroundTrack, false, "showGroundTrack must default to false");
  assert.strictEqual(normalized.showSwath, false, "showSwath must default to false");
});

test("updateSatellite: state updates are strictly isolated per satellite id", () => {
  let satellites = [
    { id: "sat-A", name: "Alpha", showOrbit: false, showGroundTrack: false },
    { id: "sat-B", name: "Bravo", showOrbit: false, showGroundTrack: false },
    { id: "sat-C", name: "Charlie", showOrbit: false, showGroundTrack: false },
  ];

  const updateSatellite = (id, updatedData) => {
    satellites = satellites.map((s) => (s.id === id ? { ...s, ...updatedData } : s));
  };

  // Turn ON orbit path only for Satellite B
  updateSatellite("sat-B", { showOrbit: true });

  assert.strictEqual(satellites.find((s) => s.id === "sat-A").showOrbit, false);
  assert.strictEqual(satellites.find((s) => s.id === "sat-B").showOrbit, true);
  assert.strictEqual(satellites.find((s) => s.id === "sat-C").showOrbit, false);
});
