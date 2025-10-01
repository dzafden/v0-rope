"use client"

import { useState } from "react"
import { useInView } from "react-intersection-observer"
// Update the import to use default import
import storage from "@/lib/storage"

// Animation settings that can be controlled globally
export const ANIMATION_SETTINGS = {
  enabled: true, // Global toggle for animations
}

/**
 * Custom hook for card animations with randomization and performance optimizations
 * @returns Animation controls and ref for the animated element
 */
export function useCardAnimation() {
  // Use intersection observer to detect if card is in view
  const { ref, inView } = useInView({
    threshold: 0.1, // Trigger when at least 10% of the card is visible
    triggerOnce: false,
  })

  // Generate initial animation parameters only once
  const [animationParams] = useState(() => getRandomAnimationParams())

  // Animation controls for Framer Motion
  const controls = {
    animate:
      ANIMATION_SETTINGS.enabled && inView
        ? {
            y: animationParams.yMovement,
            rotateZ: animationParams.rotation,
          }
        : {},
    transition: {
      duration: animationParams.duration,
      ease: "easeInOut",
      repeat: Number.POSITIVE_INFINITY,
      repeatType: "reverse",
      delay: animationParams.delay,
    },
  }

  return { ref, controls, inView }
}

/**
 * Generate random animation parameters within acceptable ranges
 */
function getRandomAnimationParams() {
  return {
    // Y-axis movement (up/down) - subtle movement
    yMovement: [0, -2 - Math.random() * 3, 0],

    // Rotation (very slight tilt)
    rotation: [0, -0.3 - Math.random() * 0.7, 0, 0.3 + Math.random() * 0.7, 0],

    // Animation duration (seconds)
    duration: 2 + Math.random() * 1.5,

    // Initial delay to stagger animations
    delay: Math.random() * 1.5,
  }
}

/**
 * Toggle global animations on/off
 * @param enabled Whether animations should be enabled
 */
export function setAnimationsEnabled(enabled: boolean) {
  ANIMATION_SETTINGS.enabled = enabled

  // Replace this:
  // You could also save this preference to localStorage
  // try {
  //   localStorage.setItem("animationsEnabled", enabled ? "true" : "false")
  // } catch (e) {
  //   console.error("Failed to save animation preference:", e)
  // }

  // With:
  storage.set("animationsEnabled", enabled)
}

/**
 * Initialize animation settings from saved preferences
 * Call this on app initialization
 */
export function initAnimationSettings() {
  try {
    // Replace this:
    // const savedPreference = localStorage.getItem("animationsEnabled")
    // if (savedPreference !== null) {
    //   ANIMATION_SETTINGS.enabled = savedPreference === "true"
    // }

    // With:
    const savedPreference = storage.get<boolean | null>("animationsEnabled", null)
    if (savedPreference !== null) {
      ANIMATION_SETTINGS.enabled = savedPreference
    }
  } catch (e) {
    console.error("Failed to load animation preference:", e)
  }
}
