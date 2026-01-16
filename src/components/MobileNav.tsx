import { NavLink } from "react-router-dom";
import { ListMusic, Music, Settings, Wand2 } from "lucide-react";

const navItems = [
  { to: "/library", icon: Music, label: "Library" },
  { to: "/playlists", icon: ListMusic, label: "Playlists" },
  { to: "/generator", icon: Wand2, label: "Generate", badge: "Beta" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-vinyl-surface border-t border-vinyl-border z-40 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive ? "text-vinyl-accent" : "text-vinyl-text-muted"
              }`
            }
          >
            <div className="relative">
              <item.icon className="w-6 h-6" />
              {item.badge && (
                <span className="absolute -top-1 -right-2 text-[8px] px-1 py-0.5 bg-vinyl-accent text-vinyl-bg rounded font-bold">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
