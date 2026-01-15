import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { TooltipProvider } from "./components/Tooltip.tsx";

// Service worker is auto-registered by vite-plugin-pwa

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <TooltipProvider />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
