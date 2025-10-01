"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useState, useEffect } from "react"
import { OverlayEffects, Star } from "./overlays"

interface ExpandedCardViewProps {
  isOpen: boolean
  onClose: () => void
  title: string
  coverImage: string
  type: "movie" | "tv" | "book"
  rating?: number
  customizations?: {
    borderEffect?: "pulse" | "glow" | "rainbow" | "neon" | "gradient" | "glitch" | "none"
    stickers?: Array<{
      id: string
      emoji: string
      position: { x: number; y: number }
      size?: number
      rotation?: number
    }>
    overlay?:
      | "hearts"
      | "stars"
      | "sparkles"
      | "shimmer"
      | "Gold"
      | "retro"
      | "pixelated"
      | "confetti"
      | "sticker"
      | "none"
  }
}

export default function ExpandedCardView({
  isOpen,
  onClose,
  title,
  coverImage,
  type,
  rating,
  customizations = {
    borderEffect: "none",
    stickers: [],
    overlay: "none",
  },
}: ExpandedCardViewProps) {
  // State to track if the animation has completed
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)

  // Reset animation state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsAnimationComplete(false)
      }, 300)
    }
  }, [isOpen])

  // Get border class based on customizations
  const getBorderClass = () => {
    switch (customizations?.borderEffect) {
      case "pulse":
        return "animate-pulse border-2 border-pink-500"
      case "glow":
        return "border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]"
      case "rainbow":
        return "border-2 border-transparent bg-gradient-to-r from-red-500 via-orange-400 via-yellow-400 via-green-500 via-blue-500 to-purple-600 p-[2px]"
      case "neon":
        return "border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)] animate-[pulse_2s_ease-in-out_infinite]"
      case "gradient":
        return "border-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-[2px] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-teal-400 before:via-purple-600 before:to-orange-400 before:opacity-70 before:mix-blend-overlay before:animate-[gradient_5s_ease_infinite_reverse] before:bg-[length:200%_200%] after:absolute after:inset-0 after:bg-gradient-to-r after:from-purple-500 after:via-pink-500 after:to-blue-500 after:animate-[gradient_3s_ease_infinite] after:bg-[length:200%_200%]"
      case "glitch":
        return "border-2 relative animate-[glitch_3s_ease-in-out_infinite] before:absolute before:inset-0 before:border-2 before:border-[#0ff] before:animate-[glitch_2.5s_ease-in-out_infinite_0.2s] after:absolute after:inset-0 after:border-2 after:border-[#f0f] after:animate-[glitch_3.5s_ease-in-out_infinite_0.1s] border-[#AFE3C0] shadow-[0_0_8px_rgba(255,255,255,0.3)]"
      default:
        return "border border-zinc-700"
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop with blur effect */}
          <>
            <motion.div
              className="absolute inset-0 bg-black/90 backdrop-blur-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Share button */}
            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[70]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium shadow-lg flex items-center gap-2"
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(168, 85, 247, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation()

                  // Create a fallback message
                  const shareMessage = `Check out ${title} (${type})!`

                  // Check if Web Share API is available
                  if (navigator.share) {
                    try {
                      navigator
                        .share({
                          title: title,
                          text: shareMessage,
                        })
                        .catch((err) => {
                          console.log("Error sharing:", err)
                          // Fallback for when sharing fails
                          if (navigator.clipboard) {
                            navigator.clipboard
                              .writeText(shareMessage)
                              .then(() => alert("Share text copied to clipboard!"))
                              .catch(() => alert("Unable to share. Try taking a screenshot instead."))
                          } else {
                            alert("Sharing not supported. Try taking a screenshot instead.")
                          }
                        })
                    } catch (err) {
                      console.log("Share API error:", err)
                      alert("Unable to share. Try taking a screenshot instead.")
                    }
                  } else {
                    // Fallback for browsers that don't support Web Share API
                    if (navigator.clipboard) {
                      navigator.clipboard
                        .writeText(shareMessage)
                        .then(() => alert("Share text copied to clipboard!"))
                        .catch(() => alert("Unable to share. Try taking a screenshot instead."))
                    } else {
                      alert("Sharing not supported. Try taking a screenshot instead.")
                    }
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
                Share to Stories
              </motion.button>
            </motion.div>
          </>

          {/* Close button */}
          <motion.button
            className="absolute top-4 right-4 z-[70] w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
          >
            <X className="w-4 h-4 text-white" />
          </motion.button>

          {/* Card container */}
          <motion.div
            className={`relative z-[65] w-[85%] max-w-[400px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ${getBorderClass()}`}
            initial={{ scale: 0.5, y: 100, opacity: 0 }}
            animate={{
              scale: 1,
              y: 0,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                onComplete: () => setIsAnimationComplete(true),
              },
            }}
            exit={{ scale: 0.5, y: 100, opacity: 0 }}
          >
            {/* Card image */}
            <div className="absolute inset-0 w-full h-full">
              <img src={coverImage || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

              {/* Customization overlays */}
              <OverlayEffects customizations={customizations} />

              {/* Sticker overlays */}
              {customizations?.stickers?.map((sticker) => (
                <motion.div
                  key={sticker.id}
                  className="absolute"
                  style={{
                    left: `${sticker.position.x}%`,
                    top: `${sticker.position.y}%`,
                    transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg)`,
                    willChange: "transform, opacity",
                  }}
                >
                  <div className="text-4xl">{sticker.emoji}</div>
                </motion.div>
              ))}
            </div>

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Type badge */}
              <div className="absolute top-4 left-4 bg-black/70 rounded-full px-3 py-1 text-xs">
                {type === "movie" && "🎬 Movie"}
                {type === "tv" && "📺 TV Show"}
                {type === "book" && "📚 Book"}
              </div>

              {/* Rating badge */}
              {rating && rating > 0 && (
                <div className="absolute top-4 right-4 bg-black/70 rounded-full px-3 py-1 text-xs flex items-center">
                  <Star className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" />
                  <span>{rating.toFixed(1)}</span>
                </div>
              )}

              {/* Title */}
              <motion.h2
                className="text-2xl font-bold text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: isAnimationComplete ? 1 : 0,
                  y: isAnimationComplete ? 0 : 20,
                }}
                transition={{ delay: 0.2 }}
              >
                {title}
              </motion.h2>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
