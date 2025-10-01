"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import storage from "@/lib/storage"

interface OnboardingContextType {
  showCollectionNotification: boolean
  setShowCollectionNotification: (show: boolean) => void
  hasSeenCollection: boolean
  setHasSeenCollection: (seen: boolean) => void
  excludedTitles: string[]
  addExcludedTitle: (titleId: string) => void
  addMultipleExcludedTitles: (titleIds: string[]) => void
  resetExcludedTitles: () => void
  getExcludedTitlesCount: () => number
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showCollectionNotification, setShowCollectionNotification] = useState(false)
  const [hasSeenCollection, setHasSeenCollection] = useState(false)
  const [excludedTitles, setExcludedTitles] = useState<string[]>([])

  useEffect(() => {
    try {
      const seen = storage.get<boolean>("hasSeenCollection", false)
      setHasSeenCollection(seen)

      const onboardingCompleted = storage.get<boolean>("onboardingCompleted", false)
      if (onboardingCompleted && !seen) {
        setShowCollectionNotification(true)
      }

      const savedExcludedTitles = storage.get<string[]>("excludedTitles", [])
      setExcludedTitles(savedExcludedTitles)
    } catch (error) {
      console.error("Error loading onboarding state:", error)
    }
  }, [])

  useEffect(() => {
    try {
      storage.set("hasSeenCollection", hasSeenCollection)
      if (hasSeenCollection) {
        setShowCollectionNotification(false)
      }
    } catch (error) {
      console.error("Error saving onboarding state:", error)
    }
  }, [hasSeenCollection])

  const addExcludedTitle = useCallback((titleId: string) => {
    setExcludedTitles((prev) => {
      if (!prev.includes(titleId)) {
        const updated = [...prev, titleId]
        try {
          storage.set("excludedTitles", updated)
        } catch (error) {
          console.error("Error saving excluded titles:", error)
        }
        return updated
      }
      return prev
    })
  }, [])

  const addMultipleExcludedTitles = useCallback((titleIds: string[]) => {
    setExcludedTitles((prev) => {
      const newTitles = titleIds.filter((id) => !prev.includes(id))
      if (newTitles.length === 0) return prev
      const updated = [...prev, ...newTitles]
      try {
        storage.set("excludedTitles", updated)
      } catch (error) {
        console.error("Error saving excluded titles:", error)
      }
      return updated
    })
  }, [])

  const resetExcludedTitles = useCallback(() => {
    setExcludedTitles([])
    try {
      storage.set("excludedTitles", [])
    } catch (error) {
      console.error("Error resetting excluded titles:", error)
    }
  }, [])

  const getExcludedTitlesCount = useCallback(() => excludedTitles.length, [excludedTitles])

  return (
    <OnboardingContext.Provider
      value={{
        showCollectionNotification,
        setShowCollectionNotification,
        hasSeenCollection,
        setHasSeenCollection,
        excludedTitles,
        addExcludedTitle,
        addMultipleExcludedTitles,
        resetExcludedTitles,
        getExcludedTitlesCount,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
