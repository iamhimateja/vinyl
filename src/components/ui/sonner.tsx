import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-vinyl-surface group-[.toaster]:text-vinyl-text group-[.toaster]:border-vinyl-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-vinyl-text-muted",
          actionButton:
            "group-[.toast]:bg-vinyl-accent group-[.toast]:text-vinyl-bg",
          cancelButton:
            "group-[.toast]:bg-vinyl-border group-[.toast]:text-vinyl-text",
          success: "group-[.toaster]:border-green-500/30",
          error: "group-[.toaster]:border-red-500/30",
          warning: "group-[.toaster]:border-amber-500/30",
          info: "group-[.toaster]:border-blue-500/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
