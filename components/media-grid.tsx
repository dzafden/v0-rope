"use client"

import { AnimatePresence, motion } from "framer-motion"
import type React from "react"
import type { MediaItem } from "@/types"
import { cn } from "@/lib/utils"

interface MediaGridProps {
  items: MediaItem[]
  renderItem: (item: MediaItem, index: number) => React.ReactNode
  gridClass?: string // Tailwind classes for grid layout
  emptyContent?: React.ReactNode // Content to display when items are empty
  layout?: "grid" | "flex" // grid for grid layout, flex for horizontal scrolling
  className?: string
}

export default function MediaGrid({
  items,
  renderItem,
  gridClass = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
  emptyContent,
  layout = "grid",
  className,
}: MediaGridProps) {
  if (items.length === 0 && emptyContent) {
    return <>{emptyContent}</>
  }

  // Create a map to deduplicate items by ID
  const uniqueItems = items.reduce((acc, item, index) => {
    // Use the index as part of the key to ensure uniqueness
    const uniqueKey = `${item.id}-${index}`
    acc.set(uniqueKey, { item, index })
    return acc
  }, new Map())

  const uniqueItemsArray = Array.from(uniqueItems.values())

  if (layout === "flex") {
    // Horizontal scrolling layout
    return (
      <div className={cn("flex overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide no-scrollbar", className)}>
        <div className="flex gap-4">
          <AnimatePresence>
            {uniqueItemsArray.map(({ item, index }) => (
              <motion.div
                key={`${item.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.05 * Math.min(index, 10) }}
                className="flex-shrink-0"
              >
                {renderItem(item, index)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Grid layout - using flex-based approach to maintain card aspect ratio
  return (
    <div className={cn("flex flex-wrap justify-between gap-4", className)}>
      <AnimatePresence>
        {uniqueItemsArray.map(({ item, index }) => (
          <motion.div
            key={`${item.id}-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.03 * Math.min(index, 15),
            }}
            className="flex"
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
