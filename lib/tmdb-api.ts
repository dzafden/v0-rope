// TMDB API endpoints and utilities
const API_KEY = "d4b75df0c793d9efa8f4db9c94430c60"
const BASE_URL = "https://api.themoviedb.org/3"
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

export type MediaType = "movie" | "tv" | "book"

export interface TmdbMedia {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  backdrop_path: string | null
  media_type: "movie" | "tv"
  overview: string
  vote_average: number
  release_date?: string
  first_air_date?: string
}

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

// New interfaces for TV show details
export interface TmdbTVShowDetails extends TmdbMedia {
  number_of_seasons: number
  number_of_episodes: number
  seasons: TmdbSeason[]
  status: string
  in_production: boolean
  networks: { id: number; name: string; logo_path: string }[]
  created_by: { id: number; name: string; profile_path: string }[]
}

export interface TmdbSeason {
  id: number
  air_date: string
  episode_count: number
  name: string
  overview: string
  poster_path: string
  season_number: number
}

export interface TmdbSeasonDetails {
  id: number
  air_date: string
  name: string
  overview: string
  poster_path: string
  season_number: number
  episodes: TmdbEpisode[]
}

export interface TmdbEpisode {
  id: number
  name: string
  overview: string
  air_date: string
  episode_number: number
  season_number: number
  still_path: string
  vote_average: number
  runtime: number
  crew: { id: number; name: string; job: string }[]
  guest_stars: { id: number; name: string; character: string; profile_path: string }[]
}

export interface TmdbEpisodeDetails extends TmdbEpisode {
  // Additional fields that might be in the detailed endpoint
  images: { stills: { file_path: string }[] }
  videos: { results: { key: string; site: string; type: string }[] }
}

// Convert TMDB media to our app's format
export function convertTmdbToMediaItem(item: TmdbMedia): MediaItem {
  return {
    id: `tmdb-${item.media_type}-${item.id}`,
    title: item.title || item.name || "Unknown Title",
    coverImage: item.poster_path
      ? `${IMAGE_BASE_URL}/w500${item.poster_path}`
      : "/placeholder.svg?height=240&width=160",
    type: item.media_type === "movie" ? "movie" : "tv",
    overview: item.overview,
    rating: item.vote_average,
    releaseDate: item.release_date || item.first_air_date,
    customizations: {
      borderEffect: "none",
      overlay: "none",
    },
  }
}

// Add better error handling to the TMDB API functions
export async function fetchTrending(page = 1): Promise<MediaItem[]> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}&page=${page}`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results
      .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
      .map(convertTmdbToMediaItem)
  } catch (error) {
    console.error("Error fetching trending media:", error)
    return []
  }
}

// Update the fetchPopularMovies function with better error handling
export async function fetchPopularMovies(page = 1): Promise<MediaItem[]> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&page=${page}&sort_by=popularity.desc&vote_count.gte=1000&include_adult=false`,
      { signal: controller.signal },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results.map((item: any) => convertTmdbToMediaItem({ ...item, media_type: "movie" }))
  } catch (error) {
    console.error("Error fetching popular movies:", error)
    return []
  }
}

// Update the fetchPopularTVShows function with better error handling
export async function fetchPopularTVShows(page = 1): Promise<MediaItem[]> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&page=${page}&sort_by=popularity.desc&vote_count.gte=500&include_adult=false`,
      { signal: controller.signal },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()

    // Filter out talk shows, news, and reality TV if they somehow get through
    // TMDB genre IDs: 10767 = Talk, 10763 = News, 10764 = Reality
    const filteredResults = data.results.filter((item: any) => {
      // If genre_ids is available, filter out unwanted genres
      if (item.genre_ids && Array.isArray(item.genre_ids)) {
        return !item.genre_ids.some((id: number) => [10767, 10763, 10764].includes(id))
      }
      return true
    })

    return filteredResults.map((item: any) => convertTmdbToMediaItem({ ...item, media_type: "tv" }))
  } catch (error) {
    console.error("Error fetching popular TV shows:", error)
    return []
  }
}

// Search for movies and TV shows
export async function searchMedia(query: string, page = 1): Promise<MediaItem[]> {
  if (!query || query.trim().length < 2) return []

  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`,
    )

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results
      .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
      .map(convertTmdbToMediaItem)
  } catch (error) {
    console.error("Error searching media:", error)
    return []
  }
}

// Add a new function to fetch classic movies
export async function fetchClassicMovies(): Promise<MediaItem[]> {
  try {
    // Get movies from 1980-2000 with high vote counts
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=vote_count.desc&primary_release_date.gte=1980-01-01&primary_release_date.lte=2000-12-31&vote_count.gte=2000&include_adult=false`,
    )

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results.map((item: any) => convertTmdbToMediaItem({ ...item, media_type: "movie" }))
  } catch (error) {
    console.error("Error fetching classic movies:", error)
    return []
  }
}

// Add a new function to fetch classic TV shows
export async function fetchClassicTVShows(): Promise<MediaItem[]> {
  try {
    // Get TV shows from before 2010 with high vote counts
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&sort_by=vote_count.desc&first_air_date.lte=2010-12-31&vote_count.gte=500&include_adult=false`,
    )

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results.map((item: any) => convertTmdbToMediaItem({ ...item, media_type: "tv" }))
  } catch (error) {
    console.error("Error fetching classic TV shows:", error)
    return []
  }
}

/**
 * Fetch top-rated movies (higher rated than just popular)
 */
export async function fetchTopRatedMovies(page = 1): Promise<MediaItem[]> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(
      `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&page=${page}&vote_count.gte=1000&include_adult=false`,
      { signal: controller.signal },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results.map((item: any) => convertTmdbToMediaItem({ ...item, media_type: "movie" }))
  } catch (error) {
    console.error("Error fetching top-rated movies:", error)
    return []
  }
}

/**
 * Fetch top-rated TV shows
 */
export async function fetchTopRatedTVShows(page = 1): Promise<MediaItem[]> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(
      `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&page=${page}&vote_count.gte=500&include_adult=false`,
      { signal: controller.signal },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()

    // Filter out talk shows, news, and reality TV
    const filteredResults = data.results.filter((item: any) => {
      if (item.genre_ids && Array.isArray(item.genre_ids)) {
        return !item.genre_ids.some((id: number) => [10767, 10763, 10764].includes(id))
      }
      return true
    })

    return filteredResults.map((item: any) => convertTmdbToMediaItem({ ...item, media_type: "tv" }))
  } catch (error) {
    console.error("Error fetching top-rated TV shows:", error)
    return []
  }
}

/**
 * Fetch movies by genre
 */
export async function fetchGenreMovies(genreId: string, page = 1): Promise<MediaItem[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}&sort_by=vote_average.desc&vote_count.gte=500&include_adult=false`,
      { signal: controller.signal },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    return data.results.map((item: any) => convertTmdbToMediaItem({ ...item, media_type: "movie" }))
  } catch (error) {
    console.error(`Error fetching movies for genre ${genreId}:`, error)
    return []
  }
}

/**
 * Fetch TV shows by genre
 */
export async function fetchGenreTVShows(genreId: string, page = 1): Promise<MediaItem[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${genreId}&page=${page}&sort_by=vote_average.desc&vote_count.gte=300&include_adult=false`,
      { signal: controller.signal },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()

    // Filter out talk shows, news, and reality TV
    const filteredResults = data.results.filter((item: any) => {
      if (item.genre_ids && Array.isArray(item.genre_ids)) {
        return !item.genre_ids.some((id: number) => [10767, 10763, 10764].includes(id))
      }
      return true
    })

    return filteredResults.map((item: any) => convertTmdbToMediaItem({ ...item, media_type: "tv" }))
  } catch (error) {
    console.error(`Error fetching TV shows for genre ${genreId}:`, error)
    return []
  }
}

// New function to extract the TMDB ID from our app's ID format
export function extractTmdbId(mediaId: string): number | null {
  // Our format is "tmdb-{media_type}-{id}"
  const parts = mediaId.split("-")
  if (parts.length >= 3 && parts[0] === "tmdb") {
    const id = Number.parseInt(parts[2], 10)
    return isNaN(id) ? null : id
  }
  return null
}

// Add this more resilient version of fetchTVShowDetails that handles network errors better
export async function fetchTVShowDetails(tvId: number, signal?: AbortSignal): Promise<TmdbTVShowDetails> {
  const maxRetries = 3
  let retryCount = 0
  let lastError: Error | null = null

  while (retryCount < maxRetries) {
    try {
      // Create a new controller for each attempt if one wasn't provided
      const controller = signal ? undefined : new AbortController()
      const internalSignal = signal || (controller ? controller.signal : undefined)

      // Set a timeout that's longer for each retry attempt
      const timeoutMs = 5000 + retryCount * 2000 // 5s, 7s, 9s
      const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined

      try {
        // Use a try-catch inside the retry loop to handle fetch errors
        const response = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${API_KEY}`, {
          signal: internalSignal,
          // Add cache control headers to help with potential rate limiting
          headers: {
            "Cache-Control": "max-age=3600",
          },
        }).catch((error) => {
          // Convert fetch errors to a rejected promise with the error
          return Promise.reject(error)
        })

        // Clear the timeout as soon as we get a response
        if (timeoutId) clearTimeout(timeoutId)

        if (!response.ok) {
          // For 429 (Too Many Requests), wait longer before retrying
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After")
            const waitTime = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : 5000
            await new Promise((resolve) => setTimeout(resolve, waitTime))
            retryCount++
            continue
          }

          throw new Error(`TMDB API error: ${response.status}`)
        }

        return await response.json()
      } catch (error) {
        // Clear timeout if there was an error
        if (timeoutId) clearTimeout(timeoutId)
        throw error
      }
    } catch (error) {
      lastError = error as Error

      // Don't retry if it was explicitly aborted
      if (error.name === "AbortError" && signal?.aborted) {
        throw error
      }

      // Wait before retrying, with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
      retryCount++
    }
  }

  // If we've exhausted all retries, throw the last error
  console.error(`Failed to fetch TV show details after ${maxRetries} attempts:`, lastError)

  // Return a minimal valid object instead of throwing to prevent UI crashes
  return {
    id: tvId,
    name: "Unknown Show",
    overview: "",
    poster_path: null,
    backdrop_path: null,
    vote_average: 0,
    media_type: "tv",
    status: "not_airing",
    in_production: false,
    number_of_seasons: 0,
    number_of_episodes: 0,
    seasons: [],
    networks: [],
    created_by: [],
  } as TmdbTVShowDetails
}

// New function to fetch specific season details with episodes
export async function fetchSeasonDetails(tvId: number, seasonNumber: number): Promise<TmdbSeasonDetails> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching season details:", error)
    throw error
  }
}

// New function to fetch specific episode details
export async function fetchEpisodeDetails(
  tvId: number,
  seasonNumber: number,
  episodeNumber: number,
): Promise<TmdbEpisodeDetails> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(
      `${BASE_URL}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${API_KEY}`,
      { signal: controller.signal },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching episode details:", error)
    throw error
  }
}
