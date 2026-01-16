import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  /** Show "Don't ask me again" checkbox */
  showDontAskAgain?: boolean;
  /** Callback when confirmed, receives dontAskAgain state */
  onConfirm: (dontAskAgain?: boolean) => void;
  onCancel: () => void;
  /** Additional warning text shown in a highlighted box */
  warningText?: string;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  showDontAskAgain = false,
  onConfirm,
  onCancel,
  warningText,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  // Reset checkbox state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDontAskAgain(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onCancel]);

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "bg-red-500/20 text-red-400",
      button: "bg-red-500 hover:bg-red-600 text-white",
      warning: "bg-red-500/10 border-red-500/30 text-red-400",
    },
    warning: {
      icon: "bg-amber-500/20 text-amber-400",
      button: "bg-amber-500 hover:bg-amber-600 text-white",
      warning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    },
    info: {
      icon: "bg-blue-500/20 text-blue-400",
      button: "bg-blue-500 hover:bg-blue-600 text-white",
      warning: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    },
  };

  const styles = variantStyles[variant];

  const handleConfirm = () => {
    onConfirm(showDontAskAgain ? dontAskAgain : undefined);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-vinyl-surface border border-vinyl-border rounded-xl shadow-2xl w-full max-w-md animate-fade-in"
        tabIndex={-1}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-full text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${styles.icon}`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-vinyl-text text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-vinyl-text-muted text-center mb-4">{message}</p>

          {/* Warning text */}
          {warningText && (
            <div
              className={`p-3 rounded-lg border mb-4 text-sm ${styles.warning}`}
            >
              {warningText}
            </div>
          )}

          {/* Don't ask again checkbox */}
          {showDontAskAgain && (
            <label className="flex items-center gap-2 mb-4 cursor-pointer justify-center">
              <input
                type="checkbox"
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
                className="w-4 h-4 rounded border-vinyl-border bg-vinyl-bg text-vinyl-accent focus:ring-vinyl-accent focus:ring-offset-0"
              />
              <span className="text-sm text-vinyl-text-muted">
                Don't ask me again
              </span>
            </label>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg bg-vinyl-border text-vinyl-text hover:bg-vinyl-border/70 transition-colors font-medium"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 rounded-lg transition-colors font-medium ${styles.button}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
