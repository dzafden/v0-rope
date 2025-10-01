import type { Activity, ActivityType, ActivityUser } from "@/types/activity"
import type { MediaItem } from "@/types"

// Sample users for fake activities
const SAMPLE_USERS: ActivityUser[] = [
  { id: "user1", name: "Alex Kim" },
  { id: "user2", name: "Jordan Smith" },
  { id: "user3", name: "Taylor Wong" },
  { id: "user4", name: "Casey Johnson" },
  { id: "user5", name: "Riley Chen" },
  { id: "user6", name: "Morgan Lee" },
  { id: "user7", name: "Jamie Rodriguez" },
  { id: "user8", name: "Quinn Patel" },
]

// Sample tags for tag activities
const SAMPLE_TAGS = ["Favorite", "Must Watch", "Rewatchable", "Classic", "Underrated", "Overrated"]

// Sample stickers for sticker activities
const getRandomSticker = (): { id: string; emoji: string } => {
  const stickers = [
    { id: "thumbs-up", emoji: "👍" },
    { id: "fire", emoji: "🔥" },
    { id: "heart", emoji: "❤️" },
    { id: "star", emoji: "⭐" },
    { id: "party", emoji: "🎉" },
    { id: "joy", emoji: "😂" },
  ]
  return stickers[Math.floor(Math.random() * stickers.length)]
}

// Generate a random timestamp within the last 7 days
const getRandomRecentTimestamp = (): number => {
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  return sevenDaysAgo + Math.random() * (now - sevenDaysAgo)
}

// Generate random activities based on real media items
export const generateActivities = (realMedia: MediaItem[]): Activity[] => {
  const ACTIVITY_TYPES: ActivityType[] = ["favorite", "watch", "tag", "sticker"]

  // Use a subset of media items to avoid overwhelming the feed
  const mediaToUse = realMedia.slice(0, Math.min(15, realMedia.length))

  // If no media items are available, return empty array
  if (mediaToUse.length === 0) {
    return []
  }

  return mediaToUse.map((item, index) => {
    // Get a random user
    const user = SAMPLE_USERS[Math.floor(Math.random() * SAMPLE_USERS.length)]

    // Get a random activity type
    const type = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)]

    // Create base activity
    const activity: Activity = {
      id: `activity-${Date.now()}-${index}`,
      user,
      type,
      media: item,
      timestamp: getRandomRecentTimestamp(),
    }

    // Add type-specific data
    if (type === "tag") {
      activity.tag = SAMPLE_TAGS[Math.floor(Math.random() * SAMPLE_TAGS.length)]
    } else if (type === "sticker") {
      activity.sticker = getRandomSticker()
    }

    return activity
  })
}

// Update the formatRelativeTime function to use abbreviated formats
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  // Convert to seconds
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) {
    return "now"
  }

  // Convert to minutes
  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) {
    return `${minutes}m`
  }

  // Convert to hours
  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours}h`
  }

  // Convert to days
  const days = Math.floor(hours / 24)
  return `${days}d`
}
