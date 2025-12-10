"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import { motion, Reorder, AnimatePresence } from "framer-motion"
import {
  Edit,
  Settings,
  Star,
  Plus,
  Search,
  Check,
  GripHorizontal,
  X,
  BookOpen,
  Upload,
  AlertCircle,
  Library,
  Tag,
  Film,
} from "lucide-react"
import MediaCard from "@/components/media-card"
import { useMedia } from "@/context/media-context"
import { cn } from "@/lib/utils"
import TitleDetails from "@/components/title-details"
// Update the import to use default import
import storage from "@/lib/storage"

// Add these imports at the top of the file
import { useState as useEmojiState, useEffect as useEmojiEffect, useRef as useEmojiRef } from "react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

// Add these localStorage keys at the top of the file, after the MOCK_COLLECTION
const STORAGE_KEYS = {
  favorites: "mediaFavorites",
  watching: "mediaWatching",
  reading: "mediaReading",
}

// Add these constants after the existing STORAGE_KEYS
const PROFILE_STORAGE_KEYS = {
  name: "mediaProfileName",
  picture: "mediaProfilePicture",
  borderEffect: "mediaProfileBorderEffect",
}

// Add this component after the imports and before the ProfilePage component
function EmojiStickerFilters({ collection }) {
  const [selectedEmoji, setSelectedEmoji] = useEmojiState(null)
  const [filteredCards, setFilteredCards] = useEmojiState([])
  const scrollContainerRef = useEmojiRef(null)

  // Extract all unique stickers used in the collection
  const usedStickers = useMemo(() => {
    const stickers = new Map()

    collection.forEach((item) => {
      if (item.customizations?.stickers?.length) {
        item.customizations.stickers.forEach((sticker) => {
          if (sticker.id && sticker.emoji) {
            if (stickers.has(sticker.id)) {
              stickers.set(sticker.id, {
                ...stickers.get(sticker.id),
                count: stickers.get(sticker.id).count + 1,
                items: [...stickers.get(sticker.id).items, item],
              })
            } else {
              stickers.set(sticker.id, {
                id: sticker.id,
                emoji: sticker.emoji,
                count: 1,
                items: [item],
              })
            }
          }
        })
      }
    })

    // Convert to array and sort by count (most used first)
    return Array.from(stickers.values()).sort((a, b) => b.count - a.count)
  }, [collection])

  // Filter cards when emoji is selected
  useEmojiEffect(() => {
    if (!selectedEmoji) {
      setFilteredCards([])
      return
    }

    const filtered = usedStickers.find((s) => s.id === selectedEmoji)?.items || []
    setFilteredCards(filtered)
  }, [selectedEmoji, usedStickers])

  // Handle emoji selection
  const handleEmojiClick = (stickerId) => {
    setSelectedEmoji((prev) => (prev === stickerId ? null : stickerId))
  }

  return (
    <div className="w-full mt-2 mb-0.5">
      <div ref={scrollContainerRef} className="flex overflow-x-auto gap-2 pb-1 -mx-2 px-2 scrollbar-hide no-scrollbar">
        {usedStickers.length > 0 ? (
          usedStickers.map((sticker) => (
            <motion.button
              key={sticker.id}
              className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${
                selectedEmoji === sticker.id
                  ? "bg-purple-600 shadow-lg shadow-purple-500/30"
                  : "bg-black/30 hover:bg-black/50"
              }`}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                scale: selectedEmoji === sticker.id ? [1, 1.1, 1] : 1,
                rotate: [0, selectedEmoji === sticker.id ? 10 : 0, selectedEmoji === sticker.id ? -10 : 0, 0],
              }}
              transition={{
                scale: {
                  duration: 0.3,
                  repeat: selectedEmoji === sticker.id ? Number.POSITIVE_INFINITY : 0,
                  repeatType: "reverse",
                },
                rotate: {
                  duration: 0.5,
                  repeat: selectedEmoji === sticker.id ? Number.POSITIVE_INFINITY : 0,
                  repeatType: "reverse",
                },
              }}
              onClick={() => handleEmojiClick(sticker.id)}
            >
              <span className="text-3xl">{sticker.emoji}</span>
              {/* Remove the count badge */}
            </motion.button>
          ))
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className="flex-shrink-0 w-14 h-14 rounded-full bg-black/30 flex items-center justify-center cursor-pointer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    y: [0, -3, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    y: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
                    rotate: { duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
                  }}
                >
                  <span className="text-3xl opacity-70">😶</span>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-800 text-white border-zinc-700">
                <p>Add stickers to your cards!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Display filtered cards */}
      <AnimatePresence>
        {selectedEmoji && filteredCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <h3 className="text-sm font-medium mb-2 text-zinc-400">Cards with this sticker</h3>
            <div className="flex overflow-x-auto gap-2 pb-2 -mx-2 px-2 scrollbar-hide no-scrollbar">
              {filteredCards.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <MediaCard {...item} className="w-[100px] sm:w-[140px]" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export interface MediaItem {
  id: string
  title: string
  coverImage: string
  type: "movie" | "tv" | "book"
  isInCollection?: boolean
  customizations?: {
    stickers?: any[]
  }
}

export default function ProfilePage() {
  const [streakCount, setStreakCount] = useState(7)
  const [coinCount, setCoinCount] = useState(245)
  const {
    collection,
    addToCollection,
    searchResults: contextSearchResults,
    searchForMedia,
    isSearching,
    getItemTags,
    getAllTags,
    setSelectedMedia,
    setIsCustomizing,
    setSelectedSticker,
    setStickerPosition,
    setStickerSize,
    setStickerRotation,
  } = useMedia()

  const getMediaWithLatestCustomizations = useCallback(
    (item) => {
      const itemInCollection = collection.find((collectionItem) => collectionItem.id === item.id)
      return itemInCollection ? { ...item, ...itemInCollection } : item
    },
    [collection],
  )

  // Add these state variables inside the ProfilePage component
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileName, setProfileName] = useState("MediaMaster")
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [profileBorderEffect, setProfileBorderEffect] = useState<"none" | "pulse" | "glow" | "rainbow">("none")
  const [fileError, setFileError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Favorites section state
  const [isEditingFavorites, setIsEditingFavorites] = useState(false)
  const [favoriteSearchQuery, setFavoriteSearchQuery] = useState("")
  const [selectedFavorites, setSelectedFavorites] = useState([])
  const [orderedFavorites, setOrderedFavorites] = useState([])

  // Currently Watching section state
  const [isEditingWatching, setIsEditingWatching] = useState(false)
  const [watchingSearchQuery, setWatchingSearchQuery] = useState("")
  const [selectedWatching, setSelectedWatching] = useState([])
  const [orderedWatching, setOrderedWatching] = useState([])

  // Currently Reading section state
  const [isEditingReading, setIsEditingReading] = useState(false)
  const [readingSearchQuery, setReadingSearchQuery] = useState("")
  const [selectedReading, setSelectedReading] = useState([])
  const [orderedReading, setOrderedReading] = useState([])

  // Search results for each section
  const [favoriteResults, setFavoriteResults] = useState([])
  const [watchingResults, setWatchingResults] = useState([])
  const [readingResults, setReadingResults] = useState([])

  const [showDetails, setShowDetails] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState(null)

  // Add these new state variables after the existing state variables in ProfilePage component
  const [selectedProfileTags, setSelectedProfileTags] = useState<string[]>([])
  const [filteredTagItems, setFilteredTagItems] = useState<any[]>([])
  const [visibleTagItems, setVisibleTagItems] = useState<number>(30) // Initially show 30 items

  // Add a ref for the tags section near the top of the ProfilePage component:
  const tagsRef = useRef<HTMLDivElement>(null)

  // Add activeCardId state to the ProfilePage component
  // Add this near the other state variables at the top of the component:
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  // Fix the isSelectionMode state by adding it properly at the top of the component with other state variables:
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Add this function to filter items by tags
  const filterItemsByTags = useCallback(() => {
    if (selectedProfileTags.length === 0) {
      setFilteredTagItems([])
      return
    }

    const filtered = collection.filter((item) => {
      const itemTags = getItemTags(item.id)
      return selectedProfileTags.some((tagId) => itemTags.includes(tagId))
    })

    setFilteredTagItems(filtered)
    setVisibleTagItems(30) // Reset visible items when filter changes
  }, [selectedProfileTags, collection, getItemTags])

  // Add this useEffect to update filtered items when selected tags change
  useEffect(() => {
    filterItemsByTags()
  }, [selectedProfileTags, filterItemsByTags])

  // Add this function to toggle tag selection
  const toggleProfileTagSelection = (tagId: string) => {
    setSelectedProfileTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  // Add this function to handle scroll and load more items
  const handleTagScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        // When user scrolls to near bottom, load more items
        setVisibleTagItems((prev) => Math.min(prev + 20, filteredTagItems.length))
      }
    },
    [filteredTagItems.length],
  )

  // Add this function to count items with a specific tag
  const countItemsWithTag = useCallback(
    (tagId: string) => {
      return collection.filter((item) => {
        const itemTags = getItemTags(item.id)
        return itemTags.includes(tagId)
      }).length
    },
    [collection, getItemTags],
  )

  // Add this useEffect to load profile data from localStorage
  useEffect(() => {
    try {
      const savedName = storage.get<string | null>(PROFILE_STORAGE_KEYS.name, null)
      if (savedName) {
        setProfileName(savedName)
      }

      const savedPicture = storage.get<string | null>(PROFILE_STORAGE_KEYS.picture, null)
      if (savedPicture) {
        setProfilePicture(savedPicture)
      }

      const savedBorderEffect = storage.get<"none" | "pulse" | "glow" | "rainbow" | null>(
        PROFILE_STORAGE_KEYS.borderEffect,
        null,
      )
      if (savedBorderEffect) {
        setProfileBorderEffect(savedBorderEffect)
      }
    } catch (e) {
      console.error("Error loading profile data:", e)
    }
  }, [])

  // Update the useEffect that loads favorites, watching, and reading lists
  // to use the getMediaWithLatestCustomizations function

  // Replace the useEffect that initializes with mock data with this updated version
  // that loads from localStorage first
  useEffect(() => {
    // Try to load favorites from localStorage
    try {
      const savedFavorites = storage.get<any[]>(STORAGE_KEYS.favorites, [])
      if (savedFavorites.length > 0) {
        // Apply latest customizations to each item
        const updatedFavorites = savedFavorites.map((item) => getMediaWithLatestCustomizations(item))
        setOrderedFavorites(updatedFavorites)
        setSelectedFavorites(updatedFavorites.map((item) => item.id))
      } else {
        setOrderedFavorites([])
      }
    } catch (e) {
      console.error("Error loading favorites from localStorage:", e)
      setOrderedFavorites([])
    }

    // Try to load watching from localStorage
    try {
      const savedWatching = storage.get<any[]>(STORAGE_KEYS.watching, [])
      if (savedWatching.length > 0) {
        // Apply latest customizations to each item
        const updatedWatching = savedWatching.map((item) => getMediaWithLatestCustomizations(item))
        setOrderedWatching(updatedWatching)
        setSelectedWatching(updatedWatching.map((item) => item.id))
      } else {
        setOrderedWatching([])
        setSelectedWatching([])
      }
    } catch (e) {
      console.error("Error loading watching from localStorage:", e)
      setOrderedWatching([])
      setSelectedWatching([])
    }

    // Try to load reading from localStorage
    try {
      const savedReading = storage.get<any[]>(STORAGE_KEYS.reading, [])
      if (savedReading.length > 0) {
        // Apply latest customizations to each item
        const updatedReading = savedReading.map((item) => getMediaWithLatestCustomizations(item))
        setOrderedReading(updatedReading)
        setSelectedReading(updatedReading.map((item) => item.id))
      } else {
        setOrderedReading([])
        setSelectedReading([])
      }
    } catch (e) {
      console.error("Error loading reading from localStorage:", e)
      setOrderedReading([])
      setSelectedReading([])
    }
  }, [getMediaWithLatestCustomizations])

  // Add this function to handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("")
    const file = e.target.files?.[0]

    if (!file) return

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size exceeds 5MB limit")
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setFileError("Only image files are allowed")
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfilePicture(event.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  // Add this function to save profile data
  const saveProfileData = () => {
    try {
      storage.set(PROFILE_STORAGE_KEYS.name, profileName)

      if (profilePicture) {
        storage.set(PROFILE_STORAGE_KEYS.picture, profilePicture)
      }

      storage.set(PROFILE_STORAGE_KEYS.borderEffect, profileBorderEffect)

      setShowProfileModal(false)
    } catch (e) {
      console.error("Error saving profile data:", e)
    }
  }

  // Add this function to get border class
  const getProfileBorderClass = () => {
    switch (profileBorderEffect) {
      case "pulse":
        return "animate-pulse border-2 border-pink-500"
      case "glow":
        return "border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]"
      case "rainbow":
        return "border-2 border-transparent bg-clip-padding p-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"
      default:
        return "border border-zinc-700"
    }
  }

  // Filter collection based on search query and media type
  const filterCollection = (query, mediaTypes) => {
    if (query.length < 2) return []

    // If we're searching for books specifically, also search OpenLibrary
    if (mediaTypes && mediaTypes.includes("book") && mediaTypes.length === 1) {
      // First search local collection
      const localResults = collection.filter((item) => {
        // Filter by media type
        if (mediaTypes && !mediaTypes.includes(item.type)) return false

        // Filter by search query
        return item.title.toLowerCase().includes(query.toLowerCase())
      })

      // If we have enough local results, just return those
      if (localResults.length >= 5) return localResults

      // Otherwise, also search OpenLibrary (this will happen asynchronously)
      const searchBooks = async (query) => {
        // Replace this with your actual OpenLibrary search logic
        // For now, just return an empty array
        return []
      }
      searchBooks(query)
        .then((bookResults) => {
          if (mediaTypes.includes("book")) {
            if (readingSearchQuery === query) {
              setReadingResults((prevResults) => {
                // Combine with existing results, avoiding duplicates
                const existingIds = new Set(prevResults.map((item) => item.id))
                const newBooks = bookResults.filter((book) => !existingIds.has(book.id))
                return [...prevResults, ...newBooks]
              })
            }
          }
        })
        .catch((err) => console.error("Error searching books:", err))

      // Return local results immediately
      return localResults
    }

    // Regular collection search for non-book specific searches
    return collection.filter((item) => {
      // Filter by media type if specified
      if (mediaTypes && !mediaTypes.includes(item.type)) return false

      // Filter by search query
      return item.title.toLowerCase().includes(query.toLowerCase())
    })
  }

  // Update search results when queries change
  useEffect(() => {
    // Favorites search (all media types)
    if (favoriteSearchQuery.length >= 2) {
      setFavoriteResults(filterCollection(favoriteSearchQuery))
    } else {
      setFavoriteResults([])
    }

    // Watching search (only movies and TV)
    if (watchingSearchQuery.length >= 2) {
      setWatchingResults(filterCollection(watchingSearchQuery, ["movie", "tv"]))
    } else {
      setWatchingResults([])
    }

    // Reading search (only books)
    if (readingSearchQuery.length >= 2) {
      setReadingResults(filterCollection(readingSearchQuery, ["book"]))
    } else {
      setReadingResults([])
    }
  }, [favoriteSearchQuery, watchingSearchQuery, readingSearchQuery, collection])

  // Update the toggleSelection function to use getMediaWithLatestCustomizations

  // Toggle item selection for a specific section
  const toggleSelection = (item, section) => {
    // If not in collection, add it
    if (!item.isInCollection) {
      addToCollection(item)
      item.isInCollection = true
    }

    // Get the item with latest customizations
    const updatedItem = getMediaWithLatestCustomizations(item)

    // Handle selection based on section
    switch (section) {
      case "favorites":
        setSelectedFavorites((prev) => {
          if (prev.includes(updatedItem.id)) {
            // Remove from favorites
            setOrderedFavorites((current) => current.filter((fav) => fav.id !== updatedItem.id))
            return prev.filter((id) => id !== updatedItem.id)
          } else {
            // Add to favorites (if under limit)
            if (prev.length >= 5) return prev
            setOrderedFavorites((current) => [...current, updatedItem])
            return [...prev, updatedItem.id]
          }
        })
        break

      case "watching":
        setSelectedWatching((prev) => {
          if (prev.includes(updatedItem.id)) {
            // Remove from watching
            setOrderedWatching((current) => current.filter((fav) => fav.id !== updatedItem.id))
            return prev.filter((id) => id !== updatedItem.id)
          } else {
            // Add to watching
            setOrderedWatching((current) => [...current, updatedItem])
            return [...prev, updatedItem.id]
          }
        })
        break

      case "reading":
        setSelectedReading((prev) => {
          if (prev.includes(updatedItem.id)) {
            // Remove from reading
            setOrderedReading((current) => current.filter((fav) => fav.id !== updatedItem.id))
            return prev.filter((id) => id !== updatedItem.id)
          } else {
            // Add to reading
            setOrderedReading((current) => [...current, updatedItem])
            return [...prev, updatedItem.id]
          }
        })
        break
    }
  }

  // Remove item from a section
  const removeItem = (id, section, e) => {
    e.stopPropagation() // Prevent triggering card actions

    switch (section) {
      case "favorites":
        setSelectedFavorites((prev) => prev.filter((itemId) => itemId !== id))
        setOrderedFavorites((current) => current.filter((item) => item.id !== id))
        break

      case "watching":
        setSelectedWatching((prev) => prev.filter((itemId) => itemId !== id))
        setOrderedWatching((current) => current.filter((item) => item.id !== id))
        break

      case "reading":
        setSelectedReading((prev) => prev.filter((itemId) => itemId !== id))
        setOrderedReading((current) => current.filter((item) => item.id !== id))
        break
    }
  }

  // Add these useEffect hooks to save changes to localStorage
  // Add this after the existing useEffects
  useEffect(() => {
    // Save favorites to localStorage whenever they change
    if (orderedFavorites) {
      storage.set(STORAGE_KEYS.favorites, orderedFavorites)
    }
  }, [orderedFavorites])

  useEffect(() => {
    // Save watching to localStorage whenever they change
    if (orderedWatching) {
      storage.set(STORAGE_KEYS.watching, orderedWatching)
    }
  }, [orderedWatching])

  useEffect(() => {
    // Save reading to localStorage whenever they change
    if (orderedReading) {
      storage.set(STORAGE_KEYS.reading, orderedReading)
    }
  }, [orderedReading])

  // Add this useEffect after the existing useEffects
  // This will update the lists whenever the collection changes

  // Add this useEffect to update lists when collection changes
  useEffect(() => {
    // Update favorites with latest customizations
    setOrderedFavorites((prev) => prev.map((item) => getMediaWithLatestCustomizations(item)))

    // Update watching with latest customizations
    setOrderedWatching((prev) => prev.map((item) => getMediaWithLatestCustomizations(item)))

    // Update reading with latest customizations
    setOrderedReading((prev) => prev.map((item) => getMediaWithLatestCustomizations(item)))
  }, [collection, getMediaWithLatestCustomizations])

  const handleShowDetails = (media) => {
    setSelectedTitle(media)
    setShowDetails(true)
  }

  // Update the handleCustomize function to handle the updated media object
  const handleCustomize = useCallback(
    (item: MediaItem) => {
      // Ensure the item is in the collection
      if (!collection.some((collectionItem) => collectionItem.id === item.id)) {
        addToCollection(item)
      }
      setSelectedMedia(item)
      setIsCustomizing(true)
      if (item.customizations?.stickers?.length) {
        const sticker = item.customizations.stickers[0]
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
    },
    [addToCollection, collection, setSelectedSticker, setStickerPosition, setStickerSize, setStickerRotation],
  )

  // Remove the incorrect declaration:
  // const [isSelectionMode, setSelectedItems] = useState(false);

  const renderMediaCard = useCallback(
    (item) => (
      <div key={item.id} className="relative">
        <MediaCard
          {...item}
          className="w-[130px] sm:w-[160px] h-[195px] sm:h-[240px]"
          onShowDetails={handleShowDetails}
          showHideButton={false}
          showTagsButton={false}
        />
      </div>
    ),
    [],
  )

  return (
    <div className="h-full overflow-y-auto scrollbar-hide no-scrollbar bg-gradient-to-b from-zinc-900 to-black pb-20">
      {/* Profile Header */}
      <div className="relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <motion.button
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowProfileModal(true)}
          >
            <Edit className="w-5 h-5" />
          </motion.button>
          <motion.button
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="pt-10 pb-6 px-4 bg-gradient-to-b from-purple-900/50 to-black">
          <div className="flex flex-col items-center">
            <motion.div
              className={`w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 overflow-hidden ${getProfileBorderClass()}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {profilePicture ? (
                <div className="w-full h-full">
                  <img
                    src={profilePicture || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <span className="text-3xl">👾</span>
              )}
            </motion.div>

            <motion.h1
              className="text-2xl font-bold mb-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {profileName}
            </motion.h1>

            {/* Replace the motion.div with the stats (coins and streak) with this updated version: */}
            <motion.div
              className="flex items-center gap-2 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-1 bg-black/30 rounded-full px-3 py-1">
                <Library className="w-4 h-4 text-yellow-400" />
                <motion.span
                  className="font-bold text-yellow-400"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  {collection.length}
                </motion.span>
              </div>

              <div
                className="flex items-center gap-1 bg-black/30 rounded-full px-3 py-1 cursor-pointer hover:bg-black/50 transition-colors"
                onClick={() => tagsRef.current?.scrollIntoView({ behavior: "smooth" })}
              >
                <Tag className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-orange-400">{getAllTags().length} tags</span>
              </div>
            </motion.div>

            {/* Emoji Sticker Filters */}
            <EmojiStickerFilters collection={collection} />
          </div>
        </div>
      </div>

      {/* Favorites Section */}
      <div className="px-4 py-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center">
            <Star className="w-5 h-5 text-yellow-400 mr-2" />
            <span>My Favorites</span>
          </h2>

          <motion.button
            className={cn(
              "rounded-full p-2 flex items-center justify-center",
              isEditingFavorites ? "bg-purple-700" : "bg-purple-600",
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsEditingFavorites(!isEditingFavorites)}
          >
            <Edit className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Search field when in edit mode */}
        {isEditingFavorites && (
          <div className="mb-4 relative">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search for titles to add..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-2 pl-10 pr-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={favoriteSearchQuery}
                onChange={(e) => setFavoriteSearchQuery(e.target.value)}
              />
              {favoriteSearchQuery && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  onClick={() => setFavoriteSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {favoriteSearchQuery.length > 0 && (
              <div className="relative">
                <div className="absolute z-20 left-0 right-0 mt-2 bg-zinc-900 rounded-xl border border-zinc-700 shadow-xl max-h-[40vh] overflow-y-auto">
                  {favoriteSearchQuery.length >= 2 ? (
                    favoriteResults.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2">
                        {favoriteResults.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "relative rounded-lg overflow-hidden cursor-pointer transition-all",
                              selectedFavorites.includes(item.id) ? "ring-2 ring-yellow-400" : "",
                            )}
                            onClick={() => toggleSelection(item, "favorites")}
                          >
                            <div className="relative w-full pb-[70%]">
                              <Image
                                src={item.coverImage || "/placeholder.svg"}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-1">
                                <p className="text-[9px] font-medium truncate">{item.title}</p>
                                <div className="flex items-center mt-0.5">
                                  <span className="text-[8px] text-zinc-400">
                                    {item.type === "movie" && "🎬"}
                                    {item.type === "tv" && "📺"}
                                    {item.type === "book" && "📚"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {selectedFavorites.includes(item.id) && (
                              <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                                <Check className="w-3 h-3 text-black" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-zinc-400">
                        <p>No matching titles found in your collection</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-4 text-zinc-400">
                      <p>Type at least 2 characters to search</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {orderedFavorites.length > 0 ? (
          <div className="flex justify-start gap-2 overflow-x-auto pb-4 -mx-4 px-4 pl-6 scrollbar-hide no-scrollbar">
            {isEditingFavorites ? (
              <Reorder.Group axis="x" values={orderedFavorites} onReorder={setOrderedFavorites} className="flex gap-2">
                {orderedFavorites.map((item) => (
                  <Reorder.Item key={item.id} value={item} className="cursor-grab active:cursor-grabbing">
                    <div className="relative">
                      <MediaCard
                        {...item}
                        onShowDetails={() => handleShowDetails(item)}
                        isActive={activeCardId === item.id}
                        onActivate={() => {
                          // If this card is already active, deactivate it
                          if (activeCardId === item.id) {
                            setActiveCardId(null)
                          } else {
                            setActiveCardId(item.id)
                          }
                        }}
                      />
                      <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg">
                        <X className="w-4 h-4 text-white" onClick={(e) => removeItem(item.id, "favorites", e)} />
                      </div>
                      <div className="absolute -top-2 -left-2 bg-yellow-400 rounded-full p-1 shadow-lg">
                        <GripHorizontal className="w-4 h-4 text-black" />
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              orderedFavorites.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <MediaCard {...item} onShowDetails={() => handleShowDetails(item)} />
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
            <Star className="w-10 h-10 mb-2 text-zinc-600" />
            <p className="mb-4">No favorites selected</p>
            {!isEditingFavorites && (
              <motion.button
                className="bg-purple-600 text-white px-4 py-2 rounded-full flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditingFavorites(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>Add Favorites</span>
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Currently Watching */}
      <div className="px-4 py-6 border-t border-zinc-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center">
            <Film className="w-5 h-5 text-blue-400 mr-2" />
            <span>Currently Watching</span>
          </h2>

          <motion.button
            className={cn(
              "rounded-full p-2 flex items-center justify-center",
              isEditingWatching ? "bg-purple-700" : "bg-purple-600",
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsEditingWatching(!isEditingWatching)}
          >
            <Edit className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Search field when in edit mode */}
        {isEditingWatching && (
          <div className="mb-4 relative">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search for movies or shows to add..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-2 pl-10 pr-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={watchingSearchQuery}
                onChange={(e) => setWatchingSearchQuery(e.target.value)}
              />
              {watchingSearchQuery && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  onClick={() => setWatchingSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {watchingSearchQuery.length > 0 && (
              <div className="relative">
                <div className="absolute z-20 left-0 right-0 mt-2 bg-zinc-900 rounded-xl border border-zinc-700 shadow-xl max-h-[40vh] overflow-y-auto">
                  {watchingSearchQuery.length >= 2 ? (
                    watchingResults.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2">
                        {watchingResults.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "relative rounded-lg overflow-hidden cursor-pointer transition-all",
                              selectedWatching.includes(item.id) ? "ring-2 ring-blue-400" : "",
                            )}
                            onClick={() => toggleSelection(item, "watching")}
                          >
                            <div className="relative w-full pb-[70%]">
                              <Image
                                src={item.coverImage || "/placeholder.svg"}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-1">
                                <p className="text-[9px] font-medium truncate">{item.title}</p>
                                <div className="flex items-center mt-0.5">
                                  <span className="text-[8px] text-zinc-400">
                                    {item.type === "movie" && "🎬"}
                                    {item.type === "tv" && "📺"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {selectedWatching.includes(item.id) && (
                              <div className="absolute top-2 right-2 bg-blue-400 rounded-full p-1">
                                <Check className="w-3 h-3 text-black" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-zinc-400">
                        <p>No matching movies or shows found</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-4 text-zinc-400">
                      <p>Type at least 2 characters to search</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {orderedWatching.length > 0 ? (
          <div className="flex justify-start gap-2 overflow-x-auto pb-4 -mx-4 px-4 pl-6 scrollbar-hide no-scrollbar">
            {isEditingWatching ? (
              <Reorder.Group axis="x" values={orderedWatching} onReorder={setOrderedWatching} className="flex gap-2">
                {orderedWatching.map((item) => (
                  <Reorder.Item key={item.id} value={item} className="cursor-grab active:cursor-grabbing">
                    <div className="relative">
                      <MediaCard
                        {...item}
                        onShowDetails={() => handleShowDetails(item)}
                        isActive={activeCardId === item.id}
                        onActivate={() => {
                          // If this card is already active, deactivate it
                          if (activeCardId === item.id) {
                            setActiveCardId(null)
                          } else {
                            setActiveCardId(item.id)
                          }
                        }}
                      />
                      <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg">
                        <X className="w-4 h-4 text-white" onClick={(e) => removeItem(item.id, "watching", e)} />
                      </div>
                      <div className="absolute -top-2 -left-2 bg-blue-400 rounded-full p-1 shadow-lg">
                        <GripHorizontal className="w-4 h-4 text-black" />
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              orderedWatching.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <MediaCard {...item} onShowDetails={() => handleShowDetails(item)} />
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
            <Film className="w-10 h-10 mb-2 text-zinc-600" />
            <p className="mb-4">Not watching anything yet</p>
            {!isEditingWatching && (
              <motion.button
                className="bg-purple-600 text-white px-4 py-2 rounded-full flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditingWatching(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>Add Shows</span>
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Currently Reading */}
      <div className="px-4 py-6 border-t border-zinc-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center">
            <BookOpen className="w-5 h-5 text-green-400 mr-2" />
            <span>Currently Reading</span>
          </h2>

          <motion.button
            className={cn(
              "rounded-full p-2 flex items-center justify-center",
              isEditingReading ? "bg-purple-700" : "bg-purple-600",
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsEditingReading(!isEditingReading)}
          >
            <Edit className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Search field when in edit mode */}
        {isEditingReading && (
          <div className="mb-4 relative">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search for books to add..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-2 pl-10 pr-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={readingSearchQuery}
                onChange={(e) => setReadingSearchQuery(e.target.value)}
              />
              {readingSearchQuery && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  onClick={() => setReadingSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {readingSearchQuery.length > 0 && (
              <div className="relative">
                <div className="absolute z-20 left-0 right-0 mt-2 bg-zinc-900 rounded-xl border border-zinc-700 shadow-xl max-h-[40vh] overflow-y-auto">
                  {readingSearchQuery.length >= 2 ? (
                    readingResults.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2">
                        {readingResults.map((item) => (
                          <div
                            key={item.id}
                            className={cn(
                              "relative rounded-lg overflow-hidden cursor-pointer transition-all",
                              selectedReading.includes(item.id) ? "ring-2 ring-green-400" : "",
                            )}
                            onClick={() => toggleSelection(item, "reading")}
                          >
                            <div className="relative w-full pb-[70%]">
                              <Image
                                src={item.coverImage || "/placeholder.svg"}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-1">
                                <p className="text-[9px] font-medium truncate">{item.title}</p>
                                <div className="flex items-center mt-0.5">
                                  <span className="text-[8px] text-zinc-400">📚</span>
                                </div>
                              </div>
                            </div>

                            {selectedReading.includes(item.id) && (
                              <div className="absolute top-2 right-2 bg-green-400 rounded-full p-1">
                                <Check className="w-3 h-3 text-black" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-zinc-400">
                        <p>No matching books found</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-4 text-zinc-400">
                      <p>Type at least 2 characters to search</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {orderedReading.length > 0 ? (
          <div className="flex justify-start gap-2 overflow-x-auto pb-4 -mx-4 px-4 pl-6 scrollbar-hide no-scrollbar">
            {isEditingReading ? (
              <Reorder.Group axis="x" values={orderedReading} onReorder={setOrderedReading} className="flex gap-2">
                {orderedReading.map((item) => (
                  <Reorder.Item key={item.id} value={item} className="cursor-grab active:cursor-grabbing">
                    <div className="relative">
                      <MediaCard
                        {...item}
                        onShowDetails={() => handleShowDetails(item)}
                        isActive={activeCardId === item.id}
                        onActivate={() => {
                          // If this card is already active, deactivate it
                          if (activeCardId === item.id) {
                            setActiveCardId(null)
                          } else {
                            setActiveCardId(item.id)
                          }
                        }}
                      />
                      <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg">
                        <X className="w-4 h-4 text-white" onClick={(e) => removeItem(item.id, "reading", e)} />
                      </div>
                      <div className="absolute -top-2 -left-2 bg-green-400 rounded-full p-1 shadow-lg">
                        <GripHorizontal className="w-4 h-4 text-black" />
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              orderedReading.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <MediaCard {...item} onShowDetails={() => handleShowDetails(item)} />
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
            <BookOpen className="w-10 h-10 mb-2 text-zinc-600" />
            <p className="mb-4">Not reading anything yet</p>
            {!isEditingReading && (
              <motion.button
                className="bg-purple-600 text-white px-4 py-2 rounded-full flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditingReading(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>Add Books</span>
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Edit Profile</h2>
                <motion.button
                  className="p-1 rounded-full bg-zinc-800"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowProfileModal(false)}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Profile Picture Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Profile Picture</label>
                <div className="flex flex-col items-center">
                  <div className={`w-32 h-32 rounded-full mb-4 overflow-hidden ${getProfileBorderClass()}`}>
                    {profilePicture ? (
                      <img
                        src={profilePicture || "/placeholder.svg"}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-4xl">👾</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <motion.button
                    className="px-4 py-2 rounded-full bg-purple-600 text-white flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    <span>Upload Image</span>
                  </motion.button>

                  {fileError && (
                    <div className="mt-2 text-red-500 text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span>{fileError}</span>
                    </div>
                  )}

                  <p className="mt-2 text-xs text-zinc-400">Max file size: 5MB</p>
                </div>
              </div>

              {/* Display Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value.slice(0, 40))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    maxLength={40}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-zinc-400">
                    {profileName.length}/40
                  </div>
                </div>
              </div>

              {/* Border Effect */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Border Effect</label>
                <div className="flex gap-2 flex-wrap">
                  {["none", "pulse", "glow", "rainbow"].map((effect) => (
                    <motion.button
                      key={effect}
                      className={`px-3 py-1 rounded-full text-xs capitalize ${
                        profileBorderEffect === effect ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-300"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setProfileBorderEffect(effect as "none" | "pulse" | "glow" | "rainbow")}
                    >
                      {effect}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <motion.button
                  className="px-6 py-2 rounded-full bg-purple-600 text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveProfileData}
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title Details Modal */}
      <AnimatePresence>
        {showDetails && selectedTitle && <TitleDetails media={selectedTitle} onClose={() => setShowDetails(false)} />}
      </AnimatePresence>

      {/* Add the ref to the Tags Section div (find the Tags Section div near the bottom of the file): */}
      {/* Tags Section */}
      <div ref={tagsRef} className="px-4 py-6 border-t border-zinc-800">
        <div className="flex flex-wrap gap-2 mb-4">
          {getAllTags().map((tag) => {
            const count = countItemsWithTag(tag.id)
            if (count === 0) return null // Don't show tags with no items

            return (
              <motion.button
                key={tag.id}
                className={cn(
                  "px-3 py-1 rounded-full text-xs flex items-center gap-1",
                  selectedProfileTags.includes(tag.id)
                    ? "bg-teal-600 text-white"
                    : tag.isCustom
                      ? "bg-purple-600/60 text-white"
                      : "bg-zinc-700 text-white",
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleProfileTagSelection(tag.id)}
              >
                <span>{tag.name}</span>
                <span
                  className={cn(
                    "text-[10px] rounded-full px-1.5 min-w-[18px] text-center",
                    selectedProfileTags.includes(tag.id)
                      ? "bg-teal-800"
                      : tag.isCustom
                        ? "bg-purple-800"
                        : "bg-zinc-800",
                  )}
                >
                  {count}
                </span>
              </motion.button>
            )
          })}
        </div>

        {selectedProfileTags.length > 0 && (
          <div
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[60vh] overflow-y-auto pb-4"
            onScroll={handleTagScroll}
          >
            <AnimatePresence>
              {filteredTagItems.slice(0, visibleTagItems).map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <MediaCard
                    {...item}
                    className="w-full sm:w-[160px]"
                    onShowDetails={() => handleShowDetails(item)}
                    isActive={activeCardId === item.id}
                    onActivate={() => {
                      // If this card is already active, deactivate it
                      if (activeCardId === item.id) {
                        setActiveCardId(null)
                      } else {
                        setActiveCardId(item.id)
                      }
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredTagItems.length === 0 && (
              <div className="col-span-3 sm:col-span-4 md:col-span-5 lg:col-span-6 text-center py-10 text-zinc-400">
                <p>No items match the selected tags</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
