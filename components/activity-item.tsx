"use client"
import { formatRelativeTime } from "@/lib/fake-activity"
import type { Activity } from "@/types/activity"
import { Tag, Clock, Heart } from "lucide-react"
import MediaCard from "./media-card"
import { motion } from "framer-motion"

// Update the ActivityItemProps interface to include onShowDetails
interface ActivityItemProps {
  activity: Activity
  onShowDetails?: (media: any) => void // Add this prop
}

// Update the function signature to accept the new prop
export default function ActivityItem({ activity, onShowDetails }: ActivityItemProps) {
  // Get the activity message based on type
  const getActivityMessage = () => {
    switch (activity.type) {
      case "favorite":
        return "favorited"
      case "watch":
        return activity.media.type === "book" ? "finished reading" : "watched"
      case "tag":
        return `tagged "${activity.tag}"`
      case "sticker":
        return "added a sticker to"
      default:
        return "interacted with"
    }
  }

  // Get the activity icon based on type
  const getActivityIcon = () => {
    switch (activity.type) {
      case "favorite":
        return <Heart className="w-3.5 h-3.5 text-yellow-400" />
      case "watch":
        return <Clock className="w-3.5 h-3.5 text-blue-400" />
      case "tag":
        return <Tag className="w-3.5 h-3.5 text-green-400" />
      case "sticker":
        return activity.sticker ? (
          <span className="text-sm">{activity.sticker.emoji}</span>
        ) : (
          <span className="text-sm">🎨</span>
        )
      default:
        return null
    }
  }

  // Create a simplified version of the media item for the MediaCard
  const mediaItem = {
    ...activity.media,
    id: activity.media.id || activity.id, // Ensure we have an ID
  }

  return (
    <div className="relative flex flex-col">
      {/* Pass onShowDetails to MediaCard */}
      <MediaCard
        {...mediaItem}
        showHideButton={false}
        showTagsButton={false}
        showDetailsButton={true}
        onShowDetails={onShowDetails ? () => onShowDetails(mediaItem) : undefined}
      />

      {/* Compact info bar below the card */}
      <motion.div
        className="mt-1 px-1 text-xs flex items-center gap-1 text-zinc-300"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* User avatar/initial */}
        <div className="w-5 h-5 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-[9px] font-medium">
          {activity.user.avatar ? (
            <img
              src={activity.user.avatar || "/placeholder.svg"}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            activity.user.name.charAt(0)
          )}
        </div>

        {/* Username (truncated if needed) */}
        <span className="font-medium truncate max-w-[60px]">{activity.user.name.split(" ")[0]}</span>

        {/* Activity icon */}
        <span className="flex-shrink-0">{getActivityIcon()}</span>

        {/* Timestamp - now more compact */}
        <span className="text-zinc-500 ml-auto text-[10px]">{formatRelativeTime(activity.timestamp)}</span>
      </motion.div>
    </div>
  )
}
