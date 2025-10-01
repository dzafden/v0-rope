/**
 * MediaRegistry - A centralized registry for managing media items with deduplication and usage tracking
 *
 * This class provides a single source of truth for media items across the application,
 * handling deduplication by ID and title, tracking which items have been used,
 * and managing which API pages have been loaded.
 */

import type { MediaItem } from "@/types"

export interface MediaRegistryStats {
  totalItems: number
  uniqueItems: number
  usedItems: number
  availableItems: number
  loadedPages: Record<string, number[]>
  recycledItems: number
}

export class MediaRegistry {
  // Core storage
  private items = new Map<string, MediaItem>() // All items by ID
  private titleMap = new Map<string, string>() // Normalized title -> ID mapping
  private usedItems = new Set<string>() // IDs of used items
  private excludedItems = new Set<string>() // IDs of excluded items
  private recycledItems = new Set<string>() // IDs of items that have been recycled
  private lastUsedTimestamps = new Map<string, number>() // Track when items were last used

  // Page tracking
  private loadedPages: Record<string, number[]> = {
    trending: [],
    movies: [],
    tvShows: [],
    books: [],
    search: [],
  }

  // Configuration
  private maxPagesToLoad = 20 // Maximum number of pages to load per type
  private recyclingEnabled = true // Whether to recycle used items when running low
  private recyclingThreshold = 8 // Start recycling when available items drop below this number
  private minItemsBeforeRecycling = 4 // Minimum number of items before we start recycling

  constructor(initialItems: MediaItem[] = [], excludedIds: string[] = []) {
    // Add initial items
    if (initialItems.length > 0) {
      this.addItems(initialItems)
    }

    // Add initial excluded IDs
    if (excludedIds.length > 0) {
      excludedIds.forEach((id) => this.excludedItems.add(id))
    }
  }

  /**
   * Add a single item to the registry with deduplication
   */
  addItem(item: MediaItem): boolean {
    // Skip items without proper data
    if (!item || !item.id || !item.title) {
      console.warn("Attempted to add invalid item to registry", item)
      return false
    }

    // Skip items with placeholder images
    if (!item.coverImage || item.coverImage.includes("placeholder")) {
      return false
    }

    // Skip excluded items
    if (this.excludedItems.has(item.id)) {
      return false
    }

    // Normalize the title for comparison
    const normalizedTitle = this.normalizeTitle(item.title)

    // Check if we already have this ID
    if (this.items.has(item.id)) {
      // If we already have this ID, only update if the new item has a higher rating
      const existingItem = this.items.get(item.id)!
      if ((item.rating || 0) > (existingItem.rating || 0)) {
        this.items.set(item.id, item)
      }
      return false // Not a new addition
    }

    // Check if we already have this title
    if (this.titleMap.has(normalizedTitle)) {
      const existingId = this.titleMap.get(normalizedTitle)!
      const existingItem = this.items.get(existingId)!

      // If the new item has a higher rating, replace the existing one
      if ((item.rating || 0) > (existingItem.rating || 0)) {
        // Remove the old item
        this.items.delete(existingId)
        // Add the new item
        this.items.set(item.id, item)
        this.titleMap.set(normalizedTitle, item.id)
        return true
      }
      return false // Not a new addition
    }

    // This is a new unique item
    this.items.set(item.id, item)
    this.titleMap.set(normalizedTitle, item.id)
    return true
  }

  /**
   * Add multiple items to the registry with deduplication
   * Returns the number of new items added
   */
  addItems(items: MediaItem[]): number {
    if (!items || !items.length) return 0

    let newItemsCount = 0
    items.forEach((item) => {
      if (this.addItem(item)) {
        newItemsCount++
      }
    })

    return newItemsCount
  }

  /**
   * Mark an item as used by ID
   */
  markAsUsed(id: string): void {
    if (this.items.has(id)) {
      this.usedItems.add(id)
      this.lastUsedTimestamps.set(id, Date.now())
    }
  }

  /**
   * Mark multiple items as used by ID
   */
  markManyAsUsed(ids: string[]): void {
    ids.forEach((id) => this.markAsUsed(id))
  }

  /**
   * Mark an item as excluded by ID
   */
  excludeItem(id: string): void {
    this.excludedItems.add(id)
    // If the item is in our registry, mark it as used too
    if (this.items.has(id)) {
      this.usedItems.add(id)
    }
  }

  /**
   * Get all available items (not used)
   */
  getAvailableItems(): MediaItem[] {
    return Array.from(this.items.values()).filter((item) => !this.usedItems.has(item.id))
  }

  /**
   * Get a specific number of available items
   * If recycling is enabled and we're running low on items, recycle some used items
   */
  getAvailableItemsBatch(count: number): MediaItem[] {
    let availableItems = this.getAvailableItems()

    // If we're running low on items and recycling is enabled, recycle some used items
    if (
      this.recyclingEnabled &&
      availableItems.length < this.recyclingThreshold &&
      this.items.size > this.minItemsBeforeRecycling
    ) {
      const recycledItems = this.recycleItems(Math.max(count * 2, 20))
      if (recycledItems.length > 0) {
        console.log(`Recycled ${recycledItems.length} items`)
        availableItems = [...availableItems, ...recycledItems]
      }
    }

    // If we still don't have enough items, log a warning
    if (availableItems.length < count) {
      console.warn(`Not enough available items: requested ${count}, have ${availableItems.length}`)
    }

    // Shuffle the items for variety
    const shuffled = availableItems.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  /**
   * Recycle used items to make them available again
   * Returns the recycled items
   */
  recycleItems(count: number): MediaItem[] {
    // If we have no used items, return empty array
    if (this.usedItems.size === 0) return []

    // Get used items sorted by when they were last used (oldest first)
    const usedItemsArray = Array.from(this.usedItems)
      .filter((id) => !this.excludedItems.has(id)) // Don't recycle excluded items
      .sort((a, b) => {
        const timeA = this.lastUsedTimestamps.get(a) || 0
        const timeB = this.lastUsedTimestamps.get(b) || 0
        return timeA - timeB
      })

    // Take the oldest used items up to the count
    const itemsToRecycle = usedItemsArray.slice(0, count)

    // Remove them from used items
    itemsToRecycle.forEach((id) => {
      this.usedItems.delete(id)
      this.recycledItems.add(id)
    })

    // Return the recycled items
    return itemsToRecycle.map((id) => this.items.get(id)!).filter(Boolean)
  }

  /**
   * Reset all used items to make them available again
   */
  resetAllUsedItems(): void {
    this.usedItems.clear()
    this.recycledItems.clear()
    this.lastUsedTimestamps.clear()
  }

  /**
   * Get all items in the registry
   */
  getAllItems(): MediaItem[] {
    return Array.from(this.items.values())
  }

  /**
   * Get an item by ID
   */
  getItemById(id: string): MediaItem | undefined {
    return this.items.get(id)
  }

  /**
   * Check if a page has been loaded
   */
  hasLoadedPage(type: string, page: number): boolean {
    return this.loadedPages[type]?.includes(page) || false
  }

  /**
   * Mark a page as loaded
   */
  markPageAsLoaded(type: string, page: number): void {
    if (!this.loadedPages[type]) {
      this.loadedPages[type] = []
    }
    if (!this.loadedPages[type].includes(page)) {
      this.loadedPages[type].push(page)
    }
  }

  /**
   * Get the next unloaded page for a type
   */
  getNextUnloadedPage(type: string): number {
    if (!this.loadedPages[type]) {
      return 1
    }

    // Find the first page that hasn't been loaded
    for (let page = 1; page <= this.maxPagesToLoad; page++) {
      if (!this.loadedPages[type].includes(page)) {
        return page
      }
    }

    // If all pages have been loaded, return a random page
    return Math.floor(Math.random() * this.maxPagesToLoad) + 1
  }

  /**
   * Get registry statistics
   */
  getStats(): MediaRegistryStats {
    return {
      totalItems: this.items.size,
      uniqueItems: this.items.size,
      usedItems: this.usedItems.size,
      availableItems: this.getAvailableItems().length,
      loadedPages: this.loadedPages,
      recycledItems: this.recycledItems.size,
    }
  }

  /**
   * Reset the registry
   */
  reset(): void {
    this.items.clear()
    this.titleMap.clear()
    this.usedItems.clear()
    this.recycledItems.clear()
    this.lastUsedTimestamps.clear()
    Object.keys(this.loadedPages).forEach((key) => {
      this.loadedPages[key] = []
    })
  }

  /**
   * Configure recycling settings
   */
  configureRecycling(options: {
    enabled?: boolean
    threshold?: number
    minItemsBeforeRecycling?: number
  }): void {
    if (options.enabled !== undefined) {
      this.recyclingEnabled = options.enabled
    }
    if (options.threshold !== undefined) {
      this.recyclingThreshold = options.threshold
    }
    if (options.minItemsBeforeRecycling !== undefined) {
      this.minItemsBeforeRecycling = options.minItemsBeforeRecycling
    }
  }

  /**
   * Normalize a title for consistent comparison
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
  }
}

// Create a singleton instance for global use
export const globalRegistry = new MediaRegistry()
