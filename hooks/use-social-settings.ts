"use client"

import { useState, useEffect } from "react"
import storage from "@/lib/storage"

const SOCIAL_ENABLED_KEY = "socialFeaturesEnabled"

export function useSocialSettings() {
  const [showSocial, setShowSocial] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preference from storage on mount
  useEffect(() => {
    try {
      const savedPreference = storage.get<boolean>(SOCIAL_ENABLED_KEY, true)
      setShowSocial(savedPreference)
    } catch (error) {
      console.error("Error loading social settings:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save preference to storage when changed
  const toggleSocial = (enabled?: boolean) => {
    const newValue = enabled !== undefined ? enabled : !showSocial
    setShowSocial(newValue)
    try {
      storage.set(SOCIAL_ENABLED_KEY, newValue)
    } catch (error) {
      console.error("Error saving social settings:", error)
    }
  }

  return {
    showSocial,
    toggleSocial,
    isLoaded,
  }
}
