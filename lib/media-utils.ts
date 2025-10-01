import type { MediaItem } from "@/types"

/**
 * Normalizes a title string for consistent comparison
 * Removes special characters, extra spaces, and converts to lowercase
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
}

/**
 * Centralized deduplication function that handles both ID and title-based deduplication
 * Keeps items with higher ratings when duplicates are found
 */
export function deduplicateMedia(mediaItems: MediaItem[]): MediaItem[] {
  console.log(`Deduplicating ${mediaItems.length} media items...`)

  // Step 1: Deduplicate by ID
  const idMap = new Map<string, MediaItem>()

  for (const item of mediaItems) {
    // If this ID doesn't exist yet, or the current item has a higher rating
    if (!idMap.has(item.id) || (item.rating || 0) > (idMap.get(item.id)?.rating || 0)) {
      idMap.set(item.id, item)
    }
  }

  console.log(`After ID deduplication: ${idMap.size} items`)

  // Step 2: Deduplicate by normalized title
  const titleMap = new Map<string, MediaItem>()

  for (const item of Array.from(idMap.values())) {
    const normalizedTitle = normalizeTitle(item.title)

    if (!titleMap.has(normalizedTitle) || (item.rating || 0) > (titleMap.get(normalizedTitle)?.rating || 0)) {
      titleMap.set(normalizedTitle, item)
    }
  }

  console.log(`After title deduplication: ${titleMap.size} items`)

  return Array.from(titleMap.values())
}

/**
 * Merges new media items with existing pool, ensuring no duplicates
 * Also filters out items that are in the excluded set
 */
export function mergeMediaPools(
  existingPool: MediaItem[],
  newItems: MediaItem[],
  excludedIds: Set<string> = new Set(),
): MediaItem[] {
  console.log(`Merging ${existingPool.length} existing items with ${newItems.length} new items...`)
  console.log(`Excluding ${excludedIds.size} items from the merge`)

  // Filter out items that are in the excluded set
  const filteredNewItems = newItems.filter((item) => !excludedIds.has(item.id))

  console.log(`After exclusion filtering: ${filteredNewItems.length} new items remain`)

  // Combine existing and new items
  const combined = [...existingPool, ...filteredNewItems]

  // Return deduplicated result
  return deduplicateMedia(combined)
}

/**
 * Filters media items based on quality criteria
 */
export function filterQualityMedia(mediaItems: MediaItem[]): MediaItem[] {
  const filtered = mediaItems.filter((item) => {
    // Filter out items without cover images or with placeholder images
    if (!item.coverImage || item.coverImage.includes("placeholder")) return false

    // Filter out items with low ratings
    if (item.rating && item.rating < 6.0) return false

    return true
  })

  console.log(`Quality filtering: ${mediaItems.length} → ${filtered.length} items`)

  return filtered
}

/**
 * Logs duplicate statistics for debugging
 */
export function logDuplicateStats(mediaItems: MediaItem[], source = "unknown"): void {
  const idMap = new Map<string, MediaItem[]>()
  const titleMap = new Map<string, MediaItem[]>()

  mediaItems.forEach((item) => {
    // Track by ID
    if (!idMap.has(item.id)) idMap.set(item.id, [item])
    else idMap.get(item.id)!.push(item)

    // Track by normalized title
    const normalizedTitle = normalizeTitle(item.title)
    if (!titleMap.has(normalizedTitle)) titleMap.set(normalizedTitle, [item])
    else titleMap.get(normalizedTitle)!.push(item)
  })

  let idDuplicatesCount = 0
  idMap.forEach((items, id) => {
    if (items.length > 1) {
      idDuplicatesCount++
      console.warn(`[Duplicate ID] Found ${items.length} items with ID "${id}" (Source: ${source})`)
    }
  })

  let titleDuplicatesCount = 0
  titleMap.forEach((items, title) => {
    if (items.length > 1) {
      titleDuplicatesCount++
      console.warn(`[Duplicate Title] Found ${items.length} items with title "${title}" (Source: ${source})`)

      // Log the actual titles for debugging
      const titles = items.map((item) => `"${item.title}" (ID: ${item.id}, Rating: ${item.rating || "N/A"})`)
      console.warn(`  Conflicting titles: ${titles.join(", ")}`)
    }
  })

  console.log(
    `[Duplicate Check] ${source}: Total items: ${mediaItems.length}, ` +
      `Unique IDs: ${idMap.size}, ID duplicates: ${idDuplicatesCount}, ` +
      `Unique Titles: ${titleMap.size}, Title duplicates: ${titleDuplicatesCount}`,
  )

  return {
    totalItems: mediaItems.length,
    uniqueIds: idMap.size,
    idDuplicates: idDuplicatesCount,
    uniqueTitles: titleMap.size,
    titleDuplicates: titleDuplicatesCount,
  }
}

/**
 * Ensures consistent ID format across all media types
 * This helps with reliable duplicate detection
 */
export function ensureConsistentId(item: MediaItem): MediaItem {
  // If the ID already follows our format, return as is
  if (item.id.startsWith("tmdb-") || item.id.startsWith("ol-book-")) {
    return item
  }

  // Otherwise, create a properly formatted ID
  let newId: string

  if (item.type === "movie" || item.type === "tv") {
    // Extract numeric ID if possible
    const numericId = item.id.replace(/\D/g, "")
    newId = `tmdb-${item.type}-${numericId || item.id}`
  } else if (item.type === "book") {
    newId = `ol-book-${item.id}`
  } else {
    // Fallback for unknown types
    newId = `media-${item.type}-${item.id}`
  }

  return {
    ...item,
    id: newId,
  }
}

/**
 * Ensures all media items in an array have consistent IDs
 */
export function ensureConsistentIds(mediaItems: MediaItem[]): MediaItem[] {
  return mediaItems.map(ensureConsistentId)
}
