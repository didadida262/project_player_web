import React from "react";
import { cn } from "@/utils/cn";

export interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "100px",
      background = "rgba(0, 0, 0, 1)",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        style={{
          "--spread": "90deg",
          "--shimmer-color": shimmerColor,
          "--radius": borderRadius,
          "--speed": shimmerDuration,
          "--cut": shimmerSize,
          "--bg": background,
        } as React.CSSProperties}
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-1.5 py-0.5 text-xs text-white [background:var(--bg)] [border-radius:var(--radius)] transition-all duration-300 hover:scale-105 active:scale-95",
          "before:absolute before:inset-0 before:z-[-1] before:animate-[shimmer_var(--speed)_infinite] before:rounded-[--radius] before:bg-[linear-gradient(var(--spread),transparent,var(--shimmer-color),transparent)] before:bg-[length:200%_100%] before:blur-md",
          "after:absolute after:inset-0 after:z-[-1] after:animate-[shimmer_var(--speed)_infinite] after:rounded-[--radius] after:bg-[linear-gradient(var(--spread),transparent,var(--shimmer-color),transparent)] after:bg-[length:200%_100%]",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";

export default ShimmerButton;

