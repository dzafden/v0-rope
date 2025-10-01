"use client"

import type React from "react"

import { useState, useRef } from "react"

// Available stickers - moved from the components to the hook
export const AVAILABLE_STICKERS = [
  { id: "thumbs-up", emoji: "👍", name: "thumbs up" },
  { id: "thumbs-down", emoji: "👎", name: "thumbs down" },
  { id: "skull", emoji: "💀", name: "skull" },
  { id: "joy", emoji: "😂", name: "joy" },
  { id: "poop", emoji: "💩", name: "poop" },
  { id: "party", emoji: "🎉", name: "party" },
  { id: "gun", emoji: "🔫", name: "gun" },
  { id: "heart", emoji: "❤️", name: "heart" },
  { id: "soup", emoji: "🍲", name: "soup" },
  { id: "rain", emoji: "🌧️", name: "rain" },
  { id: "sun", emoji: "☀️", name: "sun" },
  { id: "star", emoji: "⭐", name: "star" },
  { id: "bomb", emoji: "💣", name: "bomb" },
  { id: "fire", emoji: "🔥", name: "fire" },
  { id: "trophy", emoji: "🏆", name: "trophy" },
  { id: "eggplant", emoji: "🍆", name: "eggplant" },
  { id: "tea", emoji: "🍵", name: "tea" },
  { id: "coffee", emoji: "☕", name: "coffee" },
  { id: "hamburger", emoji: "🍔", name: "hamburger" },
  { id: "candy", emoji: "🍬", name: "candy" },
  { id: "zombie", emoji: "🧟", name: "zombie" },
  { id: "rainbow", emoji: "🌈", name: "rainbow" },
  { id: "alien", emoji: "👽", name: "alien" },
  { id: "peach", emoji: "🍑", name: "peach" },
  { id: "cake", emoji: "🎂", name: "cake" },
  { id: "glasses", emoji: "👓", name: "glasses" },
  { id: "palm", emoji: "🌴", name: "palm" },
  { id: "wave", emoji: "🌊", name: "wave" },
  { id: "eyeroll", emoji: "🙄", name: "eyeroll" },
  { id: "hearteyed", emoji: "😍", name: "hearteyed" },
  { id: "starryeyed", emoji: "🤩", name: "starryeyed" },
]

export interface StickerData {
  id: string
  emoji: string
  position: { x: number; y: number }
  size: number
  rotation: number
}

export interface UseStickerCustomizationProps {
  initialSticker?: StickerData | null
}

export interface UseStickerCustomizationReturn {
  selectedSticker: string | null
  stickerPosition: { x: number; y: number }
  stickerSize: number
  stickerRotation: number
  showStickerDropdown: boolean
  stickerSearch: string
  keyboardEnabled: boolean
  showStickerWarning: boolean
  shakeStickerButton: boolean
  stickerSearchRef: React.RefObject<HTMLDivElement>
  filteredStickers: typeof AVAILABLE_STICKERS
  setSelectedSticker: (stickerId: string | null) => void
  setStickerPosition: (position: { x: number; y: number }) => void
  setStickerSize: (size: number) => void
  setStickerRotation: (rotation: number) => void
  setShowStickerDropdown: (show: boolean) => void
  setStickerSearch: (search: string) => void
  setKeyboardEnabled: (enabled: boolean) => void
  handleStickerSelect: (stickerId: string) => void
  handleRemoveSticker: () => void
  handleOverlaySelect: (overlay: string) => void
  getStickerData: () => StickerData | null
}

export function useStickerCustomization(props: UseStickerCustomizationProps = {}): UseStickerCustomizationReturn {
  // Extract initial sticker data if provided
  const initialSticker = props.initialSticker

  // State for sticker customization
  const [selectedSticker, setSelectedSticker] = useState<string | null>(initialSticker?.id || null)
  const [stickerPosition, setStickerPosition] = useState(initialSticker?.position || { x: 50, y: 50 })
  const [stickerSize, setStickerSize] = useState(initialSticker?.size || 40)
  const [stickerRotation, setStickerRotation] = useState(initialSticker?.rotation || 0)
  const [showStickerDropdown, setShowStickerDropdown] = useState(false)
  const [stickerSearch, setStickerSearch] = useState("")
  const [keyboardEnabled, setKeyboardEnabled] = useState(false)
  const [showStickerWarning, setShowStickerWarning] = useState(false)
  const [shakeStickerButton, setShakeStickerButton] = useState(false)
  const stickerSearchRef = useRef<HTMLDivElement>(null)

  // Filter stickers based on search
  const filteredStickers = stickerSearch
    ? AVAILABLE_STICKERS.filter((s) => s.name.includes(stickerSearch.toLowerCase()))
    : AVAILABLE_STICKERS

  // Handle sticker selection
  const handleStickerSelect = (stickerId: string) => {
    const stickerData = AVAILABLE_STICKERS.find((s) => s.id === stickerId)

    if (stickerData) {
      setSelectedSticker(stickerId)
      // Reset position, size and rotation to defaults
      setStickerPosition({ x: 50, y: 50 })
      setStickerSize(40)
      setStickerRotation(0)
    }

    setShowStickerDropdown(false)
  }

  // Handle removing sticker
  const handleRemoveSticker = () => {
    setSelectedSticker(null)
  }

  // Handle overlay selection with sticker validation
  const handleOverlaySelect = (overlay: string) => {
    // If selecting "sticker" overlay but no sticker is selected, show warning
    if (overlay === "sticker" && !selectedSticker) {
      setShowStickerWarning(true)
      setShakeStickerButton(true)

      // Reset shake animation after it completes
      setTimeout(() => {
        setShakeStickerButton(false)
      }, 500)

      // Reset warning after a few seconds
      setTimeout(() => {
        setShowStickerWarning(false)
      }, 3000)
      return false
    }

    // Return true to indicate successful overlay selection
    return true
  }

  // Get current sticker data in a format ready for saving
  const getStickerData = (): StickerData | null => {
    if (!selectedSticker) return null

    const stickerData = AVAILABLE_STICKERS.find((s) => s.id === selectedSticker)
    if (!stickerData) return null

    return {
      id: selectedSticker,
      emoji: stickerData.emoji,
      position: stickerPosition,
      size: stickerSize,
      rotation: stickerRotation,
    }
  }

  return {
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
    handleOverlaySelect,
    getStickerData,
  }
}
