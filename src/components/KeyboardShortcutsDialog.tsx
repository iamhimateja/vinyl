import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scrollarea";

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
      { key: "V", description: "On → cycle styles → off" },
      { key: "V V", description: "Toggle on/off" },
    ],
  },
  {
    title: "Display",
    shortcuts: [
      { key: "I", description: "Toggle music info" },
      { key: "?", description: "Show keyboard shortcuts" },
    ],
  },
  {
    title: "Quick Actions",
    shortcuts: [
      { key: "⌘/Ctrl K", description: "Open command menu" },
    ],
  },
];

export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-vinyl-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-vinyl-accent/20 rounded-xl flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-vinyl-accent" />
            </div>
            <div>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <p className="text-xs text-vinyl-text-muted mt-1">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-vinyl-border rounded text-[10px] font-mono">
                  ?
                </kbd>{" "}
                to toggle
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Shortcuts list - scrollable */}
        <ScrollArea className="p-4 flex-1">
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
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-vinyl-border bg-vinyl-border/20 rounded-b-xl flex-shrink-0">
          <p className="text-xs text-vinyl-text-muted text-center">
            Shortcuts are disabled when typing in text fields
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
