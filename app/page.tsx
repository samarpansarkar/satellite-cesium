import CesiumWrapper from "@/components/CesiumWrapper";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Satellite Cesium
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
            100% Offline Mode
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Network:</span>
            <span className="text-emerald-400 font-semibold">Zero External Calls</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-zinc-500">CesiumJS:</span>
            <span className="text-cyan-400 font-semibold">v1.145 (Local)</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Globe Section */}
        <section className="relative">
          <CesiumWrapper />
        </section>

        {/* Offline Architecture Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-zinc-300">Offline Basemap</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                LOCAL TMS
              </span>
            </div>
            <p className="text-lg font-bold text-zinc-100">Natural Earth II</p>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Tiles are served directly from <code className="text-cyan-300">/public/cesium/Assets/Textures/NaturalEarthII</code>. No Bing or Cesium Ion network connection required.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-zinc-300">Offline Terrain</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                WGS84
              </span>
            </div>
            <p className="text-lg font-bold text-zinc-100">Ellipsoid Terrain</p>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Standard WGS84 mathematical ellipsoid computed client-side via WebGL. Disables external Cesium World Terrain calls.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-zinc-300">External Calls Disabled</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                AIR-GAPPED
              </span>
            </div>
            <p className="text-lg font-bold text-zinc-100">Zero Remote Endpoints</p>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Ion token is cleared, geocoder and remote base layer picker disabled, and Google Fonts replaced with local system fonts.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
