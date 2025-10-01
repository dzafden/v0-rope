"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertCircle, Link } from "lucide-react"

interface ProfilePictureEditorProps {
  profilePicture: string | null
  setProfilePicture: (url: string | null) => void
  profileBorderEffect: "none" | "pulse" | "glow" | "rainbow"
}

export default function ProfilePictureEditor({
  profilePicture,
  setProfilePicture,
  profileBorderEffect,
}: ProfilePictureEditorProps) {
  const [pictureUrl, setPictureUrl] = useState(profilePicture || "")
  const [error, setError] = useState("")
  const [isUrlMode, setIsUrlMode] = useState(true)

  // Get border class based on selected effect
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

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPictureUrl(e.target.value)
    setError("")
  }

  const handleUrlSubmit = () => {
    if (!pictureUrl.trim()) {
      setProfilePicture(null)
      return
    }

    // Basic URL validation
    try {
      new URL(pictureUrl)
      setProfilePicture(pictureUrl)
      setError("")
    } catch (e) {
      setError("Please enter a valid URL")
    }
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">Profile Picture</label>
      <div className="flex flex-col items-center">
        <div className={`w-32 h-32 rounded-full mb-4 overflow-hidden ${getProfileBorderClass()}`}>
          {profilePicture ? (
            <img
              src={profilePicture || "/placeholder.svg"}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={() => {
                setError("Image failed to load. Please check the URL.")
                // Don't clear the profile picture here to allow user to fix the URL
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-4xl">👾</span>
            </div>
          )}
        </div>

        <div className="w-full space-y-3">
          <div className="relative">
            <div className="flex items-center">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="url"
                value={pictureUrl}
                onChange={handleUrlChange}
                placeholder="Enter image URL"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pl-10 pr-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <motion.button
              className="px-4 py-2 rounded-full bg-purple-600 text-white flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUrlSubmit}
            >
              <span>Set Profile Picture</span>
            </motion.button>
          </div>

          {error && (
            <div className="mt-2 text-red-500 text-sm flex items-center justify-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span>{error}</span>
            </div>
          )}

          <p className="mt-2 text-xs text-zinc-400 text-center">
            Enter the URL of an image to use as your profile picture
          </p>
        </div>
      </div>
    </div>
  )
}
