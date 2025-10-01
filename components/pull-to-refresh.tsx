"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const refreshThreshold = 80 // Distance in pixels to trigger refresh

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only enable pull-to-refresh when at the top of the container
      if (container.scrollTop <= 0) {
        startY.current = e.touches[0].clientY
        currentY.current = startY.current
        setIsPulling(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return

      currentY.current = e.touches[0].clientY
      const distance = Math.max(0, currentY.current - startY.current)

      // Apply resistance to make the pull feel more natural
      const resistedDistance = Math.min(distance * 0.4, 120)

      if (container.scrollTop <= 0 && distance > 0) {
        setPullDistance(resistedDistance)
        // Prevent default scrolling behavior when pulling
        e.preventDefault()
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return

      if (pullDistance > refreshThreshold && !refreshing) {
        setRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setRefreshing(false)
          setPullDistance(0)
          setIsPulling(false)
        }
      } else {
        setPullDistance(0)
        setIsPulling(false)
      }
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isPulling, pullDistance, refreshing, onRefresh])

  return (
    <div ref={containerRef} className="h-full overflow-y-auto overflow-x-hidden relative no-scrollbar">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
        style={{
          y: pullDistance - 60,
          opacity: pullDistance / refreshThreshold,
        }}
      >
        <motion.div
          className="bg-purple-600 rounded-full p-3"
          animate={{
            rotate: refreshing ? 360 : pullDistance > refreshThreshold ? 180 : 0,
          }}
          transition={{
            duration: refreshing ? 1 : 0.2,
            repeat: refreshing ? Number.POSITIVE_INFINITY : 0,
            ease: "linear",
          }}
        >
          <RefreshCw className="w-6 h-6" />
        </motion.div>
      </motion.div>

      {/* Content with pull effect */}
      <motion.div style={{ y: pullDistance }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        {children}
      </motion.div>
    </div>
  )
}
