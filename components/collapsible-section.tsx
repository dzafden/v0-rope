"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CollapsibleSectionProps {
  id: string
  title: string
  count: number
  children: ReactNode
  defaultExpanded?: boolean
  className?: string
}

export default function CollapsibleSection({
  id,
  title,
  count,
  children,
  defaultExpanded = true,
  className,
}: CollapsibleSectionProps) {
  // Simply render the children directly without any collapsible functionality
  return <div className={cn("mb-0", className)}>{children}</div>
}
