import SkeletonRow from "@/components/skeleton-row"
import SkeletonGrid from "@/components/skeleton-grid"

export default function Loading() {
  return (
    <div className="h-screen bg-black text-white overflow-hidden p-4">
      {/* Search Bar Skeleton */}
      <div className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-md">
        <div className="relative">
          <div className="w-full h-10 bg-zinc-800/80 border border-zinc-700 rounded-full"></div>
        </div>
      </div>

      {/* Content Skeletons */}
      <div className="px-1 py-4">
        <h2 className="text-lg font-bold mb-4">Trending Now</h2>
        <SkeletonRow />

        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Popular Movies</h2>
          <SkeletonRow />
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Popular TV Shows</h2>
          <SkeletonRow />
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Popular Books</h2>
          <SkeletonRow />
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">All Trending</h2>
          <SkeletonGrid />
        </div>
      </div>
    </div>
  )
}
