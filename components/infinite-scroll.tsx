"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import React from "react"

interface InfiniteScrollProps {
  loadMore: () => Promise<void>
  hasMore: boolean
  isLoading: boolean
  children: ReactNode
}

export default function InfiniteScroll({ loadMore, hasMore, isLoading, children }: InfiniteScrollProps) {
  // First, let's add a console log to help debug the duplicate keys issue
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  // Add a function to help with debugging
  const logDuplicateKeys = (children: ReactNode) => {
    if (process.env.NODE_ENV !== "production") {
      try {
        // Extract child elements from children
        const childArray = React.Children.toArray(children)

        // Check for duplicate keys
        const keys = new Map()
        let hasDuplicates = false

        React.Children.forEach(childArray, (child) => {
          if (React.isValidElement(child) && child.key) {
            const key = child.key
            if (keys.has(key)) {
              console.warn(`Duplicate key detected: ${key}`)
              hasDuplicates = true
            } else {
              keys.set(key, true)
            }
          }
        })

        if (hasDuplicates) {
          console.warn(`Found ${keys.size} unique keys among ${childArray.length} children`)
        }
      } catch (e) {
        console.error("Error checking for duplicate keys:", e)
      }
    }
  }

  useEffect(() => {
    // Log duplicate keys in development
    logDuplicateKeys(children)

    const currentLoadingRef = loadingRef.current

    if (!currentLoadingRef) return

    console.log("Setting up intersection observer for infinite scroll")

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        console.log("Intersection observed:", {
          isIntersecting: entry.isIntersecting,
          hasMore,
          isLoading,
        })

        if (entry.isIntersecting && hasMore && !isLoading) {
          console.log("Loading more items...")
          loadMore().catch((error) => {
            console.error("Error loading more items:", error)
          })
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    )

    observerRef.current.observe(currentLoadingRef)

    return () => {
      if (observerRef.current && currentLoadingRef) {
        observerRef.current.unobserve(currentLoadingRef)
      }
    }
  }, [loadMore, hasMore, isLoading, children])

  return (
    <>
      {children}

      <div
        ref={loadingRef}
        className="w-full py-8 flex justify-center"
        style={{ minHeight: "100px" }} // Add minimum height to ensure visibility
      >
        {isLoading && hasMore && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </motion.div>
        )}

        {isLoading && !hasMore && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-zinc-500 text-sm">
            Loading complete
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
