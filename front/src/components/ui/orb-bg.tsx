import React from 'react';

// Orb style background inspirado no ReactBits (um grande anel com brilho)
export const OrbBackground: React.FC<{ className?: string }>= ({ className }) => {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center ${className || ''}`} aria-hidden>
      <div className="orb-ring">
        <div className="orb-ring-inner" />
      </div>
    </div>
  );
};

export default OrbBackground;
