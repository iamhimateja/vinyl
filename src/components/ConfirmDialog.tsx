import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
  const [dontAskAgain, setDontAskAgain] = useState(false);

  // Reset checkbox state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDontAskAgain(false);
    }
  }, [isOpen]);

  const variantStyles = {
    danger: {
      icon: "bg-red-500/20 text-red-400",
      button: "destructive" as const,
      warning: "bg-red-500/10 border-red-500/30 text-red-400",
    },
    warning: {
      icon: "bg-amber-500/20 text-amber-400",
      button: "warning" as const,
      warning: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    },
    info: {
      icon: "bg-blue-500/20 text-blue-400",
      button: "info" as const,
      warning: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    },
  };

  const styles = variantStyles[variant];

  const handleConfirm = () => {
    onConfirm(showDontAskAgain ? dontAskAgain : undefined);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center sm:text-center">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${styles.icon}`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          
          <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Warning text */}
        {warningText && (
          <div
            className={`p-3 rounded-lg border text-sm ${styles.warning}`}
          >
            {warningText}
          </div>
        )}

        {/* Don't ask again checkbox */}
        {showDontAskAgain && (
          <label className="flex items-center gap-2 cursor-pointer justify-center">
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

        <AlertDialogFooter className="sm:flex-row gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={styles.button}
            onClick={handleConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
