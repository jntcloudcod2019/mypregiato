import { cn } from "@/lib/utils";
import React, { HTMLAttributes, useEffect, useState } from "react";

interface AuroraTextProps extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  colors?: string[];
  className?: string;
  speed?: "slow" | "normal" | "fast";
}

export const AuroraText = ({
  children,
  colors = ["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"],
  className,
  speed = "normal",
  ...props
}: AuroraTextProps) => {
  const [gradientPosition, setGradientPosition] = useState(0);

  const speedValue = {
    slow: 50,
    normal: 30,
    fast: 15
  }[speed];

  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPosition((prev) => (prev + 1) % 100);
    }, speedValue);

    return () => clearInterval(interval);
  }, [speedValue]);

  const gradientString = `linear-gradient(${gradientPosition}deg, ${colors.join(", ")})`;

  return (
    <span
      className={cn("bg-clip-text text-transparent", className)}
      style={{ backgroundImage: gradientString }}
      {...props}
    >
      {children}
    </span>
  );
};
