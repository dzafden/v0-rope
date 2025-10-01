"use client"

import { useState, useEffect, useCallback } from "react"
import ActivityItem from "./activity-item"
import { generateActivities } from "@/lib/fake-activity"
import { useSocialSettings } from "@/hooks/use-social-settings"
import { useMedia } from "@/context/media-context"
import type { Activity } from "@/types/activity"
import MediaGrid from "./media-grid"
import TitleDetails from "./title-details"
import { AnimatePresence } from "framer-motion"

export default function ActivityFeed() {
  const { collection, addToCollection } = useMedia()
  const { showSocial, toggleSocial, isLoaded } = useSocialSettings()
  const [activities, setActivities] = useState<Activity[]>([])

  // Generate activities when collection changes or social is toggled on
  useEffect(() => {
    if (showSocial && collection.length > 0) {
      const generatedActivities = generateActivities(collection)
      setActivities(generatedActivities)
    }
  }, [collection, showSocial])

  // Add state for TitleDetails modal
  const [showDetails, setShowDetails] = useState(false)
  const [selectedTitle, setSelectedTitle] = useState<any>(null)

  // Render function for activity items
  const renderActivityCard = useCallback(
    (activity: Activity) => {
      return (
        <ActivityItem
          key={activity.id}
          activity={activity}
          onShowDetails={(media) => {
            // Find the media item in the collection to ensure we have the full object
            const fullMediaItem = collection.find((item) => item.id === media.id) || media
            setSelectedTitle(fullMediaItem)
            setShowDetails(true)
          }}
        />
      )
    },
    [collection],
  ) // Add collection to dependencies

  // Don't render until settings are loaded
  if (!isLoaded) {
    return null
  }

  return (
    <div className="mb-6">
      {showSocial ? (
        activities.length > 0 ? (
          <MediaGrid
            items={activities}
            renderItem={renderActivityCard}
            gridClass="grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3"
            className="pb-2"
            emptyContent={
              <div className="text-center py-8 text-zinc-400">
                <p>No activity to show</p>
              </div>
            }
          />
        ) : (
          <div className="text-center py-8 text-zinc-400">
            <p>No activity to show</p>
          </div>
        )
      ) : (
        <div className="text-center py-8 text-zinc-400">
          <p>Social features are disabled</p>
        </div>
      )}

      {/* Add TitleDetails modal */}
      <AnimatePresence>
        {showDetails && selectedTitle && (
          <TitleDetails
            media={selectedTitle}
            onClose={() => setShowDetails(false)}
            onAddToCollection={() => {
              if (selectedTitle && !collection.some((item) => item.id === selectedTitle.id)) {
                addToCollection(selectedTitle)
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
