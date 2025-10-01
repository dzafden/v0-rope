"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ChevronLeft } from "lucide-react" // Removed Users icon
import MediaCard from "./media-card"
import PullToRefresh from "./pull-to-refresh"
import InfiniteScroll from "./infinite-scroll"
import { useMedia } from "@/context/media-context"
import type { MediaItem } from "@/types"
import TitleDetails from "./title-details"
import SkeletonRow from "./skeleton-row"
import SkeletonGrid from "./skeleton-grid"
import { useStickerCustomization } from "@/hooks/use-sticker-customization"
import CustomizationModal from "./customization-modal"
import MediaGrid from "./media-grid"
import MediaSearch from "./media-search"
import GamePromo from "./game-promo" // Ensure GamePromo is imported
import OnboardingGame from "./onboarding-game"
import { OnboardingProvider } from "@/context/onboarding-context"
// import ActivityFeed from "./activity-feed" // Removed import

export default function DiscoverPage() {
  // ... (States and Hooks remain the same) ...
  // Search & category states
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<null | {
    id: string
    title: string
    data: MediaItem[]
  }>(null)

  // Customization states
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [tempCustomizations, setTempCustomizations] = useState({})
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  // Game state
  const [showGame, setShowGame] = useState(false)

  // Sticker customization hook
  const {
    selectedSticker,
    stickerPosition,
    stickerSize,
    stickerRotation,
    showStickerDropdown,
    stickerSearch,
    keyboardEnabled,
    showStickerWarning,
    shakeStickerButton,
    stickerSearchRef,
    filteredStickers,
    setSelectedSticker,
    setStickerPosition,
    setStickerSize,
    setStickerRotation,
    setShowStickerDropdown,
    setStickerSearch,
    setKeyboardEnabled,
    handleStickerSelect,
    handleRemoveSticker,
    handleOverlaySelect: handleStickerOverlaySelect,
    getStickerData,
  } = useStickerCustomization()

  // Details modal state
  const [showDetails, setShowDetails] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState<MediaItem | null>(null)

  // Coin animation state
  const [showCoins, setShowCoins] = useState(false)

  const {
    trending,
    popularMovies,
    popularTVShows,
    popularBooks,
    isLoading,
    isTrendingLoading,
    isMoviesLoading,
    isTVShowsLoading,
    isBooksLoading,
    hasMore,
    refreshTrending,
    loadMoreTrending,
    loadMoreMovies,
    loadMoreTVShows,
    loadMoreBooks,
    hasMoreMovies,
    hasMoreTVShows,
    hasMoreBooks,
    isLoadingMovies,
    isLoadingTVShows,
    isLoadingBooks,
    addToCollection,
    isItemHidden,
    hideItem,
    collection,
    updateMediaCustomization,
    getMediaWithLatestCustomizations,
    isInitialDataLoaded,
    preloadInitialData,
  } = useMedia()

  // ... (useEffect and Callbacks remain the same) ...
  // Ensure we load fresh data for the Discover page if needed
  useEffect(() => {
    if (!isInitialDataLoaded && !isLoading) {
      preloadInitialData().catch(console.error)
    }
  }, [isInitialDataLoaded, isLoading, preloadInitialData])

  const handleAddToCollection = useCallback(
    (item: MediaItem) => {
      if (!collection.some((collectionItem) => collectionItem.id === item.id)) {
        addToCollection(item)
        setShowCoins(true)
        setTimeout(() => setShowCoins(false), 2000)
      }
    },
    [addToCollection, collection],
  )

  const handleHideItem = useCallback(
    (item: MediaItem) => {
      hideItem(item.id)
    },
    [hideItem],
  )

  const handleCustomize = useCallback(
    (item: MediaItem) => {
      if (!collection.some((collectionItem) => collectionItem.id === item.id)) {
        addToCollection(item)
      }
      setSelectedMedia(item)
      setIsCustomizing(true)
      if (item.customizations?.stickers?.length) {
        const sticker = item.customizations.stickers[0]
        setSelectedSticker(sticker.id)
        setStickerPosition(sticker.position || { x: 50, y: 50 })
        setStickerSize(sticker.size || 40)
        setStickerRotation(sticker.rotation || 0)
      } else {
        setSelectedSticker(null)
        setStickerPosition({ x: 50, y: 50 })
        setStickerSize(40)
        setStickerRotation(0)
      }
    },
    [addToCollection, collection, setSelectedSticker, setStickerPosition, setStickerSize, setStickerRotation],
  )

  const handleSaveCustomizations = useCallback(() => {
    if (selectedMedia) {
      const stickerData = getStickerData()
      const updatedCustomizations = {
        ...tempCustomizations,
        stickers: stickerData ? [stickerData] : [],
      }
      updateMediaCustomization(selectedMedia.id, updatedCustomizations)
      setIsCustomizing(false)
    }
  }, [selectedMedia, tempCustomizations, getStickerData, updateMediaCustomization])

  const handleUpdateCustomization = (type: string, value: any) => {
    setTempCustomizations((prev) => ({ ...prev, [type]: value }))
  }

  const handleOverlaySelect = (overlay: string) => {
    if (!handleStickerOverlaySelect(overlay)) return
    handleUpdateCustomization("overlay", overlay)
  }

  const handleCategoryClick = useCallback(
    (id: string, title: string, data: MediaItem[]) => {
      setActiveCategory({
        id,
        title,
        data: data.filter((item) => !isItemHidden(item.id)),
      })
      window.scrollTo(0, 0)
    },
    [isItemHidden],
  )

  const getItemWithCustomizations = useCallback(
    (item: MediaItem) => getMediaWithLatestCustomizations(item),
    [getMediaWithLatestCustomizations],
  )

  const handleShowDetails = useCallback((item: MediaItem) => {
    setSelectedTitle(item)
    setShowDetails(true)
  }, [])

  const hasInitialData = useMemo(() => {
    return trending.length > 0 || popularMovies.length > 0 || popularTVShows.length > 0 || popularBooks.length > 0
  }, [trending, popularMovies, popularTVShows, popularBooks])

  const renderMediaCard = useCallback(
    (item: MediaItem, index: number) => (
      <div key={`${item.id}-${index}`} className="relative">
        <MediaCard
          {...getItemWithCustomizations(item)}
          className="w-[130px] sm:w-[160px] h-[195px] sm:h-[240px]"
          isInCollection={collection.some((collectionItem) => collectionItem.id === item.id)}
          onShowDetails={() => handleShowDetails(item)}
          showHideButton={false}
          showTagsButton={false}
        />
      </div>
    ),
    [collection, getItemWithCustomizations, handleShowDetails],
  )

  return (
    <PullToRefresh onRefresh={refreshTrending}>
      <div className="h-full bg-gradient-to-b from-zinc-900 to-black pb-20">
        {/* Search Bar */}
        {/* ... (Search Bar JSX remains the same) ... */}
        <motion.div
          className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-md"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center gap-2 w-full">
            <AnimatePresence mode="popLayout">
              {activeCategory && (
                <motion.button
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"
                  onClick={() => setActiveCategory(null)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </motion.button>
              )}
            </AnimatePresence>
            <div className="flex-1">
              <MediaSearch
                onShowDetails={handleShowDetails}
                onSearchChange={setSearchQuery}
                placeholder="Find movies, shows, books..."
              />
            </div>
          </div>
        </motion.div>

        {/* Game Promo - MOVED here, outside the conditional rendering of main content sections */}
        {/* Only show if NOT searching and NOT in a category */}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {searchQuery.length >= 2 ? (
            // Search Results View
            <motion.div key="search-results" /* ... */ className="px-1 py-4">
              {/* Search results handled by MediaSearch */}
            </motion.div>
          ) : activeCategory ? (
            // Category View
            <motion.div key={`category-${activeCategory.id}`} /* ... */ className="px-1 py-4">
              {/* ... (Category view JSX remains the same) ... */}
              <h1 className="text-xl font-bold mb-6 flex items-center px-3">
                {activeCategory.id === "trending" && <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />}
                <span>{activeCategory.title}</span>
              </h1>
              <InfiniteScroll
                loadMore={() => {
                  if (activeCategory?.id === "trending") return loadMoreTrending()
                  if (activeCategory?.id === "movies") return loadMoreMovies()
                  if (activeCategory?.id === "tvshows") return loadMoreTVShows()
                  if (activeCategory?.id === "books") return loadMoreBooks()
                  return Promise.resolve()
                }}
                hasMore={
                  activeCategory?.id === "trending"
                    ? hasMore
                    : activeCategory?.id === "movies"
                      ? hasMoreMovies
                      : activeCategory?.id === "tvshows"
                        ? hasMoreTVShows
                        : activeCategory?.id === "books"
                          ? hasMoreBooks
                          : false
                }
                isLoading={
                  activeCategory?.id === "trending"
                    ? isTrendingLoading
                    : activeCategory?.id === "movies"
                      ? isLoadingMovies
                      : activeCategory?.id === "tvshows"
                        ? isLoadingTVShows
                        : activeCategory?.id === "books"
                          ? isLoadingBooks
                          : false
                }
              >
                <MediaGrid
                  items={activeCategory?.data.filter((item) => !isItemHidden(item.id)) || []}
                  renderItem={renderMediaCard}
                  gridClass="grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2"
                />
              </InfiniteScroll>
            </motion.div>
          ) : (
            // Default Discover View
            <motion.div
              key="discover-main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="px-1 py-4"
            >
              {isLoading && !hasInitialData ? (
                // Skeleton Loading State
                <div className="px-1 py-4">
                  {/* Skeletons for GamePromo and ActivityFeed are optional, depends on desired loading look */}
                  {/* <div className="h-24 bg-zinc-800 rounded-lg mb-4 mx-4 animate-pulse"></div> Game Promo Skeleton */}
                  {/*
                  <div className="mb-4">
                    {" "}
                    <h2 className="text-sm font-bold mb-2 px-4 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-purple-400" /> <span>Activity Feed</span>
                    </h2>{" "}
                    <SkeletonRow />{" "}
                  </div>
                  */}
                  <h2 className="text-sm font-bold mb-2 px-4 flex items-center">
                    {" "}
                    <Sparkles className="w-4 h-4 mr-2 text-yellow-400" /> <span>Trending Now</span>{" "}
                  </h2>{" "}
                  <SkeletonRow />
                  <div className="mt-4">
                    {" "}
                    <h2 className="text-sm font-bold mb-2 px-4">Popular Movies</h2> <SkeletonRow />{" "}
                  </div>
                  <div className="mt-4">
                    {" "}
                    <h2 className="text-sm font-bold mb-2 px-4">Popular TV Shows</h2> <SkeletonRow />{" "}
                  </div>
                  <div className="mt-4">
                    {" "}
                    <h2 className="text-sm font-bold mb-2 px-4">Popular Books</h2> <SkeletonRow />{" "}
                  </div>
                  <div className="mt-4">
                    {" "}
                    <h2 className="text-sm font-bold mb-2 px-4">All Trending</h2> <SkeletonGrid />{" "}
                  </div>
                </div>
              ) : (
                // Actual Content
                <InfiniteScroll loadMore={loadMoreTrending} hasMore={hasMore} isLoading={isLoading}>
                  {/* GamePromo at the top */}
                  {!searchQuery && !activeCategory && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="px-4 mb-6"
                    >
                      <GamePromo onPlayGame={() => setShowGame(true)} />
                    </motion.div>
                  )}

                  {/* Activity Feed Section */}
                  {/*
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4"
                  >
                    <h2 className="text-sm font-bold mb-2 px-4 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-purple-400" />
                      <span>Activity Feed</span>
                    </h2>
                    <ActivityFeed />
                  </motion.div>
                  */}

                  {/* Trending Now Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {" "}
                    {/* Adjusted delay */}
                    <h2
                      className="text-sm font-bold mb-2 px-4 flex items-center cursor-pointer hover:text-purple-400 transition-colors"
                      onClick={() => handleCategoryClick("trending", "Trending Now", trending)}
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
                      <span>Trending Now</span>
                    </h2>
                    {/* ... (Trending Row JSX) ... */}
                    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide no-scrollbar">
                      {trending
                        .filter((item) => !isItemHidden(item.id))
                        .map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <MediaCard
                              {...getItemWithCustomizations(item)}
                              isInCollection={collection.some((ci) => ci.id === item.id)}
                              onShowDetails={() => handleShowDetails(item)}
                              showHideButton={false}
                              showTagsButton={false}
                            />
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>

                  {/* Popular Movies Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-4"
                  >
                    {" "}
                    {/* Adjusted delay */}
                    <h2
                      className="text-sm font-bold mb-2 px-4 cursor-pointer hover:text-purple-400 transition-colors"
                      onClick={() => handleCategoryClick("movies", "Popular Movies", popularMovies)}
                    >
                      {" "}
                      Popular Movies{" "}
                    </h2>
                    {/* ... (Movies Row JSX) ... */}
                    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide no-scrollbar">
                      {popularMovies
                        .filter((item) => !isItemHidden(item.id))
                        .map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <MediaCard
                              {...getItemWithCustomizations(item)}
                              isInCollection={collection.some((ci) => ci.id === item.id)}
                              onShowDetails={() => handleShowDetails(item)}
                              showHideButton={false}
                              showTagsButton={false}
                            />
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>

                  {/* Popular TV Shows Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-4"
                  >
                    {" "}
                    {/* Adjusted delay */}
                    <h2
                      className="text-sm font-bold mb-2 px-4 cursor-pointer hover:text-purple-400 transition-colors"
                      onClick={() => handleCategoryClick("tvshows", "Popular TV Shows", popularTVShows)}
                    >
                      {" "}
                      Popular TV Shows{" "}
                    </h2>
                    {/* ... (TV Shows Row JSX) ... */}
                    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide no-scrollbar">
                      {popularTVShows
                        .filter((item) => !isItemHidden(item.id))
                        .map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <MediaCard
                              {...getItemWithCustomizations(item)}
                              isInCollection={collection.some((ci) => ci.id === item.id)}
                              onShowDetails={() => handleShowDetails(item)}
                              showHideButton={false}
                              showTagsButton={false}
                            />
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>

                  {/* Popular Books Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="mt-4"
                  >
                    {" "}
                    {/* Adjusted delay */}
                    <h2
                      className="text-sm font-bold mb-2 px-4 cursor-pointer hover:text-purple-400 transition-colors"
                      onClick={() => handleCategoryClick("books", "Popular Books", popularBooks)}
                    >
                      {" "}
                      Popular Books{" "}
                    </h2>
                    {/* ... (Books Row JSX) ... */}
                    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide no-scrollbar">
                      {popularBooks
                        .filter((item) => !isItemHidden(item.id))
                        .map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <MediaCard
                              {...getItemWithCustomizations(item)}
                              isInCollection={collection.some((ci) => ci.id === item.id)}
                              onShowDetails={() => handleShowDetails(item)}
                              showHideButton={false}
                              showTagsButton={false}
                            />
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>

                  {/* All Trending Grid */}
                  <div className="mt-4">
                    <h2 className="text-sm font-bold mb-2 px-4">All Trending</h2>
                    <MediaGrid
                      items={trending.filter((item) => !isItemHidden(item.id))}
                      renderItem={renderMediaCard}
                      gridClass="grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2"
                    />
                  </div>
                </InfiniteScroll>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coin Animation */}
        <AnimatedCoins show={showCoins} />

        {/* Customization Modal */}
        {/* ... (Modal JSX remains the same) ... */}
        <CustomizationModal
          isOpen={isCustomizing}
          media={selectedMedia}
          initialCustomizations={tempCustomizations}
          onSave={handleSaveCustomizations}
          onClose={() => setIsCustomizing(false)}
        />

        {/* Title Details Modal */}
        {/* ... (Modal JSX remains the same) ... */}
        <AnimatePresence>
          {showDetails && selectedTitle && (
            <TitleDetails
              media={getItemWithCustomizations(selectedTitle)}
              onClose={() => setShowDetails(false)}
              onAddToCollection={() => {
                handleAddToCollection(selectedTitle) /* setShowDetails(false); Optional */
              }}
              onCustomize={() => {
                handleCustomize(selectedTitle)
                setShowDetails(false)
              }}
              hideItem={() => {
                handleHideItem(selectedTitle)
                setShowDetails(false)
              }}
            />
          )}
        </AnimatePresence>

        {/* Game Modal */}
        {/* ... (Modal JSX remains the same) ... */}
        <AnimatePresence>
          {showGame && (
            <div className="fixed inset-0 z-[100]">
              <OnboardingProvider>
                <OnboardingGame
                  onComplete={() => setShowGame(false)}
                  standalone={true}
                  onExit={() => setShowGame(false)}
                />
              </OnboardingProvider>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PullToRefresh>
  )
}

// AnimatedCoins Component (remains the same)
function AnimatedCoins({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold"
          initial={{ x: Math.random() * window.innerWidth, y: window.innerHeight, opacity: 1 }}
          animate={{ y: -100, opacity: 0 }}
          transition={{ duration: 1 + Math.random(), ease: "easeOut" }}
        >
          <span className="text-xs">+1</span>
        </motion.div>
      ))}
    </div>
  )
}
