"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Gamepad2, Trophy } from "lucide-react"
import { useMedia } from "@/context/media-context"
import storage from "@/lib/storage"

interface GamePromoProps {
  onPlayGame: () => void
}

export default function GamePromo({ onPlayGame }: GamePromoProps) {
  const { collection } = useMedia()
  const [highScore, setHighScore] = useState<number>(0)
  const [totalCollected, setTotalCollected] = useState<number>(0)
  const [isHovered, setIsHovered] = useState(false)

  // Load game stats from storage
  useEffect(() => {
    const gameStats = storage.get<{ highScore: number; totalCollected: number }>("gameStats", {
      highScore: 0,
      totalCollected: 0,
    })
    setHighScore(gameStats.highScore)
    setTotalCollected(gameStats.totalCollected)
  }, [])

  return (
    <motion.div
      className="relative w-full bg-gradient-to-br from-purple-900/80 to-indigo-900/80 rounded-xl overflow-hidden border border-purple-500/30 shadow-lg mb-6"
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute rounded-full bg-white/30"
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative flex items-center p-3 sm:p-6 z-10">
        {/* Game icon */}
        <motion.div
          className="w-12 h-12 sm:w-20 sm:h-20 bg-purple-600 rounded-full flex items-center justify-center sm:mr-6"
          animate={{
            rotate: isHovered ? [0, -10, 10, -5, 5, 0] : 0,
            scale: isHovered ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 1.5, repeat: isHovered ? Number.POSITIVE_INFINITY : 0 }}
        >
          <Gamepad2 className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
        </motion.div>

        {/* Game info - simplified */}
        <div className="flex-1 ml-3 sm:ml-0">
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-sm">
            <div className="bg-purple-800/50 px-3 py-1 rounded-full flex items-center">
              <Trophy className="w-4 h-4 mr-1 text-yellow-400" />
              <span>High Score: {highScore}</span>
            </div>
            <div className="bg-purple-800/50 px-3 py-1 rounded-full">
              <span>Collected: {totalCollected}</span>
            </div>
            <div className="bg-purple-800/50 px-3 py-1 rounded-full">
              <span>Library: {collection.length}</span>
            </div>
          </div>
        </div>

        {/* Play button */}
        <motion.button
          className="ml-2 sm:ml-4 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-medium text-white shadow-lg flex items-center"
          whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(168, 85, 247, 0.5)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlayGame}
        >
          <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Play
        </motion.button>
      </div>
    </motion.div>
  )
}
