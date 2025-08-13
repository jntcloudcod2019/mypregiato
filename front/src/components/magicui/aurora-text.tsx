import React from 'react';

type AuroraTextProps = {
  className?: string;
  children: React.ReactNode;
  colors?: string[];
  speed?: number;
};

export const AuroraText: React.FC<AuroraTextProps> = ({ className = '', children, colors = [
  '#0ea5e9', // sky-500
  '#38bdf8', // sky-400
  '#22d3ee', // cyan-400
  '#60a5fa', // blue-400
], speed = 1 }) => {
  const style: React.CSSProperties = {
    ['--aurora-colors' as any]: colors.join(','),
    ['--aurora-speed' as any]: String(speed),
  };
  return (
    <span className={`aurora-text ${className}`} style={style}>{children}</span>
  );
};

export default AuroraText;

