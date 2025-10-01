"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import MediaCard from "@/components/media-card"
import { useStickerCustomization, AVAILABLE_STICKERS } from "@/hooks/use-sticker-customization"
import { extractTmdbId } from "@/lib/tmdb-api"

// -------------------- Variants Definitions --------------------
const modalContainerVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { type: "spring", damping: 20, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

const dropdownVariants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

const buttonVariant = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
}

// -------------------- Component --------------------
interface CustomizationModalProps {
  isOpen: boolean
  media: any
  initialCustomizations?: {
    borderEffect?: "pulse" | "glow" | "rainbow" | "neon" | "gradient" | "glitch" | "none"
    overlay?: "hearts" | "stars" | "sparkles" | "shimmer" | "retro" | "Gold" | "sticker" | "none"
    stickers?: Array<{
      id: string
      emoji: string
      position: { x: number; y: number }
      size?: number
      rotation?: number
    }>
    customPoster?: string // Add this field to store the customized poster
  }
  onSave: (customizations: any) => void
  onClose: () => void
  bulkMode?: boolean
  bulkCount?: number
}

export default function CustomizationModal({
  isOpen,
  media,
  initialCustomizations = {},
  onSave,
  onClose,
  bulkMode,
  bulkCount,
}: CustomizationModalProps) {
  const [tempCustomizations, setTempCustomizations] = useState(initialCustomizations)

  // Add this state inside the CustomizationModal component
  const [posters, setPosters] = useState<string[]>([])
  const [currentPosterIndex, setCurrentPosterIndex] = useState(0)
  const [isLoadingPosters, setIsLoadingPosters] = useState(false)

  // Reset temporary customizations whenever initial customizations change.
  useEffect(() => {
    setTempCustomizations(initialCustomizations)
  }, [initialCustomizations])

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
  } = useStickerCustomization({
    initialSticker: initialCustomizations?.stickers?.[0] || null,
  })

  // Initialize or reset sticker state when modal opens.
  useEffect(() => {
    if (isOpen) {
      if (initialCustomizations?.stickers && initialCustomizations.stickers.length > 0) {
        const sticker = initialCustomizations.stickers[0]
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
    }
  }, [
    isOpen,
    initialCustomizations?.stickers,
    setSelectedSticker,
    setStickerPosition,
    setStickerSize,
    setStickerRotation,
  ])

  // Add this useEffect to fetch alternative posters
  useEffect(() => {
    const fetchAlternativePosters = async () => {
      if (!media || !media.id) return

      // Only fetch posters for movies and TV shows from TMDB
      if (media.type !== "movie" && media.type !== "tv") {
        setPosters([media.coverImage])
        return
      }

      try {
        setIsLoadingPosters(true)
        const tmdbId = extractTmdbId(media.id)

        if (!tmdbId) {
          setPosters([media.coverImage])
          return
        }

        const response = await fetch(
          `https://api.themoviedb.org/3/${media.type}/${tmdbId}/images?api_key=d4b75df0c793d9efa8f4db9c94430c60`,
        )

        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status}`)
        }

        const data = await response.json()

        // Extract poster paths and convert to full URLs
        const posterUrls = data.posters
          ? data.posters
              .slice(0, 10) // Limit to 10 posters
              .map((poster: any) => `https://image.tmdb.org/t/p/w500${poster.file_path}`)
          : []

        // Always include the original poster first
        if (!posterUrls.includes(media.coverImage)) {
          posterUrls.unshift(media.coverImage)
        }

        setPosters(posterUrls)
      } catch (error) {
        console.error("Error fetching alternative posters:", error)
        setPosters([media.coverImage])
      } finally {
        setIsLoadingPosters(false)
      }
    }

    fetchAlternativePosters()
  }, [media])

  // Add these handlers for carousel navigation
  const nextPoster = useCallback(() => {
    setCurrentPosterIndex((prev) => (prev + 1) % posters.length)
  }, [posters.length])

  const prevPoster = useCallback(() => {
    setCurrentPosterIndex((prev) => (prev - 1 + posters.length) % posters.length)
  }, [posters.length])

  // Update the handleUpdateCustomization function to include the selected poster
  const handleUpdateCustomization = (type: string, value: any) => {
    if (type === "selectedPoster" && posters[currentPosterIndex]) {
      // Update the media object with the selected poster
      if (media) {
        media.coverImage = posters[currentPosterIndex]
      }
    }
    setTempCustomizations((prev) => ({
      ...prev,
      [type]: value,
    }))
  }

  const handleOverlaySelect = (overlay: string) => {
    if (!handleStickerOverlaySelect(overlay)) {
      return // Stop if validation fails
    }
    handleUpdateCustomization("overlay", overlay)
  }

  // Find the handleSaveCustomizations function and update it to include the selected poster
  const handleSaveCustomizations = () => {
    if (media) {
      const stickerData = getStickerData()
      const updatedCustomizations = {
        ...tempCustomizations,
        stickers: stickerData ? [stickerData] : [],
      }

      // Only include customPoster if we're not in bulk mode
      if (!bulkMode && posters[currentPosterIndex]) {
        updatedCustomizations.customPoster = posters[currentPosterIndex]
      }

      // Pass both the customizations and the updated media to the onSave function
      onSave(updatedCustomizations)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-purple-900/90 to-black/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => {
            // Stop propagation to prevent clicks from reaching elements behind the modal
            e.stopPropagation()
          }}
        >
          <motion.div
            className="fixed inset-0 w-full h-full bg-zinc-900/80 backdrop-blur-md flex flex-col overflow-y-auto p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300, delay: 0.1 }}
            onClick={(e) => {
              // Stop propagation to prevent clicks from reaching elements behind the modal
              e.stopPropagation()
            }}
          >
            {/* Sticker Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">
                  Customize {media?.title || "Item"}
                  {bulkMode && bulkCount && (
                    <span className="ml-2 text-sm font-normal text-purple-400">(Applying to {bulkCount} items)</span>
                  )}
                </h2>
                <motion.button
                  className="p-1 rounded-full bg-zinc-800"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              <div className="relative" ref={stickerSearchRef}>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search for stickers to add..."
                      className={cn(
                        "w-full bg-zinc-800/70 border border-zinc-700 hover:border-purple-400 focus:border-purple-500 rounded-full py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors",
                        showStickerWarning && "border-pink-500 animate-pulse",
                      )}
                      value={stickerSearch}
                      onChange={(e) => setStickerSearch(e.target.value)}
                      onFocus={(e) => {
                        if (!showStickerDropdown) {
                          e.target.blur()
                          setShowStickerDropdown(true)
                          setKeyboardEnabled(true)
                        }
                      }}
                      onClick={() => {
                        if (!showStickerDropdown) setShowStickerDropdown(true)
                      }}
                      readOnly={!keyboardEnabled || !showStickerDropdown}
                    />
                    {selectedSticker && (
                      <button
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-red-500"
                        onClick={handleRemoveSticker}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {showStickerWarning && (
                    <div className="mt-2 text-xs text-pink-500 text-center animate-pulse">
                      Please select a sticker first to use the sticker overlay effect
                    </div>
                  )}

                  <AnimatePresence>
                    {showStickerDropdown && (
                      <motion.div
                        className="absolute z-10 mt-2 w-full bg-zinc-800 rounded-xl border border-zinc-700 shadow-xl overflow-hidden"
                        variants={dropdownVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        <div className="grid grid-cols-6 gap-2 p-3 max-h-[50vh] overflow-y-auto">
                          {filteredStickers.map((sticker) => (
                            <motion.button
                              key={sticker.id}
                              className={cn(
                                "flex items-center justify-center text-2xl p-2 rounded-lg hover:bg-zinc-700",
                                selectedSticker === sticker.id && "bg-purple-600",
                              )}
                              {...buttonVariant}
                              onClick={() => handleStickerSelect(sticker.id)}
                            >
                              {sticker.emoji}
                            </motion.button>
                          ))}

                          {/* Additional emojis with descriptions for search */}
                          {[
                            { emoji: "🐐", name: "goat" },
                            { emoji: "😈", name: "devil smiling" },
                            { emoji: "🫥", name: "dotted line face" },
                            { emoji: "🥐", name: "croissant" },
                            { emoji: "🤘", name: "rock on hand" },
                            { emoji: "😷", name: "face with mask" },
                            { emoji: "🤞", name: "crossed fingers" },
                            { emoji: "🤫", name: "shushing face" },
                            { emoji: "🤭", name: "hand over mouth" },
                            { emoji: "🥲", name: "smiling with tear" },
                            { emoji: "🤥", name: "lying face" },
                            { emoji: "🫨", name: "shaking face" },
                            { emoji: "🥶", name: "cold face" },
                            { emoji: "🥵", name: "hot face" },
                            { emoji: "🤯", name: "exploding head" },
                            { emoji: "🥴", name: "woozy face" },
                            { emoji: "😵", name: "dizzy face" },
                            { emoji: "😵‍💫", name: "face with spiral eyes" },
                            { emoji: "🧐", name: "face with monocle" },
                            { emoji: "🤓", name: "nerd face" },
                            { emoji: "🥱", name: "yawning face" },
                            { emoji: "😤", name: "angry face" },
                            { emoji: "☠️", name: "skull and crossbones" },
                            { emoji: "👻", name: "ghost" },
                            { emoji: "👿", name: "angry devil" },
                            { emoji: "👾", name: "alien monster" },
                            { emoji: "💀", name: "skull" },
                            { emoji: "💝", name: "heart with ribbon" },
                            { emoji: "💖", name: "sparkling heart" },
                            { emoji: "❤️‍🔥", name: "heart on fire" },
                            { emoji: "💘", name: "heart with arrow" },
                            { emoji: "💕", name: "two hearts" },
                            { emoji: "💞", name: "revolving hearts" },
                            { emoji: "💥", name: "collision" },
                            { emoji: "💯", name: "hundred points" },
                            { emoji: "💫", name: "dizzy" },
                            { emoji: "👌", name: "ok hand" },
                            { emoji: "🤙", name: "call me hand" },
                            { emoji: "🫰", name: "hand with fingers crossed" },
                            { emoji: "🤏", name: "pinching hand" },
                            { emoji: "👏", name: "clapping hands" },
                            { emoji: "🫶", name: "heart hands" },
                            { emoji: "💅", name: "nail polish" },
                            { emoji: "🦴", name: "bone" },
                            { emoji: "🫦", name: "biting lip" },
                            { emoji: "🦅", name: "eagle" },
                            { emoji: "🦉", name: "owl" },
                            { emoji: "🐌", name: "snail" },
                            { emoji: "🐴", name: "horse" },
                          ]
                            .filter((item) => {
                              // If there's no search query, show all emojis
                              if (!stickerSearch) return true

                              // Search through the name/description
                              return item.name.toLowerCase().includes(stickerSearch.toLowerCase())
                            })
                            .map((item, index) => (
                              <motion.button
                                key={`extra-emoji-${index}`}
                                className="flex items-center justify-center text-2xl p-2 rounded-lg hover:bg-zinc-700"
                                {...buttonVariant}
                                onClick={() => {
                                  // Create a temporary sticker ID for this emoji
                                  const tempStickerId = `temp-sticker-${item.emoji}-${index}`

                                  // Create a new sticker object
                                  const newSticker = {
                                    id: tempStickerId,
                                    emoji: item.emoji,
                                    name: item.name,
                                  }

                                  // First, manually add this emoji to the AVAILABLE_STICKERS array
                                  // This is needed because handleStickerSelect looks for the emoji in this array
                                  const stickerExists = AVAILABLE_STICKERS.some((s) => s.id === tempStickerId)

                                  if (!stickerExists) {
                                    // Add the sticker to the global array (this is a side effect, but necessary for this implementation)
                                    // @ts-ignore - Ignoring readonly property warning
                                    AVAILABLE_STICKERS.push(newSticker)
                                  }

                                  // Now we can select it
                                  handleStickerSelect(tempStickerId)

                                  // Close the dropdown after selection
                                  setShowStickerDropdown(false)
                                }}
                              >
                                {item.emoji}
                              </motion.button>
                            ))}
                        </div>
                        {filteredStickers.length === 0 &&
                          [
                            { emoji: "🐐", name: "goat" },
                            { emoji: "😈", name: "devil smiling" },
                            { emoji: "🫥", name: "dotted line face" },
                            { emoji: "🥐", name: "croissant" },
                            { emoji: "🤘", name: "rock on hand" },
                            { emoji: "😷", name: "face with mask" },
                            { emoji: "🤞", name: "crossed fingers" },
                            { emoji: "🤫", name: "shushing face" },
                            { emoji: "🤭", name: "hand over mouth" },
                            { emoji: "🥲", name: "smiling with tear" },
                            { emoji: "🤥", name: "lying face" },
                            { emoji: "🫨", name: "shaking face" },
                            { emoji: "🥶", name: "cold face" },
                            { emoji: "🥵", name: "hot face" },
                            { emoji: "🤯", name: "exploding head" },
                            { emoji: "🥴", name: "woozy face" },
                            { emoji: "😵", name: "dizzy face" },
                            { emoji: "😵‍💫", name: "face with spiral eyes" },
                            { emoji: "🧐", name: "face with monocle" },
                            { emoji: "🤓", name: "nerd face" },
                            { emoji: "🥱", name: "yawning face" },
                            { emoji: "😤", name: "angry face" },
                            { emoji: "☠️", name: "skull and crossbones" },
                            { emoji: "👻", name: "ghost" },
                            { emoji: "👿", name: "angry devil" },
                            { emoji: "👾", name: "alien monster" },
                            { emoji: "💀", name: "skull" },
                            { emoji: "💝", name: "heart with ribbon" },
                            { emoji: "💖", name: "sparkling heart" },
                            { emoji: "❤️‍🔥", name: "heart on fire" },
                            { emoji: "💘", name: "heart with arrow" },
                            { emoji: "💕", name: "two hearts" },
                            { emoji: "💞", name: "revolving hearts" },
                            { emoji: "💥", name: "collision" },
                            { emoji: "💯", name: "hundred points" },
                            { emoji: "💫", name: "dizzy" },
                            { emoji: "👌", name: "ok hand" },
                            { emoji: "🤙", name: "call me hand" },
                            { emoji: "🫰", name: "hand with fingers crossed" },
                            { emoji: "🤏", name: "pinching hand" },
                            { emoji: "👏", name: "clapping hands" },
                            { emoji: "🫶", name: "heart hands" },
                            { emoji: "💅", name: "nail polish" },
                            { emoji: "🦴", name: "bone" },
                            { emoji: "🫦", name: "biting lip" },
                            { emoji: "🦅", name: "eagle" },
                            { emoji: "🦉", name: "owl" },
                            { emoji: "🐌", name: "horse" },
                            { emoji: "🐴", name: "horse" },
                          ].filter(
                            (item) => !stickerSearch || item.name.toLowerCase().includes(stickerSearch.toLowerCase()),
                          ).length === 0 && <div className="py-4 text-center text-zinc-400">No stickers found</div>}
                        <div className="border-t border-zinc-700 p-2 text-center">
                          <button
                            className="text-sm text-zinc-400 hover:text-white"
                            onClick={() => {
                              setShowStickerDropdown(false)
                              setKeyboardEnabled(false)
                            }}
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sticker Controls */}
              </div>

              {/* Preview Media Card */}
              <div className="flex justify-center my-6 sm:my-8 relative">
                {/* Only show carousel navigation when not in bulk mode and we have multiple posters */}
                {!bulkMode && posters.length > 1 && (
                  <>
                    <motion.button
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 rounded-full p-1 sm:p-2"
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.8)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={prevPoster}
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>

                    <motion.button
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 rounded-full p-1 sm:p-2"
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.8)" }}
                      whileTap={{ scale: 0.9 }}
                      onClick={nextPoster}
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  </>
                )}

                {/* Poster counter - only show when not in bulk mode */}
                {!bulkMode && posters.length > 1 && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800/80 rounded-full px-2 py-0.5 text-xs">
                    {currentPosterIndex + 1} / {posters.length}
                  </div>
                )}

                {/* Loading indicator */}
                {isLoadingPosters && !bulkMode && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10 rounded-xl">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Media card preview */}
                <motion.div
                  className="scale-[1.65] sm:scale-[1.75]"
                  animate={{
                    y: [0, -5, 0],
                    rotate: selectedSticker ? [0, -1, 0, 1, 0] : 0,
                  }}
                  transition={{
                    y: { repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", duration: 2 },
                    rotate: { repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", duration: 5 },
                  }}
                >
                  <MediaCard
                    {...media}
                    coverImage={bulkMode ? media.coverImage : posters[currentPosterIndex] || media.coverImage}
                    customizations={{
                      ...media.customizations,
                      ...tempCustomizations,
                      stickers: selectedSticker
                        ? [
                            {
                              id: selectedSticker,
                              emoji: AVAILABLE_STICKERS.find((s) => s.id === selectedSticker)?.emoji,
                              position: stickerPosition,
                              size: stickerSize,
                              rotation: stickerRotation,
                            },
                          ]
                        : [],
                    }}
                    isCustomizing={true}
                    onRemoveSticker={handleRemoveSticker}
                  />
                </motion.div>
              </div>

              {/* Customization Options */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <span className="w-2 h-6 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full mr-2"></span>
                  Border Effect
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {["none", "pulse", "glow", "neon", "gradient", "glitch"].map((effect) => (
                    <motion.button
                      key={effect}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm capitalize relative overflow-hidden",
                        tempCustomizations.borderEffect === effect
                          ? "bg-purple-600 text-white"
                          : "bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700/70",
                      )}
                      {...buttonVariant}
                      onClick={() => handleUpdateCustomization("borderEffect", effect)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {tempCustomizations.borderEffect === effect && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: -100 }}
                          animate={{ x: 200 }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                        />
                      )}
                      {effect}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <span className="w-2 h-6 bg-gradient-to-b from-pink-400 to-purple-500 rounded-full mr-2"></span>
                  Overlay Effect
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {["none", "hearts", "sparkles", "shimmer", "retro", "pixelated", "Gold", "confetti", "sticker"].map(
                    (overlay) => (
                      <motion.button
                        key={overlay}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm capitalize relative overflow-hidden",
                          tempCustomizations.overlay === overlay
                            ? "bg-purple-600 text-white"
                            : "bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700/70",
                          overlay === "sticker" && shakeStickerButton && "animate-shake",
                        )}
                        {...buttonVariant}
                        onClick={() => handleOverlaySelect(overlay)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {tempCustomizations.overlay === overlay && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: -100 }}
                            animate={{ x: 200 }}
                            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                          />
                        )}
                        {overlay}
                      </motion.button>
                    ),
                  )}
                </div>
              </motion.div>

              <div className="flex justify-end gap-3 mt-auto pb-4 sm:pb-0">
                <motion.button
                  className="px-6 py-2.5 rounded-full bg-zinc-800/80 text-white border border-zinc-700/50"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(63, 63, 70, 0.8)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/20"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(168,85,247,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveCustomizations}
                >
                  Save
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
