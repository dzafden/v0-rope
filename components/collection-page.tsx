"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, X, Loader2, Tag, Check, CheckSquare, Filter, Trash2, Sparkles } from "lucide-react"
import MediaCard from "@/components/media-card"
import { useMedia } from "@/context/media-context"
import { cn } from "@/lib/utils"
import { searchMedia } from "@/lib/tmdb-api"
import { searchBooks } from "@/lib/openlibrary-api"
import { useOnboarding } from "@/context/onboarding-context"
import { useStickerCustomization } from "@/hooks/use-sticker-customization"
import CustomizationModal from "@/components/customization-modal"
import TitleDetails from "@/components/title-details"
import CollapsibleSection from "@/components/collapsible-section"
import ConfirmDialog from "@/components/confirm-dialog"
import { useDebouncedCallback } from "use-debounce"
import { FixedSizeGrid as Grid } from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"
import React from "react"

const TAG_EQUIVALENTS = {
  watched: { book: "read" },
  "want-to-watch": { book: "want-to-read" },
  read: { movie: "watched", tv: "watched" },
  "want-to-read": { movie: "want-to-watch", tv: "want-to-watch" },
}

const MAX_PARALLEL_SEARCHES = 10

// Add this custom hook at the top of the file, after the imports
function useScrollVisibility(threshold = 10) {
  const [lastScrollY, setLastScrollY] = useState(0)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [isScrolling, setIsScrolling] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setHeaderVisible(currentScrollY <= lastScrollY || currentScrollY <= threshold)
      setLastScrollY(currentScrollY)

      if (!isScrolling) {
        setIsScrolling(true)
        setTimeout(() => setIsScrolling(false), 100)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY, isScrolling, threshold])

  return { headerVisible, isScrolling }
}

// Add this component before the main CollectionPage component
function TagFilterSection({ showTagFilters, relevantTags, selectedTags, toggleTagSelection, getTagItemCount }) {
  return (
    <AnimatePresence>
      {showTagFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="flex flex-wrap gap-1.5 mt-2 pb-3 px-4">
            {" "}
            {/* Changed pb-2 to pb-3 for more bottom padding */}
            {relevantTags.map((tag) => {
              const count = getTagItemCount(tag.id)
              return (
                <motion.button
                  key={tag.id}
                  className={cn(
                    "px-2 py-1 rounded-full text-xs flex items-center gap-1", // Changed from px-3 py-1 to px-2 py-1 for more compact buttons
                    selectedTags.includes(tag.id) ? "bg-teal-600 text-white" : "bg-zinc-800 text-zinc-300",
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleTagSelection(tag.id)}
                  disabled={count === 0}
                  title={count === 0 ? "No items with this tag" : undefined}
                >
                  <span className="text-xs">{tag.name}</span> {/* Added explicit text-xs */}
                  <span
                    className={cn(
                      "text-[9px] rounded-full px-1 min-w-[16px] text-center", // Changed from text-[10px] and min-w-[18px] to text-[9px] and min-w-[16px]
                      selectedTags.includes(tag.id) ? "bg-teal-800" : "bg-zinc-700",
                    )}
                  >
                    {count}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Add this component before the main CollectionPage component
function BulkActionBar({
  isSelectionMode,
  selectedItems,
  setSelectedItems,
  filteredCollection,
  setShowTagSelectionModal,
  handleCustomize,
  setShowRemoveConfirm,
}) {
  return (
    <AnimatePresence>
      {isSelectionMode && (
        <motion.div
          className="fixed bottom-20 left-0 right-0 flex justify-center z-20"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl p-4 mx-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">
                {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"} selected
              </span>
              <div className="flex gap-2">
                <motion.button
                  className="text-xs bg-zinc-800 px-2 py-1 rounded-md"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedItems(filteredCollection.map((item) => item.id))}
                >
                  Select All
                </motion.button>
                <motion.button
                  className="text-xs bg-zinc-800 px-2 py-1 rounded-md"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedItems([])}
                >
                  Clear
                </motion.button>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                className="flex-1 bg-teal-600 text-white h-10 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => selectedItems.length > 0 && setShowTagSelectionModal(true)}
                disabled={selectedItems.length === 0}
              >
                <Tag className="w-4 h-4 mr-2" />
                Apply Tags
              </motion.button>
              <motion.div
                className="bg-purple-600 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (selectedItems.length > 0) {
                    handleCustomize(selectedItems)
                  }
                }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <motion.button
                className="flex-1 bg-red-600 text-white h-10 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (selectedItems.length > 0) {
                    setShowRemoveConfirm(true)
                  }
                }}
                disabled={selectedItems.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Add this component before the main CollectionPage component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Collection page error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg m-4">
          <h2 className="text-lg font-bold text-red-400 mb-2">Something went wrong</h2>
          <p className="text-sm text-zinc-300 mb-4">
            There was an error loading your collection. Please try refreshing the page.
          </p>
          <button className="px-4 py-2 bg-red-700 text-white rounded-lg" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function VirtualizedMediaGrid({ items, renderItem, columnCount = 3 }) {
  // Only use virtualization for large collections
  if (items.length < 50) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 overflow-visible pb-0 mb-0">
        {items.map((item, index) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>
    )
  }

  const rowCount = Math.ceil(items.length / columnCount)

  return (
    <div style={{ height: "calc(100vh - 120px)", width: "100%" }} className="overflow-visible no-scrollbar">
      <AutoSizer>
        {({ height, width }) => {
          const columnWidth = width / columnCount
          const rowHeight = columnWidth * 1.5 // Maintain aspect ratio

          return (
            <Grid
              columnCount={columnCount}
              columnWidth={columnWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={rowHeight}
              width={width}
              className="overflow-visible no-scrollbar"
            >
              {({ columnIndex, rowIndex, style }) => {
                const index = rowIndex * columnCount + columnIndex
                if (index >= items.length) return null

                return (
                  <div
                    style={{
                      ...style,
                      padding: "8px",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {renderItem(items[index])}
                  </div>
                )
              }}
            </Grid>
          )
        }}
      </AutoSizer>
    </div>
  )
}

export default function CollectionPage() {
  const {
    collection,
    updateMediaCustomization,
    addToCollection,
    removeFromCollection,
    getAllTags,
    getItemTags,
    addTagToItem,
    hideMediaItem,
    createTag,
  } = useMedia()

  const [activeFilter, setActiveFilter] = useState("All")
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [tempCustomizations, setTempCustomizations] = useState({})
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const { headerVisible, isScrolling } = useScrollVisibility()

  const {
    selectedSticker,
    stickerPosition,
    stickerSize,
    stickerRotation,
    showStickerDropdown,
    stickerSearch,
    keyboardEnabled,
    showStickerWarning,
    shakeStickerButton,
    stickerSearchRef,
    filteredStickers,
    setSelectedSticker,
    setStickerPosition,
    setStickerSize,
    setStickerRotation,
    setShowStickerDropdown,
    setStickerSearch,
    setKeyboardEnabled,
    handleStickerSelect,
    handleRemoveSticker,
    handleOverlaySelect: handleStickerOverlaySelect,
    getStickerData,
  } = useStickerCustomization()

  const { hasSeenCollection, setHasSeenCollection } = useOnboarding()

  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [bulkImportText, setBulkImportText] = useState("")
  const [bulkSearchResults, setBulkSearchResults] = useState([])
  const [selectedResults, setSelectedResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState(0)

  const [showDetails, setShowDetails] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState(null)
  const [showTagFilters, setShowTagFilters] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showTagSelectionModal, setShowTagSelectionModal] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [isEditingFavorites, setIsEditingFavorites] = useState(false)
  const [newTagName, setNewTagName] = useState<string>("")
  const [tagError, setTagError] = useState<string>("")

  // No need to destructure since we're importing the storage object directly

  const filterMediaItem = useCallback(
    (item) => {
      // Search query filter
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false

      // Category filter
      if (activeFilter !== "All") {
        if (activeFilter === "Movies" && item.type !== "movie") return false
        if (activeFilter === "TV Shows" && item.type !== "tv") return false
        if (activeFilter === "Books" && item.type !== "book") return false
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const itemTags = getItemTags(item.id)
        return selectedTags.some((tagId) => itemTags.includes(tagId))
      }

      return true
    },
    [searchQuery, activeFilter, selectedTags, getItemTags],
  )

  // Now use filterMediaItem in filteredCollection
  const filteredCollection = useMemo(() => {
    // First filter the collection
    const filtered = collection.filter(filterMediaItem)

    // Then sort by addedAt timestamp (newest first)
    return filtered.sort((a, b) => {
      // If addedAt is missing for either item, put items with timestamps first
      if (!a.addedAt) return 1
      if (!b.addedAt) return -1
      // Sort in descending order (newest first)
      return b.addedAt - a.addedAt
    })
  }, [collection, filterMediaItem])

  const relevantTags = useMemo(() => {
    const allTags = getAllTags()
    if (activeFilter === "Books")
      return allTags.filter((tag) => tag.id === "read" || tag.id === "want-to-read" || tag.isCustom)
    if (activeFilter === "Movies" || activeFilter === "TV Shows")
      return allTags.filter((tag) => tag.id === "watched" || tag.id === "want-to-watch" || tag.isCustom)
    return allTags
  }, [activeFilter, getAllTags])

  const getTagItemCount = useCallback(
    (tagId: string) => {
      return filteredCollection.filter((item) => {
        const itemTags = getItemTags(item.id)
        const tagObj = getAllTags().find((tag) => tag.id === tagId)
        if (tagObj?.isCustom) return itemTags.includes(tagId)
        if ((tagId === "watched" || tagId === "want-to-watch") && (item.type === "movie" || item.type === "tv"))
          return itemTags.includes(tagId)
        if (tagId === "read" || tagId === "want-to-read") return item.type === "book" && itemTags.includes(tagId)
        return false
      }).length
    },
    [filteredCollection, getItemTags, getAllTags],
  )

  const toggleTagSelection = useCallback((tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }, [])

  const handleCustomize = useCallback(
    (media) => {
      // If media is an array, we're in bulk mode
      const isBulkMode = Array.isArray(media)

      // Set the first item as the selected media for preview
      const firstItem = isBulkMode ? collection.find((item) => item.id === media[0]) : media

      setSelectedMedia(firstItem)
      setTempCustomizations({ ...(firstItem?.customizations || {}) })

      // Store all selected items for bulk application
      if (isBulkMode) {
        setSelectedMedia({
          ...firstItem,
          bulkIds: media, // Store all IDs for bulk application
        })
      }

      if (firstItem?.customizations?.stickers?.length) {
        const sticker = firstItem.customizations.stickers[0]
        setSelectedSticker(sticker.id)
        setStickerPosition(sticker.position || { x: 50, y: 50 })
        setStickerSize(sticker.size || 40)
        setStickerRotation(sticker.rotation || 0)
      } else {
        setSelectedSticker(null)
        setStickerPosition({ x: 50, y: 50 })
        setStickerSize(40)
        setStickerRotation(0)
      }
      setIsCustomizing(true)
    },
    [collection, setSelectedSticker, setStickerPosition, setStickerSize, setStickerRotation],
  )

  const handleSaveCustomizations = useCallback(() => {
    if (selectedMedia) {
      const stickerData = getStickerData()
      const updatedCustomizations = {
        ...tempCustomizations,
        stickers: stickerData ? [stickerData] : [],
      }

      // Check if we're in bulk mode
      if (selectedMedia.bulkIds) {
        // Remove any poster customization to prevent applying one item's poster to all
        delete updatedCustomizations.customPoster

        // Apply to all selected items
        selectedMedia.bulkIds.forEach((id) => {
          updateMediaCustomization(id, updatedCustomizations)
        })
        // Exit selection mode after bulk application
        setIsSelectionMode(false)
        setSelectedItems([])
      } else {
        // Apply to single item (including poster if changed)
        updateMediaCustomization(selectedMedia.id, updatedCustomizations)
      }

      setIsCustomizing(false)
    }
  }, [
    selectedMedia,
    tempCustomizations,
    getStickerData,
    updateMediaCustomization,
    setIsSelectionMode,
    setSelectedItems,
  ])

  const handleUpdateCustomization = useCallback((type, value) => {
    setTempCustomizations((prev) => ({ ...prev, [type]: value }))
  }, [])

  const handleOverlaySelect = useCallback(
    (overlay) => {
      if (!handleStickerOverlaySelect(overlay)) return
      handleUpdateCustomization("overlay", overlay)
    },
    [handleStickerOverlaySelect, handleUpdateCustomization],
  )

  const searchSingleTitle = useCallback(async (title) => {
    try {
      const tmdbResults = await searchMedia(title).catch((err) => {
        console.error(`Error searching TMDB for "${title}":`, err)
        return []
      })
      if (tmdbResults?.length) return tmdbResults[0]
      const bookResults = await searchBooks(title).catch((err) => {
        console.error(`Error searching books for "${title}":`, err)
        return []
      })
      return bookResults?.length ? bookResults[0] : null
    } catch (error) {
      console.error(`Error searching for "${title}":`, error)
      return null
    }
  }, [])

  // Replace the processTitleBatch function with this optimized version
  const processTitleBatch = useCallback(
    async (titles, startIndex, results, processedCount) => {
      // Remove duplicates and empty titles first
      const uniqueTitles = [...new Set(titles.filter((title) => title.trim()))]
      const endIndex = Math.min(startIndex + MAX_PARALLEL_SEARCHES, uniqueTitles.length)

      // Create a map to track which titles have been found
      const foundTitles = new Map()
      results.forEach((item) => {
        foundTitles.set(item.title.toLowerCase(), item)
      })

      const searchPromises = []
      for (let i = startIndex; i < endIndex; i++) {
        const title = uniqueTitles[i]
        // Skip if we already found this title
        if (foundTitles.has(title.toLowerCase())) continue
        searchPromises.push(searchSingleTitle(title))
      }

      const batchResults = await Promise.all(searchPromises)
      for (const result of batchResults) {
        if (result && !results.some((item) => item.id === result.id)) {
          results.push(result)
          setSelectedResults((prev) => [...prev, result.id])
          // Add to found titles map
          foundTitles.set(result.title.toLowerCase(), result)
        }
      }

      const newProcessedCount = processedCount + (endIndex - startIndex)
      setSearchProgress(Math.round((newProcessedCount / uniqueTitles.length) * 100))

      if (endIndex < uniqueTitles.length) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return processTitleBatch(uniqueTitles, endIndex, results, newProcessedCount)
      }

      return results
    },
    [searchSingleTitle],
  )

  const handleBulkSearch = useCallback(async () => {
    if (!bulkImportText.trim()) return
    const titles = bulkImportText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
    if (titles.length === 0) return

    setIsSearching(true)
    setBulkSearchResults([])
    setSelectedResults([])
    setSearchProgress(0)

    try {
      const results = await processTitleBatch(titles, 0, [], 0)
      setBulkSearchResults(results)
    } catch (error) {
      console.error("Error during bulk search:", error)
    } finally {
      setIsSearching(false)
      setSearchProgress(100)
    }
  }, [bulkImportText, processTitleBatch])

  const toggleResultSelection = useCallback((id) => {
    setSelectedResults((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]))
  }, [])

  const handleClickOutside = useCallback(
    (event) => {
      if (stickerSearchRef.current && !stickerSearchRef.current.contains(event.target)) {
        setShowStickerDropdown(false)
        setKeyboardEnabled(false)
      }
    },
    [stickerSearchRef, setShowStickerDropdown, setKeyboardEnabled],
  )

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [handleClickOutside])

  useEffect(() => {
    const handleTabChange = () => {}
    window.addEventListener("changeTab", handleTabChange)
    return () => window.removeEventListener("changeTab", handleTabChange)
  }, [])

  useEffect(() => {
    if (!hasSeenCollection) setHasSeenCollection(true)
  }, [hasSeenCollection, setHasSeenCollection])

  const handleAddSelectedToCollection = useCallback(() => {
    bulkSearchResults.filter((item) => selectedResults.includes(item.id)).forEach((item) => addToCollection(item))
    setShowBulkImportModal(false)
    setBulkImportText("")
    setBulkSearchResults([])
    setSelectedResults([])
  }, [bulkSearchResults, selectedResults, addToCollection])

  const handleShowDetails = useCallback((media) => {
    setSelectedTitle(media)
    setShowDetails(true)
  }, [])

  const handleAddToCollectionItem = useCallback(
    (media) => {
      addToCollection(media)
      setShowDetails(false)
    },
    [addToCollection],
  )

  const handleHideItem = useCallback(
    (media) => {
      hideMediaItem(media.id)
      setShowDetails(false)
    },
    [hideMediaItem],
  )

  const renderMediaCard = useCallback(
    (item) => (
      <div
        key={item.id}
        className="relative"
        onClick={(e) => {
          // Only handle selection mode clicks here
          if (isSelectionMode) {
            e.preventDefault()
            e.stopPropagation()
            setSelectedItems((prev) =>
              prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
            )
          }
        }}
      >
        <MediaCard
          {...item}
          className="w-[120px] sm:w-[150px] h-[180px] sm:h-[225px]"
          onCustomize={() => !isSelectionMode && handleCustomize(item)}
          showHideButton={!isSelectionMode}
          showTagsButton={!isSelectionMode}
          onShowDetails={() => {
            if (!isSelectionMode) {
              handleShowDetails(item)
            }
          }}
          isActive={activeCardId === item.id}
          onActivate={() => setActiveCardId(activeCardId === item.id ? null : item.id)}
          loading="lazy" // Add this prop
        />
        {isSelectionMode && (
          <div
            className={cn(
              "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center border-2",
              selectedItems.includes(item.id) ? "bg-purple-600 border-white" : "bg-black/50 border-zinc-400",
            )}
          >
            {selectedItems.includes(item.id) && <Check className="w-4 h-4 text-white" />}
          </div>
        )}
      </div>
    ),
    [isSelectionMode, selectedItems, activeCardId, handleCustomize, handleShowDetails, setActiveCardId],
  )

  const [searchInputValue, setSearchInputValue] = useState("")
  const debouncedSetSearchQuery = useDebouncedCallback((value) => {
    setSearchQuery(value)
  }, 300)

  return (
    <ErrorBoundary>
      <div className="h-full overflow-y-auto bg-gradient-to-b from-zinc-900 to-black pb-0">
        <motion.div
          className="sticky top-0 z-10 pt-4 px-4 pb-1 bg-black/80 backdrop-blur-md"
          initial={{ y: -50 }}
          animate={{
            y: 0,
            height: headerVisible ? "auto" : "0px",
            opacity: headerVisible ? 1 : 0,
            marginBottom: headerVisible ? "0px" : "-1rem",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex-1 mr-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search your collection"
                className="w-full bg-zinc-800/80 border border-zinc-700 rounded-full py-2 pl-10 pr-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                value={searchInputValue}
                onChange={(e) => {
                  setSearchInputValue(e.target.value)
                  debouncedSetSearchQuery(e.target.value)
                }}
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
            <div className="flex items-center gap-2">
              <motion.button
                className={cn(
                  "rounded-full w-8 h-8 flex items-center justify-center",
                  isFilterExpanded
                    ? "bg-purple-600"
                    : selectedTags.length > 0 || activeFilter !== "All"
                      ? "bg-teal-600"
                      : "bg-zinc-800",
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                aria-label="Filter"
              >
                <Filter
                  className={cn(
                    "w-4 h-4",
                    (selectedTags.length > 0 || activeFilter !== "All") && !isFilterExpanded && "text-white",
                  )}
                />
                {selectedTags.length > 0 && !isFilterExpanded && (
                  <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {selectedTags.length}
                  </span>
                )}
              </motion.button>
              <motion.button
                className={cn(
                  "rounded-full w-8 h-8 flex items-center justify-center",
                  isSelectionMode ? "bg-purple-600" : "bg-zinc-800",
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode)
                  if (isSelectionMode) setSelectedItems([])
                }}
                aria-label="Bulk edit mode"
              >
                {isSelectionMode ? <X className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
              </motion.button>
              <motion.div
                className="bg-purple-600 rounded-full w-8 h-8 flex items-center
justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowBulkImportModal(true)}
              >
                <Plus className="w-4 h-4" />
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {isFilterExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 pt-2 pb-2 px-2 sm:px-4 relative">
                  {" "}
                  {/* Added pb-2 for bottom padding */}
                  <motion.div className="flex overflow-x-auto gap-2 scrollbar-hide no-scrollbar">
                    {["All", "Movies", "TV Shows", "Books"].map((filter) => (
                      <motion.button
                        key={filter}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs whitespace-nowrap", // Changed from px-4 py-2 and text-sm to px-3 py-1.5 and text-xs
                          activeFilter === filter ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-300",
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setActiveFilter(filter)
                          setSelectedTags([])
                        }}
                      >
                        {filter}
                      </motion.button>
                    ))}
                    <motion.button
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs whitespace-nowrap flex items-center gap-1", // Changed from px-4 py-2 and text-sm to px-3 py-1.5 and text-xs
                        showTagFilters ? "bg-teal-700 text-white" : "bg-zinc-800 text-zinc-300",
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowTagFilters(!showTagFilters)
                        setNewTagName("")
                        setTagError("")
                      }}
                    >
                      <Tag className="w-3 h-3" /> {/* Changed from w-3.5 h-3.5 to w-3 h-3 */}
                      <span>Tags</span>
                      {selectedTags.length > 0 && (
                        <span className="bg-teal-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {" "}
                          {/* Changed from w-5 h-5 to w-4 h-4 */}
                          {selectedTags.length}
                        </span>
                      )}
                    </motion.button>
                  </motion.div>
                </div>

                <TagFilterSection
                  showTagFilters={showTagFilters}
                  relevantTags={relevantTags}
                  selectedTags={selectedTags}
                  toggleTagSelection={toggleTagSelection}
                  getTagItemCount={getTagItemCount}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="px-4 pt-4 pb-0">
          <div>
            <CollapsibleSection id="all-collection" title="All Collection" count={filteredCollection.length}>
              <VirtualizedMediaGrid
                items={filteredCollection}
                renderItem={renderMediaCard}
                emptyContent={
                  <div className="text-center py-20 text-zinc-400">
                    {searchQuery ? (
                      <>
                        <p className="mb-2">No items match your search</p>
                        <p className="text-sm">Try different keywords or filters</p>
                      </>
                    ) : (
                      <>
                        <p className="mb-4">No items in your collection yet</p>
                        {!isEditingFavorites && (
                          <motion.button
                            className="bg-purple-600 text-white px-4 py-2 rounded-full"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              window.dispatchEvent(new CustomEvent("changeTab", { detail: { tab: "discover" } }))
                            }
                          >
                            Discover titles
                          </motion.button>
                        )}
                      </>
                    )}
                  </div>
                }
              />
            </CollapsibleSection>
          </div>
        </div>

        <BulkActionBar
          isSelectionMode={isSelectionMode}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          filteredCollection={filteredCollection}
          setShowTagSelectionModal={setShowTagSelectionModal}
          handleCustomize={handleCustomize}
          setShowRemoveConfirm={setShowRemoveConfirm}
        />

        <AnimatePresence>
          {showRemoveConfirm && (
            <ConfirmDialog
              message={`Remove ${selectedItems.length} ${selectedItems.length === 1 ? "item" : "items"} from your collection?`}
              onConfirm={() => {
                selectedItems.forEach((id) => removeFromCollection(id))
                setSelectedItems([])
                setIsSelectionMode(false)
                setShowRemoveConfirm(false)
              }}
              onCancel={() => setShowRemoveConfirm(false)}
            />
          )}
        </AnimatePresence>

        <CustomizationModal
          isOpen={isCustomizing}
          media={selectedMedia}
          initialCustomizations={tempCustomizations}
          onSave={(updatedCustomizations) => {
            if (selectedMedia?.bulkIds) {
              // Apply to all selected items
              selectedMedia.bulkIds.forEach((id) => {
                updateMediaCustomization(id, updatedCustomizations)
              })
              // Exit selection mode after bulk application
              setIsSelectionMode(false)
              setSelectedItems([])
            } else {
              // Apply to single item
              updateMediaCustomization(selectedMedia.id, updatedCustomizations)
            }
            setIsCustomizing(false)
          }}
          onClose={() => setIsCustomizing(false)}
          bulkMode={!!selectedMedia?.bulkIds}
          bulkCount={selectedMedia?.bulkIds?.length}
        />

        <AnimatePresence>
          {showBulkImportModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Bulk Import Titles</h2>
                  <motion.button
                    className="p-1 rounded-full bg-zinc-800"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowBulkImportModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                {bulkSearchResults.length === 0 ? (
                  <>
                    <p className="text-sm text-zinc-400 mb-4">
                      Paste titles below, one per line. We'll search for each title and add matches to your collection.
                    </p>
                    <textarea
                      className="w-full h-40 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                      placeholder="Dune: Part Two&#10;House of the Dragon&#10;The Three-Body Problem&#10;..."
                      value={bulkImportText}
                      onChange={(e) => setBulkImportText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <motion.button
                        className="px-4 py-2 rounded-full bg-zinc-800 text-white"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowBulkImportModal(false)}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        className="px-4 py-2 rounded-full bg-purple-600 text-white flex items-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBulkSearch}
                        disabled={isSearching || !bulkImportText.trim()}
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span>Searching... {searchProgress}%</span>
                          </>
                        ) : (
                          <span>Search</span>
                        )}
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-zinc-400 mb-2">
                      Found {bulkSearchResults.length} titles. Select the ones you want to add:
                    </p>
                    <div className="mb-4 max-h-[50vh] overflow-y-auto">
                      {bulkSearchResults.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center p-2 rounded-lg mb-2 cursor-pointer ${
                            selectedResults.includes(item.id)
                              ? "bg-purple-900/50 border border-purple-500"
                              : "bg-zinc-800"
                          }`}
                          onClick={() => toggleResultSelection(item.id)}
                        >
                          <div className="w-10 h-14 relative mr-3 flex-shrink-0">
                            <img
                              src={item.coverImage || "/placeholder.svg?height=60&width=40"}
                              alt={item.title}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-zinc-400">
                                {item.type === "movie" && "🎬 Movie"}
                                {item.type === "tv" && "📺 TV Show"}
                                {item.type === "book" && "📚 Book"}
                              </span>
                              {item.releaseDate && (
                                <span className="text-xs text-zinc-500 ml-2">({item.releaseDate.split("-")[0]})</span>
                              )}
                            </div>
                            {item.overview && (
                              <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{item.overview}</p>
                            )}
                          </div>
                          {selectedResults.includes(item.id) && (
                            <div className="ml-2 bg-purple-600 rounded-full p-1">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-4">
                      <motion.button
                        className="px-4 py-2 rounded-full bg-zinc-800 text-white"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setBulkSearchResults([])
                          setSelectedResults([])
                        }}
                      >
                        Back
                      </motion.button>
                      <div className="flex gap-2">
                        <motion.button
                          className="px-4 py-2 rounded-full bg-zinc-800 text-white"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowBulkImportModal(false)}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          className="px-4 py-2 rounded-full bg-purple-600 text-white"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleAddSelectedToCollection}
                          disabled={selectedResults.length === 0}
                        >
                          Add {selectedResults.length} {selectedResults.length === 1 ? "Title" : "Titles"}
                        </motion.button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTagSelectionModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Apply Tags</h2>
                  <motion.button
                    className="p-1 rounded-full bg-zinc-800"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowTagSelectionModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                <p className="text-sm text-zinc-400 mb-4">
                  Select tags to apply to {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"}
                </p>
                <div className="space-y-2 mb-6">
                  {getAllTags().map((tag) => {
                    const selectedItemsByType = {
                      movie: selectedItems.filter((id) => collection.find((item) => item.id === id)?.type === "movie")
                        .length,
                      tv: selectedItems.filter((id) => collection.find((item) => item.id === id)?.type === "tv").length,
                      book: selectedItems.filter((id) => collection.find((item) => item.id === id)?.type === "book")
                        .length,
                    }
                    let applicableCount = tag.isCustom ? selectedItems.length : 0
                    if (!tag.isCustom) {
                      if (tag.id === "watched" || tag.id === "want-to-watch") {
                        applicableCount = selectedItemsByType.movie + selectedItemsByType.tv
                      } else if (tag.id === "read" || tag.id === "want-to-read") {
                        applicableCount = selectedItemsByType.book
                      }
                    }
                    if (applicableCount === 0) return null
                    return (
                      <motion.button
                        key={tag.id}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          selectedItems.forEach((itemId) => {
                            const item = collection.find((item) => item.id === itemId)
                            if (!item) return
                            if (tag.isCustom) {
                              addTagToItem(itemId, tag.id)
                            } else {
                              if (tag.id === "watched" || tag.id === "want-to-watch") {
                                if (item.type === "movie" || item.type === "tv") {
                                  addTagToItem(itemId, tag.id)
                                } else if (item.type === "book") {
                                  const equivalentTag = TAG_EQUIVALENTS[tag.id]?.book
                                  if (equivalentTag) addTagToItem(itemId, equivalentTag)
                                }
                              } else if (tag.id === "read" || tag.id === "want-to-read") {
                                if (item.type === "book") {
                                  addTagToItem(itemId, tag.id)
                                } else if (item.type === "movie" || item.type === "tv") {
                                  const equivalentTag = TAG_EQUIVALENTS[tag.id]?.[item.type]
                                  if (equivalentTag) addTagToItem(itemId, equivalentTag)
                                }
                              }
                            }
                          })
                          setShowTagSelectionModal(false)
                          setIsSelectionMode(false)
                          setSelectedItems([])
                        }}
                      >
                        <div className="flex items-center">
                          <span>{tag.name}</span>
                          {!tag.isCustom && applicableCount < selectedItems.length && (
                            <span className="ml-2 text-xs text-zinc-400">
                              (applies to {applicableCount} {applicableCount === 1 ? "item" : "items"})
                            </span>
                          )}
                        </div>
                        <div className="bg-zinc-700 rounded-full p-1">
                          <Plus className="w-4 h-4" />
                        </div>
                      </motion.button>
                    )
                  })}

                  {/* Add new tag creation section */}
                  <div className="mt-4 border-t border-zinc-700 pt-4">
                    <h3 className="text-sm font-medium mb-2">Create New Tag</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Enter new tag name"
                        value={newTagName || ""}
                        onChange={(e) => setNewTagName(e.target.value)}
                        maxLength={40}
                      />
                      <motion.button
                        className="px-3 py-2 rounded-lg bg-purple-600 text-white flex items-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (newTagName?.trim()) {
                            const tagId = createTag(newTagName.trim())
                            if (tagId) {
                              selectedItems.forEach((id) => addTagToItem(id, tagId))
                              setNewTagName("")
                              setShowTagSelectionModal(false)
                              setIsSelectionMode(false)
                              setSelectedItems([])
                            } else {
                              setTagError(
                                "A tag with this name already exists or you have reached the maximum number of custom tags",
                              )
                            }
                          }
                        }}
                        disabled={!newTagName?.trim()}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Create
                      </motion.button>
                    </div>
                    {tagError && <p className="text-xs text-red-400 mt-1">{tagError}</p>}
                  </div>
                </div>
                <div className="flex justify-end">
                  <motion.button
                    className="px-4 py-2 rounded-full bg-zinc-800 text-white"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTagSelectionModal(false)}
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDetails && selectedTitle && (
            <TitleDetails
              media={selectedTitle}
              onClose={() => setShowDetails(false)}
              onAddToCollection={() => handleAddToCollectionItem(selectedTitle)}
              onCustomize={() => handleCustomize(selectedTitle)}
              hideItem={() => handleHideItem(selectedTitle)}
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  )
}
