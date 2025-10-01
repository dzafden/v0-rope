"use client"

import { motion } from "framer-motion"
import { Play, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface WatchProgressCardProps {
  title: string
  posterImage: string
  progress: number // 0-100
  episodesWatched: number
  totalEpisodes: number
  onClick: () => void
}

export default function WatchProgressCard({
  title,
  posterImage,
  progress,
  episodesWatched,
  totalEpisodes,
  onClick,
}: WatchProgressCardProps) {
  return (
    <motion.div
      className="w-full bg-zinc-800 rounded-xl overflow-hidden shadow-md cursor-pointer"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="flex">
        {/* Poster image */}
        <div className="w-16 h-24 relative flex-shrink-0">
          <img src={posterImage || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <div className="p-3 flex-1">
          <h3 className="font-medium text-sm mb-1 line-clamp-1">{title}</h3>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden mb-2">
            <div
              className={cn("h-full", episodesWatched === totalEpisodes ? "bg-green-500" : "bg-purple-500")}
              style={{ width: `${(episodesWatched / totalEpisodes) * 100}%` }}
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-400">
              {episodesWatched}/{totalEpisodes} episodes
            </div>

            {episodesWatched === totalEpisodes ? (
              <div className="flex items-center text-xs text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                <span>Completed</span>
              </div>
            ) : (
              <motion.div className="flex items-center text-xs text-purple-400" whileHover={{ scale: 1.05 }}>
                <Play className="w-3 h-3 mr-1" fill="currentColor" />
                <span>Continue</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
