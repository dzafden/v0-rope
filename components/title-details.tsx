"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Sparkles, EyeOff, Tag, Check, MessageSquare, Clock, Library } from "lucide-react"
import { useMedia } from "@/context/media-context"
import MediaCard from "@/components/media-card"
import { searchMedia } from "@/lib/tmdb-api"
import { searchBooks } from "@/lib/openlibrary-api"
import TVShowDetails from "@/components/tv-show-details"
import storage from "@/lib/storage"
import ExpandedCardView from "@/components/expanded-card-view"
import ConfirmDialog from "@/components/confirm-dialog"
import TagDropdown from "@/components/tag-dropdown"

interface TitleDetailsProps {
  media: any
  onClose: () => void
  onAddToCollection?: () => void
  onCustomize?: () => void
  hideItem?: () => void
  showTagsButton?: boolean
  addTagToItem?: (itemId: string, tag: string) => void
}

export default function TitleDetails({
  media,
  onClose,
  onAddToCollection,
  onCustomize,
  hideItem,
  showTagsButton = true,
  addTagToItem,
}: TitleDetailsProps) {
  const { collection, addToCollection, removeFromCollection, hideItem: contextHideItem } = useMedia()

  // Local state
  const [similarTitles, setSimilarTitles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isWatched, setIsWatched] = useState(false)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [notes, setNotes] = useState<{ id: string; text: string; timestamp: number }[]>([])
  const [showNestedDetails, setShowNestedDetails] = useState(false)
  const [selectedSimilarTitle, setSelectedSimilarTitle] = useState<any>(null)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [addButtonClicked, setAddButtonClicked] = useState(false)
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [tagDropdownPosition, setTagDropdownPosition] = useState({ x: 0, y: 0 })

  // Add state for confirmation dialog
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  // New state for expanded card view
  const [showExpandedCard, setShowExpandedCard] = useState(false)

  const detailsRef = useRef<HTMLDivElement>(null)
  const similarTitlesCache = useRef(new Map<string, any[]>())
  const addButtonRef = useRef<HTMLButtonElement>(null)

  // Is the media already in the collection?
  const isInCollection = useMemo(() => collection.some((item) => item.id === media.id), [collection, media.id])

  // Format functions memoized for performance
  const formatReleaseDate = useCallback((dateString?: string) => {
    if (!dateString) return "Unknown"
    if (dateString.length === 4) return dateString
    try {
      return new Date(dateString).getFullYear().toString()
    } catch {
      return dateString
    }
  }, [])

  const formatNoteDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }, [])

  const getMediaTypeDisplay = useCallback(() => {
    switch (media.type) {
      case "movie":
        return "Movie"
      case "tv":
        return "TV Show"
      case "book":
        return "Book"
      default:
        return media.type
    }
  }, [media.type])

  // Fetch similar titles with cache
  useEffect(() => {
    if (!media) return
    async function fetchSimilarTitles() {
      setIsLoading(true)
      try {
        if (similarTitlesCache.current.has(media.id)) {
          setSimilarTitles(similarTitlesCache.current.get(media.id)!)
        } else {
          let results: any[] = []
          if (media.type === "movie" || media.type === "tv") {
            const searchTerm = media.title.split(":")[0].split(" ").slice(0, 2).join(" ")
            results = await searchMedia(searchTerm)
            results = results.filter((item) => item.id !== media.id).slice(0, 5)
          } else if (media.type === "book") {
            const searchTerm = media.overview?.includes("By ")
              ? media.overview.split("By ")[1]?.split(",")[0]
              : media.title.split(" ").slice(0, 2).join(" ")
            if (searchTerm) {
              results = await searchBooks(searchTerm)
              results = results.filter((item) => item.id !== media.id).slice(0, 5)
            }
          }
          similarTitlesCache.current.set(media.id, results)
          setSimilarTitles(results)
        }
      } catch (error) {
        console.error("Error fetching similar titles:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSimilarTitles()
  }, [media])

  // Load watched status and notes from local storage on media change
  useEffect(() => {
    if (!media) return
    const watchedItems = storage.get<Record<string, boolean>>("watchedItems", {})
    setIsWatched(!!watchedItems[media.id])
    const savedNotes = storage.get<Record<string, { id: string; text: string; timestamp: number }[]>>("mediaNotes", {})
    setNotes(savedNotes[media.id] || [])
  }, [media])

  const toggleWatched = useCallback(() => {
    const newStatus = !isWatched
    setIsWatched(newStatus)
    const watchedItems = storage.get<Record<string, boolean>>("watchedItems", {})
    watchedItems[media.id] = newStatus
    storage.set("watchedItems", watchedItems)
    if (newStatus && media) {
      if (media.type === "movie" || media.type === "tv") {
        addTagToItem && addTagToItem(media.id, "watched")
      } else if (media.type === "book") {
        addTagToItem && addTagToItem(media.id, "read")
      }
    }
  }, [isWatched, media, addTagToItem])

  const saveNote = useCallback(() => {
    if (!noteText.trim() || !media) return
    const newNote = { id: `note-${Date.now()}`, text: noteText.trim(), timestamp: Date.now() }
    const updatedNotes = [...notes, newNote]
    setNotes(updatedNotes)
    setNoteText("")
    const savedNotes = storage.get<Record<string, { id: string; text: string; timestamp: number }[]>>("mediaNotes", {})
    savedNotes[media.id] = updatedNotes
    storage.set("mediaNotes", savedNotes)
  }, [noteText, notes, media])

  const handleAddToCollection = useCallback(
    (item: any) => {
      if (!collection.some((i) => i.id === item.id)) {
        addToCollection(item)
        setSimilarTitles((prev) =>
          prev.map((title) => (title.id === item.id ? { ...title, isInCollection: true } : title)),
        )
      }
    },
    [collection, addToCollection],
  )

  const handleRemoveFromCollection = useCallback(() => {
    if (media && media.id) {
      removeFromCollection(media.id)
      setShowRemoveConfirm(false)
    }
  }, [media, removeFromCollection])

  const handleCustomize = useCallback(
    (item: any) => {
      // Add this line to stop event propagation
      if (event && typeof event !== "undefined") {
        event.preventDefault()
        event.stopPropagation()
      }

      if (!collection.some((col) => col.id === item.id)) {
        addToCollection(item)
      }

      // Add a small delay before closing and opening the new modal
      // This helps prevent race conditions between modal transitions
      setTimeout(() => {
        onClose()
        onCustomize && onCustomize()
      }, 50)
    },
    [collection, addToCollection, onClose, onCustomize],
  )

  const handleHideItem = useCallback(
    (itemId: string) => {
      contextHideItem && contextHideItem(itemId)
    },
    [contextHideItem],
  )

  const handleShowDetails = useCallback((mediaItem: any) => {
    setSelectedSimilarTitle(mediaItem)
    setShowNestedDetails(true)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only prevent default for buttons to maintain their normal behavior
    const target = e.target as HTMLElement
    const isButton =
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.getAttribute("role") === "button" ||
      target.classList.contains("cursor-pointer")

    if (isButton) {
      return
    }
  }, [])

  const handleNoteButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setShowNoteEditor((prev) => !prev)
      setTimeout(() => {
        if (!showNoteEditor && detailsRef.current) {
          const currentScroll = detailsRef.current.scrollTop
          detailsRef.current.scrollTo({ top: currentScroll + 150, behavior: "smooth" })
        }
      }, 50)
    },
    [showNoteEditor],
  )

  const handleAddToCollectionClick = useCallback(
    (e: React.MouseEvent) => {
      // Completely stop event propagation
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }

      // Create a separate event handler for the confirmation dialog
      const handleConfirmation = () => {
        // Prevent multiple clicks
        if (addButtonClicked) return
        setAddButtonClicked(true)

        // If already in collection, show confirmation dialog to remove
        if (isInCollection) {
          setShowRemoveConfirm(true)
        } else {
          // Add to collection
          if (media && !collection.some((item) => item.id === media.id)) {
            addToCollection(media)
          }
        }

        // Reset the button state after a delay
        setTimeout(() => {
          setAddButtonClicked(false)
        }, 300) // Reduced from 1000ms to 300ms
      }

      // Execute the handler
      handleConfirmation()
    },
    [media, collection, addToCollection, addButtonClicked, isInCollection],
  )

  // Add this after other useEffects, before the return statement
  useEffect(() => {
    // This effect runs when addButtonClicked changes
    if (addButtonClicked) {
      // Prevent any modal closing logic from running
      const preventClose = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
      }

      // Add event listeners to capture and prevent events
      document.addEventListener("click", preventClose, { capture: true })
      document.addEventListener("touchend", preventClose, { capture: true })

      // Cleanup
      return () => {
        document.removeEventListener("click", preventClose, { capture: true })
        document.removeEventListener("touchend", preventClose, { capture: true })
      }
    }
  }, [addButtonClicked])

  // Handler for opening the expanded card view
  const handleOpenExpandedCard = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowExpandedCard(true)
  }, [])

  // Add an effect to handle closing the tag dropdown when clicking outside:
  // useEffect(() => {
  //   if (!showTagDropdown) return

  //   const handleClickOutside = (e: MouseEvent) => {
  //     // Don't close if clicking the tag button itself
  //     const target = e.target as HTMLElement
  //     if (target.closest('[aria-label="Manage Tags"]')) return

  //     // Check if the click is outside the dropdown
  //     const dropdownElements = document.querySelectorAll(".tag-dropdown")
  //     let clickedInside = false

  //     dropdownElements.forEach((element) => {
  //       if (element.contains(target)) {
  //         clickedInside = true
  //       }
  //     })

  //     if (!clickedInside) {
  //       setShowTagDropdown(false)
  //     }
  //   }

  //   document.addEventListener("mousedown", handleClickOutside)
  //   return () => document.removeEventListener("mousedown", handleClickOutside)
  // }, [showTagDropdown])

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-black/80 flex flex-col overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Close button - moved inside the motion.div */}
        <div
          className="fixed top-4 right-4 z-[100]"
          onClick={(e) => {
            e.stopPropagation() // Prevent double triggering
            onClose()
          }}
        >
          <button
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shadow-md"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Background effect that takes colors from the poster - moved outside the sliding container */}
        <div
          className="absolute inset-0 -z-10 overflow-hidden will-change-transform"
          style={{
            backgroundImage: `url(${media.coverImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(24px) brightness(0.7)",
            transform: "scale(1.1)",
          }}
        >
          {/* Gradient overlay that transitions from semi-transparent to fully opaque */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black"></div>
        </div>

        <motion.div
          className="w-full h-full bg-transparent overflow-y-auto no-scrollbar scrollbar-hide"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{
            type: "spring",
            damping: 35,
            stiffness: 300,
            restDelta: 0.001,
            restSpeed: 0.001,
          }}
          onClick={(e) => e.stopPropagation()}
          ref={detailsRef}
          onPointerDown={handlePointerDown}
        >
          {/* Media card preview */}
          <div className="flex justify-center pt-12 mb-4 overflow-visible relative">
            {/* Clickable card to open expanded view */}
            <div className="relative cursor-pointer transform-gpu" onClick={handleOpenExpandedCard}>
              <MediaCard {...media} showHideButton={false} showTagsButton={false} showDetailsButton={false} />

              {/* Customization button in bottom right corner of the card */}
              {isInCollection && (
                <motion.button
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center shadow-lg z-10"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (onCustomize) {
                      onCustomize()
                    }
                  }}
                  aria-label="Customize"
                >
                  <Sparkles className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Details content */}
          <div className="px-6 pb-24">
            <h1 className="text-2xl font-bold mb-1">{media.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm px-2 py-0.5 bg-zinc-800 rounded-full">{getMediaTypeDisplay()}</span>
              {media.releaseDate && (
                <span className="text-sm text-zinc-400">{formatReleaseDate(media.releaseDate)}</span>
              )}
              {media.rating > 0 && (
                <span className="text-sm flex items-center text-yellow-400">★ {media.rating.toFixed(1)}</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-6">
              {/* Collection button - shows Plus when not in collection, Library icon when in collection */}
              <div
                className="relative"
                onClick={(e) => {
                  // Extra layer to catch and stop events
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <motion.button
                  ref={addButtonRef}
                  className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                    isInCollection ? "bg-green-600" : "bg-purple-600"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddToCollectionClick}
                  disabled={addButtonClicked}
                  aria-label={isInCollection ? "Remove from Collection" : "Add to Collection"}
                >
                  {isInCollection ? <Library className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </motion.button>
              </div>

              {media.type !== "tv" && (
                <motion.button
                  className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${isWatched ? "bg-green-600" : "bg-zinc-700"}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleWatched()
                  }}
                  aria-label={isWatched ? "Mark as Unwatched" : "Mark as Watched"}
                >
                  <Check className="w-4 h-4" />
                </motion.button>
              )}

              <motion.button
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${notes.length > 0 ? "bg-purple-600" : "bg-zinc-700"}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNoteButtonClick}
                aria-label="Add Note"
              >
                <MessageSquare className="w-4 h-4" />
                {notes.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {notes.length}
                  </span>
                )}
              </motion.button>

              {hideItem && (
                <motion.button
                  className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (hideItem) {
                      hideItem()
                    }
                  }}
                  aria-label="Hide"
                >
                  <EyeOff className="w-4 h-4" />
                </motion.button>
              )}

              {showTagsButton && (
                <motion.button
                  className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setTagDropdownPosition({ x: e.clientX, y: e.clientY })
                    setShowTagDropdown(true)
                  }}
                  aria-label="Manage Tags"
                >
                  <Tag className="w-4 h-4" />
                </motion.button>
              )}
            </div>

            {/* Note editor section */}
            {media.type === "movie" && (
              <AnimatePresence>
                {showNoteEditor && (
                  <motion.div
                    className="mt-3 mb-6 bg-zinc-800/50 rounded-lg p-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {notes.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {notes.map((note) => (
                          <div key={note.id} className="bg-zinc-900/70 rounded-lg p-2">
                            <p className="text-sm mb-1">{note.text}</p>
                            <div className="flex items-center text-xs text-zinc-400">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatNoteDate(note.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="Add notes about this title..."
                      rows={3}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <motion.button
                        className="px-3 py-1 rounded-lg text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowNoteEditor(false)
                        }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        className="px-3 py-1 rounded-lg text-xs bg-purple-600 text-white hover:bg-purple-500 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          saveNote()
                        }}
                        disabled={!noteText.trim()}
                      >
                        Save
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Overview */}
            {media.overview && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Overview</h2>
                <p className="text-zinc-300">{media.overview}</p>
              </div>
            )}

            {/* Media-specific details */}
            {media.type === "movie" && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Details</h2>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-800/50 p-3 rounded-lg">
                    <p className="text-xs text-zinc-400">Release Year</p>
                    <p>{formatReleaseDate(media.releaseDate)}</p>
                  </div>
                  <div className="bg-zinc-800/50 p-3 rounded-lg">
                    <p className="text-xs text-zinc-400">Rating</p>
                    <p>{media.rating ? `${media.rating.toFixed(1)}/10` : "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

            {media.type === "tv" && (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Details</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-800/50 p-3 rounded-lg">
                      <p className="text-xs text-zinc-400">First Air Date</p>
                      <p>{formatReleaseDate(media.releaseDate)}</p>
                    </div>
                    <div className="bg-zinc-800/50 p-3 rounded-lg">
                      <p className="text-xs text-zinc-400">Rating</p>
                      <p>{media.rating ? `${media.rating.toFixed(1)}/10` : "N/A"}</p>
                    </div>
                  </div>
                </div>
                <TVShowDetails mediaId={media.id} />
              </>
            )}

            {media.type === "book" && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Details</h2>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-800/50 p-3 rounded-lg">
                    <p className="text-xs text-zinc-400">Publication Year</p>
                    <p>{formatReleaseDate(media.releaseDate)}</p>
                  </div>
                  <div className="bg-zinc-800/50 p-3 rounded-lg">
                    <p className="text-xs text-zinc-400">Author</p>
                    <p>{media.overview?.includes("By ") ? media.overview.split("By ")[1] : "Unknown"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Similar Titles */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Similar Titles</h2>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : similarTitles.length > 0 ? (
                <div className="flex overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide no-scrollbar gap-3">
                  {similarTitles.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-[140px] sm:w-[160px]">
                      <MediaCard
                        {...item}
                        isInCollection={collection.some((collectionItem) => collectionItem.id === item.id)}
                        onShowDetails={() => handleShowDetails(item)}
                        showHideButton={false}
                        showTagsButton={false}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-zinc-400">No similar titles found</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Nested TitleDetails for a similar title */}
        {showNestedDetails && selectedSimilarTitle && (
          <TitleDetails
            media={selectedSimilarTitle}
            onClose={() => {
              setShowNestedDetails(false)
              setSelectedSimilarTitle(null)
            }}
            onAddToCollection={onAddToCollection}
            onCustomize={onCustomize}
            hideItem={hideItem}
            showTagsButton={showTagsButton}
            addTagToItem={addTagToItem}
          />
        )}

        {/* Tag Dropdown */}
        {showTagDropdown && (
          <TagDropdown
            itemId={media.id}
            mediaType={media.type}
            onClose={() => setShowTagDropdown(false)}
            position={tagDropdownPosition}
          />
        )}
      </motion.div>

      {/* Expanded Card View */}
      <ExpandedCardView
        isOpen={showExpandedCard}
        onClose={() => setShowExpandedCard(false)}
        title={media.title}
        coverImage={media.coverImage}
        type={media.type}
        rating={media.rating}
        customizations={media.customizations}
      />

      {/* Confirmation Dialog for removing from collection */}
      {showRemoveConfirm && (
        <ConfirmDialog
          message={`Remove "${media.title}" from your collection?`}
          onConfirm={handleRemoveFromCollection}
          onCancel={() => setShowRemoveConfirm(false)}
        />
      )}
    </>
  )
}
