import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Disc3,
  ListMusic,
  Music,
  Download,
  RefreshCw,
  Settings,
  Headphones,
  Sun,
  Moon,
  Info,
  HelpCircle,
} from "lucide-react";
import { tooltipProps } from "./Tooltip";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import type { AppSettings, Theme } from "../types";

interface SidebarProps {
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
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar({
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
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Listen for ? key to open shortcuts dialog
  useEffect(() => {
    const handleQuestionMark = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleQuestionMark);
    return () => document.removeEventListener("keydown", handleQuestionMark);
  }, []);

  return (
    <aside className="w-16 h-screen bg-vinyl-surface/95 backdrop-blur-sm border-r border-vinyl-border flex flex-col items-center flex-shrink-0 fixed left-0 top-0 z-[60] py-4">
      {/* Logo */}
      <NavLink
        to="/library"
        className="mb-6"
        {...tooltipProps(appTitle, "right")}
      >
        <div className="w-10 h-10 bg-vinyl-accent rounded-full flex items-center justify-center hover:scale-110 transition-transform">
          <AppIcon className="w-6 h-6 text-vinyl-bg" />
        </div>
      </NavLink>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                isActive
                  ? "bg-vinyl-accent/20 text-vinyl-accent"
                  : "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50"
              }`
            }
            {...tooltipProps(item.label, "right")}
          >
            <item.icon className="w-5 h-5" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-1 pt-4 border-t border-vinyl-border">
        {/* Theme toggle */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50"
            {...tooltipProps(
              theme === "dark" ? "Light Mode" : "Dark Mode",
              "right",
            )}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Keyboard shortcuts help */}
        <button
          onClick={() => setShowShortcuts(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50"
          {...tooltipProps("Keyboard Shortcuts (?)", "right")}
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* About link */}
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
              isActive
                ? "bg-vinyl-accent/20 text-vinyl-accent"
                : "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50"
            }`
          }
          {...tooltipProps("About", "right")}
        >
          <Info className="w-5 h-5" />
        </NavLink>

        {/* Update available notification */}
        {isUpdateAvailable && onUpdate && (
          <button
            onClick={onUpdate}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors bg-vinyl-accent/20 text-vinyl-accent hover:bg-vinyl-accent/30 relative"
            {...tooltipProps("Update Available", "right")}
          >
            <RefreshCw className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-vinyl-accent rounded-full" />
          </button>
        )}

        {/* Install app button */}
        {canInstall && onInstall && (
          <button
            onClick={onInstall}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors text-vinyl-accent hover:bg-vinyl-accent/20"
            {...tooltipProps("Install App", "right")}
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </aside>
  );
}
