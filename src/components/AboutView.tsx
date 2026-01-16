import { useState, useEffect } from "react";
import {
  Disc3,
  Heart,
  Database,
  Wifi,
  WifiOff,
  Download,
  Monitor,
  Smartphone,
} from "lucide-react";
import { checkStorageQuota } from "../lib/db";
import { formatFileSize } from "../lib/audioMetadata";

// Detect browser type
function getBrowserInfo() {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox"))
    return { name: "Firefox", supportsInstall: false };
  if (ua.includes("Edg")) return { name: "Edge", supportsInstall: true };
  if (ua.includes("Chrome")) return { name: "Chrome", supportsInstall: true };
  if (ua.includes("Safari")) return { name: "Safari", supportsInstall: false };
  return { name: "Browser", supportsInstall: false };
}

export function AboutView() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storage, setStorage] = useState<{
    used: number;
    quota: number;
    percent: number;
  } | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const browserInfo = getBrowserInfo();

  // Check if already installed as PWA
  const isInstalled = window.matchMedia("(display-mode: standalone)").matches;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check storage
    checkStorageQuota().then(setStorage);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-8">
      {/* Logo section */}
      <div className="text-center">
        <div className="w-20 h-20 bg-vinyl-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <Disc3 className="w-12 h-12 text-vinyl-bg" />
        </div>
        <h1 className="text-2xl font-bold text-vinyl-text">
          Vinyl Music Player
        </h1>
        <p className="text-vinyl-text-muted mt-1">Version 1.0.0</p>
      </div>

      {/* Description */}
      <div className="text-center text-vinyl-text-muted">
        <p>
          A minimal, offline-first music player that feels like a personal vinyl
          player.
        </p>
        <p className="mt-2">Your music, your data, fully owned by you.</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Online status */}
        <div className="bg-vinyl-surface rounded-xl p-4 border border-vinyl-border">
          <div className="flex items-center gap-2 mb-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-vinyl-accent" />
            )}
            <span className="text-sm font-medium text-vinyl-text">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <p className="text-xs text-vinyl-text-muted">
            {isOnline
              ? "Connected to network"
              : "Working offline - local music available"}
          </p>
        </div>

        {/* Storage status */}
        <div className="bg-vinyl-surface rounded-xl p-4 border border-vinyl-border">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-vinyl-accent" />
            <span className="text-sm font-medium text-vinyl-text">Storage</span>
          </div>
          {storage && (
            <>
              <p className="text-xs text-vinyl-text-muted mb-2">
                {formatFileSize(storage.used)} used
              </p>
              <div className="h-1.5 bg-vinyl-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-vinyl-accent transition-all"
                  style={{ width: `${Math.min(storage.percent, 100)}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Install as App */}
      <div className="bg-vinyl-surface rounded-xl p-5 border border-vinyl-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-vinyl-text flex items-center gap-2">
            <Download className="w-5 h-5 text-vinyl-accent" />
            Install as App
          </h3>
          {isInstalled && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
              Installed
            </span>
          )}
        </div>

        {isInstalled ? (
          <p className="text-sm text-vinyl-text-muted">
            You're running Vinyl as a standalone app. Enjoy!
          </p>
        ) : (
          <>
            <p className="text-sm text-vinyl-text-muted mb-3">
              Install Vinyl as a standalone app for the best experience.
            </p>

            <button
              onClick={() => setShowInstallGuide(!showInstallGuide)}
              className="text-sm text-vinyl-accent hover:underline"
            >
              {showInstallGuide
                ? "Hide instructions"
                : "Show install instructions"}
            </button>

            {showInstallGuide && (
              <div className="mt-4 space-y-4 text-sm">
                {/* Desktop */}
                <div className="border-t border-vinyl-border pt-4">
                  <h4 className="font-medium text-vinyl-text flex items-center gap-2 mb-2">
                    <Monitor className="w-4 h-4" />
                    Desktop
                  </h4>
                  <div className="space-y-2 text-vinyl-text-muted">
                    <p>
                      <strong className="text-vinyl-text">Chrome/Edge:</strong>{" "}
                      Click the install icon (⊕) in the address bar, or use Menu
                      → "Install Vinyl..."
                    </p>
                    <p>
                      <strong className="text-vinyl-text">Firefox:</strong> Not
                      supported. Firefox removed PWA install support. Use Chrome
                      or Edge instead.
                    </p>
                    <p>
                      <strong className="text-vinyl-text">
                        Safari (macOS 14+):
                      </strong>{" "}
                      File → "Add to Dock"
                    </p>
                  </div>
                </div>

                {/* Mobile */}
                <div className="border-t border-vinyl-border pt-4">
                  <h4 className="font-medium text-vinyl-text flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4" />
                    Mobile
                  </h4>
                  <div className="space-y-2 text-vinyl-text-muted">
                    <p>
                      <strong className="text-vinyl-text">
                        Android Chrome:
                      </strong>{" "}
                      Tap menu (⋮) → "Add to Home Screen" or "Install App"
                    </p>
                    <p>
                      <strong className="text-vinyl-text">iOS Safari:</strong>{" "}
                      Tap Share (□↑) → "Add to Home Screen"
                    </p>
                  </div>
                </div>

                {/* Current browser */}
                <div className="border-t border-vinyl-border pt-4">
                  <p className="text-vinyl-text-muted">
                    You're using{" "}
                    <strong className="text-vinyl-text">
                      {browserInfo.name}
                    </strong>
                    {browserInfo.supportsInstall
                      ? " - Look for the install icon in your address bar!"
                      : " - This browser has limited PWA support. Try Chrome or Edge for the best experience."}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Features */}
      <div className="bg-vinyl-surface rounded-xl p-5 border border-vinyl-border">
        <h3 className="font-medium text-vinyl-text mb-3">Features</h3>
        <ul className="space-y-2 text-sm text-vinyl-text-muted">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-vinyl-accent rounded-full" />
            Offline-first design
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-vinyl-accent rounded-full" />
            Import local audio files
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-vinyl-accent rounded-full" />
            Folder import support
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-vinyl-accent rounded-full" />
            Create playlists
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-vinyl-accent rounded-full" />
            Media session support
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-vinyl-accent rounded-full" />
            Installable as PWA
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="text-center text-vinyl-text-muted text-sm">
        <p className="flex items-center justify-center gap-1">
          Made with{" "}
          <Heart className="w-4 h-4 text-red-400" fill="currentColor" /> for
          music lovers
        </p>
      </div>
    </div>
  );
}
