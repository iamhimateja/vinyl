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
  Music,
  Sliders,
  ListMusic,
  Keyboard,


  FolderOpen,



  Palette,
  Zap,
  MonitorSmartphone,
  Github,
  ExternalLink,
} from "lucide-react";
import { checkStorageQuota } from "../lib/db";
import { formatFileSize } from "../lib/audioMetadata";
import { isDesktop } from "../lib/platform";

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

const APP_VERSION = "1.0.0";

export function AboutView() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storage, setStorage] = useState<{
    used: number;
    quota: number;
    percent: number;
  } | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const browserInfo = getBrowserInfo();
  const isElectron = isDesktop();

  // Check if already installed as PWA
  const isInstalled = window.matchMedia("(display-mode: standalone)").matches || isElectron;

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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Logo section */}
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-vinyl-accent to-vinyl-accent/70 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-vinyl-accent/20">
          <Disc3 className="w-14 h-14 text-vinyl-bg animate-spin-slow" />
        </div>
        <h1 className="text-3xl font-bold text-vinyl-text">
          Vinyl Music Player
        </h1>
        <p className="text-vinyl-text-muted mt-1">Version {APP_VERSION}</p>
        {isElectron && (
          <span className="inline-block mt-2 text-xs bg-vinyl-accent/20 text-vinyl-accent px-3 py-1 rounded-full">
            Desktop App
          </span>
        )}
      </div>

      {/* Description */}
      <div className="text-center text-vinyl-text-muted">
        <p className="text-lg">
          A beautiful, offline-first music player with a vinyl-inspired experience.
        </p>
        <p className="mt-2 text-sm">
          Your music, your data, fully private — no accounts, no tracking.
        </p>
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
              : "Working offline — music still plays!"}
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

      {/* Features Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-vinyl-text flex items-center gap-2">
          <Zap className="w-5 h-5 text-vinyl-accent" />
          Features
        </h2>

        {/* Playback */}
        <FeatureSection
          icon={<Music className="w-5 h-5" />}
          title="Music Playback"
          isExpanded={expandedSection === "playback"}
          onToggle={() => toggleSection("playback")}
          items={[
            "Play MP3, FLAC, WAV, OGG, AAC, M4A, OPUS, AIFF, WMA, APE, WebM",
            "Animated vinyl record visualization",
            "Crossfade between tracks (0-12s)",
            "Playback speed control (0.5x - 2x)",
            "Drag & drop files to play instantly",
            "Queue management with drag-to-reorder",
            "Shuffle and repeat modes",
          ]}
        />

        {/* Audio */}
        <FeatureSection
          icon={<Sliders className="w-5 h-5" />}
          title="Audio Features"
          isExpanded={expandedSection === "audio"}
          onToggle={() => toggleSection("audio")}
          items={[
            "10-band equalizer (60Hz - 16kHz)",
            "EQ presets: Rock, Pop, Jazz, Classical, Bass Boost, etc.",
            "Real-time audio processing via Web Audio API",
            "Audio visualizer: Bars, Wave, Area Wave styles",
            "Sleep timer with countdown display",
          ]}
        />

        {/* Library */}
        <FeatureSection
          icon={<FolderOpen className="w-5 h-5" />}
          title="Library Management"
          isExpanded={expandedSection === "library"}
          onToggle={() => toggleSection("library")}
          items={[
            "Folder scanning with recursive import",
            "Auto-sync file watcher (detects new/removed files)",
            "Smart duplicate detection",
            "Automatic metadata extraction (title, artist, album, artwork)",
            "Quick play: drag & drop without importing",
            isElectron ? "Native file system access" : "Browser file API support",
          ]}
        />

        {/* Organization */}
        <FeatureSection
          icon={<ListMusic className="w-5 h-5" />}
          title="Organization"
          isExpanded={expandedSection === "organization"}
          onToggle={() => toggleSection("organization")}
          items={[
            "Create custom playlists",
            "Auto-playlist creation from folder structure",
            "Favorites with one-click heart button",
            "Search and filter your library",
          ]}
        />

        {/* Interface */}
        <FeatureSection
          icon={<Palette className="w-5 h-5" />}
          title="Interface"
          isExpanded={expandedSection === "interface"}
          onToggle={() => toggleSection("interface")}
          items={[
            "Light and dark themes",
            "8 customizable accent colors",
            "Responsive design (desktop & mobile)",
            "Mini player with album art",
            "Full-screen now playing view",
            isElectron ? "System tray mini player with controls" : "Media session integration",
          ]}
        />

        {/* Keyboard Shortcuts */}
        <FeatureSection
          icon={<Keyboard className="w-5 h-5" />}
          title="Keyboard Shortcuts"
          isExpanded={expandedSection === "shortcuts"}
          onToggle={() => toggleSection("shortcuts")}
          items={[
            "Space: Play/Pause",
            "N/P: Next/Previous track",
            "←/→: Seek backward/forward",
            "↑/↓: Volume up/down",
            "M: Mute | S: Shuffle | R: Repeat",
            "V: Cycle visualizer | VV: Turn off",
            "I: Music info | E: Equalizer | F: Favorite",
            "Q: Queue | ?: Show all shortcuts",
          ]}
        />

        {/* Platforms */}
        <FeatureSection
          icon={<MonitorSmartphone className="w-5 h-5" />}
          title="Cross-Platform"
          isExpanded={expandedSection === "platforms"}
          onToggle={() => toggleSection("platforms")}
          items={[
            "Web PWA with offline support",
            "Desktop app: Windows, macOS, Linux",
            "Mobile-friendly touch interface",
            "Installable as standalone app",
            "Works completely offline",
          ]}
        />
      </div>

      {/* Install as App - only show on web */}
      {!isElectron && (
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
              You're running Vinyl as a standalone app. Enjoy the full experience!
            </p>
          ) : (
            <>
              <p className="text-sm text-vinyl-text-muted mb-3">
                Install Vinyl for quick access and offline use.
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
                        Click the install icon (⊕) in the address bar
                      </p>
                      <p>
                        <strong className="text-vinyl-text">Safari (macOS 14+):</strong>{" "}
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
                        <strong className="text-vinyl-text">Android:</strong>{" "}
                        Menu (⋮) → "Install App"
                      </p>
                      <p>
                        <strong className="text-vinyl-text">iOS:</strong>{" "}
                        Share (□↑) → "Add to Home Screen"
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-vinyl-border pt-4">
                    <p className="text-vinyl-text-muted">
                      Using <strong className="text-vinyl-text">{browserInfo.name}</strong>
                      {browserInfo.supportsInstall
                        ? " — Look for the install button!"
                        : " — Try Chrome or Edge for best experience."}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Privacy */}
      <div className="bg-vinyl-surface rounded-xl p-5 border border-vinyl-border">
        <h3 className="font-medium text-vinyl-text flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-vinyl-accent" />
          Privacy First
        </h3>
        <ul className="space-y-2 text-sm text-vinyl-text-muted">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            No accounts required
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            No data collection or analytics
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            All data stored locally on your device
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Open source and auditable
          </li>
        </ul>
      </div>

      {/* Links */}
      <div className="flex items-center justify-center gap-4">
        <a
          href="https://github.com/iamhimateja/vinyl-music-player"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-vinyl-text-muted hover:text-vinyl-accent transition-colors"
        >
          <Github className="w-4 h-4" />
          GitHub
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Footer */}
      <div className="text-center text-vinyl-text-muted text-sm pt-4 border-t border-vinyl-border">
        <p className="flex items-center justify-center gap-1">
          Made with{" "}
          <Heart className="w-4 h-4 text-red-400" fill="currentColor" /> for
          music lovers
        </p>
        <p className="mt-2 text-xs">
          © 2024 Vinyl Music Player. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// Feature Section Component
interface FeatureSectionProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
  isExpanded: boolean;
  onToggle: () => void;
}

function FeatureSection({ icon, title, items, isExpanded, onToggle }: FeatureSectionProps) {
  return (
    <div className="bg-vinyl-surface rounded-xl border border-vinyl-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-vinyl-border/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-vinyl-accent">{icon}</div>
          <span className="font-medium text-vinyl-text">{title}</span>
        </div>
        <div className={`text-vinyl-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <ul className="space-y-2 text-sm text-vinyl-text-muted">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-vinyl-accent rounded-full mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
