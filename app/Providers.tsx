"use client";

import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import React, { ReactNode } from "react";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0a192f", // Navy Blue
      paper: "#112240",   // Lighter Navy Blue
    },
    primary: {
      main: "#38bdf8", // Sky Blue
    },
    secondary: {
      main: "#7dd3fc", // Light Sky Blue
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
