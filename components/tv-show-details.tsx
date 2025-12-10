"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fetchTVShowDetails,
  fetchSeasonDetails,
  extractTmdbId,
  type TmdbTVShowDetails,
  type TmdbSeasonDetails,
  type TmdbEpisode,
} from "@/lib/tmdb-api"
import storage from "@/lib/storage"

// Storage key for watch progress
const WATCH_PROGRESS_STORAGE_KEY = "tvWatchProgress"

interface WatchProgress {
  [showId: string]: {
    seasons: {
      [seasonNumber: number]: {
        watched: boolean
        episodes: {
          [episodeNumber: number]: {
            watched: boolean
            lastWatched?: number
          }
        }
      }
    }
  }
}

interface TVShowDetailsProps {
  mediaId: string
}

export default function TVShowDetails({ mediaId }: TVShowDetailsProps) {
  // TV show and season state
  const [selectedSeason, setSelectedSeason] = useState<number>(1)
  const [tvShowDetails, setTvShowDetails] = useState<TmdbTVShowDetails | null>(null)
  const [seasonDetails, setSeasonDetails] = useState<TmdbSeasonDetails | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [watchProgress, setWatchProgress] = useState<WatchProgress>({})
  const [allWatched, setAllWatched] = useState<boolean>(false)

  // Note states for season and episode
  const [seasonNotes, setSeasonNotes] = useState<Record<number, string>>({})
  const [episodeNotes, setEpisodeNotes] = useState<
    Record<string, Array<{ id: string; text: string; timestamp: number }>>
  >({})
  const [editingNote, setEditingNote] = useState<{ type: "season" | "episode"; id: number | string } | null>(null)
  const [expandedNoteId, setExpandedNoteId] = useState<{ type: "season" | "episode"; id: number | string } | null>(null)

  // For episode modal
  const [selectedEpisode, setSelectedEpisode] = useState<TmdbEpisode | null>(null)

  // Refs and extracted ID
  const detailsRef = useRef<HTMLDivElement>(null)
  const tmdbId = extractTmdbId(mediaId)

  // --- Helpers and Memoized Functions ---

  // Format a date string in a readable format
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return "Unknown"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }, [])

  // Get still image URL (with fallback)
  const getStillImageUrl = useCallback((path: string | null) => {
    return path ? `https://image.tmdb.org/t/p/w500${path}` : "/placeholder.svg?height=180&width=320"
  }, [])

  // Calculate season progress percentage
  const calculateSeasonProgress = useCallback(
    (seasonNumber: number) => {
      if (!watchProgress[mediaId]?.seasons[seasonNumber] || !seasonDetails?.episodes?.length) return 0
      const watchedCount = seasonDetails.episodes.filter(
        (ep) => watchProgress[mediaId].seasons[seasonNumber].episodes[ep.episode_number]?.watched,
      ).length
      return Math.round((watchedCount / seasonDetails.episodes.length) * 100)
    },
    [watchProgress, seasonDetails, mediaId],
  )

  // Check if all seasons are watched
  const checkAllWatched = useCallback(() => {
    if (!tvShowDetails?.seasons || !watchProgress[mediaId]) return false
    return tvShowDetails.seasons
      .filter((season) => season.season_number > 0)
      .every((season) => watchProgress[mediaId].seasons[season.season_number]?.watched)
  }, [tvShowDetails, watchProgress, mediaId])

  // --- Load and Save from Storage ---

  // Load watch progress from localStorage on mount
  useEffect(() => {
    try {
      const savedProgress = storage.get<WatchProgress>(WATCH_PROGRESS_STORAGE_KEY, {})
      setWatchProgress(savedProgress)
    } catch (err) {
      console.error("Error loading watch progress:", err)
      setWatchProgress({})
    }
  }, [])

  // Save watch progress to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(watchProgress).length > 0) {
      storage.set(WATCH_PROGRESS_STORAGE_KEY, watchProgress)
    }
  }, [watchProgress])

  // Load season and episode notes from storage
  useEffect(() => {
    try {
      const savedSeasonNotes = storage.get<Record<number, string>>(`${mediaId}-seasonNotes`, {})
      const savedEpisodeNotes = storage.get<Record<string, Array<{ id: string; text: string; timestamp: number }>>>(
        `${mediaId}-episodeNotes`,
        {},
      )
      setSeasonNotes(savedSeasonNotes)
      setEpisodeNotes(savedEpisodeNotes)
    } catch (err) {
      console.error("Error loading notes:", err)
    }
  }, [mediaId])

  // Save season notes whenever they change
  useEffect(() => {
    if (Object.keys(seasonNotes).length > 0) storage.set(`${mediaId}-seasonNotes`, seasonNotes)
  }, [seasonNotes, mediaId])

  // Save episode notes whenever they change
  useEffect(() => {
    if (Object.keys(episodeNotes).length > 0) storage.set(`${mediaId}-episodeNotes`, episodeNotes)
  }, [episodeNotes, mediaId])

  // --- Fetch Data from TMDB ---

  // Fetch TV show details on mount or when tmdbId changes
  useEffect(() => {
    const fetchDetails = async () => {
      if (!tmdbId) {
        setError("Invalid TV show ID")
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const details = await fetchTVShowDetails(tmdbId)
        setTvShowDetails(details)
        const regularSeasons = details.seasons.filter((s) => s.season_number > 0)
        if (regularSeasons.length > 0) {
          setSelectedSeason(regularSeasons[0].season_number)
        }
      } catch (err) {
        console.error("Error fetching TV show details:", err)
        setError("Failed to load TV show details")
      } finally {
        setIsLoading(false)
      }
    }
    fetchDetails()
  }, [tmdbId])

  // Fetch season details when selectedSeason changes
  useEffect(() => {
    const fetchSeason = async () => {
      if (!tmdbId || !selectedSeason) return
      setIsLoading(true)
      setError(null)
      try {
        const season = await fetchSeasonDetails(tmdbId, selectedSeason)
        setSeasonDetails(season)
      } catch (err) {
        console.error(`Error fetching season ${selectedSeason} details:`, err)
        setError(`Failed to load season ${selectedSeason} details`)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSeason()
  }, [tmdbId, selectedSeason])

  // Update allWatched when watchProgress or tvShowDetails change
  useEffect(() => {
    setAllWatched(checkAllWatched())
  }, [watchProgress, tvShowDetails, checkAllWatched])

  // --- Handlers ---

  // Toggle episode watched status
  const toggleEpisodeWatched = useCallback(
    (seasonNumber: number, episodeNumber: number) => {
      setWatchProgress((prev) => {
        const newProgress = { ...prev }
        if (!newProgress[mediaId]) newProgress[mediaId] = { seasons: {} }
        if (!newProgress[mediaId].seasons[seasonNumber]) {
          newProgress[mediaId].seasons[seasonNumber] = { watched: false, episodes: {} }
        }
        const currentStatus = newProgress[mediaId].seasons[seasonNumber].episodes[episodeNumber]?.watched
        newProgress[mediaId].seasons[seasonNumber].episodes[episodeNumber] = {
          watched: !currentStatus,
          lastWatched: !currentStatus ? Date.now() : undefined,
        }
        if (seasonDetails?.episodes) {
          const allEpisodesWatched = seasonDetails.episodes.every(
            (ep) => newProgress[mediaId].seasons[seasonNumber].episodes[ep.episode_number]?.watched,
          )
          newProgress[mediaId].seasons[seasonNumber].watched = allEpisodesWatched
        }
        setTimeout(() => window.dispatchEvent(new CustomEvent("watchProgressUpdate")), 0)
        return newProgress
      })
    },
    [mediaId, seasonDetails],
  )

  // Toggle episode note editor (for episodes, similar to season note)
  const handleEpisodeNoteToggle = useCallback((id: string) => {
    setEditingNote((prev) => (prev && prev.type === "episode" && prev.id === id ? null : { type: "episode", id }))
  }, [])

  // Handle pointer down to manage drag gestures
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const scrollTop = detailsRef.current?.scrollTop || 0
    if (scrollTop <= 10) {
      const target = e.currentTarget as HTMLElement
      target.style.touchAction = "none"
      target.setPointerCapture(e.pointerId)
    } else {
      e.stopPropagation()
      ;(e.currentTarget as HTMLElement).style.touchAction = "auto"
    }
  }, [])

  const handleSaveNote = useCallback(
    (type: "season" | "episode", id: number | string, text: string) => {
      if (type === "season") {
        setSeasonNotes((prev) => ({ ...prev, [id as number]: text }))
      } else if (type === "episode") {
        setEpisodeNotes((prev) => {
          const episodeId = id as string
          const newNote = { id: Date.now().toString(), text, timestamp: Date.now() }
          const existingNotes = prev[episodeId] || []
          return { ...prev, [episodeId]: [...existingNotes, newNote] }
        })
      }
      setEditingNote(null)
    },
    [setSeasonNotes, setEpisodeNotes],
  )

  // --- Render ---

  if (isLoading && !tvShowDetails) {
    return (
      <div className="mt-6 flex justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-6 text-center text-red-500">
        <p>{error}</p>
        <button className="mt-2 px-4 py-2 bg-purple-600 rounded-lg text-white" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="mt-6">
      {/* Header with Season & Episode title and "Mark All as Watched" */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Seasons & Episodes</h2>
        <motion.button
          className={cn(
            allWatched ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700",
            "text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1",
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() =>
            setWatchProgress((prev) => {
              const newProgress = { ...prev }
              if (!newProgress[mediaId]) newProgress[mediaId] = { seasons: {} }
              if (tvShowDetails?.seasons) {
                tvShowDetails.seasons.forEach((season) => {
                  if (season.season_number > 0) {
                    if (!newProgress[mediaId].seasons[season.season_number]) {
                      newProgress[mediaId].seasons[season.season_number] = { watched: true, episodes: {} }
                    } else {
                      newProgress[mediaId].seasons[season.season_number].watched = true
                    }
                    for (let i = 1; i <= season.episode_count; i++) {
                      newProgress[mediaId].seasons[season.season_number].episodes[i] = {
                        watched: true,
                        lastWatched: Date.now(),
                      }
                    }
                  }
                })
              }
              setAllWatched(true)
              setTimeout(() => window.dispatchEvent(new CustomEvent("watchProgressUpdate")), 0)
              return newProgress
            })
          }
        >
          <Check className="w-3 h-3" />
          <span>{allWatched ? "Watched All" : "Mark All as Watched"}</span>
        </motion.button>
      </div>

      {/* Season selector */}
      <div className="flex overflow-x-auto gap-2 pb-4 -mx-6 px-6 scrollbar-hide no-scrollbar">
        {tvShowDetails?.seasons
          ?.filter((season) => season.season_number > 0)
          .map((season) => (
            <motion.button
              key={season.id}
              className={cn(
                "px-4 py-2 rounded-full text-sm whitespace-nowrap flex items-center gap-1",
                selectedSeason === season.season_number ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-300",
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSeason(season.season_number)}
            >
              <span>S{season.season_number}</span>
              {watchProgress[mediaId]?.seasons[season.season_number] && (
                <div className="ml-1 w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </motion.button>
          ))}
      </div>

      {/* Season info and progress */}
      {seasonDetails && (
        <div className="mb-4 bg-zinc-800/30 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{seasonDetails.name}</h3>
              <motion.button
                className={cn(
                  "p-1 rounded-full",
                  watchProgress[mediaId]?.seasons[selectedSeason]?.watched
                    ? "bg-green-500 text-white"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600",
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  const isCurrentlyWatched = watchProgress[mediaId]?.seasons[selectedSeason]?.watched
                  setWatchProgress((prev) => {
                    const newProgress = { ...prev }
                    if (!newProgress[mediaId]) newProgress[mediaId] = { seasons: {} }
                    if (!newProgress[mediaId].seasons[selectedSeason])
                      newProgress[mediaId].seasons[selectedSeason] = { watched: false, episodes: {} }
                    const newWatchedStatus = !isCurrentlyWatched
                    newProgress[mediaId].seasons[selectedSeason].watched = newWatchedStatus
                    if (seasonDetails?.episodes) {
                      seasonDetails.episodes.forEach((ep) => {
                        newProgress[mediaId].seasons[selectedSeason].episodes[ep.episode_number] = {
                          watched: newWatchedStatus,
                          lastWatched: newWatchedStatus ? Date.now() : undefined,
                        }
                      })
                    }
                    setTimeout(() => window.dispatchEvent(new CustomEvent("watchProgressUpdate")), 0)
                    return newProgress
                  })
                  if (!isCurrentlyWatched) {
                    setExpandedNoteId({ type: "season", id: selectedSeason })
                    setTimeout(() => setExpandedNoteId(null), 3000)
                  }
                }}
                title={
                  watchProgress[mediaId]?.seasons[selectedSeason]?.watched
                    ? "Mark season as unwatched"
                    : "Mark season as watched"
                }
              >
                <Check className="w-3 h-3" />
              </motion.button>

              {/* Season note button */}
              <motion.button
                className={cn(
                  "flex items-center justify-center rounded-full overflow-hidden",
                  editingNote?.type === "season" && editingNote?.id === selectedSeason
                    ? "text-purple-300"
                    : seasonNotes[selectedSeason]
                      ? "bg-purple-500 text-white w-5 h-5"
                      : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 w-5 h-5",
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={
                  expandedNoteId?.type === "season" && expandedNoteId?.id === selectedSeason
                    ? { width: "auto", paddingRight: "8px" }
                    : { width: "24px", paddingRight: "0px" }
                }
                transition={{
                  width: { duration: 0.3, ease: "easeOut" },
                  paddingRight: { duration: 0.3, ease: "easeOut" },
                }}
                onClick={() => {
                  setEditingNote((prev) =>
                    prev && prev.type === "season" && prev.id === selectedSeason
                      ? null
                      : { type: "season", id: selectedSeason },
                  )
                }}
                title={seasonNotes[selectedSeason] ? "Edit season note" : "Add season note"}
              >
                {editingNote?.type === "season" && editingNote?.id === selectedSeason ? (
                  <div className="flex items-center justify-center py-1.5 px-1">
                    <motion.div
                      className="w-0.5 h-0.5 mx-0.5 rounded-full bg-white"
                      animate={{ scale: [1, 2.5, 1] }}
                      transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.2 }}
                    />
                    <motion.div
                      className="w-0.5 h-0.5 mx-0.5 rounded-full bg-white"
                      animate={{ scale: [1, 2.5, 1] }}
                      transition={{ duration: 0.6, delay: 0.2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.2 }}
                    />
                    <motion.div
                      className="w-0.5 h-0.5 mx-0.5 rounded-full bg-white"
                      animate={{ scale: [1, 2.5, 1] }}
                      transition={{ duration: 0.6, delay: 0.4, repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.2 }}
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {/* SVG icon for note */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-2 h-2"
                    >
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </div>
                )}
                {expandedNoteId?.type === "season" && expandedNoteId?.id === selectedSeason && !editingNote && (
                  <span className="ml-1 text-xs whitespace-nowrap">Add a note</span>
                )}
              </motion.button>
            </div>
            <div className="flex items-center text-xs text-zinc-400">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(seasonDetails.air_date)}
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            {seasonDetails.overview || `Season ${seasonDetails.season_number} of ${tvShowDetails?.name}`}
          </p>

          {/* Progress bar */}
          {watchProgress[mediaId]?.seasons[selectedSeason] && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Watch Progress</span>
                <span>{calculateSeasonProgress(selectedSeason)}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${calculateSeasonProgress(selectedSeason)}%` }}
                />
              </div>
            </div>
          )}

          {/* Season note editor */}
          {editingNote?.type === "season" && editingNote?.id === selectedSeason && (
            <motion.div
              className="mt-3 bg-zinc-800/50 rounded-lg p-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <textarea
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Add notes about this season..."
                rows={3}
                value={seasonNotes[selectedSeason] || ""}
                onChange={(e) =>
                  setSeasonNotes((prev) => ({
                    ...prev,
                    [selectedSeason]: e.target.value,
                  }))
                }
              />
              <div className="flex justify-end gap-2 mt-2">
                <motion.button
                  className="px-3 py-1 rounded-lg text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditingNote(null)}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="px-3 py-1 rounded-lg text-xs bg-purple-600 text-white hover:bg-purple-500"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSaveNote("season", selectedSeason, seasonNotes[selectedSeason] || "")}
                >
                  Save
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Episodes list */}
      <div className="space-y-3 mb-6">
        {isLoading && !seasonDetails?.episodes ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : seasonDetails?.episodes?.length ? (
          seasonDetails.episodes.map((episode) => {
            // Add a state to track if this specific episode is expanded
            const isExpanded = selectedEpisode?.id === episode.id
            const episodeNoteId = `${selectedSeason}-${episode.episode_number}`
            const hasNotes = episodeNotes[episodeNoteId]?.length > 0

            return (
              <motion.div
                key={episode.id}
                className="bg-zinc-800/50 rounded-lg overflow-hidden"
                animate={{
                  height: isExpanded ? "auto" : "auto",
                  marginBottom: isExpanded ? "1.5rem" : "0.75rem",
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex cursor-pointer" onClick={() => setSelectedEpisode(isExpanded ? null : episode)}>
                  <div className="w-24 h-16 relative flex-shrink-0">
                    <img
                      src={getStillImageUrl(episode.still_path) || "/placeholder.svg"}
                      alt={episode.name}
                      className="w-full h-full object-cover"
                    />
                    {watchProgress[mediaId]?.seasons[selectedSeason]?.episodes[episode.episode_number]?.watched && (
                      <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-0.5">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-sm">
                        {episode.episode_number}. {episode.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <motion.button
                          className={cn(
                            "p-1 rounded-full",
                            watchProgress[mediaId]?.seasons[selectedSeason]?.episodes[episode.episode_number]?.watched
                              ? "bg-green-500 text-white"
                              : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600",
                          )}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            const isCurrentlyWatched =
                              watchProgress[mediaId]?.seasons[selectedSeason]?.episodes[episode.episode_number]?.watched
                            toggleEpisodeWatched(selectedSeason, episode.episode_number)
                            if (!isCurrentlyWatched) {
                              setExpandedNoteId({ type: "episode", id: `${selectedSeason}-${episode.episode_number}` })
                              setTimeout(() => setExpandedNoteId(null), 3000)
                            }
                          }}
                          title={
                            watchProgress[mediaId]?.seasons[selectedSeason]?.episodes[episode.episode_number]?.watched
                              ? "Mark as unwatched"
                              : "Mark as watched"
                          }
                        >
                          <Check className="w-3 h-3" />
                        </motion.button>
                        <motion.button
                          className={cn(
                            "flex items-center justify-center rounded-full overflow-hidden",
                            editingNote?.type === "episode" &&
                              editingNote?.id === `${selectedSeason}-${episode.episode_number}`
                              ? "text-purple-300"
                              : episodeNotes[`${selectedSeason}-${episode.episode_number}`]
                                ? "bg-purple-500 text-white w-5 h-5"
                                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600 w-5 h-5",
                          )}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          animate={
                            expandedNoteId?.type === "episode" &&
                            expandedNoteId?.id === `${selectedSeason}-${episode.episode_number}`
                              ? { width: "auto", paddingRight: "8px" }
                              : { width: "24px", paddingRight: "0px" }
                          }
                          transition={{
                            width: { duration: 0.3, ease: "easeOut" },
                            paddingRight: { duration: 0.3, ease: "easeOut" },
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingNote((prev) =>
                              prev &&
                              prev.type === "episode" &&
                              prev.id === `${selectedSeason}-${episode.episode_number}`
                                ? null
                                : { type: "episode", id: `${selectedSeason}-${episode.episode_number}` },
                            )
                          }}
                          title={
                            episodeNotes[`${selectedSeason}-${episode.episode_number}`]
                              ? "Edit episode note"
                              : "Add episode note"
                          }
                        >
                          {editingNote?.type === "episode" &&
                          editingNote?.id === `${selectedSeason}-${episode.episode_number}` ? (
                            <div className="flex items-center justify-center py-1.5 px-1">
                              <motion.div
                                className="w-0.5 h-0.5 mx-0.5 rounded-full bg-white"
                                animate={{ scale: [1, 2.5, 1] }}
                                transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.2 }}
                              />
                              <motion.div
                                className="w-0.5 h-0.5 mx-0.5 rounded-full bg-white"
                                animate={{
                                  duration: 0.6,
                                  delay: 0.2,
                                  repeat: Number.POSITIVE_INFINITY,
                                  repeatDelay: 0.2,
                                }}
                              />
                              <motion.div
                                className="w-0.5 h-0.5 mx-0.5 rounded-full bg-white"
                                animate={{
                                  duration: 0.6,
                                  delay: 0.4,
                                  repeat: Number.POSITIVE_INFINITY,
                                  repeatDelay: 0.2,
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                              {/* Minimal SVG icon */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-2 h-2"
                              >
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                              </svg>
                              {Array.isArray(episodeNotes[`${selectedSeason}-${episode.episode_number}`]) &&
                                episodeNotes[`${selectedSeason}-${episode.episode_number}`].length > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {episodeNotes[`${selectedSeason}-${episode.episode_number}`].length}
                                  </span>
                                )}
                            </div>
                          )}
                          {expandedNoteId?.type === "episode" &&
                            expandedNoteId?.id === `${selectedSeason}-${episode.episode_number}` &&
                            !editingNote && <span className="ml-1 text-xs whitespace-nowrap">Add a note</span>}
                        </motion.button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(episode.air_date)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {episode.runtime || "N/A"} min
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded episode details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-4 pb-4"
                    >
                      {/* Episode overview */}
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-zinc-400 mb-1">Overview</h3>
                        <p className="text-sm">{episode.overview || "No overview available."}</p>
                      </div>

                      {/* Episode notes */}
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-zinc-400 mb-2">Notes</h3>

                        {/* Note editor */}
                        {editingNote?.type === "episode" &&
                          editingNote?.id === `${selectedSeason}-${episode.episode_number}` && (
                            <motion.div
                              className="mb-4 bg-zinc-800/50 rounded-lg p-2"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <textarea
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="Add notes about this episode..."
                                rows={3}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => e.stopPropagation()}
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <motion.button
                                  className="px-3 py-1 rounded-lg text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingNote(null)
                                  }}
                                >
                                  Cancel
                                </motion.button>
                                <motion.button
                                  className="px-3 py-1 rounded-lg text-xs bg-purple-600 text-white hover:bg-purple-500"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSaveNote(
                                      "episode",
                                      `${selectedSeason}-${episode.episode_number}`,
                                      e.currentTarget.parentElement?.previousSibling?.value || "",
                                    )
                                  }}
                                >
                                  Save
                                </motion.button>
                              </div>
                            </motion.div>
                          )}

                        {/* Notes thread */}
                        {hasNotes ? (
                          <div className="space-y-2">
                            {episodeNotes[episodeNoteId].map((note) => (
                              <div key={note.id} className="bg-zinc-800/70 rounded-lg p-3">
                                <p className="text-sm mb-1">{note.text}</p>
                                <div className="flex items-center text-xs text-zinc-400">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(note.timestamp).toLocaleDateString()}{" "}
                                  {new Date(note.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-2 text-zinc-500 text-sm">No notes yet</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        ) : (
          <div className="text-center py-4 text-zinc-500">No episodes available for this season</div>
        )}
      </div>
    </div>
  )
}
