"use client"

import SkeletonCard from "./skeleton-card"

interface SkeletonGridProps {
  count?: number
}

export default function SkeletonGrid({ count = 12 }: SkeletonGridProps) {
  return (
    <div className="flex flex-wrap justify-between">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} className="w-[30%] sm:w-[160px]" />
      ))}
    </div>
  )
}
