"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Search, X, Loader2 } from "lucide-react"
import { useMedia } from "@/context/media-context"
import type { MediaItem } from "@/types"
import InfiniteScroll from "./infinite-scroll"
import MediaGrid from "./media-grid"
import SkeletonGrid from "./skeleton-grid"
// Fix the require issue by importing MediaCard at the top
import MediaCard from "./media-card"

interface MediaSearchProps {
  onShowDetails?: (item: MediaItem) => void
  renderItem?: (item: MediaItem) => React.ReactNode
  className?: string
  placeholder?: string
  autoFocus?: boolean
  gridClass?: string
  onSearchChange?: (query: string) => void
  initialQuery?: string
}

export default function MediaSearch({
  onShowDetails,
  renderItem,
  className = "",
  placeholder = "Find movies, shows, books...",
  autoFocus = false,
  gridClass = "grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2",
  onSearchChange,
  initialQuery = "",
}: MediaSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  const {
    searchResults,
    isSearching,
    hasMore,
    searchForMedia,
    loadMoreSearchResults,
    isItemHidden,
    collection,
    getMediaWithLatestCustomizations,
  } = useMedia()

  // Call search when the query changes (if 2+ characters)
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchForMedia(searchQuery)
    }
    if (onSearchChange) {
      onSearchChange(searchQuery)
    }
  }, [searchQuery, searchForMedia, onSearchChange])

  const loadMoreSearch = useCallback(() => {
    if (searchQuery.length >= 2) {
      return loadMoreSearchResults(searchQuery)
    }
    return Promise.resolve()
  }, [searchQuery, loadMoreSearchResults])

  // Default renderItem implementation if not provided
  // Update the defaultRenderItem function to use the imported MediaCard instead of require
  const defaultRenderItem = useCallback(
    (item: MediaItem) => {
      const itemWithCustomizations = getMediaWithLatestCustomizations(item)

      return (
        <div key={item.id} className="relative">
          <MediaCard
            {...itemWithCustomizations}
            className="w-[130px] sm:w-[160px] h-[195px] sm:h-[240px]"
            isInCollection={collection.some((collectionItem) => collectionItem.id === item.id)}
            onShowDetails={() => onShowDetails && onShowDetails(item)}
            showHideButton={false}
            showTagsButton={false}
          />
        </div>
      )
    },
    [collection, getMediaWithLatestCustomizations, onShowDetails],
  )

  const itemRenderer = renderItem || defaultRenderItem

  return (
    <div className={className}>
      {/* Search Input */}
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
        <input
          type="text"
          placeholder={placeholder}
          className={`w-full bg-zinc-800/80 border ${
            isSearching ? "border-purple-500/50 shadow-[0_0_0_1px_rgba(168,85,247,0.3)]" : "border-zinc-700"
          } rounded-full py-2 pl-10 pr-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus={autoFocus}
        />
        {searchQuery && (
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
            onClick={() => setSearchQuery("")}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {searchQuery.length >= 2 && (
        <div className="mt-4">
          <InfiniteScroll loadMore={loadMoreSearch} hasMore={hasMore} isLoading={isSearching}>
            <h2 className="text-sm font-bold mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <span>Search Results</span>
                {isSearching && searchResults.length === 0 && (
                  <motion.div
                    className="ml-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, rotate: 360 }}
                    transition={{
                      opacity: { duration: 0.2 },
                      rotate: { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                    }}
                  >
                    <Loader2 className="w-4 h-4 text-purple-400" />
                  </motion.div>
                )}
                {!isSearching && searchResults.length > 0 && (
                  <motion.div
                    className="ml-2 text-xs text-green-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    (search complete)
                  </motion.div>
                )}
              </div>
              {searchResults.length > 0 && <span className="text-sm text-zinc-400">{searchResults.length} items</span>}
            </h2>
            {isSearching && searchResults.length === 0 ? (
              <div className="py-4">
                <div className="flex justify-center items-center mb-6">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
                <SkeletonGrid count={6} />
              </div>
            ) : searchResults.length > 0 ? (
              <MediaGrid
                items={searchResults.filter((item) => !isItemHidden(item.id))}
                renderItem={itemRenderer}
                gridClass={gridClass}
                emptyContent={<div className="text-center py-10 text-zinc-400">No matching titles found</div>}
              />
            ) : (
              <div className="text-center py-10 text-zinc-400">{isSearching ? "Searching..." : "No results found"}</div>
            )}
          </InfiniteScroll>
        </div>
      )}
    </div>
  )
}
