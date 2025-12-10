"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, useRef } from "react"
import { type MediaItem, fetchTrending, fetchPopularMovies, fetchPopularTVShows, searchMedia } from "@/lib/tmdb-api"
import { searchBooks, fetchPopularBooks } from "@/lib/openlibrary-api"
import storage from "@/lib/storage"

// -------------------- Types and Constants --------------------
export interface Tag {
  id: string
  name: string
  isCustom: boolean
}

export interface HiddenItem {
  id: string
  timestamp: number
}

export interface MediaContextType {
  // Data arrays and collection
  trending: MediaItem[]
  popularMovies: MediaItem[]
  popularTVShows: MediaItem[]
  popularBooks: MediaItem[]
  collection: MediaItem[]
  searchResults: MediaItem[]

  // Loading states
  isLoading: boolean
  isTrendingLoading: boolean
  isMoviesLoading: boolean
  isTVShowsLoading: boolean
  isBooksLoading: boolean
  isSearching: boolean
  hasMore: boolean
  currentPage: number

  // Data loading and search functions
  refreshTrending: () => Promise<void>
  loadMoreTrending: () => Promise<void>
  searchForMedia: (query: string) => Promise<void>
  loadMoreSearchResults: (query: string) => Promise<void>

  // Collection actions
  addToCollection: (item: MediaItem) => void
  removeFromCollection: (id: string) => void
  updateMediaCustomization: (id: string, customizations: MediaItem["customizations"], updatedMedia?: MediaItem) => void

  // Hidden items and tags
  hiddenItems: HiddenItem[]
  tags: Tag[]
  itemTags: Record<string, string[]>
  hideItem: (id: string) => void
  isItemHidden: (id: string) => boolean
  addTagToItem: (itemId: string, tagId: string) => void
  removeTagFromItem: (itemId: string, tagId: string) => void
  getItemTags: (itemId: string) => string[]
  createTag: (name: string) => string | null
  getAllTags: () => Tag[]
  getTagById: (id: string) => Tag | undefined

  // Preloading and customization
  preloadInitialData: () => Promise<void>
  getMediaWithLatestCustomizations: (mediaItem: MediaItem | null) => MediaItem | null

  // Setters for loaded data – used by other components to update data
  setTrending: (items: MediaItem[]) => void
  setPopularMovies: (items: MediaItem[]) => void
  setPopularTVShows: (items: MediaItem[]) => void
  setPopularBooks: (items: MediaItem[]) => void

  // New flag to indicate if data has been loaded
  isInitialDataLoaded: boolean
}

// Local storage keys
const STORAGE_KEYS = {
  collection: "mediaCollection",
  customizations: "mediaCustomizations",
  hiddenItems: "mediaHiddenItems",
  tags: "mediaTags",
  itemTags: "mediaItemTags",
}

const DEFAULT_TAGS: Tag[] = [
  { id: "watched", name: "Watched", isCustom: false },
  { id: "want-to-watch", name: "Want to Watch", isCustom: false },
  { id: "read", name: "Read", isCustom: false },
  { id: "want-to-read", name: "Want to Read", isCustom: false },
]

const MediaContext = createContext<MediaContextType | undefined>(undefined)

// -------------------- MediaProvider Component --------------------
export function MediaProvider({ children }: { children: ReactNode }) {
  // Main Data States
  const [trending, setTrending] = useState<MediaItem[]>([])
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([])
  const [popularTVShows, setPopularTVShows] = useState<MediaItem[]>([])
  const [popularBooks, setPopularBooks] = useState<MediaItem[]>([])
  const [collection, setCollection] = useState<MediaItem[]>([])
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])

  // Granular Loading States
  const [isTrendingLoading, setIsTrendingLoading] = useState(true)
  const [isMoviesLoading, setIsMoviesLoading] = useState(true)
  const [isTVShowsLoading, setIsTVShowsLoading] = useState(true)
  const [isBooksLoading, setIsBooksLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchPage, setSearchPage] = useState(1)
  const [lastSearchQuery, setLastSearchQuery] = useState("")
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false)

  // Hidden items and tags
  const [hiddenItems, setHiddenItems] = useState<HiddenItem[]>([])
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS)
  const [itemTags, setItemTags] = useState<Record<string, string[]>>({})

  // Additional loading states for pagination
  const [hasMoreMovies, setHasMoreMovies] = useState(true)
  const [hasMoreTVShows, setHasMoreTVShows] = useState(true)
  const [hasMoreBooks, setHasMoreBooks] = useState(true)
  const [isLoadingMovies, setIsLoadingMovies] = useState(false)
  const [isLoadingTVShows, setIsLoadingTVShows] = useState(false)
  const [isLoadingBooks, setIsLoadingBooks] = useState(false)

  // Ref to avoid duplicate preloading calls
  const isPreloadingRef = useRef(false)

  // ------------------ Initial Data Loading ------------------
  useEffect(() => {
    // Helper function to load data in parallel
    const loadInitialData = async () => {
      setIsTrendingLoading(true)
      setIsMoviesLoading(true)
      setIsTVShowsLoading(true)
      setIsBooksLoading(true)

      try {
        // Load trending, movies and TV shows concurrently
        const [trendingData, moviesData, tvData] = await Promise.all([
          fetchTrending().catch((err) => {
            console.error("Error fetching trending:", err)
            return []
          }),
          fetchPopularMovies().catch((err) => {
            console.error("Error fetching movies:", err)
            return []
          }),
          fetchPopularTVShows().catch((err) => {
            console.error("Error fetching TV shows:", err)
            return []
          }),
        ])

        // Load books data separately
        let booksData: MediaItem[] = []
        try {
          booksData = await fetchPopularBooks()
        } catch (error) {
          console.error("Error fetching books:", error)
        }

        // Update states with fetched data
        setTrending(trendingData)
        setPopularMovies(moviesData)
        setPopularTVShows(tvData)
        setPopularBooks(booksData)
        setCurrentPage(1)
        setHasMore(true)
        setIsInitialDataLoaded(true)
      } catch (error) {
        console.error("Error loading initial data:", error)
      } finally {
        // Update loading states
        setIsTrendingLoading(false)
        setIsMoviesLoading(false)
        setIsTVShowsLoading(false)
        setIsBooksLoading(false)
        setIsLoading(false)
      }
    }

    loadInitialData()

    // Load collection from storage
    const savedCollection = storage.get<MediaItem[]>(STORAGE_KEYS.collection, [])
    if (savedCollection.length > 0) {
      setCollection(savedCollection)
    }

    // Load customizations and apply to collection items
    const savedCustomizations = storage.get<Record<string, MediaItem["customizations"]>>(
      STORAGE_KEYS.customizations,
      {},
    )
    setCollection((prev) =>
      prev.map((item) =>
        savedCustomizations[item.id] ? { ...item, customizations: savedCustomizations[item.id] } : item,
      ),
    )
  }, [])

  // Add this useEffect to update isInitialDataLoaded whenever any data is available
  useEffect(() => {
    if (trending.length > 0 || popularMovies.length > 0 || popularTVShows.length > 0 || popularBooks.length > 0) {
      setIsInitialDataLoaded(true)
    }
  }, [trending, popularMovies, popularTVShows, popularBooks])

  // ------------------ Local Storage Sync ------------------
  useEffect(() => {
    storage.set(STORAGE_KEYS.collection, collection)
  }, [collection])

  useEffect(() => {
    try {
      const savedHidden = storage.get<HiddenItem[]>(STORAGE_KEYS.hiddenItems, [])
      const currentTime = Date.now()
      const filteredHidden = savedHidden.filter((h) => currentTime - h.timestamp < 14 * 24 * 60 * 60 * 1000)
      setHiddenItems(filteredHidden)
      storage.set(STORAGE_KEYS.hiddenItems, filteredHidden)
    } catch (e) {
      console.error("Error loading hidden items:", e)
      storage.set(STORAGE_KEYS.hiddenItems, [])
    }
  }, [])

  useEffect(() => {
    const customTags = tags.filter((t) => t.isCustom)
    storage.set(STORAGE_KEYS.tags, customTags)
  }, [tags])

  useEffect(() => {
    storage.set(STORAGE_KEYS.itemTags, itemTags)
  }, [itemTags])

  // ------------------ Data Refresh Functions ------------------
  const refreshTrending = useCallback(async () => {
    setIsTrendingLoading(true)
    setIsBooksLoading(true)
    setIsLoading(true)

    try {
      const trendingData = await fetchTrending().catch((err) => {
        console.error("Error refreshing trending:", err)
        return []
      })
      let booksData: MediaItem[] = []
      try {
        booksData = await fetchPopularBooks()
      } catch (error) {
        console.error("Error refreshing books:", error)
      }
      // Combine trending and some books for variety
      const combinedTrending = [...trendingData]
      if (booksData.length > 0) {
        const numBooks = Math.floor(Math.random() * 3) + 3
        const randomBooks = [...booksData].sort(() => 0.5 - Math.random()).slice(0, numBooks)
        combinedTrending.push(...randomBooks)
        combinedTrending.sort(() => 0.5 - Math.random())
      }
      setTrending(combinedTrending)
      setPopularBooks(booksData)
      setCurrentPage(1)
      setHasMore(true)
    } catch (error) {
      console.error("Error refreshing trending data:", error)
    } finally {
      setIsTrendingLoading(false)
      setIsBooksLoading(false)
      setIsLoading(false)
    }
  }, [])

  const loadMoreTrending = useCallback(async () => {
    if (isTrendingLoading || !hasMore) return
    setIsTrendingLoading(true)
    setIsLoading(true)
    try {
      const nextPage = currentPage + 1
      const moreTrending = await fetchTrending(nextPage).catch((err) => {
        console.error("Error loading more trending:", err)
        return []
      })
      if (moreTrending.length === 0) {
        setHasMore(false)
      } else {
        setTrending((prev) => [...prev, ...moreTrending])
        setCurrentPage(nextPage)
      }
    } catch (error) {
      console.error("Error loading more trending data:", error)
    } finally {
      setIsTrendingLoading(false)
      setIsLoading(false)
    }
  }, [isTrendingLoading, hasMore, currentPage])

  const loadMoreMovies = useCallback(async () => {
    if (isLoadingMovies || !hasMoreMovies) return Promise.resolve()
    setIsLoadingMovies(true)
    try {
      const nextPage = Math.ceil(popularMovies.length / 20) + 1
      const moreMovies = await fetchPopularMovies(nextPage).catch((err) => {
        console.error("Error loading more movies:", err)
        return []
      })
      if (moreMovies.length === 0) {
        setHasMoreMovies(false)
      } else {
        setPopularMovies((prev) => [...prev, ...moreMovies])
      }
    } catch (error) {
      console.error("Error loading more movies:", error)
    } finally {
      setIsLoadingMovies(false)
    }
  }, [isLoadingMovies, hasMoreMovies, popularMovies])

  const loadMoreTVShows = useCallback(async () => {
    if (isLoadingTVShows || !hasMoreTVShows) return Promise.resolve()
    setIsLoadingTVShows(true)
    try {
      const nextPage = Math.ceil(popularTVShows.length / 20) + 1
      const moreTVShows = await fetchPopularTVShows(nextPage).catch((err) => {
        console.error("Error loading more TV shows:", err)
        return []
      })
      if (moreTVShows.length === 0) {
        setHasMoreTVShows(false)
      } else {
        setPopularTVShows((prev) => [...prev, ...moreTVShows])
      }
    } catch (error) {
      console.error("Error loading more TV shows:", error)
    } finally {
      setIsLoadingTVShows(false)
    }
  }, [isLoadingTVShows, hasMoreTVShows, popularTVShows])

  const loadMoreBooks = useCallback(async () => {
    if (isLoadingBooks || !hasMoreBooks) return Promise.resolve()
    setIsLoadingBooks(true)
    try {
      const nextPage = Math.ceil(popularBooks.length / 10) + 1
      const moreBooks = await fetchPopularBooks(nextPage).catch((err) => {
        console.error("Error loading more books:", err)
        return []
      })
      if (moreBooks.length === 0) {
        setHasMoreBooks(false)
      } else {
        setPopularBooks((prev) => [...prev, ...moreBooks])
      }
    } catch (error) {
      console.error("Error loading more books:", error)
    } finally {
      setIsLoadingBooks(false)
    }
  }, [isLoadingBooks, hasMoreBooks, popularBooks])

  const searchForMedia = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([])
        return
      }
      if (query === lastSearchQuery && isSearching) return

      const controller = new AbortController()
      const signal = controller.signal
      if (prevControllerRef.current) {
        prevControllerRef.current.abort()
      }
      prevControllerRef.current = controller

      setIsSearching(true)
      setLastSearchQuery(query)
      try {
        const [tmdbResults, bookResults] = await Promise.all([
          searchMedia(query).catch((err) => {
            if (err.name !== "AbortError") console.error("Error searching TMDB:", err)
            return []
          }),
          searchBooks(query).catch((err) => {
            if (err.name !== "AbortError") console.error("Error searching books:", err)
            return []
          }),
        ])
        if (!signal.aborted) {
          const combined = [...tmdbResults, ...bookResults]
          setSearchResults(combined)
          setSearchPage(1)
          setHasMore(combined.length >= 20)
        }
      } catch (error) {
        if (error.name !== "AbortError") console.error("Error searching media:", error)
      } finally {
        if (!signal.aborted) setIsSearching(false)
      }
    },
    [lastSearchQuery, isSearching],
  )

  const loadMoreSearchResults = useCallback(
    async (query: string) => {
      if (isSearching || !hasMore) return
      const controller = new AbortController()
      const signal = controller.signal
      setIsSearching(true)
      try {
        const nextPage = searchPage + 1
        const [tmdbResults, bookResults] = await Promise.all([
          searchMedia(query, nextPage).catch((err) => {
            if (err.name !== "AbortError") console.error("Error loading more TMDB:", err)
            return []
          }),
          searchBooks(query, nextPage).catch((err) => {
            if (err.name !== "AbortError") console.error("Error loading more books:", err)
            return []
          }),
        ])
        if (!signal.aborted) {
          const moreResults = [...tmdbResults, ...bookResults]
          if (moreResults.length === 0) {
            setHasMore(false)
          } else {
            setSearchResults((prev) => [...prev, ...moreResults])
            setSearchPage(nextPage)
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") console.error("Error loading more search results:", error)
      } finally {
        if (!signal.aborted) setIsSearching(false)
      }
    },
    [isSearching, hasMore, searchPage],
  )

  const prevControllerRef = useRef<AbortController | null>(null)

  // ------------------ Collection Actions ------------------
  const addToCollection = useCallback(
    (item: MediaItem) => {
      if (!collection.some((i) => i.id === item.id)) {
        const customizations = item.customizations || { borderEffect: "none", overlay: "none", stickers: [] }
        const savedCustomizations = storage.get<Record<string, MediaItem["customizations"]>>(
          STORAGE_KEYS.customizations,
          {},
        )
        const itemWithCollection = {
          ...item,
          isInCollection: true,
          customizations: savedCustomizations[item.id] || customizations,
          addedAt: Date.now(),
        }
        setCollection((prev) => [...prev, itemWithCollection])
      }
    },
    [collection],
  )

  const removeFromCollection = useCallback((id: string) => {
    setCollection((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const updateMediaCustomization = useCallback((id: string, customizations: any, updatedMedia?: MediaItem) => {
    setCollection((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          // If updatedMedia is provided, use its coverImage
          const coverImage = updatedMedia?.coverImage || item.coverImage
          return {
            ...item,
            coverImage, // Update the cover image if provided
            customizations: { ...item.customizations, ...customizations },
            ...customizations,
          }
        }
        return item
      }),
    )
    const saved = storage.get<Record<string, MediaItem["customizations"]>>(STORAGE_KEYS.customizations, {})
    const updated = { ...saved, [id]: { ...(saved[id] || {}), ...customizations } }
    storage.set(STORAGE_KEYS.customizations, updated)

    // If we have an updated media with a new cover image, save that separately
    if (updatedMedia?.coverImage) {
      const mediaCovers = storage.get<Record<string, string>>("mediaCoverImages", {})
      mediaCovers[id] = updatedMedia.coverImage
      storage.set("mediaCoverImages", mediaCovers)
    }
  }, [])

  // Hide item actions and tag management functions
  const hideItem = useCallback((id: string) => {
    setHiddenItems((prev) => [...prev, { id, timestamp: Date.now() }])
  }, [])

  const isItemHidden = useCallback((id: string) => hiddenItems.some((item) => item.id === id), [hiddenItems])

  const addTagToItem = useCallback((itemId: string, tagId: string) => {
    setItemTags((prev) => {
      const current = prev[itemId] || []
      if (!current.includes(tagId)) {
        return { ...prev, [itemId]: [...current, tagId] }
      }
      return prev
    })
  }, [])

  const removeTagFromItem = useCallback((itemId: string, tagId: string) => {
    setItemTags((prev) => {
      const current = prev[itemId] || []
      if (current.includes(tagId)) {
        return { ...prev, [itemId]: current.filter((id) => id !== tagId) }
      }
      return prev
    })
  }, [])

  const getItemTags = useCallback((itemId: string) => itemTags[itemId] || [], [itemTags])

  const createTag = useCallback(
    (name: string): string | null => {
      if (!name.trim() || name.length > 40 || tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase()))
        return null
      const id = `custom-${Date.now()}`
      const newTag: Tag = { id, name, isCustom: true }
      setTags((prev) => [...prev, newTag])
      return id
    },
    [tags],
  )

  const getAllTags = useCallback(() => tags, [tags])
  const getTagById = useCallback((id: string) => tags.find((tag) => tag.id === id), [tags])

  // ------------------ Preloading and Customization ------------------
  const preloadInitialData = useCallback(async () => {
    if (isPreloadingRef.current) return
    isPreloadingRef.current = true

    // Always fetch fresh data for the Discover page, regardless of what's in the registry
    setIsTrendingLoading(true)
    setIsMoviesLoading(true)
    setIsTVShowsLoading(true)
    setIsBooksLoading(true)
    setIsLoading(true)
    try {
      const [trendingData, moviesData, tvData, booksData] = await Promise.all([
        fetchTrending().catch((err) => {
          console.error("Error fetching trending:", err)
          return []
        }),
        fetchPopularMovies().catch((err) => {
          console.error("Error fetching movies:", err)
          return []
        }),
        fetchPopularTVShows().catch((err) => {
          console.error("Error fetching TV shows:", err)
          return []
        }),
        fetchPopularBooks().catch((err) => {
          console.error("Error fetching books:", err)
          return []
        }),
      ])
      setTrending(trendingData)
      setPopularMovies(moviesData)
      setPopularTVShows(tvData)
      setPopularBooks(booksData)
      setCurrentPage(1)
      setHasMore(true)
      setIsInitialDataLoaded(true)
    } catch (error) {
      console.error("Error preloading initial data:", error)
    } finally {
      setIsTrendingLoading(false)
      setIsMoviesLoading(false)
      setIsTVShowsLoading(false)
      setIsBooksLoading(false)
      setIsLoading(false)
      isPreloadingRef.current = false
    }
  }, [])

  // ------------------ Media With Latest Customizations ------------------
  const getMediaWithLatestCustomizations = useCallback(
    (mediaItem: MediaItem | null): MediaItem | null => {
      if (!mediaItem) return null
      const collectionItem = collection.find((item) => item.id === mediaItem.id)
      return collectionItem ? { ...mediaItem, customizations: collectionItem.customizations || {} } : mediaItem
    },
    [collection],
  )

  // ------------------ Context Value ------------------
  const value: MediaContextType = {
    trending,
    popularMovies,
    popularTVShows,
    popularBooks,
    collection,
    searchResults,
    isLoading,
    isTrendingLoading,
    isMoviesLoading,
    isTVShowsLoading,
    isBooksLoading,
    isSearching,
    hasMore,
    currentPage,
    refreshTrending,
    loadMoreTrending,
    searchForMedia,
    loadMoreSearchResults,
    addToCollection,
    removeFromCollection,
    updateMediaCustomization,
    hiddenItems,
    tags,
    itemTags,
    hideItem,
    isItemHidden,
    addTagToItem,
    removeTagFromItem,
    getItemTags,
    createTag,
    getAllTags,
    getTagById,
    preloadInitialData,
    getMediaWithLatestCustomizations,
    setTrending: (items: MediaItem[]) => {
      setTrending(items)
      setIsTrendingLoading(false)
      setIsLoading(false)
      if (items.length > 0) setIsInitialDataLoaded(true)
    },
    setPopularMovies: (items: MediaItem[]) => {
      setPopularMovies(items)
      setIsMoviesLoading(false)
      setIsLoadingMovies(false)
      if (items.length > 0 && trending.length > 0) setIsInitialDataLoaded(true)
    },
    setPopularTVShows: (items: MediaItem[]) => {
      setPopularTVShows(items)
      setIsTVShowsLoading(false)
      setIsLoadingTVShows(false)
      if (items.length > 0 && trending.length > 0) setIsInitialDataLoaded(true)
    },
    setPopularBooks: (items: MediaItem[]) => {
      setPopularBooks(items)
      setIsBooksLoading(false)
      setIsLoadingBooks(false)
      if (items.length > 0 && trending.length > 0) setIsInitialDataLoaded(true)
    },
    isInitialDataLoaded,
  }

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
}

export function useMedia() {
  const context = useContext(MediaContext)
  if (context === undefined) {
    throw new Error("useMedia must be used within a MediaProvider")
  }
  return context
}
