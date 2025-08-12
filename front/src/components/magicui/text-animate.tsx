import React from 'react';

export type TextAnimateProps = {
  children: string;
  className?: string;
  delay?: number; // seconds
  duration?: number; // seconds
  by?: 'text' | 'word' | 'character';
  animation?: 'scaleUp';
  startOnView?: boolean; // ignorado nesta versão simples
  once?: boolean; // ignorado nesta versão simples
  as?: keyof JSX.IntrinsicElements;
};

function splitText(text: string, by: 'text' | 'word' | 'character'): string[] {
  if (by === 'text') return [text];
  if (by === 'word') return text.split(/(\s+)/); // mantém espaços
  return Array.from(text);
}

export const TextAnimate: React.FC<TextAnimateProps> = ({
  children,
  className,
  delay = 0,
  duration = 0.35,
  by = 'text',
  animation = 'scaleUp',
  as: As = 'p',
}) => {
  const parts = splitText(children, by);
  const isSpace = (s: string) => /^\s+$/.test(s);

  if (animation !== 'scaleUp') {
    return <As className={className}>{children}</As>;
  }

  // Renderização com atraso incremental
  let accDelay = delay;
  const increment = by === 'character' ? 0.015 : by === 'word' ? 0.03 : 0; // leve cascata

  return (
    <As className={className} style={{
      // fallback caso seja by=text
      ['--ta-duration' as any]: `${duration}s`,
      ['--ta-delay' as any]: `${delay}s`,
    }}>
      {parts.map((part, idx) => {
        const d = accDelay;
        if (!isSpace(part)) accDelay += increment;
        return (
          <span
            key={`${idx}-${part}`}
            className="inline-block will-change-transform will-change-opacity animate-scale-up"
            style={{
              ['--ta-duration' as any]: `${duration}s`,
              ['--ta-delay' as any]: `${d}s`,
            }}
          >
            {part}
          </span>
        );
      })}
    </As>
  );
};

export default TextAnimate;
