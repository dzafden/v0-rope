"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { motion, useDragControls } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCardAnimation } from "@/hooks/use-card-animation"
import { useMobile } from "@/hooks/use-mobile"
import TagDropdown from "./tag-dropdown"
import { useMedia } from "@/context/media-context"
import ConfirmDialog from "./confirm-dialog"
import { OverlayEffects, Star } from "./overlays"

export type MediaType = "movie" | "tv" | "book"

export interface MediaCardProps {
  id: string
  title: string
  coverImage: string
  type: "movie" | "tv" | "book"
  overview?: string
  rating?: number
  releaseDate?: string
  isInCollection?: boolean
  addedAt?: number
  customizations?: {
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
  className?: string
  onCustomize?: () => void
  showHideButton?: boolean
  showTagsButton?: boolean
  onShowDetails?: () => void
  isActive?: boolean
  onActivate?: () => void
  isCustomizing?: boolean
  onRemoveSticker?: () => void
}

// Standard card dimensions with 2:3 aspect ratio (like trading cards)
const CARD_WIDTH = 120 // Reduced from 140 to 120
const CARD_HEIGHT = 180 // Reduced from 210 to 180
const CARD_WIDTH_SM = 150 // Reduced from 160 to 150
const CARD_HEIGHT_SM = 225 // Reduced from 240 to 225

export default function MediaCard({
  id,
  title,
  coverImage,
  type,
  overview,
  rating,
  releaseDate,
  isInCollection = false,
  customizations = {
    borderEffect: "none",
    stickers: [],
    overlay: "none",
  },
  onAddToCollection,
  onCustomize,
  isCustomizing = false,
  onUpdateStickerPosition,
  onRemoveSticker,
  hideItem,
  showTagsButton,
  showHideButton,
  showDetailsButton = true,
  onShowDetails,
  className,
  isActive = false,
  onActivate,
  priority,
}: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [hoveredStickerId, setHoveredStickerId] = useState<string | null>(null)
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [tagButtonPosition, setTagButtonPosition] = useState({ x: 0, y: 0 })
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()
  const isMobile = useMobile()
  const { hideItem: contextHideItem, removeFromCollection } = useMedia()
  const { ref, controls } = useCardAnimation()

  // At the beginning of the MediaCard component, add this logic to use the customized poster if available
  const displayImage = customizations?.customPoster || coverImage

  // Choose border style based on customizations
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

  const handleImageError = () => setImageError(true)
  const startDrag = (e: any) => dragControls.start(e)
  const handleTap = (e: any) => {
    // Prevent default behavior to avoid any browser-specific handling
    e.preventDefault()

    // Stop propagation to prevent parent elements from capturing the event
    e.stopPropagation()

    // Only trigger details if we're not in customizing mode and we have a handler
    if (!isCustomizing && onShowDetails) {
      // Small delay to ensure the tap is registered as intentional
      setTimeout(() => {
        onShowDetails()
      }, 10)
    }
  }

  const handleHideItem = (e: any) => {
    e.stopPropagation()
    hideItem ? hideItem() : id && contextHideItem(id)
  }

  const handleTagsClick = (e: any) => {
    e.stopPropagation()
    setTagButtonPosition({ x: e.clientX, y: e.clientY })
    setShowTagDropdown(!showTagDropdown)
  }

  const handleRemoveClick = (e: any) => {
    e.stopPropagation()
    setShowRemoveConfirm(true)
  }

  const handleConfirmRemove = () => {
    id && removeFromCollection(id)
    setShowRemoveConfirm(false)
  }

  return (
    <motion.div
      ref={(el) => {
        ref(el)
        cardRef.current = el
      }}
      className={cn(
        "perspective-1000 w-[120px] sm:w-[150px] h-[180px] sm:h-[225px] mx-1 sm:mx-2 my-2",
        "flex-shrink-0",
        className,
      )}
      style={{
        aspectRatio: "2/3",
        width: isMobile ? CARD_WIDTH : CARD_WIDTH_SM,
        height: isMobile ? CARD_HEIGHT : CARD_HEIGHT_SM,
      }}
      animate={controls.animate}
      transition={controls.transition}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onTap={handleTap}
      onTapStart={(e) => e.stopPropagation()}
      onClick={(e) => {
        // Backup click handler for devices that don't properly support tap
        if (!isCustomizing && onShowDetails) {
          e.preventDefault()
          e.stopPropagation()
          onShowDetails()
        }
      }}
    >
      <motion.div
        className={cn(
          "relative w-full h-full rounded-xl overflow-hidden transform-style-3d shadow-xl",
          getBorderClass(),
        )}
      >
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={imageError ? "/placeholder.svg?height=240&width=160" : customizations?.customPoster || coverImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 120px, 150px"
            className={cn(
              "object-cover transition-all duration-300",
              isActive && "brightness-50",
              customizations?.borderEffect === "pulse" && "animate-border-pulse",
              customizations?.borderEffect === "glow" && "animate-border-glow",
              customizations?.borderEffect === "rainbow" && "animate-border-rainbow",
              customizations?.borderEffect === "neon" && "animate-border-neon",
              customizations?.borderEffect === "gradient" && "animate-border-gradient",
              customizations?.borderEffect === "glitch" && "animate-border-glitch",
            )}
            onError={() => setImageError(true)}
            priority={priority}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-xs font-medium truncate">
            {title}
          </div>
          <div className="absolute top-2 left-2 bg-black/70 rounded-full px-2 py-1 text-xs">
            {type === "movie" && "🎬"}
            {type === "tv" && "📺"}
            {type === "book" && "📚"}
          </div>
          {rating && rating > 0 && (
            <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 text-xs flex items-center">
              <Star className="w-3 h-3 text-yellow-400 mr-1" />
              {rating.toFixed(1)}
            </div>
          )}

          {/* Render Sticker Overlays */}
          {customizations?.stickers?.map((sticker) => {
            const cardWidth = cardRef.current?.offsetWidth || 160
            const stickerSizePx = ((sticker.size || 40) / 100) * cardWidth
            return (
              <motion.div
                key={sticker.id}
                className="absolute cursor-move"
                style={{
                  left: `${sticker.position.x}%`,
                  top: `${sticker.position.y}%`,
                  width: `${stickerSizePx}px`,
                  height: `${stickerSizePx}px`,
                  transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg)`,
                  willChange: "transform, opacity",
                }}
                drag={isCustomizing}
                dragControls={dragControls}
                dragMomentum={false}
                dragConstraints={cardRef}
                onDragEnd={(e, info) => {
                  if (cardRef.current && onUpdateStickerPosition) {
                    const rect = cardRef.current.getBoundingClientRect()
                    const newX = ((info.point.x - rect.left) / rect.width) * 100
                    const newY = ((info.point.y - rect.top) / rect.height) * 100
                    onUpdateStickerPosition(sticker.id, { x: newX, y: newY })
                  }
                }}
                onPointerDown={startDrag}
                onHoverStart={() => setHoveredStickerId(sticker.id)}
                onHoverEnd={() => setHoveredStickerId(null)}
              >
                <div className="flex items-center justify-center w-full h-full text-4xl">{sticker.emoji}</div>
                {hoveredStickerId === sticker.id && isCustomizing && (
                  <motion.button
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveSticker && onRemoveSticker(sticker.id)
                    }}
                  >
                    <X className="w-3 h-3 text-white" />
                  </motion.button>
                )}
              </motion.div>
            )
          })}

          {/* Overlay Effects */}
          <OverlayEffects customizations={customizations} />

          {showTagDropdown && (
            <TagDropdown
              itemId={id}
              mediaType={type}
              onClose={() => setShowTagDropdown(false)}
              position={tagButtonPosition}
            />
          )}

          {showRemoveConfirm && (
            <ConfirmDialog
              message="Remove from your collection?"
              onConfirm={handleConfirmRemove}
              onCancel={() => setShowRemoveConfirm(false)}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
