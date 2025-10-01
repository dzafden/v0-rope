"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { MediaProvider } from "@/context/media-context"
import { ThemeProvider } from "@/components/theme-provider"
import { initAnimationSettings } from "@/hooks/use-card-animation"
import Onboarding from "@/components/onboarding"
import SplashScreen from "@/components/splash-screen"
// Import the OnboardingProvider at the top of the file
import { OnboardingProvider } from "@/context/onboarding-context"
// Update the import to use default import
import storage from "@/lib/storage"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Add state to track if splash screen should be shown
  const [showSplashScreen, setShowSplashScreen] = useState(false)
  // Add state to track if app is ready to render
  const [isAppReady, setIsAppReady] = useState(false)

  // Initialize animation settings and preload data on app load
  useEffect(() => {
    initAnimationSettings()

    // Check if user has seen splash screen before
    const hasSeenSplashScreen = storage.get<boolean>("hasSeenSplashScreen", false)

    if (!hasSeenSplashScreen) {
      setShowSplashScreen(true)
    } else {
      // If splash screen has been seen, mark app as ready immediately
      setIsAppReady(true)
    }
  }, [])

  // Handle splash screen completion
  const handleSplashScreenComplete = () => {
    localStorage.setItem("hasSeenSplashScreen", "true")
    setShowSplashScreen(false)
    // Mark app as ready to render
    setIsAppReady(true)
  }

  // If splash screen should be shown, render it
  if (showSplashScreen) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark">
        <MediaProvider>
          <SplashScreen onComplete={handleSplashScreenComplete} />
        </MediaProvider>
      </ThemeProvider>
    )
  }

  // Only render the app content when it's ready
  if (!isAppReady) {
    // Return a minimal loading state instead of nothing
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Keep the OnboardingProvider here to wrap the main app content
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <OnboardingProvider>
        <MediaProvider>
          <Onboarding />
          {children}
        </MediaProvider>
      </OnboardingProvider>
    </ThemeProvider>
  )
}
