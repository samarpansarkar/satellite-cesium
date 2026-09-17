import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

export const metadata: Metadata = {
  title: "Satellite Cesium - Offline 3D Globe",
  description: "CesiumJS geospatial visualization running 100% offline with local assets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
