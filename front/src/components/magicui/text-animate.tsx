import React, { useEffect, useRef } from 'react'

interface TextAnimateProps {
  children: React.ReactNode
  animation?: 'fadeIn' | 'typewriter' | 'scaleUp' | 'slideIn'
  by?: 'character' | 'word' | 'line'
  delay?: number
  duration?: number
  className?: string
}

export const TextAnimate: React.FC<TextAnimateProps> = ({
  children,
  animation = 'fadeIn',
  by = 'word',
  delay = 0,
  duration = 0.2,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // Implementação simples para animação de texto
    // Em uma versão completa, seria implementada a animação real
    // Mas para este exemplo, apenas retornamos o texto sem animação
    const container = containerRef.current
    if (!container) return
    
    // Adicionar classe para animação
    container.classList.add('text-animated')
  }, [])
  
  return (
    <div ref={containerRef} className={`text-animate ${className}`}>
      {children}
    </div>
  )
}
