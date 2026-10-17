/**
 * cesium/config.ts
 * One-time Cesium global configuration and shared constants.
 */
import * as Cesium from "cesium";

// Configure Cesium asset base path to point to /cesium in public folder and clear Ion tokens
if (typeof window !== "undefined") {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";
  Cesium.Ion.defaultAccessToken = "";
  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(20.0, -40.0, 140.0, 60.0);
}

/** SVG data-URI icon used for every satellite billboard. */
export const SATELLITE_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M21,11H18V7h-2.59l-1.2-1.2a1,1,0,0,0-1.42,0L10,8.59,8.59,10a1,1,0,0,0,0,1.42L9.79,12.6,7,15.4V19H3.4l-1.1,1.1a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0L4.8,20.4H8.4V16.8l2.8-2.8,1.2,1.2a1,1,0,0,0,1.42,0l4.2-4.2a1,1,0,0,0,0-1.42L16.8,8.4H21a1,1,0,0,0,0-2Z'/%3E%3C/svg%3E";

/** Default ground station – New Delhi coordinates (lon, lat). */
export const GROUND_STATION = Cesium.Cartesian3.fromDegrees(77.209, 28.6139, 0);
