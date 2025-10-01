"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import OnboardingGame from "./onboarding-game"
import { MediaProvider } from "@/context/media-context" // Import MediaProvider
import { OnboardingProvider } from "@/context/onboarding-context" // Import OnboardingProvider
// Update the import to use default import
import storage from "@/lib/storage"

// Border effects for random application to cards
const BORDER_EFFECTS = [
  "border-2 border-pink-500 animate-pulse",
  "border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]",
  "border-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 p-[2px]",
  "border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)] animate-[pulse_2s_ease-in-out_infinite]",
  "border-2 border-[#AFE3C0] shadow-[0_0_8px_rgba(255,255,255,0.3)] animate-[glitch_3s_ease-in-out_infinite]",
]

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)

  // Auto-scroll effect
  useEffect(() => {
    // Only set up the interval if the component is mounted
    let mounted = true
    const interval = setInterval(() => {
      if (mounted) {
        setScrollPosition((prev) => (prev + 1) % 200) // Loop every 200px
      }
    }, 16) // ~60fps

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  // Handle completion of splash screen
  const handleBegin = () => {
    setShowOnboarding(true)
    // Store that user has seen splash screen
    storage.set("hasSeenSplashScreen", true)
  }

  // Handle completion of onboarding
  const handleOnboardingComplete = () => {
    storage.set("onboardingCompleted", true)

    // Call the onComplete prop instead of reloading
    if (onComplete) {
      onComplete()
    }
  }

  if (showOnboarding) {
    // Wrap OnboardingGame with BOTH MediaProvider AND OnboardingProvider
    return (
      <MediaProvider>
        <OnboardingProvider>
          <OnboardingGame onComplete={handleOnboardingComplete} />
        </OnboardingProvider>
      </MediaProvider>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black overflow-hidden">
      {/* Scrolling card grid that fills the entire screen */}
      <div className="absolute inset-0 w-full h-full z-0">
        <motion.div className="absolute inset-0" style={{ y: -scrollPosition }}>
          <div className="grid grid-cols-4 gap-3 p-4">
            {Array.from({ length: 60 }).map((_, index) => {
              // Randomly assign border effects to some cards
              const hasBorderEffect = Math.random() > 0.7
              const borderEffectClass = hasBorderEffect
                ? BORDER_EFFECTS[Math.floor(Math.random() * BORDER_EFFECTS.length)]
                : "border border-zinc-700"

              return (
                <motion.div
                  key={index}
                  className={`w-full aspect-[2/3] rounded-xl bg-zinc-900 ${borderEffectClass}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.03,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  whileHover={{ scale: 1.05, rotate: Math.random() > 0.5 ? 3 : -3 }}
                >
                  {/* Card content placeholder */}
                  <div className="h-full flex flex-col justify-end p-2">
                    <div className="w-full h-2 bg-zinc-800 rounded mb-1"></div>
                    <div className="w-2/3 h-2 bg-zinc-800 rounded"></div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Begin button positioned absolutely over the cards */}
      <motion.button
        className="absolute bottom-10 z-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold shadow-lg flex items-center gap-2"
        whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(168, 85, 247, 0.5)" }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: [1, 1.05, 1],
          boxShadow: ["0 0 0 rgba(168, 85, 247, 0)", "0 0 15px rgba(168, 85, 247, 0.5)", "0 0 0 rgba(168, 85, 247, 0)"],
        }}
        transition={{
          y: { delay: 0.5, duration: 0.8 },
          scale: {
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            duration: 2,
            delay: 1,
          },
          boxShadow: {
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            duration: 2,
            delay: 1,
          },
        }}
        onClick={handleBegin}
      >
        Let's Begin
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  )
}
