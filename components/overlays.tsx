"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Heart, Sparkles } from "lucide-react"

// -------------------- Overlay Components --------------------

/**
 * Heart overlay effect with floating animated hearts
 */
export function HeartOverlay() {
  const heartConfigs = useMemo(
    () =>
      [...Array(5)].map(() => ({
        initialX: Math.random() * 160,
        duration: 3 + Math.random() * 2,
        delay: Math.random() * 5,
        rotation: Math.random() * 360,
      })),
    [],
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {heartConfigs.map((config, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ willChange: "transform, opacity" }}
          initial={{ x: config.initialX, y: -20, opacity: 0.7 }}
          animate={{ y: 240, opacity: [0.7, 1, 0], rotate: config.rotation }}
          transition={{
            duration: config.duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: config.delay,
            ease: "easeInOut",
          }}
        >
          <Heart className="text-pink-500 w-4 h-4 fill-pink-500" />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Sparkle overlay effect with animated sparkles
 */
export function SparkleOverlay() {
  const sparkleConfigs = useMemo(
    () =>
      [...Array(8)].map(() => ({
        x: Math.random() * 160,
        y: Math.random() * 240,
        delay: Math.random() * 5,
      })),
    [],
  )

  const sparkleVariant = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: [0, 1, 0], opacity: [0, 1, 0] },
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {sparkleConfigs.map((config, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ willChange: "transform, opacity", left: config.x, top: config.y }}
          variants={sparkleVariant}
          initial="initial"
          animate="animate"
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: config.delay, ease: "easeInOut" }}
        >
          <Sparkles className="text-yellow-400 w-4 h-4" />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Shimmer overlay effect with animated gradient
 */
export function ShimmerOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
    </div>
  )
}

/**
 * Gold overlay effect with animated gold shimmer
 */
export function GoldOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent animate-[shimmer_1.5s_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_70%,rgba(234,179,8,0.2)_100%)]" />
    </div>
  )
}

/**
 * Retro overlay effect with CRT-like scan lines and color distortion
 */
export function RetroOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 rounded-xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none" />
      <div className="absolute inset-0 opacity-30 mix-blend-screen">
        <div className="absolute inset-0 bg-red-500 mix-blend-multiply transform translate-x-[0.5px]" />
        <div className="absolute inset-0 bg-blue-500 mix-blend-multiply transform translate-x-[-0.5px]" />
      </div>
      <div className="absolute inset-0 animate-[flicker_0.15s_infinite_alternate] bg-white opacity-[0.01] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="w-full h-full animate-[noise_0.2s_infinite]" />
      </div>
    </div>
  )
}

/**
 * Pixelated overlay effect with animated pixels
 */
export function PixelatedOverlay() {
  const pixelSize = 6 // Size of each pixel
  const pixelOpacity = 0.2 // Base opacity of pixels

  // Generate a grid of pixels with random opacity variations
  const pixels = useMemo(() => {
    const result = []
    const cols = Math.ceil(160 / pixelSize)
    const rows = Math.ceil(240 / pixelSize)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Random opacity variation
        const opacityVariation = Math.random() * 0.15
        const finalOpacity = pixelOpacity + opacityVariation

        result.push({
          x: x * pixelSize,
          y: y * pixelSize,
          opacity: finalOpacity,
          hue: Math.floor(Math.random() * 360), // Random hue for subtle color variation
          delay: Math.random() * 2, // Random animation delay
        })
      }
    }
    return result
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pixels.map((pixel, i) => (
        <motion.div
          key={i}
          className="absolute bg-white"
          style={{
            left: `${pixel.x}px`,
            top: `${pixel.y}px`,
            width: `${pixelSize}px`,
            height: `${pixelSize}px`,
            opacity: pixel.opacity,
            mixBlendMode: "overlay",
            filter: `hue-rotate(${pixel.hue}deg)`,
          }}
          animate={{
            opacity: [pixel.opacity, pixel.opacity * 1.5, pixel.opacity],
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: pixel.delay,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px]" />
    </div>
  )
}

/**
 * Confetti overlay effect with animated confetti pieces
 */
export function ConfettiOverlay() {
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 30 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 4,
        color: [
          "#FF5252", // red
          "#FFEB3B", // yellow
          "#2196F3", // blue
          "#4CAF50", // green
          "#E040FB", // purple
          "#FF9800", // orange
        ][Math.floor(Math.random() * 6)],
        rotation: Math.random() * 360,
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 3,
      })),
    [],
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {confettiPieces.map((piece, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: `${piece.size}px`,
            height: `${piece.size * 0.6}px`,
            backgroundColor: piece.color,
            willChange: "transform, opacity",
          }}
          initial={{
            y: -20,
            x: piece.x,
            opacity: 0,
            rotate: piece.rotation,
          }}
          animate={{
            y: [null, 240],
            x: [null, piece.x - 10 + Math.random() * 20],
            opacity: [0, 1, 1, 0],
            rotate: piece.rotation + 360 * 2,
          }}
          transition={{
            duration: piece.duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: piece.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

/**
 * Sticker overlay effect with animated stickers
 * @param emoji The emoji to use for the sticker
 */
export function StickerOverlay({ emoji }: { emoji: string }) {
  const stickerConfigs = useMemo(
    () =>
      [...Array(6)].map(() => ({
        x: Math.random() * 160,
        y: Math.random() * 240,
        duration: 2 + Math.random(),
        delay: Math.random() * 5,
        rotation: Math.random() * 360,
      })),
    [],
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stickerConfigs.map((config, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ willChange: "transform, opacity" }}
          initial={{
            x: config.x,
            y: config.y,
            scale: 0,
            opacity: 0,
            rotate: config.rotation,
          }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{
            duration: config.duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: config.delay,
            ease: "easeInOut",
          }}
        >
          <div className="text-2xl">{emoji}</div>
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Star icon component
 */
export function Star({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

/**
 * Component that renders the appropriate overlay based on the customization
 */
export function OverlayEffects({
  customizations,
}: {
  customizations?: {
    overlay?: string
    stickers?: Array<{ id: string; emoji: string }>
  }
}) {
  return (
    <>
      {customizations?.overlay === "hearts" && <HeartOverlay />}
      {customizations?.overlay === "sparkles" && <SparkleOverlay />}
      {customizations?.overlay === "shimmer" && <ShimmerOverlay />}
      {customizations?.overlay === "Gold" && <GoldOverlay />}
      {customizations?.overlay === "retro" && <RetroOverlay />}
      {customizations?.overlay === "pixelated" && <PixelatedOverlay />}
      {customizations?.overlay === "confetti" && <ConfettiOverlay />}
      {customizations?.overlay === "sticker" && customizations?.stickers?.length > 0 && (
        <StickerOverlay emoji={customizations.stickers[0].emoji} />
      )}
    </>
  )
}
