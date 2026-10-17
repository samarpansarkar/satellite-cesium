/**
 * cesium/animClock.ts
 * Out-of-band animation clock singleton.
 *
 * Cesium re-renders via requestAnimationFrame at 60 fps. Storing elapsed
 * simulation time here (outside React state) lets CallbackProperty callbacks
 * read the latest value every frame without triggering React re-renders.
 */
export const animClock = {
  /** Total simulated seconds elapsed since the viewer was mounted. */
  elapsedTime: 0,
  /** Real-time multiplier (0 = paused, 1 = real-time, N = N× speed). */
  speed: 1,
};
