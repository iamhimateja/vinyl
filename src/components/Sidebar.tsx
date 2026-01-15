import { NavLink } from "react-router-dom";
import {
  Disc3,
  ListMusic,
  Music,
  Download,
  RefreshCw,
  Settings,
  Headphones,
  Wand2,
  Sun,
  Moon,
  Info,
} from "lucide-react";
import type { AppSettings, Theme } from "../types";

interface SidebarProps {
  songCount: number;
  canInstall?: boolean;
  onInstall?: () => void;
  isUpdateAvailable?: boolean;
  onUpdate?: () => void;
  appTitle?: string;
  appIcon?: AppSettings["appIcon"];
  theme?: Theme;
  onToggleTheme?: () => void;
}

const ICON_MAP = {
  disc: Disc3,
  music: Music,
  headphones: Headphones,
  vinyl: Disc3,
};

const navItems = [
  { to: "/library", icon: Music, label: "Library" },
  { to: "/playlists", icon: ListMusic, label: "Playlists" },
  { to: "/generator", icon: Wand2, label: "Generator" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar({
  songCount,
  canInstall,
  onInstall,
  isUpdateAvailable,
  onUpdate,
  appTitle = "Vinyl",
  appIcon = "disc",
  theme = "dark",
  onToggleTheme,
}: SidebarProps) {
  const AppIcon = ICON_MAP[appIcon] || Disc3;

  return (
    <aside className="w-64 h-screen bg-vinyl-surface border-r border-vinyl-border flex flex-col flex-shrink-0 sticky top-0">
      {/* Logo */}
      <div className="p-6">
        <NavLink to="/library" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-vinyl-accent rounded-full flex items-center justify-center">
            <AppIcon className="w-6 h-6 text-vinyl-bg" />
          </div>
          <div>
            <h1 className="font-bold text-vinyl-text">{appTitle}</h1>
            <p className="text-xs text-vinyl-text-muted">Music Player</p>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-vinyl-accent/20 text-vinyl-accent"
                      : "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.to === "/library" && songCount > 0 && (
                  <span className="ml-auto text-xs bg-vinyl-border px-2 py-0.5 rounded-full">
                    {songCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-vinyl-border space-y-1">
        {/* Theme toggle */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
        )}

        {/* About link */}
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? "bg-vinyl-accent/20 text-vinyl-accent"
                : "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50"
            }`
          }
        >
          <Info className="w-5 h-5" />
          <span>About</span>
        </NavLink>

        {/* Update available notification */}
        {isUpdateAvailable && onUpdate && (
          <button
            onClick={onUpdate}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors bg-vinyl-accent/20 text-vinyl-accent hover:bg-vinyl-accent/30"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Update Available</span>
          </button>
        )}

        {/* Install app button */}
        {canInstall && onInstall && (
          <button
            onClick={onInstall}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-vinyl-accent hover:bg-vinyl-accent/20"
          >
            <Download className="w-5 h-5" />
            <span>Install App</span>
          </button>
        )}
      </div>
    </aside>
  );
}
