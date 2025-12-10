"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { Tag, Plus, Check, X } from "lucide-react"
import { useMedia } from "@/context/media-context"
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"

interface TagDropdownProps {
  itemId: string
  mediaType: "movie" | "tv" | "book"
  onClose: () => void
  position: { x: number; y: number }
}

// Reusable motion variants
const containerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

const buttonVariants = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
}

export default function TagDropdown({ itemId, mediaType, onClose, position }: TagDropdownProps) {
  const { getAllTags, getItemTags, addTagToItem, removeTagFromItem, createTag } = useMedia()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState("")
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: position.y, left: position.x })

  const allTags = getAllTags()

  // Filter tags based on media type
  const relevantTags = useMemo(() => {
    return allTags.filter((tag) => {
      if (tag.isCustom) return true
      if (mediaType === "movie" || mediaType === "tv") {
        return tag.id === "watched" || tag.id === "want-to-watch"
      }
      if (mediaType === "book") {
        return tag.id === "read" || tag.id === "want-to-read"
      }
      return true
    })
  }, [allTags, mediaType])

  // Initialize selected tags from context
  useEffect(() => {
    const currentTags = getItemTags(itemId)
    setSelectedTags(currentTags)
  }, [itemId, getItemTags])

  // Focus the input when adding a new tag
  useEffect(() => {
    if (isAddingTag && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAddingTag])

  // Recalculate dropdown position when click position changes
  useEffect(() => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      let top = position.y
      let left = position.x
      const dropdownWidth = rect.width
      const dropdownHeight = rect.height
      const safetyMargin = 20

      if (top + dropdownHeight + safetyMargin > viewportHeight) {
        top = Math.max(safetyMargin, position.y - dropdownHeight)
      }
      if (top < safetyMargin) top = safetyMargin
      if (left + dropdownWidth + safetyMargin > viewportWidth) {
        left = Math.max(safetyMargin, position.x - dropdownWidth)
      }
      if (left < safetyMargin) left = safetyMargin
      setDropdownPosition({ top, left })
    }
  }, [position])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  // Memoize style for the portal container
  const dropdownStyle = useMemo(
    () => ({
      top: `${dropdownPosition.top}px`,
      left: `${dropdownPosition.left}px`,
      maxHeight: "80vh",
      transform: "translateZ(0)",
    }),
    [dropdownPosition],
  )

  // Toggle tag selection – wrapped in useCallback
  const toggleTag = useCallback(
    (tagId: string) => {
      if (selectedTags.includes(tagId)) {
        setSelectedTags((prev) => prev.filter((id) => id !== tagId))
        removeTagFromItem(itemId, tagId)
      } else {
        setSelectedTags((prev) => [...prev, tagId])
        addTagToItem(itemId, tagId)
      }
    },
    [selectedTags, addTagToItem, removeTagFromItem, itemId],
  )

  // Handle creating a new tag – wrapped in useCallback
  const handleCreateTag = useCallback(() => {
    const trimmed = newTagName.trim()
    if (!trimmed) {
      setError("Tag name cannot be empty")
      return
    }
    if (trimmed.length > 40) {
      setError("Tag name must be 40 characters or less")
      return
    }
    const tagId = createTag(trimmed)
    if (tagId) {
      addTagToItem(itemId, tagId)
      setSelectedTags((prev) => [...prev, tagId])
      setNewTagName("")
      setIsAddingTag(false)
      setError("")
    } else {
      const customTagCount = allTags.filter((tag) => tag.isCustom).length
      setError(
        customTagCount >= 10 ? "You can only create up to 10 custom tags" : "A tag with this name already exists",
      )
    }
  }, [newTagName, createTag, addTagToItem, itemId, allTags])

  return typeof document !== "undefined"
    ? createPortal(
        <motion.div
          ref={dropdownRef}
          className="fixed z-[100] w-64 bg-zinc-900 rounded-xl border border-zinc-700 shadow-xl overflow-hidden"
          style={dropdownStyle}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="p-3 border-b border-zinc-800">
            <h3 className="text-sm font-medium flex items-center">
              <Tag className="w-4 h-4 mr-2 text-teal-400" />
              Manage Tags
            </h3>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {relevantTags.map((tag) => (
              <motion.button
                key={tag.id}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1",
                  selectedTags.includes(tag.id) ? "bg-teal-900/30 text-teal-200" : "hover:bg-zinc-800 text-zinc-300",
                )}
                {...buttonVariants}
                onClick={() => toggleTag(tag.id)}
              >
                <span>{tag.name}</span>
                {selectedTags.includes(tag.id) && <Check className="w-4 h-4 text-teal-400" />}
              </motion.button>
            ))}
            {isAddingTag ? (
              <div className="mt-2 p-2 bg-zinc-800 rounded-lg">
                <div className="flex items-center mb-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name (max 40 chars)"
                    className="flex-1 bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                    maxLength={40}
                  />
                  <button className="ml-1 p-1 rounded-lg bg-teal-600 text-white" onClick={handleCreateTag}>
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    className="ml-1 p-1 rounded-lg bg-zinc-700 text-zinc-300"
                    onClick={() => {
                      setIsAddingTag(false)
                      setNewTagName("")
                      setError("")
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
              </div>
            ) : (
              <motion.button
                className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm mt-2 bg-zinc-800 text-zinc-300"
                {...buttonVariants}
                onClick={() => setIsAddingTag(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                <span>Create New Tag</span>
              </motion.button>
            )}
          </div>
          <div className="p-2 border-t border-zinc-800 flex justify-end">
            <motion.button
              className="px-3 py-1 rounded-lg text-xs bg-zinc-800 text-zinc-300"
              {...buttonVariants}
              onClick={onClose}
            >
              Close
            </motion.button>
          </div>
        </motion.div>,
        document.body,
      )
    : null
}
