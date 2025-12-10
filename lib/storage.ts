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

export default storage
