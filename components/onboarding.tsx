"use client"

import { useState, useEffect } from "react"
import OnboardingGame from "./onboarding-game"
import { OnboardingProvider } from "@/context/onboarding-context"
// Update the import to use default import
import storage from "@/lib/storage"

export default function Onboarding() {
  const [isOnboarded, setIsOnboarded] = useState(false)
  // Update the onboarding component to ensure it's properly integrated with the app

  // Make sure we show the onboarding only once by default
  const [showOnboarding, setShowOnboarding] = useState(true)

  // Update the useEffect to check for splash screen completion
  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingCompleted = storage.get<boolean>("onboardingCompleted", false)
    const hasSeenSplashScreen = storage.get<boolean>("hasSeenSplashScreen", false)

    // Only show onboarding if splash screen has been seen but onboarding hasn't been completed
    if (onboardingCompleted === true) {
      setIsOnboarded(true)
      setShowOnboarding(false)
    } else if (hasSeenSplashScreen === true) {
      setShowOnboarding(true)
    } else {
      setShowOnboarding(false)
    }
  }, [])

  // Make sure the onboarding component is properly marked as completed
  const handleOnboardingComplete = () => {
    storage.set("onboardingCompleted", true)
    setIsOnboarded(true)
    setShowOnboarding(false)
  }

  if (isOnboarded || !showOnboarding) {
    return null
  }

  // Wrap OnboardingGame with OnboardingProvider to fix the context error
  return (
    <OnboardingProvider>
      <OnboardingGame onComplete={handleOnboardingComplete} />
    </OnboardingProvider>
  )
}
