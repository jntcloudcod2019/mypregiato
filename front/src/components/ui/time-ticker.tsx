import React, { useState, useEffect } from 'react';

interface TimeTickerProps {
  onTick?: (timestamp: number) => void;
  interval?: number;
}

/**
 * Componente isolado para gerenciar o tick de tempo
 * Evita re-render global do componente pai
 */
export const TimeTicker: React.FC<TimeTickerProps> = ({ 
  onTick, 
  interval = 1000 
}) => {
  const [nowTick, setNowTick] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      const timestamp = Date.now();
      setNowTick(timestamp);
      onTick?.(timestamp);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, onTick]);

  return null; // Componente não renderiza nada visualmente
};
