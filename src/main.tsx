import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { TooltipProvider } from "./components/Tooltip.tsx";

// Service worker is auto-registered by vite-plugin-pwa

// Use HashRouter for Tauri (file:// protocol doesn't support BrowserRouter well)
const isTauri = "__TAURI__" in window;
const Router = isTauri ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router>
        <App />
        <TooltipProvider />
      </Router>
    </ErrorBoundary>
  </StrictMode>,
);
