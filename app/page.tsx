"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Library, User } from "lucide-react"
import { cn } from "@/lib/utils"
import DiscoverPage from "@/components/discover-page"
import CollectionPage from "@/components/collection-page"
import ProfilePage from "@/components/profile-page"

// Import the OnboardingProvider and useOnboarding hook at the top of the file
import { useOnboarding } from "@/context/onboarding-context"
import { useMedia } from "@/context/media-context"

// Wrap the TabButton component to add notification dot functionality
function TabButton({ icon, isActive, onClick, showNotification = false }) {
  return (
    <motion.button
      className={cn("flex items-center justify-center p-2 relative", isActive ? "text-purple-500" : "text-zinc-400")}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {icon}

      {/* Notification dot */}
      {showNotification && (
        <motion.div
          className="absolute top-0 right-0 w-3 h-3 bg-pink-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
      )}
    </motion.button>
  )
}

// Create a new component that uses the OnboardingContext
function AppContent() {
  const [activeTab, setActiveTab] = useState("discover")
  const { showCollectionNotification, setHasSeenCollection } = useOnboarding()
  const { preloadInitialData, isInitialDataLoaded } = useMedia()

  // Preload data as soon as the app mounts
  useEffect(() => {
    if (!isInitialDataLoaded) {
      preloadInitialData().catch(console.error)
    }
  }, [isInitialDataLoaded, preloadInitialData])

  // Update the tab change handler to mark collection as seen and ensure data is loaded
  const handleTabChange = (tab) => {
    setActiveTab(tab)

    // If switching to collection tab, mark it as seen
    if (tab === "collection") {
      setHasSeenCollection(true)
    }

    // If switching to discover tab, ensure data is loaded
    if (tab === "discover" && !isInitialDataLoaded) {
      preloadInitialData().catch(console.error)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      <main className="flex-1 overflow-hidden">
        {activeTab === "discover" && <DiscoverPage />}
        {activeTab === "collection" && <CollectionPage />}
        {activeTab === "profile" && <ProfilePage />}
      </main>

      <motion.nav
        className="flex justify-around items-center h-16 bg-zinc-900 border-t border-zinc-800 px-2"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <TabButton
          icon={<Search className="w-6 h-6" />}
          isActive={activeTab === "discover"}
          onClick={() => handleTabChange("discover")}
        />
        <TabButton
          icon={<Library className="w-6 h-6" />}
          isActive={activeTab === "collection"}
          onClick={() => handleTabChange("collection")}
          showNotification={showCollectionNotification}
        />
        <TabButton
          icon={<User className="w-6 h-6" />}
          isActive={activeTab === "profile"}
          onClick={() => handleTabChange("profile")}
        />
      </motion.nav>
    </div>
  )
}

// Update the main App component to wrap with OnboardingProvider
export default function App() {
  return <AppContent />
}
