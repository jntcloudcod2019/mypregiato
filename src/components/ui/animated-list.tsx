
import React, { ReactNode, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedListItem {
  id: string
  content: ReactNode
}

interface AnimatedListProps {
  items: AnimatedListItem[]
  className?: string
  delay?: number
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  items,
  className,
  delay = 100
}) => {
  const [visibleItems, setVisibleItems] = useState<AnimatedListItem[]>([])

  useEffect(() => {
    setVisibleItems([])
    items.forEach((item, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, item])
      }, index * delay)
    })
  }, [items, delay])

  return (
    <div className={cn("space-y-2", className)}>
      {visibleItems.map((item, index) => (
        <div
          key={item.id}
          className="animate-fade-in opacity-0"
          style={{
            animationDelay: `${index * delay}ms`,
            animationFillMode: 'forwards'
          }}
        >
          {item.content}
        </div>
      ))}
    </div>
  )
}
