import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { TooltipProvider } from "./components/Tooltip.tsx";

// Global error handler for uncaught errors
window.onerror = (message, _source, _lineno, _colno, error) => {
  console.error("Uncaught error:", message, error);
  return false;
};

window.onunhandledrejection = (event) => {
  console.error("Unhandled rejection:", event.reason);
};

// Check if running in a desktop environment
const isElectron = (window as { electron?: { isElectron?: boolean } }).electron
  ?.isElectron;
const isTauri = "__TAURI__" in window;
const isDesktopApp = isElectron || isTauri;

// Use HashRouter for desktop apps (file:// protocol doesn't support BrowserRouter well)
const Router = isDesktopApp ? HashRouter : BrowserRouter;

const root = document.getElementById("root");
if (root) {
  // Disable StrictMode in desktop apps to avoid double-effect issues
  const content = (
    <ErrorBoundary>
      <Router>
        <App />
        <TooltipProvider />
      </Router>
    </ErrorBoundary>
  );

  createRoot(root).render(
    isDesktopApp ? content : <StrictMode>{content}</StrictMode>,
  );
}
