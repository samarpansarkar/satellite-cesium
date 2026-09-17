"use client";

import dynamic from "next/dynamic";

const CesiumViewer = dynamic(() => import("./CesiumViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex flex-col items-center justify-center bg-zinc-900/60 rounded-2xl border border-zinc-800 backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <div className="absolute w-6 h-6 rounded-full border border-sky-400/40 animate-ping" />
      </div>
      <p className="mt-4 text-zinc-400 text-sm font-mono tracking-wide">
        Loading CesiumJS 3D Globe Engine...
      </p>
    </div>
  ),
});

export default function CesiumWrapper() {
  return <CesiumViewer />;
}
