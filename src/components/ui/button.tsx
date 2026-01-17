import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vinyl-accent focus-visible:ring-offset-2 focus-visible:ring-offset-vinyl-bg disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-vinyl-accent text-vinyl-bg hover:bg-vinyl-accent-light",
        destructive:
          "bg-red-500 text-white hover:bg-red-600",
        warning:
          "bg-amber-500 text-white hover:bg-amber-600",
        info:
          "bg-blue-500 text-white hover:bg-blue-600",
        outline:
          "border border-vinyl-border bg-transparent text-vinyl-text hover:bg-vinyl-border/50",
        secondary:
          "bg-vinyl-border text-vinyl-text hover:bg-vinyl-border/70",
        ghost:
          "text-vinyl-text-muted hover:text-vinyl-text hover:bg-vinyl-border/50",
        link:
          "text-vinyl-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
