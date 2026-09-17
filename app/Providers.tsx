"use client";

import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import React, { ReactNode } from "react";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#09090b",
      paper: "#18181b",
    },
    primary: {
      main: "#06b6d4", // Cyan 500
    },
    secondary: {
      main: "#10b981", // Emerald 500
    },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
