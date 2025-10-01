"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  className?: string
}

export default function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("w-[140px] sm:w-[160px] h-[210px] sm:h-[240px] mx-1 sm:mx-2 my-2", className)}>
      <div className="relative w-full h-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 bg-[length:400%_100%]"
          animate={{
            backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
          }}
          transition={{
            duration: 2,
            ease: "linear",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />

        {/* Title placeholder */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <div className="h-3 w-3/4 bg-zinc-800 rounded-full" />
        </div>

        {/* Type badge placeholder */}
        <div className="absolute top-2 left-2 h-4 w-8 bg-zinc-800 rounded-full" />
      </div>
    </div>
  )
}
