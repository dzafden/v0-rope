export type MediaType = "movie" | "tv" | "book"

export interface MediaItem {
  id: string
  title: string
  coverImage: string
  type: MediaType
  overview: string
  rating: number
  releaseDate?: string
  isInCollection?: boolean
  addedAt?: number // Timestamp when added to collection
  airingStatus?: "airing" | "not_airing" // New property for TV show airing status
  lastStatusUpdate?: number // Timestamp of last status update
  customizations?: {
    borderEffect?: "pulse" | "glow" | "rainbow" | "none"
    stickers?: Array<{
      id: string
      image: string
      position: { x: number; y: number }
    }>
    overlay?: "hearts" | "stars" | "sparkles" | "none"
  }
}
