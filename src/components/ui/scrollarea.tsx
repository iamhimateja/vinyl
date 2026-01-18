import { useOverlayScrollbars } from "overlayscrollbars-react";
import type { OverlayScrollbarsComponentProps } from "overlayscrollbars-react";
import { useEffect, useRef, forwardRef, type ReactNode, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Additional class for the viewport (scrollable content area) */
  viewportClassName?: string;
  /** Auto-hide scrollbar - "never" | "scroll" | "leave" | "move" */
  autoHide?: "never" | "scroll" | "leave" | "move";
  /** Auto-hide delay in ms */
  autoHideDelay?: number;
  /** Whether to show horizontal scrollbar */
  horizontal?: boolean;
  /** OverlayScrollbars options override */
  options?: OverlayScrollbarsComponentProps["options"];
}

/**
 * ScrollArea - A custom scrollbar component using OverlayScrollbars
 * Provides theme-adaptive, auto-hiding scrollbars with smooth scrolling
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      children,
      className,
      viewportClassName,
      autoHide = "leave",
      autoHideDelay = 400,
      horizontal = false,
      options,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const [initialize] = useOverlayScrollbars({
      options: {
        scrollbars: {
          theme: "os-theme-vinyl",
          autoHide,
          autoHideDelay,
          clickScroll: true,
        },
        overflow: {
          x: horizontal ? "scroll" : "hidden",
          y: "scroll",
        },
        ...options,
      },
      defer: true,
    });

    useEffect(() => {
      const container = containerRef.current;
      if (container) {
        initialize(container);
      }
    }, [initialize]);

    // Forward the ref
    useEffect(() => {
      if (ref) {
        if (typeof ref === "function") {
          ref(containerRef.current);
        } else {
          ref.current = containerRef.current;
        }
      }
    }, [ref]);

    return (
      <div
        ref={containerRef}
        className={cn("h-full w-full", className)}
        data-overlayscrollbars-initialize
        {...props}
      >
        <div className={viewportClassName}>{children}</div>
      </div>
    );
  }
);

ScrollArea.displayName = "ScrollArea";

export default ScrollArea;
