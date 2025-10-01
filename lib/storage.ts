/**
 * Storage utility for consistent localStorage access with error handling
 *
 * This utility provides a consistent interface for interacting with localStorage,
 * including proper error handling, type safety, and SSR compatibility.
 */

// Check if localStorage is available (for SSR environments)
const isLocalStorageAvailable = (): boolean => {
  if (typeof window === "undefined") return false

  try {
    // Test if localStorage is accessible
    const testKey = "__storage_test__"
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Common storage keys used throughout the application
 */
export const STORAGE_KEYS = {
  collection: "mediaCollection",
  customizations: "mediaCustomizations",
  hiddenItems: "mediaHiddenItems",
  tags: "mediaTags",
  itemTags: "mediaItemTags",
  favorites: "mediaFavorites",
  watching: "mediaWatching",
  reading: "mediaReading",
}

/**
 * Storage utility with type-safe methods and error handling
 */
const storage = {
  /**
   * Get a value from localStorage with proper type conversion
   * @param key The key to retrieve
   * @param defaultValue Default value to return if key doesn't exist or on error
   * @returns The stored value or defaultValue if not found/error
   */
  get: <T,>(key: string, defaultValue: T): T => {
    if (!isLocalStorageAvailable()) return defaultValue

    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (e) {
      console.error(`Error getting ${key} from localStorage:`, e)
      return defaultValue
    }
  },

  /**
   * Set a value in localStorage with proper serialization
   * @param key The key to set
   * @param value The value to store
   * @returns true if successful, false otherwise
   */
  set: <T,>(key: string, value: T): boolean => {
    if (!isLocalStorageAvailable()) return false

    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error(`Error setting ${key} in localStorage:`, e)
      return false
    }
  },

  /**
   * Remove a key from localStorage
   * @param key The key to remove
   * @returns true if successful, false otherwise
   */
  remove: (key: string): boolean => {
    if (!isLocalStorageAvailable()) return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (e) {
      console.error(`Error removing ${key} from localStorage:`, e)
      return false
    }
  },

  /**
   * Check if a key exists in localStorage
   * @param key The key to check
   * @returns true if the key exists, false otherwise
   */
  has: (key: string): boolean => {
    if (!isLocalStorageAvailable()) return false

    try {
      return localStorage.getItem(key) !== null
    } catch (e) {
      console.error(`Error checking if ${key} exists in localStorage:`, e)
      return false
    }
  },

  /**
   * Clear all items from localStorage
   * @returns true if successful, false otherwise
   */
  clear: (): boolean => {
    if (!isLocalStorageAvailable()) return false

    try {
      localStorage.clear()
      return true
    } catch (e) {
      console.error("Error clearing localStorage:", e)
      return false
    }
  },

  /**
   * Append a value to an array in localStorage
   * @param key The key of the array
   * @param value The value to append
   * @returns true if successful, false otherwise
   */
  append: <T,>(key: string, value: T): boolean => {
    if (!isLocalStorageAvailable()) return false

    try {
      const current = storage.get<T[]>(key, [] as unknown as T[])
      return storage.set(key, [...current, value])
    } catch (e) {
      console.error(`Error appending to ${key} in localStorage:`, e)
      return false
    }
  },
}

/**
 * Cleans up all orphaned data associated with a deleted media item
 * @param mediaId The ID of the deleted media item
 */
export function cleanupOrphanedData(mediaId: string): void {
  console.log(`Cleaning up orphaned data for media ID: ${mediaId}`)

  const cleanupFunctions = [
    cleanupMediaCustomizations,
    cleanupMediaItemTags,
    cleanupMediaNotes,
    cleanupTVSeasonNotes,
    cleanupTVEpisodeNotes,
    cleanupTVWatchProgress,
    cleanupWatchedItems,
    cleanupMediaLists,
  ]

  cleanupFunctions.forEach((fn) => {
    try {
      fn(mediaId)
    } catch (err) {
      console.error(`Cleanup failed in ${fn.name} for mediaId ${mediaId}:`, err)
      // Continue with other cleanups despite the error
    }
  })
}

/**
 * Removes the media item from mediaCustomizations
 */
function cleanupMediaCustomizations(mediaId: string): void {
  try {
    const customizations = storage.get("mediaCustomizations", {})
    if (customizations[mediaId]) {
      delete customizations[mediaId]
      storage.set("mediaCustomizations", customizations)
      console.log(`Cleaned up customizations for ${mediaId}`)
    }
  } catch (err) {
    console.error(`Failed to clean up mediaCustomizations for ${mediaId}:`, err)
  }
}

/**
 * Removes the media item from mediaItemTags
 */
function cleanupMediaItemTags(mediaId: string): void {
  try {
    const itemTags = storage.get("mediaItemTags", {})
    if (itemTags[mediaId]) {
      delete itemTags[mediaId]
      storage.set("mediaItemTags", itemTags)
      console.log(`Cleaned up item tags for ${mediaId}`)
    }
  } catch (err) {
    console.error(`Failed to clean up mediaItemTags for ${mediaId}:`, err)
  }
}

/**
 * Removes the media item from mediaNotes
 */
function cleanupMediaNotes(mediaId: string): void {
  try {
    const notes = storage.get("mediaNotes", {})
    if (notes[mediaId]) {
      delete notes[mediaId]
      storage.set("mediaNotes", notes)
      console.log(`Cleaned up notes for ${mediaId}`)
    }
  } catch (err) {
    console.error(`Failed to clean up mediaNotes for ${mediaId}:`, err)
  }
}

/**
 * Removes TV show season notes
 */
function cleanupTVSeasonNotes(mediaId: string): void {
  try {
    const seasonNotesKey = `${mediaId}-seasonNotes`
    if (storage.get(seasonNotesKey) !== undefined) {
      storage.remove(seasonNotesKey)
      console.log(`Cleaned up season notes for ${mediaId}`)
    }
  } catch (err) {
    console.error(`Failed to clean up season notes for ${mediaId}:`, err)
  }
}

/**
 * Removes TV show episode notes
 */
function cleanupTVEpisodeNotes(mediaId: string): void {
  try {
    const episodeNotesKey = `${mediaId}-episodeNotes`
    if (storage.get(episodeNotesKey) !== undefined) {
      storage.remove(episodeNotesKey)
      console.log(`Cleaned up episode notes for ${mediaId}`)
    }
  } catch (err) {
    console.error(`Failed to clean up episode notes for ${mediaId}:`, err)
  }
}

/**
 * Removes the media item from tvWatchProgress
 */
function cleanupTVWatchProgress(mediaId: string): void {
  try {
    const watchProgress = storage.get("tvWatchProgress", {})
    if (watchProgress[mediaId]) {
      delete watchProgress[mediaId]
      storage.set("tvWatchProgress", watchProgress)
      console.log(`Cleaned up TV watch progress for ${mediaId}`)
    }
  } catch (err) {
    console.error(`Failed to clean up tvWatchProgress for ${mediaId}:`, err)
  }
}

/**
 * Removes the media item from watchedItems
 */
function cleanupWatchedItems(mediaId: string): void {
  try {
    const watchedItems = storage.get("watchedItems", {})
    if (watchedItems[mediaId]) {
      delete watchedItems[mediaId]
      storage.set("watchedItems", watchedItems)
      console.log(`Cleaned up watched status for ${mediaId}`)
    }
  } catch (err) {
    console.error(`Failed to clean up watchedItems for ${mediaId}:`, err)
  }
}

/**
 * Removes the media item from all media lists (favorites, watching, reading)
 */
function cleanupMediaLists(mediaId: string): void {
  try {
    const listKeys = [STORAGE_KEYS.favorites, STORAGE_KEYS.watching, STORAGE_KEYS.reading]

    listKeys.forEach((listKey) => {
      const list = storage.get(listKey, [])

      // Handle both old format (array of objects) and new format (array of IDs)
      let filteredList

      if (list.length > 0 && typeof list[0] === "object" && list[0]?.id) {
        // Old format: array of objects
        filteredList = list.filter((item) => item.id !== mediaId)
      } else {
        // New format: array of IDs
        filteredList = list.filter((id) => id !== mediaId)
      }

      if (list.length !== filteredList.length) {
        storage.set(listKey, filteredList)
        console.log(`Removed ${mediaId} from ${listKey}`)
      }
    })
  } catch (err) {
    console.error(`Failed to clean up media lists for ${mediaId}:`, err)
  }
}

export default storage
