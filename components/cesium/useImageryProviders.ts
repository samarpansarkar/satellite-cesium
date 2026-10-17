/**
 * cesium/useImageryProviders.ts
 * React hook that creates and memoises all Cesium imagery / terrain providers.
 *
 * The hook returns a single object so callers can destructure only what they need.
 * All providers are created client-side only (guarded with `typeof window`).
 */
import { useMemo } from "react";
import * as Cesium from "cesium";
import type { ImageryProviders } from "@/lib/types";

/**
 * Creates and memoises all imagery providers.
 * Providers are created once at mount time and never recreated.
 */
export function useImageryProviders(): ImageryProviders {
  // ── Offline providers ────────────────────────────────────────────────────

  const naturalEarthProvider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return Cesium.TileMapServiceImageryProvider.fromUrl(
      Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")
    );
  }, []);

  /** Transparent lat/lon grid overlay rendered on top of the Natural Earth base map. */
  const earthGridOverlayProvider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return new Cesium.GridImageryProvider({
      backgroundColor: Cesium.Color.TRANSPARENT,
      color: Cesium.Color.fromCssColorString("#c89d70").withAlpha(0.6),
      cells: 8,
      glowColor: Cesium.Color.fromCssColorString("#8b5a2b").withAlpha(0.2),
      glowWidth: 2,
    });
  }, []);

  /** Solid dark background + amber grid (used in "grid" map mode). */
  const gridProvider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return new Cesium.GridImageryProvider({
      backgroundColor: Cesium.Color.fromCssColorString("#090d16"),
      color: Cesium.Color.fromCssColorString("#c89d70").withAlpha(0.7),
      cells: 8,
    });
  }, []);

  // ── Docker / local tile-server providers ─────────────────────────────────
  // Uncomment exactly ONE block that matches your server type.
  // See the comments inside CesiumViewer.tsx for full documentation.

  // ── OPTION A: XYZ Raster Tiles (PNG/JPEG) ────────────────────────────────
  // GET http://localhost:8080/tiles/{z}/{x}/{y}.png
  const dockerXYZProvider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return new Cesium.UrlTemplateImageryProvider({
      url: "http://localhost:8080/tiles/{z}/{x}/{y}.png",
      minimumLevel: 0,
      maximumLevel: 18,
      tilingScheme: new Cesium.WebMercatorTilingScheme(),
      credit: new Cesium.Credit("Docker Tile Server"),
    });
  }, []);

  // ── OPTION B: TMS (Tile Map Service) ─────────────────────────────────────
  // GET http://localhost:8080/tms/1.0.0/imagery/{z}/{x}/{y}.png
  const dockerTMSProvider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return Cesium.TileMapServiceImageryProvider.fromUrl(
      "http://localhost:8080/tms/1.0.0/imagery/",
      {
        fileExtension: "png",
        minimumLevel: 0,
        maximumLevel: 18,
        credit: new Cesium.Credit("Docker TMS Server"),
      }
    );
  }, []);

  // ── OPTION C: Cesium Quantized-Mesh Terrain ───────────────────────────────
  // GET http://localhost:8080/tilesets/terrain/{z}/{x}/{y}.terrain
  const dockerTerrainProvider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return Cesium.CesiumTerrainProvider.fromUrl(
      "http://localhost:8080/tilesets/terrain/",
      {
        requestVertexNormals: true,  // enables lighting / slope shading
        requestWaterMask: false,
        credit: new Cesium.Credit("Docker Terrain Server"),
      }
    );
  }, []);

  // ── OPTION D: WMS (Web Map Service) ──────────────────────────────────────
  // GET http://localhost:8080/wms?SERVICE=WMS&REQUEST=GetMap&…
  const dockerWMSProvider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return new Cesium.WebMapServiceImageryProvider({
      url: "http://localhost:8080/wms",
      layers: "earth_imagery",   // ← change to your WMS layer name
      parameters: {
        service: "WMS",
        version: "1.1.1",
        request: "GetMap",
        transparent: "false",
        format: "image/png",
      },
      minimumLevel: 0,
      maximumLevel: 18,
      credit: new Cesium.Credit("Docker WMS Server"),
    });
  }, []);

  return {
    naturalEarthProvider,
    earthGridOverlayProvider,
    gridProvider,
    dockerXYZProvider,
    dockerTMSProvider,
    dockerTerrainProvider,
    dockerWMSProvider,
  };
}
