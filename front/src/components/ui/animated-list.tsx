
import React, { ReactNode, useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedListItem {
  id: string
  content: ReactNode
}

interface AnimatedListProps {
  items: AnimatedListItem[]
  className?: string
  delay?: number // intervalo entre itens
  duration?: number // duração de cada item
  easing?: string // função de easing CSS
  direction?: 'up' | 'down' // direção do fade-in
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  items,
  className,
  delay = 80,
  duration = 300,
  easing = 'cubic-bezier(0.16, 1, 0.3, 1)',
  direction = 'up'
}) => {
  const [visibleItems, setVisibleItems] = useState<AnimatedListItem[]>([])

  useEffect(() => {
    setVisibleItems([])
    items.forEach((item, index) => {
      const t = setTimeout(() => {
        setVisibleItems(prev => [...prev, item])
      }, index * delay)
      return () => clearTimeout(t)
    })
  }, [items, delay])

  const translateFrom = useMemo(() => (direction === 'up' ? '4px' : '-4px'), [direction])

  return (
    <div className={cn("space-y-2", className)}>
      {visibleItems.map((item, index) => (
        <div
          key={item.id}
          className="opacity-0 will-change-[opacity,transform]"
          style={{
            animation: `fade-in ${duration}ms ${easing} forwards`,
            animationDelay: `${index * delay}ms`,
            // estado inicial da animação
            transform: `translateY(${translateFrom})`
          }}
        >
          {item.content}
        </div>
      ))}
    </div>
  )
}
