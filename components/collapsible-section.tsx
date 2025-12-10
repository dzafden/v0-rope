"use client"

import { useState, useEffect, type ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import storage from "@/lib/storage"

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
  // Initialize expanded state from localStorage or use default
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const savedState = storage.get<Record<string, boolean>>("collapsibleSections", {})
    return savedState[id] !== undefined ? savedState[id] : defaultExpanded
  })

  // Save expanded state to localStorage when it changes
  useEffect(() => {
    const savedState = storage.get<Record<string, boolean>>("collapsibleSections", {})
    storage.set("collapsibleSections", { ...savedState, [id]: isExpanded })
  }, [isExpanded, id])

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={cn("mb-6", className)}>
      <motion.div
        className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-1.5 sm:px-4 sm:py-3 cursor-pointer"
        onClick={toggleExpanded}
        whileHover={{ backgroundColor: "rgba(82, 82, 91, 0.4)" }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center">
          <motion.div
            initial={{ rotate: isExpanded ? 90 : 0 }}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="mr-1 sm:mr-2 flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </motion.div>
          <h2 className="text-sm sm:text-lg font-semibold truncate">{title}</h2>
          {count > 0 && (
            <span className="ml-1.5 sm:ml-2 bg-purple-600/70 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center flex-shrink-0">
              {count}
            </span>
          )}
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-3 px-1 overflow-y-hidden overflow-x-hidden scrollbar-hide">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
