import type { MediaItem } from "@/types"

export type ActivityType = "favorite" | "watch" | "tag" | "sticker"

export interface ActivityUser {
  id: string
  name: string
  avatar?: string
}

export interface Activity {
  id: string
  user: ActivityUser
  type: ActivityType
  media: MediaItem
  timestamp: number // Unix timestamp
  tag?: string
  sticker?: {
    id: string
    emoji: string
  }
}
