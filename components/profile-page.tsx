"use client";

import type React from "react";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import {
  Edit, Settings, Star, Plus, Search, Check, GripHorizontal, X,
  BookOpen, Library, Tag, Film, Tv, Clock, MessageSquare,
} from "lucide-react";

// Import necessary components
import MediaCard from "@/components/media-card";
import TitleDetails from "@/components/title-details";
import CustomizationModal from "@/components/customization-modal";

import { useMedia } from "@/context/media-context"; // Use the context
import { cn } from "@/lib/utils";
import storage from "@/lib/storage"; // Use the storage utility

// Emoji Sticker related imports
import { useState as useEmojiState, useEffect as useEmojiEffect, useRef as useEmojiRef } from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// LocalStorage Keys - Use keys defined in storage or context if available, otherwise define here
const STORAGE_KEYS_PROFILE = { // Renamed to avoid conflict if STORAGE_KEYS comes from storage.ts
  favorites: "mediaFavorites",
  watching: "mediaWatching",
  reading: "mediaReading",
  profileTags: "mediaProfileTags", // Key for saving selected filter tags
};

const PROFILE_STORAGE_KEYS = {
  name: "mediaProfileName",
  picture: "mediaProfilePicture",
  borderEffect: "mediaProfileBorderEffect",
};


// --- EmojiStickerFilters Component ---
// ... (No changes needed in EmojiStickerFilters) ...
function EmojiStickerFilters({ collection }) {
    const [selectedEmoji, setSelectedEmoji] = useEmojiState(null);
    const [filteredCards, setFilteredCards] = useEmojiState([]);
    const scrollContainerRef = useEmojiRef(null);

    const usedStickers = useMemo(() => {
      const stickers = new Map();
      collection.forEach((item) => {
        if (item.customizations?.stickers?.length) {
          item.customizations.stickers.forEach((sticker) => {
            if (stickers.has(sticker.id)) {
              stickers.set(sticker.id, {
                ...stickers.get(sticker.id),
                count: stickers.get(sticker.id).count + 1,
                items: [...stickers.get(sticker.id).items, item],
              });
            } else {
              stickers.set(sticker.id, {
                id: sticker.id,
                emoji: sticker.emoji,
                count: 1,
                items: [item],
              });
            }
          });
        }
      });
      return Array.from(stickers.values()).sort((a, b) => b.count - a.count);
    }, [collection]);

    useEmojiEffect(() => {
      if (!selectedEmoji) {
        setFilteredCards([]);
        return;
      }
      const filtered = usedStickers.find((s) => s.id === selectedEmoji)?.items || [];
      setFilteredCards(filtered);
    }, [selectedEmoji, usedStickers]);

    const handleEmojiClick = (stickerId) => {
      setSelectedEmoji((prev) => (prev === stickerId ? null : stickerId));
    };

    return (
      <div className="w-full mt-2 mb-0.5">
        <div ref={scrollContainerRef} className="flex overflow-x-auto gap-2 pb-1 -mx-2 px-2 scrollbar-hide no-scrollbar">
          {usedStickers.length > 0 ? (
            usedStickers.map((sticker) => (
              <motion.button
                key={sticker.id}
                className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${
                  selectedEmoji === sticker.id
                    ? "bg-purple-600 shadow-lg shadow-purple-500/30"
                    : "bg-black/30 hover:bg-black/50"
                }`}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                animate={{
                  scale: selectedEmoji === sticker.id ? [1, 1.1, 1] : 1,
                  rotate: [0, selectedEmoji === sticker.id ? 10 : 0, selectedEmoji === sticker.id ? -10 : 0, 0],
                }}
                transition={{
                  scale: { duration: 0.3, repeat: selectedEmoji === sticker.id ? Number.POSITIVE_INFINITY : 0, repeatType: "reverse" },
                  rotate: { duration: 0.5, repeat: selectedEmoji === sticker.id ? Number.POSITIVE_INFINITY : 0, repeatType: "reverse" },
                }}
                onClick={() => handleEmojiClick(sticker.id)}
              >
                <span className="text-3xl">{sticker.emoji}</span>
              </motion.button>
            ))
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className="flex-shrink-0 w-14 h-14 rounded-full bg-black/30 flex items-center justify-center cursor-pointer"
                    whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
                    animate={{ y: [0, -3, 0], rotate: [0, 5, -5, 0] }}
                    transition={{
                      y: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
                      rotate: { duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
                    }}
                  >
                    <span className="text-3xl opacity-70">😶</span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-zinc-800 text-white border-zinc-700">
                  <p>Add stickers to your cards!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <AnimatePresence>
          {selectedEmoji && filteredCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }} // Corrected line
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <h3 className="text-sm font-medium mb-2 text-zinc-400">Cards with this sticker</h3>
              <div className="flex overflow-x-auto gap-2 pb-2 -mx-2 px-2 scrollbar-hide no-scrollbar">
                {filteredCards.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <MediaCard {...item} className="w-[100px] sm:w-[140px]" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

// --- NotesTimeline Component ---
// ... (No changes needed in NotesTimeline) ...
function NotesTimeline({ notes, onClose, handleShowDetails, collection }) {
    const getBorderEffectClass = (effect) => {
      switch (effect) {
        case "pulse": return "animate-pulse border-2 border-pink-500";
        case "glow": return "border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]";
        case "rainbow": return "border-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-[2px]";
        case "neon": return "border-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)] animate-[pulse_2s_ease-in-out_infinite]";
        case "gradient": return "border-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-[2px]";
        case "glitch": return "border-2 relative animate-[glitch_3s_ease-in-out_infinite] border-[#AFE3C0] shadow-[0_0_8px_rgba(255,255,255,0.3)]";
        default: return "";
      }
    };

    const handleMediaCardClick = (mediaId) => {
      const mediaItem = collection.find((item) => item.id === mediaId);
      if (mediaItem && handleShowDetails) {
        handleShowDetails(mediaItem);
      }
    };

    return (
      <motion.div className="w-full mt-4 mb-6" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center">
            <MessageSquare className="w-5 h-5 text-pink-400 mr-2" />
            <span>Your Notes Timeline</span>
          </h3>
          <motion.button className="bg-zinc-800 rounded-full p-2" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}>
            <X className="w-4 h-4" />
          </motion.button>
        </div>
        {notes.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
            <p>You haven't added any notes yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <motion.div key={note.id} className="bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-700/50" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                <div className="flex">
                  <div className="w-20 h-28 relative flex-shrink-0 overflow-hidden m-2 rounded-lg border border-zinc-700/50 cursor-pointer" onClick={() => handleMediaCardClick(note.mediaId)}>
                    <img src={note.mediaPoster || "/placeholder.svg"} alt={note.mediaTitle} className="w-full h-full object-cover"/>
                    {note.mediaCustomizations?.borderEffect && ( <div className={`absolute inset-0 pointer-events-none ${getBorderEffectClass(note.mediaCustomizations.borderEffect)}`}></div> )}
                  </div>
                  <div className="p-3 flex-1">
                    <div className="flex flex-col">
                      <h4 className="font-medium text-sm">{note.mediaTitle}</h4>
                      <div className="flex items-center text-xs text-zinc-400 mt-1">
                        {note.mediaType === "movie" && <Film className="w-3 h-3 mr-1" />}
                        {note.mediaType === "tv" && <Tv className="w-3 h-3 mr-1" />}
                        {note.mediaType === "book" && <BookOpen className="w-3 h-3 mr-1" />}
                        <span>{note.releaseYear || "Unknown year"}</span>
                        {note.season && note.episode && ( <span className="ml-2 bg-zinc-700/50 px-1.5 py-0.5 rounded text-[10px]"> S{note.season}:E{note.episode} </span> )}
                        {note.season && !note.episode && ( <span className="ml-2 bg-zinc-700/50 px-1.5 py-0.5 rounded text-[10px]"> Season {note.season} </span> )}
                        {note.episodeTitle && <span className="ml-1 text-zinc-500">"{note.episodeTitle}"</span>}
                      </div>
                      <div className="mt-2 text-sm bg-zinc-900/50 p-3 rounded-lg">{note.text}</div>
                      <div className="flex items-center mt-2 text-xs text-zinc-500 justify-end">
                        <Clock className="w-3 h-3 mr-1 opacity-70" />
                        <span className="opacity-70"> {new Date(note.timestamp).toLocaleDateString()} {new Date(note.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

// --- MediaItem Interface ---
export interface MediaItem {
  id: string;
  title: string;
  coverImage: string;
  type: "movie" | "tv" | "book";
  releaseDate?: string;
  isInCollection?: boolean;
  customizations?: {
    stickers?: any[];
    borderEffect?: string;
    overlay?: string;
    [key: string]: any;
  };
}

// --- ProfilePage Component ---
export default function ProfilePage() {
  // Get ALL necessary state and functions from context
  const {
    collection,
    addToCollection,
    getItemTags,
    getAllTags,
    setSelectedSticker,
    setStickerPosition,
    setStickerSize,
    setStickerRotation,
    updateMediaCustomization,
    hideItem,
    getMediaWithLatestCustomizations,
    // State for lists FROM CONTEXT
    orderedFavorites: contextOrderedFavorites,
    orderedWatching: contextOrderedWatching,
    orderedReading: contextOrderedReading,
    // Actions for lists FROM CONTEXT
    toggleSelection: contextToggleSelection,
    removeItem: contextRemoveItem,
  } = useMedia();

  // --- State Variables ---
  // Profile Edit Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState("MediaMaster");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profileBorderEffect, setProfileBorderEffect] = useState<"none" | "pulse" | "glow" | "rainbow">("none");
  const [uploadFileError, setUploadFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing state for sections
  const [isEditingFavorites, setIsEditingFavorites] = useState(false);
  const [isEditingWatching, setIsEditingWatching] = useState(false);
  const [isEditingReading, setIsEditingReading] = useState(false);

  // Search state for sections
  const [favoriteSearchQuery, setFavoriteSearchQuery] = useState("");
  const [watchingSearchQuery, setWatchingSearchQuery] = useState("");
  const [readingSearchQuery, setReadingSearchQuery] = useState("");
  const [favoriteResults, setFavoriteResults] = useState<MediaItem[]>([]);
  const [watchingResults, setWatchingResults] = useState<MediaItem[]>([]);
  const [readingResults, setReadingResults] = useState<MediaItem[]>([]);

  // LOCAL state for reordering (for immediate UI feedback during drag)
  // Initialized from context but managed locally during drag
  const [localOrderedFavorites, setLocalOrderedFavorites] = useState<MediaItem[]>(contextOrderedFavorites);
  const [localOrderedWatching, setLocalOrderedWatching] = useState<MediaItem[]>(contextOrderedWatching);
  const [localOrderedReading, setLocalOrderedReading] = useState<MediaItem[]>(contextOrderedReading);

  // Sync local reorder state when context state changes (e.g., on initial load or after context update)
  useEffect(() => { setLocalOrderedFavorites(contextOrderedFavorites); }, [contextOrderedFavorites]);
  useEffect(() => { setLocalOrderedWatching(contextOrderedWatching); }, [contextOrderedWatching]);
  useEffect(() => { setLocalOrderedReading(contextOrderedReading); }, [contextOrderedReading]);

  // Title Details Modal State
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<MediaItem | null>(null);

  // Customization Modal State
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [tempCustomizations, setTempCustomizations] = useState({});

  // Tags Filter State (Specific to Profile Page UI)
  const [selectedProfileTags, setSelectedProfileTags] = useState<string[]>([]);
  const [filteredTagItems, setFilteredTagItems] = useState<MediaItem[]>([]);
  const [visibleTagItems, setVisibleTagItems] = useState<number>(30);
  const tagsRef = useRef<HTMLDivElement>(null);

  // Notes Timeline State
  const [showNotesTimeline, setShowNotesTimeline] = useState(false);
  const [userNotes, setUserNotes] = useState<Array<any>>([]);

  // Active Card State (for visual feedback)
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // File Upload State
  const [file, setFile] = useState<File | null>(null);

  // --- Callbacks & Effects ---

    // Load Profile Data (Name, Picture, Border, **Selected Tags Filter**)
    useEffect(() => {
      try {
        const savedName = storage.get<string | null>(PROFILE_STORAGE_KEYS.name, null);
        if (savedName) setProfileName(savedName);
        const savedPicture = storage.get<string | null>(PROFILE_STORAGE_KEYS.picture, null);
        if (savedPicture) setProfilePicture(savedPicture);
        const savedBorderEffect = storage.get<"none" | "pulse" | "glow" | "rainbow" | null>(PROFILE_STORAGE_KEYS.borderEffect, null);
        if (savedBorderEffect) setProfileBorderEffect(savedBorderEffect);

        // Load saved profile filter tags
        const savedProfileTags = storage.get<string[]>(STORAGE_KEYS_PROFILE.profileTags, []);
        if (savedProfileTags.length > 0) { setSelectedProfileTags(savedProfileTags); }

      } catch (e) { console.error("Error loading profile data:", e); }
    }, []);

    // **Save Selected Profile Tags Filter to Storage**
    useEffect(() => {
      try {
        storage.set(STORAGE_KEYS_PROFILE.profileTags, selectedProfileTags);
      } catch (e) {
        console.error("Error saving selected profile tags:", e);
      }
    }, [selectedProfileTags]); // Run whenever the selected tags change

    // Load Notes
     useEffect(() => {
        // ... (Notes loading logic remains the same) ...
        try {
            console.log("Loading notes for profile page...");
            const allMediaNotes = storage.get<Record<string, Array<{ id: string; text: string; timestamp: number }>>>("mediaNotes", {});
            const notes: typeof userNotes = [];

            Object.entries(allMediaNotes).forEach(([mediaId, mediaNotesList]) => {
                const mediaItem = collection.find((item) => item.id === mediaId);
                if (!mediaItem || !mediaNotesList?.length) return;
                mediaNotesList.forEach(note => {
                    let season, episode, episodeTitle;
                     if (mediaItem.type === "tv" && mediaId.includes("-")) { /* ... parsing logic ... */
                        const parts = mediaId.split("-")
                        if (parts.length >= 2) {
                            const seasonEpisode = parts[parts.length - 1]
                            const match = seasonEpisode.match(/(\d+)-(\d+)$/)
                            if (match) {
                                season = Number.parseInt(match[1])
                                episode = Number.parseInt(match[2])
                            }
                        }
                    }
                     notes.push({
                        id: note.id, mediaId, mediaTitle: mediaItem.title, mediaPoster: mediaItem.coverImage,
                        mediaType: mediaItem.type, mediaCustomizations: mediaItem.customizations,
                        releaseYear: mediaItem.releaseDate?.substring(0, 4), season, episode, episodeTitle,
                        text: note.text, timestamp: note.timestamp,
                    });
                });
              });

              collection.forEach(item => {
                  if (item.type === 'tv') {
                      const seasonNotesKey = `${item.id}-seasonNotes`;
                      const seasonNotes = storage.get<Record<number, string>>(seasonNotesKey, {});
                      Object.entries(seasonNotes).forEach(([seasonStr, text]) => {
                          if (text && text.trim()) {
                              const season = Number.parseInt(seasonStr, 10);
                              if (!isNaN(season)) {
                                  notes.push({
                                      id: `season-${item.id}-${season}-${Date.now()}`, mediaId: item.id, mediaTitle: item.title,
                                      mediaPoster: item.coverImage, mediaType: item.type, mediaCustomizations: item.customizations,
                                      releaseYear: item.releaseDate?.substring(0, 4), season, text, timestamp: Date.now()
                                  });
                              }
                          }
                      });
                  }
              });

              collection.forEach(item => {
                  if (item.type === 'tv') {
                      const episodeNotesKey = `${item.id}-episodeNotes`;
                      const episodeNotesData = storage.get<Record<string, Array<{ id: string; text: string; timestamp: number }>>>(episodeNotesKey, {});
                      Object.entries(episodeNotesData).forEach(([episodeKey, episodeNoteList]) => {
                         const match = episodeKey.match(/^(\d+)-(\d+)$/);
                          if (match && episodeNoteList?.length) {
                              const season = Number.parseInt(match[1], 10);
                              const episode = Number.parseInt(match[2], 10);
                              if (!isNaN(season) && !isNaN(episode)) {
                                  episodeNoteList.forEach(note => {
                                      notes.push({
                                          id: note.id, mediaId: item.id, mediaTitle: item.title, mediaPoster: item.coverImage,
                                          mediaType: item.type, mediaCustomizations: item.customizations,
                                          releaseYear: item.releaseDate?.substring(0, 4), season, episode,
                                          episodeTitle: `Episode ${episode}`, text: note.text, timestamp: note.timestamp
                                      });
                                  });
                              }
                          } else { console.warn(`Could not parse episode key format: ${episodeKey} or no notes`); }
                      });
                  }
              });

            notes.sort((a, b) => b.timestamp - a.timestamp);
            setUserNotes(notes);
            console.log("Loaded notes:", notes);
          } catch (error) { console.error("Error loading notes:", error); }
    }, [collection]); // Re-run if collection changes

    // REMOVED: useEffect that loaded lists directly in ProfilePage

    // Show Title Details Modal
     const handleShowDetails = useCallback((media: MediaItem) => {
        console.log("Showing details for:", media.title);
        setSelectedTitle(media);
        setShowDetails(true);
      }, []);

    // Filter Collection for Search Bars
     const filterCollection = useCallback((query: string, mediaTypes?: Array<"movie" | "tv" | "book">): MediaItem[] => {
        if (!query || query.trim().length < 2) return [];
        const searchTerm = query.toLowerCase().trim();
        return collection.filter((item) => {
          if (mediaTypes && !mediaTypes.includes(item.type)) return false;
          return item.title.toLowerCase().includes(searchTerm);
        });
      }, [collection]);

    // Update Search Results based on Query
     useEffect(() => setFavoriteResults(filterCollection(favoriteSearchQuery, ["movie", "tv", "book"])), [favoriteSearchQuery, filterCollection]);
     useEffect(() => setWatchingResults(filterCollection(watchingSearchQuery, ["movie", "tv"])), [watchingSearchQuery, filterCollection]);
     useEffect(() => setReadingResults(filterCollection(readingSearchQuery, ["book"])), [readingSearchQuery, filterCollection]);


    // --- Callbacks for TitleDetails ---
    const handleAddToCollectionFromDetails = useCallback((item: MediaItem) => {
        // Use context function directly
        contextToggleSelection(item, 'collection'); // Assuming 'collection' adds if not present
         console.log(`Add to collection requested for ${item.title} from details.`);
      }, [contextToggleSelection]); // Depend on context function

    const handleCustomizeFromDetails = useCallback((item: MediaItem) => {
          console.log("Customize requested from details for:", item.title);
          if (typeof setSelectedSticker !== 'function' || typeof setStickerPosition !== 'function' || typeof setStickerSize !== 'function' || typeof setStickerRotation !== 'function') {
              console.error("Sticker context functions are not available or not functions!"); return;
          }
          // Ensure item is in collection - contextToggleSelection might handle this, or call addToCollection explicitly if needed
          if (!collection.some((collectionItem) => collectionItem.id === item.id)) {
            addToCollection(item); // Explicitly add if not in collection
          }
          setSelectedMedia(item); setTempCustomizations(item.customizations || {}); setIsCustomizing(true);
          if (item.customizations?.stickers?.length) {
              const sticker = item.customizations.stickers[0];
              setSelectedSticker(sticker.id); setStickerPosition(sticker.position || { x: 50, y: 50 });
              setStickerSize(sticker.size || 40); setStickerRotation(sticker.rotation || 0);
          } else {
              setSelectedSticker(null); setStickerPosition({ x: 50, y: 50 }); setStickerSize(40); setStickerRotation(0);
          }
          setShowDetails(false);
      }, [
          collection, addToCollection, // Added addToCollection dependency
          setSelectedSticker, setStickerPosition, setStickerSize, setStickerRotation,
          setSelectedMedia, setTempCustomizations, setIsCustomizing, setShowDetails,
      ]);

    const handleHideItemFromDetails = useCallback((item: MediaItem) => {
          console.log("Hide requested from details for:", item.title);
          if (hideItem) { hideItem(item.id); }
          else { console.warn("hideItem function not available from useMedia context."); }
          setShowDetails(false);
      }, [hideItem, setShowDetails]);


    // --- Customization Modal Save ---
     const handleSaveCustomizations = useCallback((updatedCustomizations) => {
          if (selectedMedia) {
              console.log("Saving customizations for:", selectedMedia.title, updatedCustomizations);
              updateMediaCustomization(selectedMedia.id, updatedCustomizations);
              setIsCustomizing(false); setSelectedMedia(null);
          }
      }, [selectedMedia, updateMediaCustomization, setIsCustomizing, setSelectedMedia]);


    // --- Tags Section Logic ---
      const filterItemsByTags = useCallback(() => {
          if (selectedProfileTags.length === 0) { setFilteredTagItems([]); return; }
          const filtered = collection.filter(item => selectedProfileTags.some(tagId => getItemTags(item.id).includes(tagId)));
          setFilteredTagItems(filtered); setVisibleTagItems(30);
        }, [selectedProfileTags, collection, getItemTags]);

      useEffect(filterItemsByTags, [selectedProfileTags, filterItemsByTags]);

      const toggleProfileTagSelection = (tagId: string) => {
        const newTags = selectedProfileTags.includes(tagId) ? selectedProfileTags.filter(id => id !== tagId) : [...selectedProfileTags, tagId];
        setSelectedProfileTags(newTags);
        // Saving happens in the dedicated useEffect for selectedProfileTags
      };

      const handleTagScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          if (scrollHeight - scrollTop <= clientHeight * 1.5) {
            setVisibleTagItems(prev => Math.min(prev + 20, filteredTagItems.length));
          }
        }, [filteredTagItems.length]);

      const countItemsWithTag = useCallback((tagId: string) => {
          return collection.filter(item => getItemTags(item.id).includes(tagId)).length;
        }, [collection, getItemTags]);


    // --- Profile Edit Logic ---
      const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (!file) { setUploadFileError("No file selected"); return; }
          if (!file.type.startsWith("image/")) { setUploadFileError("Please select an image file"); return; }
          if (file.size > 5 * 1024 * 1024) { setUploadFileError("File size exceeds 5MB"); return; }
          setFile(file); setUploadFileError("");
          const reader = new FileReader();
          reader.onloadend = () => { if (reader.result) setProfilePicture(reader.result as string); };
          reader.readAsDataURL(file);
        };

      const getProfileBorderClass = () => {
          switch (profileBorderEffect) {
            case "pulse": return "animate-pulse border-2 border-pink-500";
            case "glow": return "border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]";
            case "rainbow": return "border-2 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-[2px]";
            default: return "";
          }
        };

      const saveProfileData = () => {
          try {
            storage.set(PROFILE_STORAGE_KEYS.name, profileName);
            storage.set(PROFILE_STORAGE_KEYS.picture, profilePicture);
            storage.set(PROFILE_STORAGE_KEYS.borderEffect, profileBorderEffect);
          } catch (e) { console.error("Error saving profile data:", e); }
          setShowProfileModal(false);
        };


    // --- List Item Management (using context functions) ---
    // REMOVED local toggleSelection and removeItem functions

    // --- Render Function ---
  return (
    <div className="h-full overflow-y-auto scrollbar-hide no-scrollbar bg-gradient-to-b from-zinc-900 to-black pb-20">
      {/* Profile Header */}
      {/* ... (Header JSX remains the same) ... */}
       <div className="relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2"> <motion.button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowProfileModal(true)}> <Edit className="w-5 h-5" /> </motion.button> <motion.button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}> <Settings className="w-5 h-5" /> </motion.button> </div>
        <div className="pt-10 pb-6 px-4 bg-gradient-to-b from-purple-900/50 to-black">
          <div className="flex flex-col items-center">
            <motion.div className={`w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 overflow-hidden ${getProfileBorderClass()}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}> {profilePicture ? ( <div className="w-full h-full"><img src={profilePicture} alt="Profile" className="w-full h-full object-cover" /></div> ) : ( <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><span className="text-4xl">👾</span></div> )} </motion.div>
            <motion.h1 className="text-2xl font-bold mb-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}> {profileName} </motion.h1>
            <motion.div className="flex items-center gap-2 mb-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}> <div className="flex items-center gap-1 bg-black/30 rounded-full px-3 py-1"> <Library className="w-4 h-4 text-yellow-400" /> <motion.span className="font-bold text-yellow-400" initial={{ scale: 1 }} whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 500 }}> {collection.length} </motion.span> </div> <div className="flex items-center gap-1 bg-black/30 rounded-full px-3 py-1 cursor-pointer hover:bg-black/50 transition-colors" onClick={() => tagsRef.current?.scrollIntoView({ behavior: "smooth" })}> <Tag className="w-4 h-4 text-orange-400" /> <span className="font-bold text-orange-400">{getAllTags().length}</span> </div> <div className="flex items-center gap-1 bg-black/30 rounded-full px-3 py-1 cursor-pointer hover:bg-black/50 transition-colors" onClick={() => setShowNotesTimeline(!showNotesTimeline)}> <MessageSquare className="w-4 h-4 text-pink-400" /> <span className="font-bold text-pink-400">{userNotes.length}</span> {showNotesTimeline && (<motion.div className="w-2 h-2 bg-pink-400 rounded-full ml-1" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}/> )} </div> </motion.div>
            <EmojiStickerFilters collection={collection} />
            <AnimatePresence> {showNotesTimeline && ( <NotesTimeline notes={userNotes} onClose={() => setShowNotesTimeline(false)} handleShowDetails={handleShowDetails} collection={collection} /> )} </AnimatePresence>
          </div>
        </div>
      </div>


      {/* Favorites Section */}
      <div className="px-4 py-6 relative">
        <div className="flex justify-between items-center mb-4"> <h2 className="text-lg font-bold flex items-center"><Star className="w-5 h-5 text-yellow-400 mr-2" /><span>My Favorites</span></h2> <motion.button className={cn("rounded-full p-2 flex items-center justify-center", isEditingFavorites ? "bg-purple-700" : "bg-purple-600")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsEditingFavorites(!isEditingFavorites)}> <Edit className="w-4 h-4" /> </motion.button> </div>
        {isEditingFavorites && (
            <div className="mb-4 relative">
              <div className="relative flex-grow"> <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" /> <input type="text" placeholder="Search to add (max 5)..." className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-2 pl-10 pr-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" value={favoriteSearchQuery} onChange={(e) => setFavoriteSearchQuery(e.target.value)} /> {favoriteSearchQuery && ( <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white" onClick={() => setFavoriteSearchQuery("")}><X className="w-4 h-4" /></button> )} </div>
              {favoriteSearchQuery.length > 0 && ( <div className="absolute z-20 left-0 right-0 mt-2 bg-zinc-900 rounded-xl border border-zinc-700 shadow-xl max-h-[40vh] overflow-y-auto"> {favoriteSearchQuery.length >= 2 ? ( favoriteResults.length > 0 ? ( <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 p-1"> {favoriteResults.map((item) => { const isSelected = contextOrderedFavorites.some(fav => fav.id === item.id); return ( <div key={item.id} className={cn("relative rounded-md overflow-hidden cursor-pointer transition-all group", isSelected ? "ring-2 ring-yellow-400" : "hover:ring-2 hover:ring-yellow-600/50", contextOrderedFavorites.length >= 5 && !isSelected ? "opacity-50 cursor-not-allowed" : "")} onClick={() => contextToggleSelection(item, "favorites")} title={item.title}> <div className="relative w-full pb-[70%] bg-zinc-800"><Image src={item.coverImage || "/placeholder.svg"} alt={item.title} fill sizes="(max-width: 640px) 30vw, (max-width: 768px) 20vw, 15vw" className="object-cover transition-transform duration-200 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-0.5"><p className="text-[8px] font-medium truncate text-white leading-tight"> {item.title} </p><div className="flex items-center mt-0.5"><span className="text-[7px] text-zinc-300"> {item.type === "movie" ? "🎬" : item.type === "tv" ? "📺" : "📚"} </span></div></div></div> {isSelected && ( <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-0.5"> <Check className="w-2 h-2 text-black" /> </div> )} </div> ); })} </div> ) : ( <div className="text-center py-4 text-zinc-400">No matching titles found</div> ) ) : ( <div className="text-center py-4 text-zinc-400">Type at least 2 characters</div> )} </div> )}
            </div>
         )}
        {/* Use local state for rendering reorder list, but context state for length check */}
        {contextOrderedFavorites.length > 0 ? (
           <div className="flex justify-start gap-2 overflow-x-auto pb-4 -mx-4 px-4 pl-6 scrollbar-hide no-scrollbar">
             {isEditingFavorites ? (
               <Reorder.Group axis="x" values={localOrderedFavorites} onReorder={(newOrder) => {
                  setLocalOrderedFavorites(newOrder); // Update local state for smooth UI
                  // Persist the new order of IDs
                  storage.set(STORAGE_KEYS_PROFILE.favorites, newOrder.map(item => item.id));
               }} className="flex gap-2">
                 {localOrderedFavorites.map((item) => (
                   <Reorder.Item key={item.id} value={item} className="cursor-grab active:cursor-grabbing">
                     <div className="relative">
                       <MediaCard {...getMediaWithLatestCustomizations(item)} onShowDetails={() => handleShowDetails(item)} isActive={activeCardId === item.id} onActivate={() => setActiveCardId(activeCardId === item.id ? null : item.id)} />
                       <button className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg z-10" onClick={(e) => contextRemoveItem(item.id, "favorites", e)} aria-label="Remove"><X className="w-4 h-4 text-white" /></button>
                       <div className="absolute -top-2 -left-2 bg-yellow-400 rounded-full p-1 shadow-lg"><GripHorizontal className="w-4 h-4 text-black pointer-events-none" /></div>
                     </div>
                   </Reorder.Item>
                 ))}
               </Reorder.Group>
             ) : (
               contextOrderedFavorites.map((item, index) => ( // Render based on context state when not editing
                 <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
                   <MediaCard {...getMediaWithLatestCustomizations(item)} onShowDetails={() => handleShowDetails(item)} />
                 </motion.div>
               ))
             )}
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
             <Star className="w-10 h-10 mb-2 text-zinc-600" />
             <p className="mb-4">Add up to 5 favorites!</p>
             {!isEditingFavorites && (<motion.button className="bg-purple-600 text-white px-4 py-2 rounded-full flex items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsEditingFavorites(true)}><Plus className="w-4 h-4 mr-1" /><span>Add Favorites</span></motion.button>)}
           </div>
         )}
      </div>

      {/* Currently Watching Section */}
      <div className="px-4 py-6 border-t border-zinc-800">
         <div className="flex justify-between items-center mb-4"> <h2 className="text-lg font-bold flex items-center"><Film className="w-5 h-5 text-blue-400 mr-2" /><span>Currently Watching</span></h2> <motion.button className={cn("rounded-full p-2 flex items-center justify-center", isEditingWatching ? "bg-purple-700" : "bg-purple-600")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsEditingWatching(!isEditingWatching)}> <Edit className="w-4 h-4" /> </motion.button> </div>
         {isEditingWatching && (
            <div className="mb-4 relative">
              <div className="relative flex-grow"> <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" /> <input type="text" placeholder="Search movies or shows to add..." className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-2 pl-10 pr-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" value={watchingSearchQuery} onChange={(e) => setWatchingSearchQuery(e.target.value)} /> {watchingSearchQuery && ( <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white" onClick={() => setWatchingSearchQuery("")}><X className="w-4 h-4" /></button> )} </div>
              {watchingSearchQuery.length > 0 && ( <div className="absolute z-20 left-0 right-0 mt-2 bg-zinc-900 rounded-xl border border-zinc-700 shadow-xl max-h-[40vh] overflow-y-auto"> {watchingSearchQuery.length >= 2 ? ( watchingResults.length > 0 ? ( <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 p-1"> {watchingResults.map((item) => { const isSelected = contextOrderedWatching.some(watch => watch.id === item.id); return ( <div key={item.id} className={cn("relative rounded-md overflow-hidden cursor-pointer transition-all group", isSelected ? "ring-2 ring-blue-400" : "hover:ring-2 hover:ring-blue-600/50")} onClick={() => contextToggleSelection(item, "watching")} title={item.title}> <div className="relative w-full pb-[70%] bg-zinc-800"><Image src={item.coverImage || "/placeholder.svg"} alt={item.title} fill sizes="(max-width: 640px) 30vw, (max-width: 768px) 20vw, 15vw" className="object-cover transition-transform duration-200 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-0.5"><p className="text-[8px] font-medium truncate text-white leading-tight"> {item.title} </p><div className="flex items-center mt-0.5"><span className="text-[7px] text-zinc-300"> {item.type === "movie" ? "🎬" : "📺"} </span></div></div></div> {isSelected && ( <div className="absolute top-1 right-1 bg-blue-400 rounded-full p-0.5"> <Check className="w-2 h-2 text-black" /> </div> )} </div> );})} </div> ) : ( <div className="text-center py-4 text-zinc-400">No matching movies or shows found</div> ) ) : ( <div className="text-center py-4 text-zinc-400">Type at least 2 characters</div> )} </div> )}
            </div>
         )}
        {contextOrderedWatching.length > 0 ? (
           <div className="flex justify-start gap-2 overflow-x-auto pb-4 -mx-4 px-4 pl-6 scrollbar-hide no-scrollbar">
             {isEditingWatching ? (
               <Reorder.Group axis="x" values={localOrderedWatching} onReorder={(newOrder) => {
                   setLocalOrderedWatching(newOrder);
                   storage.set(STORAGE_KEYS_PROFILE.watching, newOrder.map(item => item.id));
               }} className="flex gap-2">
                 {localOrderedWatching.map((item) => (
                   <Reorder.Item key={item.id} value={item} className="cursor-grab active:cursor-grabbing">
                     <div className="relative">
                       <MediaCard {...getMediaWithLatestCustomizations(item)} onShowDetails={() => handleShowDetails(item)} isActive={activeCardId === item.id} onActivate={() => setActiveCardId(activeCardId === item.id ? null : item.id)} />
                       <button className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg z-10" onClick={(e) => contextRemoveItem(item.id, "watching", e)} aria-label="Remove"><X className="w-4 h-4 text-white" /></button>
                       <div className="absolute -top-2 -left-2 bg-blue-400 rounded-full p-1 shadow-lg"><GripHorizontal className="w-4 h-4 text-black pointer-events-none" /></div>
                     </div>
                   </Reorder.Item>
                 ))}
               </Reorder.Group>
             ) : (
               contextOrderedWatching.map((item, index) => (
                 <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
                   <MediaCard {...getMediaWithLatestCustomizations(item)} onShowDetails={() => handleShowDetails(item)} />
                 </motion.div>
               ))
             )}
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
             <Film className="w-10 h-10 mb-2 text-zinc-600" />
             <p className="mb-4">Not watching anything yet</p>
             {!isEditingWatching && (<motion.button className="bg-purple-600 text-white px-4 py-2 rounded-full flex items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsEditingWatching(true)}><Plus className="w-4 h-4 mr-1" /><span>Add Shows</span></motion.button>)}
           </div>
         )}
      </div>

      {/* Currently Reading Section */}
       <div className="px-4 py-6 border-t border-zinc-800">
          <div className="flex justify-between items-center mb-4"> <h2 className="text-lg font-bold flex items-center"><BookOpen className="w-5 h-5 text-orange-400 mr-2" /><span>Currently Reading</span></h2> <motion.button className={cn("rounded-full p-2 flex items-center justify-center", isEditingReading ? "bg-purple-700" : "bg-purple-600")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsEditingReading(!isEditingReading)}> <Edit className="w-4 h-4" /> </motion.button> </div>
          {isEditingReading && (
            <div className="mb-4 relative">
              <div className="relative flex-grow"> <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" /> <input type="text" placeholder="Search books to add..." className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-2 pl-10 pr-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" value={readingSearchQuery} onChange={(e) => setReadingSearchQuery(e.target.value)} /> {readingSearchQuery && ( <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white" onClick={() => setReadingSearchQuery("")}><X className="w-4 h-4" /></button> )} </div>
              {readingSearchQuery.length > 0 && ( <div className="absolute z-20 left-0 right-0 mt-2 bg-zinc-900 rounded-xl border border-zinc-700 shadow-xl max-h-[40vh] overflow-y-auto"> {readingSearchQuery.length >= 2 ? ( readingResults.length > 0 ? ( <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 p-1"> {readingResults.map((item) => { const isSelected = contextOrderedReading.some(read => read.id === item.id); return ( <div key={item.id} className={cn("relative rounded-md overflow-hidden cursor-pointer transition-all group", isSelected ? "ring-2 ring-green-400" : "hover:ring-2 hover:ring-green-600/50" )} onClick={() => contextToggleSelection(item, "reading")} title={item.title}> <div className="relative w-full pb-[70%] bg-zinc-800"><Image src={item.coverImage || "/placeholder.svg"} alt={item.title} fill sizes="(max-width: 640px) 30vw, (max-width: 768px) 20vw, 15vw" className="object-cover transition-transform duration-200 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-0.5"><p className="text-[8px] font-medium truncate text-white leading-tight"> {item.title} </p><div className="flex items-center mt-0.5"><span className="text-[7px] text-zinc-300"> 📚 </span></div></div></div> {isSelected && ( <div className="absolute top-1 right-1 bg-green-400 rounded-full p-0.5"> <Check className="w-2 h-2 text-black" /> </div> )} </div> ); })} </div> ) : ( <div className="text-center py-4 text-zinc-400">No matching books found</div> ) ) : ( <div className="text-center py-4 text-zinc-400">Type at least 2 characters</div> )} </div> )}
            </div>
          )}
        {contextOrderedReading.length > 0 ? (
           <div className="flex justify-start gap-2 overflow-x-auto pb-4 -mx-4 px-4 pl-6 scrollbar-hide no-scrollbar">
             {isEditingReading ? (
               <Reorder.Group axis="x" values={localOrderedReading} onReorder={(newOrder) => {
                   setLocalOrderedReading(newOrder);
                   storage.set(STORAGE_KEYS_PROFILE.reading, newOrder.map(item => item.id));
               }} className="flex gap-2">
                 {localOrderedReading.map((item) => (
                   <Reorder.Item key={item.id} value={item} className="cursor-grab active:cursor-grabbing">
                     <div className="relative">
                       <MediaCard {...getMediaWithLatestCustomizations(item)} onShowDetails={() => handleShowDetails(item)} isActive={activeCardId === item.id} onActivate={() => setActiveCardId(activeCardId === item.id ? null : item.id)} />
                       <button className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg z-10" onClick={(e) => contextRemoveItem(item.id, "reading", e)} aria-label="Remove"><X className="w-4 h-4 text-white" /></button>
                       <div className="absolute -top-2 -left-2 bg-green-400 rounded-full p-1 shadow-lg"><GripHorizontal className="w-4 h-4 text-black pointer-events-none" /></div>
                     </div>
                   </Reorder.Item>
                 ))}
               </Reorder.Group>
             ) : (
               contextOrderedReading.map((item, index) => (
                 <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }}>
                   <MediaCard {...getMediaWithLatestCustomizations(item)} onShowDetails={() => handleShowDetails(item)} />
                 </motion.div>
               ))
             )}
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
             <BookOpen className="w-10 h-10 mb-2 text-zinc-600" />
             <p className="mb-4">Not reading anything yet</p>
             {!isEditingReading && (<motion.button className="bg-purple-600 text-white px-4 py-2 rounded-full flex items-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsEditingReading(true)}><Plus className="w-4 h-4 mr-1" /><span>Add Books</span></motion.button>)}
           </div>
         )}
      </div>

      {/* Tags Section */}
      <div ref={tagsRef} className="px-4 py-6 border-t border-zinc-800">
        <div className="flex flex-wrap gap-2 mb-4">
          {getAllTags().map((tag) => {
            const count = countItemsWithTag(tag.id);
            if (count === 0) return null;
            return ( <motion.button key={tag.id} className={cn("px-3 py-1 rounded-full text-xs flex items-center gap-1 transition-colors", selectedProfileTags.includes(tag.id) ? "bg-teal-600 hover:bg-teal-500 text-white" : tag.isCustom ? "bg-purple-600/60 hover:bg-purple-600/80 text-white" : "bg-zinc-700 hover:bg-zinc-600 text-white")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => toggleProfileTagSelection(tag.id)}> <span>{tag.name}</span><span className={cn("text-[10px] rounded-full px-1.5 min-w-[18px] text-center", selectedProfileTags.includes(tag.id) ? "bg-teal-800" : tag.isCustom ? "bg-purple-800" : "bg-zinc-800")}>{count}</span> </motion.button> );
          })}
        </div>
        {selectedProfileTags.length > 0 && ( filteredTagItems.length > 0 ? ( <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[60vh] overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800" onScroll={handleTagScroll}> <AnimatePresence> {filteredTagItems.slice(0, visibleTagItems).map((item) => ( <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}> <MediaCard {...getMediaWithLatestCustomizations(item)} className="w-full" onShowDetails={() => handleShowDetails(item)} isActive={activeCardId === item.id} onActivate={() => setActiveCardId(activeCardId === item.id ? null : item.id)} /> </motion.div> ))} </AnimatePresence> </div> ) : ( <div className="col-span-full text-center py-10 text-zinc-400"><Tag className="w-10 h-10 mx-auto mb-2 text-zinc-600" /><p>No items match the selected tags</p></div> ) )}
        {selectedProfileTags.length === 0 && ( <div className="text-center py-10 text-zinc-500"><p>Select tags above to filter your collection.</p></div> )}
      </div>


      {/* --- Modals --- */}
      {/* Profile Edit Modal */}
       {showProfileModal && ( <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"> <motion.div className="bg-zinc-800 p-6 rounded-xl w-full max-w-md border border-zinc-700" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}> <h2 className="text-xl font-bold mb-4">Edit Profile</h2> <div className="mb-4"> <label htmlFor="profileName" className="block text-sm font-medium text-zinc-300 mb-1">Name</label> <input id="profileName" type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" /> </div> <div className="mb-4"> <label className="block text-sm font-medium text-zinc-300 mb-1">Profile Picture</label> <div className="flex items-center gap-4"> <div className={`w-16 h-16 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center ${getProfileBorderClass()}`}> {profilePicture ? (<img src={profilePicture} alt="Current profile" className="w-full h-full object-cover"/>) : (<span className="text-3xl">👾</span>)} </div> <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" /> <button onClick={() => fileInputRef.current?.click()} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm">Upload Image</button> {profilePicture && (<button onClick={() => {setProfilePicture(null); setFile(null);}} className="text-red-500 hover:text-red-400 text-sm">Remove</button>)} </div> {uploadFileError && <p className="text-red-500 text-xs mt-1">{uploadFileError}</p>} </div> <div className="mb-6"> <label className="block text-sm font-medium text-zinc-300 mb-2">Picture Border Effect</label> <div className="flex gap-2"> {(['none', 'pulse', 'glow', 'rainbow'] as const).map(effect => ( <button key={effect} onClick={() => setProfileBorderEffect(effect)} className={cn("px-3 py-1 rounded-full text-xs capitalize border-2", profileBorderEffect === effect ? "bg-purple-600 border-purple-400 text-white" : "bg-zinc-700 border-zinc-600 text-zinc-300 hover:border-zinc-500")}>{effect}</button>))} </div> </div> <div className="flex justify-end gap-3"> <button onClick={() => setShowProfileModal(false)} className="bg-zinc-600 hover:bg-zinc-500 text-white px-4 py-2 rounded-md text-sm">Cancel</button> <button onClick={saveProfileData} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm">Save Changes</button> </div> </motion.div> </div> )}

      {/* Title Details Modal */}
       <AnimatePresence> {showDetails && selectedTitle && ( <TitleDetails media={getMediaWithLatestCustomizations(selectedTitle)} onClose={() => setShowDetails(false)} onAddToCollection={() => handleAddToCollectionFromDetails(selectedTitle)} onCustomize={() => handleCustomizeFromDetails(selectedTitle)} {...(hideItem && { hideItem: () => handleHideItemFromDetails(selectedTitle) })} /> )} </AnimatePresence>

       {/* Customization Modal */}
       <CustomizationModal isOpen={isCustomizing} media={selectedMedia} initialCustomizations={tempCustomizations} onSave={handleSaveCustomizations} onClose={() => { setIsCustomizing(false); setSelectedMedia(null); }} />

    </div> // End of main container div
  );
}
