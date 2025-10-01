import { MediaRegistry } from "./media-registry"
import type { MediaItem } from "@/types"
import { fetchTopRatedMovies, fetchTopRatedTVShows, fetchGenreMovies, fetchGenreTVShows } from "./tmdb-api"
import { fetchCriticallyAcclaimedBooks } from "./openlibrary-api"
import storage from "./storage"

/**
 * Content strategy configuration for the discovery game
 */
export interface ContentStrategyConfig {
  prioritizeNew: boolean // Prioritize newer releases
  diversityWeight: number // 0-1 value for how much to diversify content (genres, types)
  obscurityLevel: number // 0-1 value for how obscure/mainstream content should be
  preferredGenres?: string[] // User's preferred genres based on collection
  excludeYears?: number[] // Years to exclude (e.g., if user prefers older/newer content)
  mediaTypeDistribution?: {
    movie: number // Weight for movies (0-1)
    tv: number // Weight for TV shows (0-1)
    book: number // Weight for books (0-1)
  }
}

/**
 * Game history item tracking what the user has seen in previous games
 */
export interface GameHistoryItem {
  id: string // Media ID
  timestamp: number // When it was shown
  interacted: boolean // Whether user clicked/interacted with it
  exploded: boolean // Whether it was removed via bomb
  mediaType: "movie" | "tv" | "book" // Type of media
  recognized: boolean // Whether user recognized it (clicked on it)
  genres?: string[] // Genres of the item
  releaseYear?: number // Release year if available
}

/**
 * Success rate tracking for different content types
 */
export interface SuccessRateStats {
  movie: {
    seen: number
    recognized: number
    rate: number
  }
  tv: {
    seen: number
    recognized: number
    rate: number
  }
  book: {
    seen: number
    recognized: number
    rate: number
  }
  byDecade: Record<
    string,
    {
      seen: number
      recognized: number
      rate: number
    }
  >
  byGenre: Record<
    string,
    {
      seen: number
      recognized: number
      rate: number
    }
  >
}

/**
 * Genre weight information for content selection
 */
interface GenreWeight {
  id: string
  name: string
  weight: number // 0-1 value
  recognitionRate?: number // How often user recognizes this genre
}

/**
 * DiscoveryGameRegistry - Specialized registry for the standalone game
 * Focuses on discovering new content rather than recognizing classics
 */
export class DiscoveryGameRegistry extends MediaRegistry {
  private contentStrategy: ContentStrategyConfig
  private gameHistory: GameHistoryItem[]
  private collectionIds: Set<string>
  private genrePreferences: Map<string, number> // Genre ID -> weight
  private successRates: SuccessRateStats
  private sessionCount: number // Number of game sessions played
  private genreWeights: GenreWeight[] // Weighted genres for selection
  private shareWithDiscover = false

  /**
   * Create a new DiscoveryGameRegistry
   * @param collection User's collection items
   * @param previouslySeenItems IDs of items previously seen in games
   * @param contentStrategy Content strategy configuration
   */
  constructor(
    collection: MediaItem[] = [],
    previouslySeenItems: string[] = [],
    contentStrategy: Partial<ContentStrategyConfig> = {},
  ) {
    // Initialize base registry with empty items but exclude collection and previously seen items
    super([], [...collection.map((item) => item.id), ...previouslySeenItems])

    // Store collection IDs for quick lookup
    this.collectionIds = new Set(collection.map((item) => item.id))

    // Load game history from storage
    this.gameHistory = DiscoveryGameRegistry.loadGameHistory()

    // Configure recycling to be more aggressive for discovery
    this.configureRecycling({
      enabled: true,
      threshold: 12,
      minItemsBeforeRecycling: 4,
    })

    // Set default content strategy
    this.contentStrategy = {
      prioritizeNew: true,
      diversityWeight: 0.7,
      obscurityLevel: 0.3,
      mediaTypeDistribution: {
        movie: 0.4,
        tv: 0.4,
        book: 0.2,
      },
      ...contentStrategy,
    }

    // Initialize genre preferences from collection
    this.genrePreferences = this.analyzeCollectionGenres(collection)

    // Load success rates from storage
    this.successRates = this.loadSuccessRates()

    // Load session count
    this.sessionCount = storage.get<number>("gameSessionCount", 0)

    // Initialize genre weights
    this.genreWeights = this.calculateGenreWeights()

    // Update content strategy based on success rates
    this.adjustContentStrategyFromSuccessRates()
  }

  /**
   * Set whether this registry should share its data with the Discover page
   */
  public setShareWithDiscover(share: boolean): void {
    this.shareWithDiscover = share
  }

  /**
   * Check if this registry should share its data with the Discover page
   */
  public shouldShareWithDiscover(): boolean {
    return this.shareWithDiscover
  }

  /**
   * Analyze the user's collection to determine genre preferences
   */
  private analyzeCollectionGenres(collection: MediaItem[]): Map<string, number> {
    const genreCounts = new Map<string, number>()
    const mediaTypeCounts = { movie: 0, tv: 0, book: 0 }

    // Count genres and media types in collection
    collection.forEach((item) => {
      // Count media type
      mediaTypeCounts[item.type]++

      // Count genres
      if (item.genres) {
        item.genres.forEach((genre) => {
          const count = genreCounts.get(genre) || 0
          genreCounts.set(genre, count + 1)
        })
      }
    })

    // Convert counts to weights
    const totalItems = Math.max(1, collection.length)
    const genreWeights = new Map<string, number>()

    genreCounts.forEach((count, genre) => {
      genreWeights.set(genre, count / totalItems)
    })

    // Adjust content strategy based on collection distribution
    if (collection.length > 10) {
      const total = mediaTypeCounts.movie + mediaTypeCounts.tv + mediaTypeCounts.book
      if (total > 0) {
        this.contentStrategy.mediaTypeDistribution = {
          movie: Math.max(0.2, mediaTypeCounts.movie / total),
          tv: Math.max(0.2, mediaTypeCounts.tv / total),
          book: Math.max(0.1, mediaTypeCounts.book / total),
        }

        // Normalize to ensure they sum to 1
        const sum =
          this.contentStrategy.mediaTypeDistribution.movie +
          this.contentStrategy.mediaTypeDistribution.tv +
          this.contentStrategy.mediaTypeDistribution.book

        this.contentStrategy.mediaTypeDistribution.movie /= sum
        this.contentStrategy.mediaTypeDistribution.tv /= sum
        this.contentStrategy.mediaTypeDistribution.book /= sum
      }
    }

    return genreWeights
  }

  /**
   * Calculate genre weights for content selection
   */
  private calculateGenreWeights(): GenreWeight[] {
    const weights: GenreWeight[] = []

    // Convert genre preferences to array
    this.genrePreferences.forEach((weight, id) => {
      weights.push({
        id,
        name: id, // We don't have genre names here, just IDs
        weight,
      })
    })

    // Add recognition rates from success rates
    Object.entries(this.successRates.byGenre).forEach(([genre, stats]) => {
      const existingGenre = weights.find((g) => g.id === genre)
      if (existingGenre) {
        existingGenre.recognitionRate = stats.rate
      } else {
        weights.push({
          id: genre,
          name: genre,
          weight: 0.1, // Default low weight for genres not in collection
          recognitionRate: stats.rate,
        })
      }
    })

    // Sort by weight (descending)
    return weights.sort((a, b) => b.weight - a.weight)
  }

  /**
   * Update content strategy configuration
   */
  public updateContentStrategy(config: Partial<ContentStrategyConfig>): void {
    this.contentStrategy = {
      ...this.contentStrategy,
      ...config,
    }
  }

  /**
   * Increment session count
   */
  public incrementSessionCount(): void {
    this.sessionCount++
    storage.set("gameSessionCount", this.sessionCount)

    // Gradually increase obscurity as user plays more sessions
    if (this.sessionCount > 5) {
      const newObscurity = Math.min(0.8, 0.3 + this.sessionCount * 0.02)
      this.updateContentStrategy({
        obscurityLevel: newObscurity,
      })
    }
  }

  /**
   * Add game history item - tracks what the user has seen in the game
   */
  public addToGameHistory(item: MediaItem, interacted = false, exploded = false, recognized = false): void {
    // Add to excluded items in the registry
    this.excludeItem(item.id)

    // Extract release year if available
    let releaseYear: number | undefined
    if (item.releaseDate) {
      const year = Number.parseInt(item.releaseDate.substring(0, 4))
      if (!isNaN(year)) {
        releaseYear = year
      }
    }

    // Add to game history
    const historyItem: GameHistoryItem = {
      id: item.id,
      timestamp: Date.now(),
      interacted,
      exploded,
      mediaType: item.type,
      recognized,
      genres: item.genres,
      releaseYear,
    }

    this.gameHistory.push(historyItem)

    // Update success rates
    this.updateSuccessRates(historyItem)

    // Save updated history to storage
    this.saveGameHistory()
  }

  /**
   * Update success rates based on game history item
   */
  private updateSuccessRates(historyItem: GameHistoryItem): void {
    const { mediaType, recognized, genres, releaseYear } = historyItem

    // Update media type stats
    this.successRates[mediaType].seen++
    if (recognized) {
      this.successRates[mediaType].recognized++
    }
    this.successRates[mediaType].rate = this.successRates[mediaType].recognized / this.successRates[mediaType].seen

    // Update decade stats if we have release year
    if (releaseYear) {
      const decade = `${Math.floor(releaseYear / 10) * 10}s`

      if (!this.successRates.byDecade[decade]) {
        this.successRates.byDecade[decade] = { seen: 0, recognized: 0, rate: 0 }
      }

      this.successRates.byDecade[decade].seen++
      if (recognized) {
        this.successRates.byDecade[decade].recognized++
      }
      this.successRates.byDecade[decade].rate =
        this.successRates.byDecade[decade].recognized / this.successRates.byDecade[decade].seen
    }

    // Update genre stats if we have genres
    if (genres && genres.length > 0) {
      genres.forEach((genre) => {
        if (!this.successRates.byGenre[genre]) {
          this.successRates.byGenre[genre] = { seen: 0, recognized: 0, rate: 0 }
        }

        this.successRates.byGenre[genre].seen++
        if (recognized) {
          this.successRates.byGenre[genre].recognized++
        }
        this.successRates.byGenre[genre].rate =
          this.successRates.byGenre[genre].recognized / this.successRates.byGenre[genre].seen
      })
    }

    // Recalculate genre weights
    this.genreWeights = this.calculateGenreWeights()

    // Save updated success rates
    this.saveSuccessRates()
  }

  /**
   * Adjust content strategy based on success rates
   */
  private adjustContentStrategyFromSuccessRates(): void {
    // If we don't have enough data, don't adjust
    const totalSeen = this.successRates.movie.seen + this.successRates.tv.seen + this.successRates.book.seen

    if (totalSeen < 20) return

    // Find the media type with highest recognition rate
    const movieRate = this.successRates.movie.rate || 0
    const tvRate = this.successRates.tv.rate || 0
    const bookRate = this.successRates.book.rate || 0

    // Find preferred genres (genres with highest recognition rates)
    const preferredGenres = Object.entries(this.successRates.byGenre)
      .filter(([_, stats]) => stats.seen >= 5) // Only consider genres with enough data
      .sort((a, b) => b[1].rate - a[1].rate)
      .slice(0, 3)
      .map(([genre]) => genre)

    // Find preferred decades
    const preferredDecades = Object.entries(this.successRates.byDecade)
      .filter(([_, stats]) => stats.seen >= 5) // Only consider decades with enough data
      .sort((a, b) => b[1].rate - a[1].rate)
      .slice(0, 2)
      .map(([decade]) => decade)

    // Update content strategy based on success rates
    this.updateContentStrategy({
      preferredGenres,
      // Adjust obscurity level - if user recognizes a lot, increase obscurity
      obscurityLevel: Math.min(0.9, Math.max(0.1, (movieRate + tvRate + bookRate) / 3 + 0.2)),
    })

    // Adjust media type distribution based on recognition rates
    // If user recognizes one type more than others, slightly reduce its weight
    const avgRate = (movieRate + tvRate + bookRate) / 3
    const distribution = { ...this.contentStrategy.mediaTypeDistribution }

    if (movieRate > avgRate * 1.2) {
      distribution.movie = Math.max(0.2, distribution.movie * 0.9)
    }
    if (tvRate > avgRate * 1.2) {
      distribution.tv = Math.max(0.2, distribution.tv * 0.9)
    }
    if (bookRate > avgRate * 1.2) {
      distribution.book = Math.max(0.1, distribution.book * 0.9)
    }

    // Normalize to ensure they sum to 1
    const sum = distribution.movie + distribution.tv + distribution.book
    distribution.movie /= sum
    distribution.tv /= sum
    distribution.book /= sum

    this.updateContentStrategy({
      mediaTypeDistribution: distribution,
    })
  }

  /**
   * Save game history to localStorage
   */
  private saveGameHistory(): void {
    // Limit history size to prevent localStorage bloat
    const recentHistory = this.gameHistory.sort((a, b) => b.timestamp - a.timestamp).slice(0, 500) // Keep only the 500 most recent items

    storage.set("gameHistory", recentHistory)
  }

  /**
   * Load game history from storage
   */
  public static loadGameHistory(): GameHistoryItem[] {
    return storage.get<GameHistoryItem[]>("gameHistory", [])
  }

  /**
   * Get IDs of previously seen items
   */
  public static getPreviouslySeenItemIds(): string[] {
    const history = DiscoveryGameRegistry.loadGameHistory()
    return history.map((item) => item.id)
  }

  /**
   * Save success rates to localStorage
   */
  private saveSuccessRates(): void {
    storage.set("gameSuccessRates", this.successRates)
  }

  /**
   * Load success rates from localStorage
   */
  private loadSuccessRates(): SuccessRateStats {
    const defaultStats: SuccessRateStats = {
      movie: { seen: 0, recognized: 0, rate: 0 },
      tv: { seen: 0, recognized: 0, rate: 0 },
      book: { seen: 0, recognized: 0, rate: 0 },
      byDecade: {},
      byGenre: {},
    }

    return storage.get<SuccessRateStats>("gameSuccessRates", defaultStats)
  }

  /**
   * Get success rate statistics
   */
  public getSuccessRates(): SuccessRateStats {
    return this.successRates
  }

  /**
   * Load discovery game data - combines multiple sources based on content strategy
   */
  public async loadDiscoveryGameData(): Promise<void> {
    try {
      // Track loaded items for this session
      const loadedItems: MediaItem[] = []

      // Load top-rated content
      const [topMovies, topTVShows, criticalBooks] = await Promise.all([
        this.fetchTopRatedContent("movie"),
        this.fetchTopRatedContent("tv"),
        this.fetchCriticallyAcclaimedBooks(),
      ])

      // Add items to registry
      const moviesAdded = this.addItems(topMovies)
      const tvShowsAdded = this.addItems(topTVShows)
      const booksAdded = this.addItems(criticalBooks)

      console.log(
        `Added to discovery registry: ${moviesAdded} top movies, ${tvShowsAdded} top TV shows, ${booksAdded} acclaimed books`,
      )

      // If we have preferred genres, load genre-specific content
      if (this.contentStrategy.preferredGenres?.length) {
        await this.loadGenreSpecificContent()
      }

      // If we need more variety, load some trending content
      if (this.getStats().availableItems < 20) {
        await this.loadSupplementaryContent()
      }

      console.log("Discovery game registry stats:", this.getStats())
    } catch (error) {
      console.error("Error loading discovery game data:", error)
    }
  }

  /**
   * Fetch top-rated content based on media type
   */
  private async fetchTopRatedContent(type: "movie" | "tv"): Promise<MediaItem[]> {
    try {
      // Determine which page to load based on obscurity level
      // Higher obscurity = deeper pages with less mainstream content
      const obscurityFactor = Math.floor(this.contentStrategy.obscurityLevel * 10) + 1
      const page = Math.max(1, Math.min(10, obscurityFactor))

      if (type === "movie") {
        return await fetchTopRatedMovies(page)
      } else {
        return await fetchTopRatedTVShows(page)
      }
    } catch (error) {
      console.error(`Error fetching top-rated ${type} content:`, error)
      return []
    }
  }

  /**
   * Fetch critically acclaimed books
   */
  private async fetchCriticallyAcclaimedBooks(): Promise<MediaItem[]> {
    try {
      return await fetchCriticallyAcclaimedBooks()
    } catch (error) {
      console.error("Error fetching critically acclaimed books:", error)
      return []
    }
  }

  /**
   * Load genre-specific content based on user preferences
   */
  private async loadGenreSpecificContent(): Promise<void> {
    if (!this.contentStrategy.preferredGenres?.length) return

    try {
      // Get top 3 preferred genres
      const topGenres = this.contentStrategy.preferredGenres.slice(0, 3)

      // Load content for each genre
      for (const genre of topGenres) {
        const [genreMovies, genreTVShows] = await Promise.all([fetchGenreMovies(genre), fetchGenreTVShows(genre)])

        this.addItems(genreMovies)
        this.addItems(genreTVShows)
      }
    } catch (error) {
      console.error("Error loading genre-specific content:", error)
    }
  }

  /**
   * Load supplementary content if we need more variety
   */
  private async loadSupplementaryContent(): Promise<void> {
    // Implementation will depend on what additional API methods we add
    // This is a placeholder for now
    console.log("Loading supplementary content for discovery game")
  }

  /**
   * Get items for the game, ensuring a good mix of content types
   * using the weighted selection algorithm
   */
  public getGameItems(count: number): MediaItem[] {
    const availableItems = this.getAvailableItems()

    // If we don't have enough items, return what we have
    if (availableItems.length <= count) {
      return availableItems
    }

    // Apply the weighted selection algorithm
    return this.weightedSelectionAlgorithm(availableItems, count)
  }

  /**
   * Weighted selection algorithm that ensures content diversity
   * while prioritizing genres the user enjoys
   */
  private weightedSelectionAlgorithm(items: MediaItem[], count: number): MediaItem[] {
    // Step 1: Group items by media type
    const movieItems = items.filter((item) => item.type === "movie")
    const tvItems = items.filter((item) => item.type === "tv")
    const bookItems = items.filter((item) => item.type === "book")

    // Step 2: Calculate target counts for each media type based on distribution
    const distribution = this.contentStrategy.mediaTypeDistribution || { movie: 0.4, tv: 0.4, book: 0.2 }

    let movieCount = Math.round(count * distribution.movie)
    let tvCount = Math.round(count * distribution.tv)
    let bookCount = Math.round(count * distribution.book)

    // Adjust counts if we don't have enough of a particular type
    if (movieItems.length < movieCount) {
      const deficit = movieCount - movieItems.length
      movieCount = movieItems.length
      // Redistribute the deficit proportionally
      const tvRatio = distribution.tv / (distribution.tv + distribution.book)
      tvCount += Math.round(deficit * tvRatio)
      bookCount += Math.round(deficit * (1 - tvRatio))
    }

    if (tvItems.length < tvCount) {
      const deficit = tvCount - tvItems.length
      tvCount = tvItems.length
      // Give the deficit to books or movies
      if (bookItems.length >= bookCount + deficit) {
        bookCount += deficit
      } else {
        bookCount = bookItems.length
        movieCount += deficit - (bookCount - bookItems.length)
      }
    }

    if (bookItems.length < bookCount) {
      const deficit = bookCount - bookItems.length
      bookCount = bookItems.length
      // Give the deficit to movies or TV
      if (movieItems.length >= movieCount + deficit) {
        movieCount += deficit
      } else {
        movieCount = movieItems.length
        tvCount += deficit - (movieCount - movieItems.length)
      }
    }

    // Step 3: Score each item based on genre preferences and other factors
    const scoredMovies = this.scoreItemsByPreference(movieItems)
    const scoredTVShows = this.scoreItemsByPreference(tvItems)
    const scoredBooks = this.scoreItemsByPreference(bookItems)

    // Step 4: Select top-scoring items of each type
    const selectedMovies = scoredMovies.slice(0, movieCount)
    const selectedTVShows = scoredTVShows.slice(0, tvCount)
    const selectedBooks = scoredBooks.slice(0, bookCount)

    // Step 5: Combine and shuffle the results
    const selectedItems = [...selectedMovies, ...selectedTVShows, ...selectedBooks].map((item) => item.item)
    return this.shuffleArray(selectedItems)
  }

  /**
   * Score items based on genre preferences and other factors
   */
  private scoreItemsByPreference(items: MediaItem[]): { item: MediaItem; score: number }[] {
    const scoredItems = items.map((item) => {
      let score = 0.5 // Base score

      // Factor 1: Genre match with user preferences
      if (item.genres && item.genres.length > 0) {
        const genreScores = item.genres.map((genre) => {
          const genreWeight = this.genreWeights.find((g) => g.id === genre)
          return genreWeight ? genreWeight.weight : 0.1
        })

        // Average genre score, weighted by the number of genres
        score += (genreScores.reduce((sum, s) => sum + s, 0) / genreScores.length) * 0.3
      }

      // Factor 2: Release year preference (if prioritizeNew is true, favor newer content)
      if (item.releaseDate) {
        const year = Number.parseInt(item.releaseDate.substring(0, 4))
        if (!isNaN(year)) {
          const currentYear = new Date().getFullYear()
          const yearDiff = currentYear - year

          if (this.contentStrategy.prioritizeNew) {
            // Newer content gets higher score
            score += Math.max(0, 0.2 - yearDiff / 100)
          } else {
            // Older content gets higher score
            score += Math.min(0.2, yearDiff / 100)
          }
        }
      }

      // Factor 3: Rating quality (higher rated content gets slight boost)
      if (item.rating) {
        score += (item.rating / 10) * 0.1
      }

      // Factor 4: Obscurity adjustment based on session count
      // As sessions increase, we slightly favor more obscure content
      if (this.sessionCount > 5) {
        // Random factor that increases with session count
        const obscurityBoost = Math.random() * Math.min(0.3, this.sessionCount * 0.01)
        score += obscurityBoost
      }

      return { item, score }
    })

    // Sort by score (descending)
    return scoredItems.sort((a, b) => b.score - a.score)
  }

  /**
   * Get random items from an array
   */
  private getRandomItems<T>(items: T[], count: number): T[] {
    if (items.length <= count) return items

    const shuffled = this.shuffleArray([...items])
    return shuffled.slice(0, count)
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
}
