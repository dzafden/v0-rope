// OpenLibrary API endpoints and utilities
const BASE_URL = "https://openlibrary.org"

export interface OpenLibraryBook {
  key: string
  title: string
  author_name?: string[]
  cover_i?: number
  cover_id?: number
  first_publish_year?: number
  isbn?: string[]
}

export interface OpenLibraryResponse {
  numFound: number
  start: number
  docs: OpenLibraryBook[]
}

import type { MediaItem } from "./tmdb-api"

// Convert OpenLibrary book to our app's format
export function convertOpenLibraryToMediaItem(book: OpenLibraryBook): MediaItem {
  // Get cover ID (either from cover_i or cover_id)
  const coverId = book.cover_i || book.cover_id

  // Build cover URL - use a direct cover ID if available
  let coverUrl = "/placeholder.svg?height=240&width=160"

  if (coverId) {
    coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
  }

  return {
    id: `ol-book-${book.key?.replace(/^\/works\//, "") || Math.random().toString(36).substring(2, 15)}`,
    title: book.title || "Unknown Title",
    coverImage: coverUrl,
    type: "book",
    overview: book.author_name ? `By ${book.author_name.join(", ")}` : "",
    rating: 0, // OpenLibrary doesn't provide ratings
    releaseDate: book.first_publish_year ? book.first_publish_year.toString() : undefined,
    customizations: {
      borderEffect: "none",
      overlay: "none",
    },
  }
}

// Search for books
export async function searchBooks(query: string, page = 1): Promise<MediaItem[]> {
  if (!query || query.trim().length < 2) return []

  try {
    const limit = 20
    const offset = (page - 1) * limit
    const response = await fetch(
      `${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`,
    )

    if (!response.ok) {
      throw new Error(`OpenLibrary API error: ${response.status}`)
    }

    const data: OpenLibraryResponse = await response.json()
    return data.docs.map(convertOpenLibraryToMediaItem)
  } catch (error) {
    console.error("Error searching books:", error)
    return []
  }
}

// Update the fetchPopularBooks function to be more resilient with better error handling
export async function fetchPopularBooks(page = 1): Promise<MediaItem[]> {
  // Return hardcoded books for any page beyond 1 to avoid excessive API calls
  if (page > 1) {
    return getHardcodedPopularBooks(page)
  }

  try {
    // Increase timeout from 5 seconds to 10 seconds to give more time for the API to respond
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      // First try to fetch trending books from the search API with more reliable parameters
      const response = await fetch(`${BASE_URL}/search.json?q=subject:bestseller&sort=rating&limit=10`, {
        signal: controller.signal,
      })

      // Clear the timeout as soon as we get a response
      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn("OpenLibrary API returned non-OK status:", response.status)
        return getHardcodedPopularBooks(page)
      }

      const data = await response.json()

      if (data.docs && data.docs.length > 0) {
        // Filter to only include books with cover images
        const booksWithCovers = data.docs
          .filter((book) => book.cover_i || book.cover_id)
          .map(convertOpenLibraryToMediaItem)

        if (booksWithCovers.length >= 5) {
          return booksWithCovers
        }
      }

      // If we don't have enough books with covers, use hardcoded data
      return getHardcodedPopularBooks(page)
    } catch (error) {
      // Make sure to clear the timeout if there's an error
      clearTimeout(timeoutId)

      // Check if the error is due to an aborted request
      if (error.name === "AbortError") {
        console.warn("OpenLibrary API request timed out, using hardcoded data instead")
      } else {
        console.error("Error fetching popular books:", error)
      }

      // Return hardcoded books as fallback
      return getHardcodedPopularBooks(page)
    }
  } catch (error) {
    console.error("Error in fetchPopularBooks:", error)
    // Return hardcoded books as fallback
    return getHardcodedPopularBooks(page)
  }
}

// Update the hardcoded books function to accept a page parameter
function getHardcodedPopularBooks(page = 1): MediaItem[] {
  // First page of hardcoded books
  const firstPageBooks = [
    {
      id: "ol-book-atomic-habits",
      title: "Atomic Habits",
      coverImage: "https://covers.openlibrary.org/b/id/10700323-L.jpg",
      type: "book",
      overview: "By James Clear",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-48-laws",
      title: "The 48 Laws of Power",
      coverImage: "https://covers.openlibrary.org/b/id/8906626-L.jpg",
      type: "book",
      overview: "By Robert Greene",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-rich-dad",
      title: "Rich Dad Poor Dad",
      coverImage: "https://covers.openlibrary.org/b/id/8479839-L.jpg",
      type: "book",
      overview: "By Robert T. Kiyosaki",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-thinking-fast",
      title: "Thinking, Fast and Slow",
      coverImage: "https://covers.openlibrary.org/b/id/7089298-L.jpg",
      type: "book",
      overview: "By Daniel Kahneman",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-sapiens",
      title: "Sapiens",
      coverImage: "https://covers.openlibrary.org/b/id/8709129-L.jpg",
      type: "book",
      overview: "By Yuval Noah Harari",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-alchemist",
      title: "The Alchemist",
      coverImage: "https://covers.openlibrary.org/b/id/8304287-L.jpg",
      type: "book",
      overview: "By Paulo Coelho",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-mockingbird",
      title: "To Kill a Mockingbird",
      coverImage: "https://covers.openlibrary.org/b/id/8221999-L.jpg",
      type: "book",
      overview: "By Harper Lee",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-1984",
      title: "1984",
      coverImage: "https://covers.openlibrary.org/b/id/8575741-L.jpg",
      type: "book",
      overview: "By George Orwell",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-gatsby",
      title: "The Great Gatsby",
      coverImage: "https://covers.openlibrary.org/b/id/8761420-L.jpg",
      type: "book",
      overview: "By F. Scott Fitzgerald",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-harry-potter",
      title: "Harry Potter and the Philosopher's Stone",
      coverImage: "https://covers.openlibrary.org/b/id/8267857-L.jpg",
      type: "book",
      overview: "By J.K. Rowling",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
  ]

  // Second page of hardcoded books
  const secondPageBooks = [
    {
      id: "ol-book-dune",
      title: "Dune",
      coverImage: "https://covers.openlibrary.org/b/id/8406786-L.jpg",
      type: "book",
      overview: "By Frank Herbert",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-pride-prejudice",
      title: "Pride and Prejudice",
      coverImage: "https://covers.openlibrary.org/b/id/8409593-L.jpg",
      type: "book",
      overview: "By Jane Austen",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-hobbit",
      title: "The Hobbit",
      coverImage: "https://covers.openlibrary.org/b/id/8323742-L.jpg",
      type: "book",
      overview: "By J.R.R. Tolkien",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-catcher",
      title: "The Catcher in the Rye",
      coverImage: "https://covers.openlibrary.org/b/id/8231488-L.jpg",
      type: "book",
      overview: "By J.D. Salinger",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-little-prince",
      title: "The Little Prince",
      coverImage: "https://covers.openlibrary.org/b/id/8406427-L.jpg",
      type: "book",
      overview: "By Antoine de Saint-Exupéry",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-lord-rings",
      title: "The Lord of the Rings",
      coverImage: "https://covers.openlibrary.org/b/id/8477380-L.jpg",
      type: "book",
      overview: "By J.R.R. Tolkien",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-brave-new-world",
      title: "Brave New World",
      coverImage: "https://covers.openlibrary.org/b/id/8231885-L.jpg",
      type: "book",
      overview: "By Aldous Huxley",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-crime-punishment",
      title: "Crime and Punishment",
      coverImage: "https://covers.openlibrary.org/b/id/8302507-L.jpg",
      type: "book",
      overview: "By Fyodor Dostoevsky",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-fahrenheit",
      title: "Fahrenheit 451",
      coverImage: "https://covers.openlibrary.org/b/id/8576679-L.jpg",
      type: "book",
      overview: "By Ray Bradbury",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-animal-farm",
      title: "Animal Farm",
      coverImage: "https://covers.openlibrary.org/b/id/8395346-L.jpg",
      type: "book",
      overview: "By George Orwell",
      rating: 0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
  ]

  // Return appropriate page of books
  return page === 1 ? firstPageBooks : secondPageBooks
}

/**
 * Fetch critically acclaimed books
 * This uses a combination of award-winning books and highly rated classics
 */
export async function fetchCriticallyAcclaimedBooks(): Promise<MediaItem[]> {
  try {
    // We'll use a list of award-winning books and classics
    // This could be expanded with more specific OpenLibrary queries
    const response = await fetch(`${BASE_URL}/search.json?q=award+winner&sort=rating&limit=20`)

    if (!response.ok) {
      throw new Error(`OpenLibrary API error: ${response.status}`)
    }

    const data: OpenLibraryResponse = await response.json()

    // Filter to only include books with cover images
    const booksWithCovers = data.docs.filter((book) => book.cover_i || book.cover_id).map(convertOpenLibraryToMediaItem)

    if (booksWithCovers.length >= 10) {
      return booksWithCovers
    }

    // If we don't have enough books with covers, use hardcoded acclaimed books
    return getHardcodedAcclaimedBooks()
  } catch (error) {
    console.error("Error fetching critically acclaimed books:", error)
    return getHardcodedAcclaimedBooks()
  }
}

/**
 * Hardcoded list of critically acclaimed books as fallback
 */
function getHardcodedAcclaimedBooks(): MediaItem[] {
  return [
    {
      id: "ol-book-beloved",
      title: "Beloved",
      coverImage: "https://covers.openlibrary.org/b/id/8231991-L.jpg",
      type: "book",
      overview: "By Toni Morrison",
      rating: 4.3,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-one-hundred-years",
      title: "One Hundred Years of Solitude",
      coverImage: "https://covers.openlibrary.org/b/id/7101409-L.jpg",
      type: "book",
      overview: "By Gabriel García Márquez",
      rating: 4.4,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-ulysses",
      title: "Ulysses",
      coverImage: "https://covers.openlibrary.org/b/id/8241565-L.jpg",
      type: "book",
      overview: "By James Joyce",
      rating: 4.0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-invisible-man",
      title: "Invisible Man",
      coverImage: "https://covers.openlibrary.org/b/id/8259281-L.jpg",
      type: "book",
      overview: "By Ralph Ellison",
      rating: 4.2,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-lolita",
      title: "Lolita",
      coverImage: "https://covers.openlibrary.org/b/id/8314135-L.jpg",
      type: "book",
      overview: "By Vladimir Nabokov",
      rating: 4.1,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-sound-fury",
      title: "The Sound and the Fury",
      coverImage: "https://covers.openlibrary.org/b/id/8410733-L.jpg",
      type: "book",
      overview: "By William Faulkner",
      rating: 4.0,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-grapes-wrath",
      title: "The Grapes of Wrath",
      coverImage: "https://covers.openlibrary.org/b/id/8231499-L.jpg",
      type: "book",
      overview: "By John Steinbeck",
      rating: 4.3,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-catch-22",
      title: "Catch-22",
      coverImage: "https://covers.openlibrary.org/b/id/8389576-L.jpg",
      type: "book",
      overview: "By Joseph Heller",
      rating: 4.2,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-slaughterhouse-five",
      title: "Slaughterhouse-Five",
      coverImage: "https://covers.openlibrary.org/b/id/8305555-L.jpg",
      type: "book",
      overview: "By Kurt Vonnegut",
      rating: 4.1,
      customizations: { borderEffect: "none", overlay: "none" },
    },
    {
      id: "ol-book-handmaids-tale",
      title: "The Handmaid's Tale",
      coverImage: "https://covers.openlibrary.org/b/id/8028457-L.jpg",
      type: "book",
      overview: "By Margaret Atwood",
      rating: 4.3,
      customizations: { borderEffect: "none", overlay: "none" },
    },
  ]
}
