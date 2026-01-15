import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

// Global tooltip component - add this once in App.tsx or main.tsx
export function TooltipProvider() {
  return (
    <ReactTooltip
      id="global-tooltip"
      className="!bg-vinyl-surface !text-vinyl-text !border !border-vinyl-border !rounded-lg !px-3 !py-2 !text-sm !shadow-xl !z-[9999]"
      place="top"
      delayShow={300}
      delayHide={100}
    />
  );
}

// Helper to add tooltip props to any element
export function tooltipProps(content: string) {
  return {
    "data-tooltip-id": "global-tooltip",
    "data-tooltip-content": content,
  };
}
