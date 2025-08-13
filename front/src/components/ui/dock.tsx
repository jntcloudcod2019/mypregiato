import React from 'react';

export type DockItem = {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
};

export function Dock({ items, className = '' }: { items: DockItem[]; className?: string }) {
  return (
    <div className={`w-full flex items-center justify-center py-2 ${className}`}>
      <div className="flex items-end gap-3 rounded-2xl bg-card/70 border px-3 py-2 shadow-smooth">
        {items.map((item) => (
          <button
            key={item.label}
            title={item.label}
            onClick={item.onClick}
            className="group relative h-12 w-12 grid place-items-center rounded-xl bg-background/70 border hover:bg-background transition-all hover:-translate-y-1 hover:shadow-elegant"
          >
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              {item.icon}
            </span>
            <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Dock;
