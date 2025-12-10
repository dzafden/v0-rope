"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface InfiniteScrollProps {
  loadMore: () => Promise<void>
  hasMore: boolean
  isLoading: boolean
  children: ReactNode
}

export default function InfiniteScroll({ loadMore, hasMore, isLoading, children }: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentLoadingRef = loadingRef.current

    if (!currentLoadingRef) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )

    observerRef.current.observe(currentLoadingRef)

    return () => {
      if (observerRef.current && currentLoadingRef) {
        observerRef.current.unobserve(currentLoadingRef)
      }
    }
  }, [loadMore, hasMore, isLoading])

  return (
    <>
      {children}

      <div ref={loadingRef} className="w-full py-8 flex justify-center">
        {isLoading && hasMore && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </motion.div>
        )}

        {!hasMore && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-zinc-500 text-sm">
            No more items to load
          </motion.div>
        )}
      </div>
    </>
  )
}
