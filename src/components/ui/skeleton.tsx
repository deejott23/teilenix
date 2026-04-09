import React from 'react'
import { cn } from '@/lib/utils'

export function Sk({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-muted', className)} style={style} />
  )
}
