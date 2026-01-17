import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { key: string; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Playback",
    shortcuts: [
      { key: "Space", description: "Play / Pause" },
      { key: "N", description: "Next track" },
      { key: "P", description: "Previous track" },
      { key: "→", description: "Seek forward 5s" },
      { key: "←", description: "Seek backward 5s" },
    ],
  },
  {
    title: "Volume & Audio",
    shortcuts: [
      { key: "↑", description: "Volume up" },
      { key: "↓", description: "Volume down" },
      { key: "M", description: "Mute / Unmute" },
      { key: "E", description: "Toggle equalizer" },
    ],
  },
  {
    title: "Queue & Modes",
    shortcuts: [
      { key: "S", description: "Toggle shuffle" },
      { key: "R", description: "Cycle repeat mode" },
      { key: "Q", description: "Toggle queue view" },
      { key: "F", description: "Toggle favorite" },
    ],
  },
  {
    title: "Visualizer",
    shortcuts: [
      { key: "V", description: "Cycle visualizer style" },
      { key: "V V", description: "Turn off visualizer" },
    ],
  },
  {
    title: "Display",
    shortcuts: [
      { key: "I", description: "Toggle music info" },
    ],
  },
];

export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: KeyboardShortcutsDialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use portal to render at document body level
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-vinyl-surface border border-vinyl-border rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-vinyl-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-vinyl-accent/20 rounded-xl flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-vinyl-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-vinyl-text">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-vinyl-text-muted">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-vinyl-border rounded text-[10px] font-mono">
                  ?
                </kbd>{" "}
                to toggle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list - scrollable */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold text-vinyl-text-muted uppercase tracking-wider mb-2 px-3">
                  {group.title}
                </h3>
                <div className="space-y-0.5">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-vinyl-border/30 transition-colors"
                    >
                      <span className="text-vinyl-text text-sm">{shortcut.description}</span>
                      <kbd className="px-2.5 py-1 bg-vinyl-border/50 border border-vinyl-border rounded-lg text-xs font-mono text-vinyl-text-muted min-w-[2.5rem] text-center">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-vinyl-border bg-vinyl-border/20 rounded-b-2xl flex-shrink-0">
          <p className="text-xs text-vinyl-text-muted text-center">
            Shortcuts are disabled when typing in text fields
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
