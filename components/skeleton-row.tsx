"use client"

import SkeletonCard from "./skeleton-card"

interface SkeletonRowProps {
  count?: number
}

export default function SkeletonRow({ count = 6 }: SkeletonRowProps) {
  return (
    <div className="flex overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide no-scrollbar">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  )
}
