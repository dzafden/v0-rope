"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Bomb } from "lucide-react"
import { useMedia } from "@/context/media-context"
import {
  fetchTrending,
  fetchPopularMovies,
  fetchPopularTVShows,
  fetchClassicMovies,
  fetchClassicTVShows,
} from "@/lib/tmdb-api"
import { fetchPopularBooks } from "@/lib/openlibrary-api"
import { useOnboarding } from "@/context/onboarding-context"
import storage from "@/lib/storage"
import { MediaRegistry } from "@/lib/media-registry"
import { DiscoveryGameRegistry } from "@/lib/discovery-game-registry"

import type { Item } from "@/types/media"

const TOTAL_QUESTIONS = 7

interface Choice {
  id: string
  text: string
  value: string
}

interface Question {
  id: string
  question: string
  choices: Choice[]
}

const QUESTIONS: Question[] = [
  {
    id: "initial",
    question: "Ready?",
    choices: [
      { id: "yes", text: "Yes", value: "yes" },
      { id: "no", text: "No", value: "no" },
    ],
  },
  {
    id: "media-types",
    question: "What types of media do you collect?",
    choices: [
      { id: "movies", text: "Movies", value: "movies" },
      { id: "tv", text: "TV Shows", value: "tv" },
      { id: "both", text: "Both", value: "both" },
      { id: "other", text: "Other", value: "other" },
    ],
  },
  {
    id: "collection-size",
    question: "How large is your current collection?",
    choices: [
      { id: "small", text: "Under 50", value: "small" },
      { id: "medium", text: "50-200", value: "medium" },
      { id: "large", text: "200-500", value: "large" },
      { id: "massive", text: "500+", value: "massive" },
    ],
  },
  {
    id: "organization-priority",
    question: "What matters most in organizing?",
    choices: [
      { id: "visual", text: "Visual Appeal", value: "visual" },
      { id: "metadata", text: "Detailed Info", value: "metadata" },
      { id: "discovery", text: "Easy Discovery", value: "discovery" },
      { id: "tracking", text: "Track Progress", value: "tracking" },
    ],
  },
  {
    id: "sharing",
    question: "Do you plan to share your collection?",
    choices: [
      { id: "yes-public", text: "Yes, publicly", value: "yes-public" },
      { id: "yes-friends", text: "Yes, with friends", value: "yes-friends" },
      { id: "no-private", text: "No, keep private", value: "no-private" },
    ],
  },
  {
    id: "tracking-preference",
    question: "What do you want to track?",
    choices: [
      { id: "watched", text: "What I've watched", value: "watched" },
      { id: "wishlist", text: "What I want to watch", value: "wishlist" },
      { id: "ratings", text: "My ratings", value: "ratings" },
      { id: "all", text: "All of the above", value: "all" },
    ],
  },
  {
    id: "customization",
    question: "How much customization do you want?",
    choices: [
      { id: "minimal", text: "Keep it simple", value: "minimal" },
      { id: "moderate", text: "Some options", value: "moderate" },
      { id: "extensive", text: "Full control", value: "extensive" },
    ],
  },
]

interface OnboardingGameProps {
  onComplete: (answers: Record<string, string>) => void
}

// ** UPDATES END HERE **

// ------------------------------------------------------------------
// Types and Constants
// ------------------------------------------------------------------
interface Block {
  id: string
  title: string
  coverImage: string
  type: "movie" | "tv" | "book"
  row: number
  col: number
  overview?: string
  releaseDate?: string
  rating?: number
}

const GRID_COLS = 4
const MAX_ROWS = 5 // Cards are taller
const INITIAL_ROWS = 2
const ROW_INTERVAL = 5000
const STORAGE_KEY = "onboardingSeenCards"
const MIN_MEDIA_TO_START = GRID_COLS * INITIAL_ROWS

// ------------------------------------------------------------------
// OnboardingGame Component
// ------------------------------------------------------------------
export default function OnboardingGame({
  onComplete,
  standalone = false,
  onExit,
}: {
  onComplete: (answers: Record<string, string>) => void // Updated to accept answers
  standalone?: boolean
  onExit?: () => void
}) {
  // Media and game state
  const {
    addToCollection,
    preloadInitialData,
    loadMoreTrending,
    loadMoreMovies,
    loadMoreTVShows,
    loadMoreBooks,
    setTrending,
    setPopularMovies,
    setPopularTVShows,
    setPopularBooks,
    isInitialDataLoaded,
    collection,
  } = useMedia()
  const { excludedTitles, addMultipleExcludedTitles } = useOnboarding()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [rowIntervalState, setRowIntervalState] = useState(ROW_INTERVAL)
  const [collectedTitles, setCollectedTitles] = useState<string[]>([])
  const [totalCollectedTitles, setTotalCollectedTitles] = useState<string[]>([])
  const [countdown, setCountdown] = useState(ROW_INTERVAL / 1000)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const [bombUsesLeft, setBombUsesLeft] = useState<number[]>(Array(GRID_COLS).fill(2))
  const [explodingColumns, setExplodingColumns] = useState<Set<number>>(new Set())
  const [titlesToExclude, setTitlesToExclude] = useState<string[]>([])
  const [isPreloading, setIsPreloading] = useState(false)
  const [runGameOverEffect, setRunGameOverEffect] = useState(false)
  const [isLoadingInitialMedia, setIsLoadingInitialMedia] = useState(true)
  const [isLoadingAdditionalMedia, setIsLoadingAdditionalMedia] = useState(false)
  const [intentionalDelay, setIntentionalDelay] = useState(true)
  const [showCollectionAnimation, setShowCollectionAnimation] = useState(false)
  const [collectedItem, setCollectedItem] = useState<Block | null>(null)
  const [rowsAddedSinceLastLoad, setRowsAddedSinceLastLoad] = useState(0)
  const [isLoadingMoreMedia, setIsLoadingMoreMedia] = useState(false)
  const [hasSharedInitialData, setHasSharedInitialData] = useState(false)
  const [recycledItemsCount, setRecycledItemsCount] = useState(0)

  // ** UPDATES START HERE **
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isAnimating, setIsAnimating] = useState(false)
  const [showCountdown, setShowCountdown] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewItems, setPreviewItems] = useState<Item[]>([])
  // ** UPDATES END HERE **

  // Create a registry instance for this game
  const [registry] = useState(() => {
    if (standalone) {
      // Use the specialized DiscoveryGameRegistry for standalone mode
      // This will automatically exclude collection items and previously seen items
      const previouslySeenItems = DiscoveryGameRegistry.getPreviouslySeenItemIds()
      const registry = new DiscoveryGameRegistry(collection, previouslySeenItems)

      // Ensure the registry doesn't share its data with the Discover page
      registry.setShareWithDiscover(false)

      return registry
    } else {
      // For onboarding mode, use the regular MediaRegistry
      const registry = new MediaRegistry([], excludedTitles)
      return registry
    }
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const preloadingInitiatedRef = useRef(false)
  const backgroundLoadingRef = useRef(false)
  const dataSharedRef = useRef(false)

  // Process excluded titles from this session.
  useEffect(() => {
    if (titlesToExclude.length > 0) {
      addMultipleExcludedTitles(titlesToExclude)
      // Also exclude them in our registry
      titlesToExclude.forEach((id) => registry.excludeItem(id))
      setTitlesToExclude([])
    }
  }, [titlesToExclude, addMultipleExcludedTitles, registry])

  // Share media data with MediaContext when we have enough
  const shareMediaWithContext = useCallback(() => {
    if (dataSharedRef.current) return false

    // For standalone mode, don't share data with MediaContext
    // This prevents the game's diverse/obscure content from affecting the Discover page
    if (standalone) {
      dataSharedRef.current = true
      setHasSharedInitialData(true)
      return true
    }

    const allItems = registry.getAllItems()
    console.log(`[OnboardingGame] Sharing ${allItems.length} media items with MediaContext`)

    // Share data even with fewer items - don't wait for 20 items
    if (allItems.length > 0) {
      // Filter and categorize media from the registry
      const movies = allItems.filter((item) => item.type === "movie")
      const tvShows = allItems.filter((item) => item.type === "tv")
      const books = allItems.filter((item) => item.type === "book")

      // Create a diverse trending list
      const trendingItems = []
      // Add some movies (40%)
      trendingItems.push(...movies.slice(0, Math.min(8, movies.length)))
      // Add some TV shows (40%)
      trendingItems.push(...tvShows.slice(0, Math.min(8, tvShows.length)))
      // Add some books (20%)
      trendingItems.push(...books.slice(0, Math.min(4, books.length)))

      // Shuffle the trending list for variety
      const shuffledTrending = [...trendingItems].sort(() => 0.5 - Math.random())

      // Update MediaContext with already loaded data
      if (movies.length > 0) {
        setPopularMovies(movies.slice(0, Math.min(20, movies.length)))
      }

      if (tvShows.length > 0) {
        setPopularTVShows(tvShows.slice(0, Math.min(20, tvShows.length)))
      }

      if (books.length > 0) {
        setPopularBooks(books.slice(0, Math.min(20, books.length)))
      }

      if (shuffledTrending.length > 0) {
        setTrending(shuffledTrending.slice(0, Math.min(20, shuffledTrending.length)))
      }

      console.log(
        `[OnboardingGame] Shared ${movies.length} movies, ${tvShows.length} TV shows, ${books.length} books with MediaContext`,
      )

      dataSharedRef.current = true
      setHasSharedInitialData(true)
      return true
    }
    return false
  }, [registry, setPopularMovies, setPopularTVShows, setPopularBooks, setTrending, standalone])

  // Load seen cards from storage and initial media.
  useEffect(() => {
    try {
      const storedSeenCards = storage.get(STORAGE_KEY, [])
      if (storedSeenCards.length > 0) {
        // Mark stored cards as used in the registry
        storedSeenCards.forEach((id) => registry.markAsUsed(id))
      }
    } catch (error) {
      console.error("Error loading seen cards:", error)
      localStorage.removeItem(STORAGE_KEY)
    }

    const loadInitialMedia = async () => {
      // If MediaContext already has data loaded, don't fetch again
      if (isInitialDataLoaded) {
        setIsLoadingInitialMedia(false)
        return
      }

      setIsLoadingInitialMedia(true)
      try {
        const [popularMovies1, popularTVShows1, classicMovies] = await Promise.all([
          fetchPopularMovies(1).catch(() => []),
          fetchPopularTVShows(1).catch(() => []),
          fetchClassicMovies().catch(() => []),
        ])

        // Add fetched media to registry
        const moviesAdded = registry.addItems(popularMovies1)
        const tvShowsAdded = registry.addItems(popularTVShows1)
        const classicsAdded = registry.addItems(classicMovies)

        console.log(`Added to registry: ${moviesAdded} movies, ${tvShowsAdded} TV shows, ${classicsAdded} classics`)
        console.log(`Registry stats:`, registry.getStats())

        // Share data as soon as we have any results
        if (popularMovies1.length > 0) {
          setPopularMovies(popularMovies1)
        }

        if (popularTVShows1.length > 0) {
          setPopularTVShows(popularTVShows1)
        }

        // Mark pages as loaded
        registry.markPageAsLoaded("movies", 1)
        registry.markPageAsLoaded("tvShows", 1)

        // Share initial data with MediaContext immediately
        setTimeout(() => {
          shareMediaWithContext()
        }, 0)

        loadAdditionalMediaInBackground()
      } catch (error) {
        console.error("Error loading initial media:", error)
      } finally {
        setIsLoadingInitialMedia(false)
      }
    }

    const loadAdditionalMediaInBackground = async () => {
      if (backgroundLoadingRef.current) return
      backgroundLoadingRef.current = true
      setIsLoadingAdditionalMedia(true)
      try {
        const results = await Promise.allSettled([
          fetchClassicTVShows().catch(() => []),
          fetchTrending(1).catch(() => []),
          fetchPopularBooks(1).catch(() => []),
          fetchPopularMovies(2).catch(() => []),
          fetchPopularTVShows(2).catch(() => []),
        ])
        const [classicTVShows = [], trending1 = [], books1 = [], popularMovies2 = [], popularTVShows2 = []] =
          results.map((result) => (result.status === "fulfilled" ? result.value : []))

        // Add all fetched media to registry
        const classicsAdded = registry.addItems(classicTVShows)
        const trendingAdded = registry.addItems(trending1)
        const booksAdded = registry.addItems(books1)
        const movies2Added = registry.addItems(popularMovies2)
        const tvShows2Added = registry.addItems(popularTVShows2)

        console.log(
          `Added to registry: ${classicsAdded} classic TV, ${trendingAdded} trending, ${booksAdded} books, ` +
            `${movies2Added} movies (page 2), ${tvShows2Added} TV shows (page 2)`,
        )
        console.log(`Registry stats:`, registry.getStats())

        // Mark pages as loaded
        registry.markPageAsLoaded("trending", 1)
        registry.markPageAsLoaded("books", 1)
        registry.markPageAsLoaded("movies", 2)
        registry.markPageAsLoaded("tvShows", 2)

        // Share with MediaContext if we haven't already
        setTimeout(() => {
          if (!dataSharedRef.current && registry.getStats().uniqueItems >= 20) {
            shareMediaWithContext()
          }
        }, 0)

        loadMoreMediaInBackground()
      } catch (error) {
        console.error("Error loading additional media:", error)
      } finally {
        setIsLoadingAdditionalMedia(false)
        backgroundLoadingRef.current = false
      }
    }

    const loadMoreMediaInBackground = async () => {
      try {
        const randomMoviePage = Math.floor(Math.random() * 5) + 5
        const randomTVPage = Math.floor(Math.random() * 5) + 5
        const randomBookPage = Math.floor(Math.random() * 3) + 3
        const randomTrendingPage = Math.floor(Math.random() * 3) + 3

        const results = await Promise.allSettled([
          fetchPopularMovies(randomMoviePage).catch(() => []),
          fetchPopularTVShows(randomTVPage).catch(() => []),
          fetchPopularBooks(randomBookPage).catch(() => []),
          fetchTrending(randomTrendingPage).catch(() => []),
        ])
        const [moreMovies = [], moreTVShows = [], moreBooks = [], moreTrending = []] = results.map((result) =>
          result.status === "fulfilled" ? result.value : [],
        )

        // Add all fetched media to registry
        const moviesAdded = registry.addItems(moreMovies)
        const tvShowsAdded = registry.addItems(moreTVShows)
        const booksAdded = registry.addItems(moreBooks)
        const trendingAdded = registry.addItems(moreTrending)

        console.log(
          `Added to registry: ${moviesAdded} movies (page ${randomMoviePage}), ` +
            `${tvShowsAdded} TV shows (page ${randomTVPage}), ` +
            `${booksAdded} books (page ${randomBookPage}), ` +
            `${trendingAdded} trending (page ${randomTrendingPage})`,
        )
        console.log(`Registry stats:`, registry.getStats())

        // Mark pages as loaded
        registry.markPageAsLoaded("movies", randomMoviePage)
        registry.markPageAsLoaded("tvShows", randomTVPage)
        registry.markPageAsLoaded("books", randomBookPage)
        registry.markPageAsLoaded("trending", randomTrendingPage)

        // Share with MediaContext if we haven't already
        setTimeout(() => {
          if (!dataSharedRef.current && registry.getStats().uniqueItems >= 40) {
            shareMediaWithContext()
          }
        }, 0)
      } catch (error) {
        console.error("Error loading more media for game:", error)
      }
    }

    loadInitialMedia()
    const timeoutId = setTimeout(() => setIsLoadingInitialMedia(false), 5000)
    return () => clearTimeout(timeoutId)
  }, [isInitialDataLoaded, shareMediaWithContext, setPopularMovies, setPopularTVShows, registry])

  const addToSeenCards = (cardId: string) => {
    try {
      // Mark as used in registry
      registry.markAsUsed(cardId)

      // Also update localStorage for persistence
      const currentSeenCards = storage.get(STORAGE_KEY, [])
      if (!currentSeenCards.includes(cardId)) {
        currentSeenCards.push(cardId)
        storage.set(STORAGE_KEY, currentSeenCards)
      }
    } catch (error) {
      console.error("Error updating seen cards:", error)
    }
  }

  const loadMoreMediaForGame = useCallback(async () => {
    if (isLoadingMoreMedia) return
    setIsLoadingMoreMedia(true)
    try {
      console.log("Loading more media for the game...")

      // Get next unloaded pages for each type
      const randomMoviePage = registry.getNextUnloadedPage("movies")
      const randomTVPage = registry.getNextUnloadedPage("tvShows")
      const randomBookPage = registry.getNextUnloadedPage("books")
      const randomTrendingPage = registry.getNextUnloadedPage("trending")

      const results = await Promise.allSettled([
        fetchPopularMovies(randomMoviePage).catch(() => []),
        fetchPopularTVShows(randomTVPage).catch(() => []),
        fetchPopularBooks(randomBookPage).catch(() => []),
        fetchTrending(randomTrendingPage).catch(() => []),
      ])
      const [moreMovies = [], moreTVShows = [], moreBooks = [], moreTrending = []] = results.map((result) =>
        result.status === "fulfilled" ? result.value : [],
      )

      // Add all fetched media to registry
      const moviesAdded = registry.addItems(moreMovies)
      const tvShowsAdded = registry.addItems(moreTVShows)
      const booksAdded = registry.addItems(moreBooks)
      const trendingAdded = registry.addItems(moreTrending)

      console.log(
        `Added to registry: ${moviesAdded} movies (page ${randomMoviePage}), ` +
          `${tvShowsAdded} TV shows (page ${randomTVPage}), ` +
          `${booksAdded} books (page ${randomBookPage}), ` +
          `${trendingAdded} trending (page ${randomTrendingPage})`,
      )
      console.log(`Registry stats:`, registry.getStats())

      // Mark pages as loaded
      registry.markPageAsLoaded("movies", randomMoviePage)
      registry.markPageAsLoaded("tvShows", randomTVPage)
      registry.markPageAsLoaded("books", randomBookPage)
      registry.markPageAsLoaded("trending", randomTrendingPage)

      // Share with MediaContext if we haven't already
      setTimeout(() => {
        if (!dataSharedRef.current && registry.getStats().uniqueItems >= 40) {
          shareMediaWithContext()
        }
      }, 0)
    } catch (error) {
      console.error("Error loading more media for game:", error)
    } finally {
      setIsLoadingMoreMedia(false)
    }
  }, [isLoadingMoreMedia, shareMediaWithContext, registry])

  // Force recycle items when running low
  const forceRecycleItems = useCallback(
    (count: number) => {
      // Force recycling of items
      registry.configureRecycling({ enabled: true, threshold: 0, minItemsBeforeRecycling: 0 })
      const recycledItems = registry.recycleItems(count)
      console.log("Forcibly recycled", recycledItems.length, "items")
      setRecycledItemsCount((prev) => prev + recycledItems.length)
      return recycledItems.length
    },
    [registry],
  )

  const startGame = () => {
    if (registry.getStats().uniqueItems < MIN_MEDIA_TO_START && isLoadingInitialMedia) {
      console.log("Not enough items to start game, waiting for more data...")
      // Force load more media and try again after a delay
      loadMoreMediaForGame()
      setTimeout(() => startGame(), 2000)
      return
    }

    startPreloading()
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setLevel(1)
    setRowIntervalState(ROW_INTERVAL)
    setCollectedTitles([])
    setBombUsesLeft(Array(GRID_COLS).fill(2))
    setExplodingColumns(new Set())
    setCountdown(Math.round(ROW_INTERVAL / 1000))
    setRowsAddedSinceLastLoad(0)
    setRecycledItemsCount(0)

    // If we're running low on available items, load more or recycle
    const availableCount = registry.getStats().availableItems
    if (availableCount < GRID_COLS * INITIAL_ROWS * 2) {
      console.log("Low on available items (", availableCount, "), loading more...")
      loadMoreMediaForGame()
    }

    const initialBlocks: Block[] = []

    // Get available items from registry
    const availableItems = registry.getAvailableItemsBatch(GRID_COLS * INITIAL_ROWS)

    // If we don't have enough items, force recycling and try again
    if (availableItems.length < GRID_COLS * INITIAL_ROWS) {
      console.log("Not enough items for initial blocks, forcing recycling...")
      forceRecycleItems(GRID_COLS * INITIAL_ROWS * 2)

      // Try again with recycled items
      const recycledAvailableItems = registry.getAvailableItemsBatch(GRID_COLS * INITIAL_ROWS)

      // If we still don't have enough, try one more time after a delay
      if (recycledAvailableItems.length < GRID_COLS * INITIAL_ROWS) {
        setTimeout(() => startGame(), 1000)
        return
      }
    }

    // Create a map to track which columns have items in each row
    const filledPositions = new Map<number, Set<number>>() // row -> Set of columns

    // Get available items from registry (after possible recycling)
    const finalAvailableItems = registry.getAvailableItemsBatch(GRID_COLS * INITIAL_ROWS)

    // Place items in the grid, starting from the bottom rows
    for (let row = MAX_ROWS - 1; row >= MAX_ROWS - INITIAL_ROWS; row--) {
      filledPositions.set(row, new Set<number>())

      // Try to fill each column in this row
      for (let col = 0; col < GRID_COLS; col++) {
        if (finalAvailableItems.length > 0) {
          const item = finalAvailableItems.shift()!
          initialBlocks.push({ ...item, row, col })
          filledPositions.get(row)!.add(col)

          // Mark this item as used in the registry
          registry.markAsUsed(item.id)
        }
      }
    }

    setBlocks(initialBlocks)

    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      addNewRow()
      setCountdown(ROW_INTERVAL / 1000)
    }, rowIntervalState)
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)
  }

  const startPreloading = useCallback(() => {
    if (preloadingInitiatedRef.current || isPreloading) return
    preloadingInitiatedRef.current = true
    setIsPreloading(true)
    console.log("Starting aggressive preloading of media data...")

    // If we already have enough data in the registry, share it immediately
    if (!dataSharedRef.current && registry.getStats().uniqueItems >= 20) {
      shareMediaWithContext()
    }
    // Still call preloadInitialData to ensure MediaContext is properly initialized
    ;(async () => {
      try {
        // Only call preloadInitialData if we haven't already shared our data
        if (!dataSharedRef.current) {
          await preloadInitialData()
          console.log("Initial data preloading complete")
        }

        // Load more data in the background
        Promise.all([loadMoreTrending?.(), loadMoreMovies?.(), loadMoreTVShows?.(), loadMoreBooks?.()]).catch((err) => {
          console.log("Background loading completed with errors:", err)
        })
      } catch (error) {
        console.error("Error during preloading:", error)
      } finally {
        setIsPreloading(false)
      }
    })()
  }, [
    isPreloading,
    preloadInitialData,
    loadMoreTrending,
    loadMoreMovies,
    loadMoreTVShows,
    loadMoreBooks,
    registry,
    shareMediaWithContext,
  ])

  const addNewRow = () => {
    setBlocks((prevBlocks) => {
      const topRowBlocks = prevBlocks.filter((block) => block.row <= 0)
      if (topRowBlocks.length > 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (countdownRef.current) clearInterval(countdownRef.current)
        setGameOver(true)
        setCountdown(Math.ceil(countdown))
        setRunGameOverEffect(true)

        // Mark all remaining blocks as used when game ends
        prevBlocks.forEach((block) => {
          registry.markAsUsed(block.id)
        })

        return prevBlocks
      }

      const movedBlocks = prevBlocks.map((block) => ({ ...block, row: block.row - 1 }))
      const newRowBlocks: Block[] = []
      const row = MAX_ROWS - 1

      // Track rows added since last media load
      setRowsAddedSinceLastLoad((prev) => {
        const newCount = prev + 1
        // If we've added 10 rows, load more media
        if (newCount >= 10) {
          loadMoreMediaForGame()
          return 0
        }
        return newCount
      })

      // Create a Set of existing IDs to prevent duplicates
      const existingIds = new Set(prevBlocks.map((block) => block.id))

      // Get available items from registry
      let availableItems = registry.getAvailableItemsBatch(GRID_COLS)

      // If we don't have enough unique items, force recycling
      if (availableItems.length < GRID_COLS) {
        console.log("Not enough items for new row (", availableItems.length, "/", GRID_COLS, "), forcing recycling...")
        forceRecycleItems(GRID_COLS * 2)

        // Try again with recycled items
        availableItems = registry.getAvailableItemsBatch(GRID_COLS)

        // If we still don't have enough, try loading more media
        if (availableItems.length < GRID_COLS) {
          loadMoreMediaForGame()
        }
      }

      // If we still don't have any items, end the game
      if (availableItems.length === 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (countdownRef.current) clearInterval(countdownRef.current)
        setGameOver(true)
        setRunGameOverEffect(true)
        return prevBlocks
      }

      // Fill as many columns as possible with available items
      const filledColumns = new Set<number>()

      // First pass: try to fill all columns with unique items
      for (let col = 0; col < GRID_COLS; col++) {
        // Find an item that's not already in the grid
        let foundItem = false
        for (let i = 0; i < availableItems.length; i++) {
          const item = availableItems[i]

          // Skip this item if it's already in the grid
          if (existingIds.has(item.id)) {
            continue
          }

          // Use this item for this column
          newRowBlocks.push({ ...item, row, col })
          // Mark this item as used in the registry
          registry.markAsUsed(item.id)
          existingIds.add(item.id)
          filledColumns.add(col)

          // Remove this item from availableItems
          availableItems.splice(i, 1)
          foundItem = true
          break
        }

        // If we couldn't find a unique item for this column, we'll handle it in the second pass
        if (!foundItem && availableItems.length > 0) {
          // Use any available item, even if it's a duplicate
          const item = availableItems.shift()!
          newRowBlocks.push({ ...item, row, col })
          // Mark this item as used in the registry
          registry.markAsUsed(item.id)
          filledColumns.add(col)
        }
      }

      // Check if we need to fill any remaining columns
      if (filledColumns.size < GRID_COLS) {
        console.log("Could only fill", filledColumns.size, "/", GRID_COLS, "columns in new row")
      }

      return [...movedBlocks, ...newRowBlocks]
    })
  }

  const handleBlockClick = (block: Block, e: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    e.preventDefault()
    e.stopPropagation()

    // Immediately disable pointer events on this block to prevent multiple clicks
    const target = e.currentTarget as HTMLElement
    target.style.pointerEvents = "none"

    // Add a visual effect before removing the block
    triggerCollectionEffect(block)

    // Mark the block as seen
    addToSeenCards(block.id)
    setTitlesToExclude((prev) => [...prev, block.id])

    // Update the registry with the interaction
    if (standalone) {
      // For standalone mode, track that the user recognized this item
      ;(registry as DiscoveryGameRegistry).addToGameHistory(block, true, false, true)
    } else {
      // For onboarding mode, just mark as used
      registry.markAsUsed(block.id)
    }

    // Remove the block immediately
    removeBlock(block)
  }

  const triggerCollectionEffect = (block: Block) => {
    setCollectedItem(block)
    setShowCollectionAnimation(true)
    setTimeout(() => {
      setShowCollectionAnimation(false)
      setCollectedItem(null)
    }, 1500)
  }

  const removeBlock = (block: Block) => {
    // Add to collection
    addToCollection(block)

    // Update state
    setCollectedTitles((prev) => [...prev, block.id])
    setTotalCollectedTitles((prev) => [...prev, block.id])
    setScore((prev) => prev + 10)

    // Remove the block from the grid
    setBlocks((prevBlocks) => {
      // First filter out the clicked block
      const newBlocks = prevBlocks.filter((b) => b.id !== block.id)

      // Then handle blocks that need to fall
      const blocksToFall = newBlocks.filter((b) => b.col === block.col && b.row < block.row)

      if (blocksToFall.length > 0) {
        // Sort from bottom to top
        blocksToFall.sort((a, b) => b.row - a.row)

        let currentRow = block.row
        blocksToFall.forEach((fallingBlock) => {
          fallingBlock.row = currentRow
          currentRow--
        })
      }

      return newBlocks
    })
  }

  const handleBombClick = (col: number) => {
    if (bombUsesLeft[col] <= 0) return
    const newBombUsesLeft = [...bombUsesLeft]
    newBombUsesLeft[col] -= 1
    setBombUsesLeft(newBombUsesLeft)
    setExplodingColumns((prev) => {
      const updated = new Set(prev)
      updated.add(col)
      return updated
    })
    setTimeout(() => {
      setBlocks((prevBlocks) => {
        const blocksInColumn = prevBlocks.filter((block) => block.col === col)
        blocksInColumn.forEach((block) => {
          addToSeenCards(block.id)
          setTitlesToExclude((prev) => [...prev, block.id])

          // Update the registry with the explosion
          if (standalone) {
            // For standalone mode, track that this item was exploded
            ;(registry as DiscoveryGameRegistry).addToGameHistory(block, false, true, false)
          } else {
            // For onboarding mode, just mark as used
            registry.markAsUsed(block.id)
          }
        })
        setScore((prev) => prev + blocksInColumn.length * 10)
        return prevBlocks.filter((block) => block.col !== col)
      })
      setTimeout(() => {
        setExplodingColumns((prev) => {
          const updated = new Set(prev)
          updated.delete(col)
          return updated
        })
        setCountdown(Math.ceil(countdown))
      }, 500)
    }, 500)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  // Add this code near the beginning of the component to initialize the registry with collection items
  // Add this after the registry initialization

  // Update the game stats when game ends
  useEffect(() => {
    if (gameOver && collectedTitles.length > 0) {
      // Save game stats
      const currentStats = storage.get<{ highScore: number; totalCollected: number }>("gameStats", {
        highScore: 0,
        totalCollected: 0,
      })

      const newHighScore = Math.max(currentStats.highScore, collectedTitles.length)
      const newTotalCollected = currentStats.totalCollected + collectedTitles.length

      storage.set("gameStats", {
        highScore: newHighScore,
        totalCollected: newTotalCollected,
      })
    }
  }, [gameOver, collectedTitles.length])

  // Add this useEffect to ensure we load media immediately in standalone mode
  useEffect(() => {
    if (standalone && !isLoadingInitialMedia && registry.getStats().uniqueItems < MIN_MEDIA_TO_START) {
      console.log("Standalone mode: Loading initial media...")
      loadMoreMediaForGame()
    }
  }, [standalone, isLoadingInitialMedia, registry, loadMoreMediaForGame])

  // Add this useEffect after the existing useEffects in the component
  useEffect(() => {
    // Only load discovery game data in standalone mode
    if (standalone && registry instanceof DiscoveryGameRegistry) {
      // Load discovery game data
      ;(registry as DiscoveryGameRegistry).loadDiscoveryGameData().catch(console.error)
    }
  }, [standalone, registry])

  // ** UPDATES START HERE **
  // Background preload of preview data
  useEffect(() => {
    if (currentQuestion === QUESTIONS.length - 1 && !preloadingInitiatedRef.current) {
      preloadingInitiatedRef.current = true
      setIsPreloading(true)

      fetch("/api/items?limit=8")
        .then((res) => res.json())
        .then((data) => {
          setPreviewItems(data.items || [])
          setIsPreloading(false)
        })
        .catch((error) => {
          console.error("Failed to preload preview:", error)
          setIsPreloading(false)
        })
    }
  }, [currentQuestion])

  // Trigger countdown on first mount
  useEffect(() => {
    setShowCountdown(true)
  }, [])

  // Countdown timer
  useEffect(() => {
    if (showCountdown && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false)
    }
  }, [showCountdown, countdown])

  // Update progress based on current question
  useEffect(() => {
    if (currentQuestion === 0 && !showCountdown) {
      setProgress(0)
    } else if (!showCountdown) {
      setProgress(((currentQuestion + 1) / TOTAL_QUESTIONS) * 100)
    }
  }, [currentQuestion, showCountdown])

  const handleAnswer = useCallback(
    (choiceValue: string) => {
      if (isAnimating) return

      const question = QUESTIONS[currentQuestion]
      const newAnswers = { ...answers, [question.id]: choiceValue }
      setAnswers(newAnswers)
      setIsAnimating(true)

      setTimeout(() => {
        if (currentQuestion < QUESTIONS.length - 1) {
          setCurrentQuestion(currentQuestion + 1)
          setIsAnimating(false)
        } else {
          // Share data with background preloading
          if (!dataSharedRef.current) {
            dataSharedRef.current = true
            // Data is already being fetched in background
            if (previewItems.length > 0 || !isPreloading) {
              setTimeout(() => {
                onComplete(newAnswers)
              }, 500)
            } else {
              // Wait for background loading to complete
              const checkInterval = setInterval(() => {
                if (!isPreloading) {
                  clearInterval(checkInterval)
                  onComplete(newAnswers)
                }
              }, 100)
            }
          }
        }
      }, 300)
    },
    [currentQuestion, answers, isAnimating, onComplete, previewItems, isPreloading],
  )
  // ** UPDATES END HERE **

  // ** CHANGED CODE START **
  // Use the onExit prop when standalone and onExit is provided, otherwise use handleOnboardingComplete
  const handleClose = standalone && onExit ? onExit : () => {} // Placeholder for handleOnboardingComplete

  const canStartGame = !isLoadingInitialMedia && !isPreloading && registry.getStats().uniqueItems >= MIN_MEDIA_TO_START

  const gridWidth = 300 // Example width, adjust as needed
  const gridHeight = 400 // Example height, adjust as needed
  const blockWidth = gridWidth / GRID_COLS
  const blockHeight = gridHeight / MAX_ROWS
  const gridDimensions = { width: gridWidth, height: gridHeight }

  const getTotalCollectedCount = () => {
    return storage.get<{ highScore: number; totalCollected: number }>("gameStats", {
      highScore: 0,
      totalCollected: 0,
    }).totalCollected
  }
  // ** CHANGED CODE END **

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
      <div
        ref={gameContainerRef}
        className="relative w-full h-full max-w-xl mx-auto flex flex-col items-center justify-center p-2"
      >
        <motion.button
          className="absolute top-4 right-4 z-50 bg-zinc-800 rounded-full p-2"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClose} // Use the new handleClose function
        >
          <X className="w-5 h-5" />
        </motion.button>

        {!gameStarted ? (
          // ** CHANGED CODE START **
          // Render the onboarding questions when the game hasn't started
          showCountdown ? (
            <div className="flex items-center justify-center min-h-screen bg-background">
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-9xl font-bold text-primary"
              >
                {countdown}
              </motion.div>
            </div>
          ) : (
            <motion.div
              className="absolute inset-0 bg-transparent z-0 flex flex-col items-center justify-center text-center overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative w-full max-w-2xl p-8">
                <motion.h2
                  className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 text-transparent bg-clip-text"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {standalone ? "Media Collector Game" : "How to Play"}
                </motion.h2>

                <div className="flex justify-center mb-8">
                  <div className="relative h-32 w-full max-w-xs">
                    {registry.getAllItems().length >= 4 ? (
                      <>
                        {registry
                          .getAllItems()
                          .slice(0, 4)
                          .map((media, index) => (
                            <motion.div
                              key={`preview-${media.id}`}
                              className="absolute bottom-0 w-16 h-24 rounded-lg overflow-hidden border-2 border-purple-500/50 shadow-lg"
                              style={{
                                left: `${index * 25}%`,
                                backgroundImage: `url(${media.coverImage})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                zIndex: 4 - index,
                              }}
                              initial={{ y: 50, opacity: 0, rotateZ: index % 2 === 0 ? -5 : 5 }}
                              animate={{ y: 0, opacity: 1, rotateZ: index % 2 === 0 ? -5 : 5 }}
                              transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                              whileHover={{ y: -10, scale: 1.05, rotateZ: 0 }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                              <div className="absolute bottom-1 left-0 right-0 text-center">
                                <p className="text-[8px] font-medium truncate px-1">{media.title}</p>
                              </div>
                            </motion.div>
                          ))}
                      </>
                    ) : (
                      <>
                        <motion.div
                          className="absolute bottom-0 left-0 w-16 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg border-2 border-purple-500/50 shadow-lg"
                          initial={{ y: 50, opacity: 0, rotateZ: -5 }}
                          animate={{ y: 0, opacity: 1, rotateZ: -5 }}
                          transition={{ delay: 0.2, type: "spring" }}
                          whileHover={{ y: -10, scale: 1.05, rotateZ: 0 }}
                        />
                        <motion.div
                          className="absolute bottom-0 left-[25%] w-16 h-24 bg-gradient-to-br from-pink-600 to-purple-600 rounded-lg border-2 border-purple-500/50 shadow-lg"
                          initial={{ y: 50, opacity: 0, rotateZ: 5 }}
                          animate={{ y: 0, opacity: 1, rotateZ: 5 }}
                          transition={{ delay: 0.3, type: "spring" }}
                          whileHover={{ y: -10, scale: 1.05, rotateZ: 0 }}
                        />
                        <motion.div
                          className="absolute bottom-0 left-[50%] w-16 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg border-2 border-purple-500/50 shadow-lg"
                          initial={{ y: 50, opacity: 0, rotateZ: -5 }}
                          animate={{ y: 0, opacity: 1, rotateZ: -5 }}
                          transition={{ delay: 0.4, type: "spring" }}
                          whileHover={{ y: -10, scale: 1.05, rotateZ: 0 }}
                        />
                        <motion.div
                          className="absolute bottom-0 left-[75%] w-16 h-24 bg-gradient-to-br from-pink-600 to-purple-600 rounded-lg border-2 border-purple-500/50 shadow-lg"
                          initial={{ y: 50, opacity: 0, rotateZ: 5 }}
                          animate={{ y: 0, opacity: 1, rotateZ: 5 }}
                          transition={{ delay: 0.5, type: "spring" }}
                          whileHover={{ y: -10, scale: 1.05, rotateZ: 0 }}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-5 mb-8">
                  <motion.div
                    className="flex items-center bg-gradient-to-r from-purple-700/70 to-indigo-600/50 p-3 rounded-xl border border-purple-500/50 shadow-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="bg-purple-600 rounded-full p-2 mr-3">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      >
                        👆
                      </motion.div>
                    </div>
                    <p className="text-sm text-left text-zinc-200">Tap cards you recognize to collect them</p>
                  </motion.div>

                  <motion.div
                    className="flex items-center bg-gradient-to-r from-pink-700/70 to-rose-600/50 p-3 rounded-xl border border-pink-500/50 shadow-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="bg-red-600 rounded-full p-2 mr-3">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      >
                        💣
                      </motion.div>
                    </div>
                    <p className="text-sm text-left text-zinc-200">Use bombs to clear entire columns</p>
                  </motion.div>

                  <motion.div
                    className="flex items-center bg-gradient-to-r from-amber-700/70 to-orange-600/50 p-3 rounded-xl border border-amber-500/50 shadow-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="bg-amber-600 rounded-full p-2 mr-3">
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      >
                        ⚠️
                      </motion.div>
                    </div>
                    <p className="text-sm text-left text-zinc-200">Game ends when cards reach the top</p>
                  </motion.div>
                </div>

                <div className="flex flex-col items-center gap-4 mt-8">
                  <motion.button
                    className="relative overflow-hidden px-6 py-3 rounded-full font-bold shadow-lg w-40 text-white"
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(168, 85, 247, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    disabled={!canStartGame}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"
                      animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
                      transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: [-200, 200] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
                    />
                    <span className="relative z-10">
                      {!canStartGame ? (
                        <span className="flex items-center justify-center">
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                          Loading...
                        </span>
                      ) : (
                        "Start Game"
                      )}
                    </span>
                  </motion.button>

                  <motion.button
                    className="text-zinc-400 px-6 py-2 rounded-full text-sm hover:text-white w-40"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose} // Use the new handleClose function
                  >
                    {standalone ? "Exit Game" : "Skip"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )
          // ** CHANGED CODE END **
        ) : (
          <>
            <div className="w-full flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-400">This Game</span>
                  <motion.span
                    className="text-xl font-bold"
                    key={`current-${collectedTitles.length}`}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {collectedTitles.length}
                  </motion.span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-400">Total Collected</span>
                  <motion.span
                    className="text-xl font-bold text-purple-400"
                    key={`total-${totalCollectedTitles.length}`}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {totalCollectedTitles.length}
                  </motion.span>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-full" style={{ maxWidth: gridDimensions.width }}>
              {!gameOver && (
                <div className="flex justify-around mb-2 px-1">
                  {Array(GRID_COLS)
                    .fill(0)
                    .map((_, col) => (
                      <motion.button
                        key={`bomb-${col}`}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          bombUsesLeft[col] <= 0
                            ? "bg-zinc-700 opacity-50 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-500 shadow-lg"
                        }`}
                        whileHover={bombUsesLeft[col] > 0 ? { scale: 1.1 } : {}}
                        whileTap={bombUsesLeft[col] > 0 ? { scale: 0.9 } : {}}
                        onClick={() => handleBombClick(col)}
                        disabled={bombUsesLeft[col] <= 0}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{
                          y: 0,
                          opacity: 1,
                          rotate: bombUsesLeft[col] > 0 ? [0, -5, 5, -3, 3, 0] : 0,
                        }}
                        transition={{
                          y: { delay: col * 0.1, type: "spring", stiffness: 300, damping: 15 },
                          rotate: {
                            repeat: bombUsesLeft[col] > 0 ? Number.POSITIVE_INFINITY : 0,
                            repeatType: "reverse",
                            duration: 2,
                            delay: col * 0.2,
                          },
                        }}
                      >
                        <div className="relative flex items-center justify-center">
                          <Bomb
                            className={`w-5 h-5 ${bombUsesLeft[col] <= 0 ? "text-zinc-400" : "text-white"}`}
                            fill={bombUsesLeft[col] <= 0 ? "none" : "currentColor"}
                          />
                          {bombUsesLeft[col] > 0 && (
                            <span className="absolute text-red-600 font-bold text-[8px]" style={{ marginTop: "1px" }}>
                              {bombUsesLeft[col]}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                </div>
              )}

              <div
                className="relative bg-zinc-900 rounded-xl border-2 border-zinc-700 overflow-hidden"
                style={{
                  width: gridDimensions.width,
                  height: gridDimensions.height,
                }}
              >
                <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
                  {[...Array(GRID_COLS - 1)].map((_, i) => (
                    <div key={`col-${i}`} className="border-r border-zinc-800 h-full"></div>
                  ))}
                </div>

                <div className="absolute top-0 left-0 right-0 h-[12.5%] bg-gradient-to-b from-red-500/40 to-transparent pointer-events-none border-b border-red-500/50"></div>

                <AnimatePresence>
                  {Array.from(explodingColumns).map((col) => (
                    <motion.div
                      key={`explosion-${col}`}
                      className="absolute z-20 pointer-events-none"
                      style={{
                        left: col * blockWidth,
                        top: 0,
                        width: blockWidth,
                        height: gridDimensions.height,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.5 } }}
                    >
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={`particle-${col}-${i}`}
                          className="absolute rounded-full bg-orange-500"
                          style={{
                            left: "50%",
                            top: "50%",
                            width: Math.random() * 20 + 5,
                            height: Math.random() * 20 + 5,
                          }}
                          initial={{ x: 0, y: 0, scale: 0, backgroundColor: "#ef4444" }}
                          animate={{
                            x: (Math.random() - 0.5) * blockWidth * 2,
                            y: (Math.random() - 0.5) * blockHeight * 4,
                            scale: Math.random() * 3 + 1,
                            backgroundColor: ["#ef4444", "#f97316", "#eab308", "#f97316"],
                          }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      ))}
                      <motion.div
                        className="absolute left-1/2 top-1/2 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 opacity-70"
                        style={{ x: "-50%", y: "-50%" }}
                        initial={{ width: 0, height: 0 }}
                        animate={{ width: blockWidth * 2, height: gridDimensions.height * 1.5 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                <AnimatePresence mode="popLayout">
                  {blocks.map((block) => (
                    <motion.div
                      key={block.id}
                      layout
                      className="absolute overflow-hidden rounded-xl shadow-lg cursor-pointer"
                      style={{
                        width: blockWidth - 10,
                        height: blockHeight - 2,
                        left: block.col * blockWidth + 5,
                        top: block.row * blockHeight + 1,
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3, ease: "easeOut" } }}
                      transition={{ type: "spring", damping: 20 }}
                      onClick={(e) => {
                        // Call handleBlockClick with the event
                        handleBlockClick(block, e)
                      }}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div
                        className="w-full h-full bg-cover bg-center relative border border-zinc-700 rounded-xl overflow-hidden"
                        style={{
                          backgroundImage: `url(${block.coverImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center top",
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
                          <p className="text-[0.6rem] font-medium truncate">{block.title}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="w-full mt-4 flex items-center space-x-4">
              <div className="relative w-3/4 h-3 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-purple-500"
                  style={{
                    width: `${(Math.max(0, Math.min(countdown, rowIntervalState / 1000)) / (rowIntervalState / 1000)) * 100}%`,
                  }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                />
              </div>
              <div className="flex items-center justify-end w-1/4">
                <span className="text-sm text-zinc-400 mr-2">Next Row</span>
                <div className="h-8 w-8 rounded-full border-2 border-purple-500 flex items-center justify-center">
                  <span className="text-lg font-bold">{Math.ceil(countdown)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        <AnimatePresence>
          {gameOver && (
            <motion.div
              className="absolute inset-0 bg-purple-900/50 backdrop-blur-md flex items-center justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-purple-900/70 backdrop-blur-md rounded-2xl p-8 w-full max-w-md text-center shadow-xl border border-purple-500/30 mx-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                  <span className="text-5xl mb-4 block">🎉</span>
                  <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 text-transparent bg-clip-text">
                    Good Job!
                  </h2>
                  <p className="text-zinc-300 mb-2">
                    You've collected <span className="text-purple-400 font-bold">{collectedTitles.length}</span> titles
                    in this game!
                  </p>
                  <p className="text-zinc-400 text-sm mb-6">
                    Total unique titles collected:{" "}
                    <span className="text-purple-300 font-bold">{getTotalCollectedCount()}</span>
                  </p>
                </motion.div>

                <div className="flex flex-col items-center gap-4 mt-6">
                  <motion.button
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-bold shadow-lg w-full max-w-[200px]"
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(168, 85, 247, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0 rgba(168, 85, 247, 0)",
                        "0 0 15px rgba(168, 85, 247, 0.5)",
                        "0 0 0 rgba(168, 85, 247, 0)",
                      ],
                    }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", duration: 2 }}
                    onClick={startGame}
                  >
                    Play Again
                  </motion.button>

                  <motion.button
                    className="bg-white text-purple-700 px-6 py-3 rounded-full font-bold shadow-lg w-full max-w-[200px] flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", duration: 1.5, delay: 0.5 }}
                    onClick={handleClose} // Use the new handleClose function
                  >
                    {isPreloading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Preparing...</span>
                      </>
                    ) : (
                      <span>{standalone ? "Exit Game" : "Continue"}</span>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
