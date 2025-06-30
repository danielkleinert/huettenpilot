import {useState} from 'react'
import type {ReactNode} from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  className?: string
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative group">
      <div
        onClick={(e) => {
          e.stopPropagation()
          setShowTooltip(!showTooltip)
        }}
      >
        {children}
      </div>
      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none transition-opacity duration-200 z-50 ${
        showTooltip ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      } ${className}`}>
        <div className="bg-popover text-popover-foreground border border-border rounded-md p-2 text-sm shadow-md whitespace-nowrap">
          {content}
        </div>
      </div>
    </div>
  )
}