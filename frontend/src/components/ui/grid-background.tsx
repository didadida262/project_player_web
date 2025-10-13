import React from "react";
import { cn } from "@/utils/cn";

export const GridBackground = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div className={cn("relative w-full h-full bg-black", className)}>
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />
      
      {/* Animated grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-[slide_3s_linear_infinite]" style={{ top: '20%' }} />
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent animate-[slide_4s_linear_infinite]" style={{ top: '60%' }} />
        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent animate-[slideVertical_3s_linear_infinite]" style={{ left: '30%' }} />
        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-pink-500/50 to-transparent animate-[slideVertical_4s_linear_infinite]" style={{ left: '70%' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

