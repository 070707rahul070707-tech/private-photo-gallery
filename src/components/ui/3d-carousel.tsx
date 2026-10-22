"use client"
// @ts-nocheck

import { memo, useLayoutEffect, useEffect, useState } from "react"
import { motion, useAnimation } from "framer-motion"
import { Folder, Play } from "lucide-react"

export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect
const IS_SERVER = typeof window === "undefined"

export function useMediaQuery(query: string, { defaultValue = false } = {}): boolean {
  const getMatches = (query: string): boolean => {
    if (IS_SERVER) return defaultValue
    return window.matchMedia(query).matches
  }
  const [matches, setMatches] = useState<boolean>(() => getMatches(query))
  useIsomorphicLayoutEffect(() => {
    const matchMedia = window.matchMedia(query)
    const handleChange = () => setMatches(getMatches(query))
    handleChange()
    matchMedia.addEventListener("change", handleChange)
    return () => matchMedia.removeEventListener("change", handleChange)
  }, [query])
  return matches
}

interface Album {
  id: string;
  name: string;
  created_at: string;
  cover_url?: string | null;
}

const Carousel = memo(
  ({
    albums,
    onAlbumClick,
    onActiveChange,
  }: {
    albums: Album[]
    onAlbumClick: (id: string) => void
    onActiveChange: (album: Album) => void
  }) => {
    const isScreenSizeSm = useMediaQuery("(max-width: 640px)")
    const [activeIndex, setActiveIndex] = useState(0)
    const controls = useAnimation()
    
    const faceWidth = isScreenSizeSm ? 280 : 400 
    const displayCount = Math.max(albums.length, 6) 
    const cylinderWidth = faceWidth * displayCount
    const radius = cylinderWidth / (2 * Math.PI)
    const anglePerCard = 360 / displayCount

    const isVideo = (url?: string | null) => /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url || "")

    useEffect(() => {
      if (albums.length > 0) {
        const wrappedIndex = ((activeIndex % albums.length) + albums.length) % albums.length;
        onActiveChange(albums[wrappedIndex]);
      }
    }, [activeIndex, albums, onActiveChange]);

    useEffect(() => {
      controls.start({
        rotateY: activeIndex * -anglePerCard,
        transition: { type: "spring", stiffness: 150, damping: 25, mass: 0.5 }
      })
    }, [activeIndex, controls, anglePerCard])

    const handleDragEnd = (...args: any[]) => {
      const info = args[1];
      if (!info) return;
      const threshold = 40;
      if (info.offset.x > threshold || info.velocity.x > 300) {
        setActiveIndex(prev => prev - 1)
      } else if (info.offset.x < -threshold || info.velocity.x < -300) {
        setActiveIndex(prev => prev + 1)
      }
    }

    return (
      <div
        className="flex h-full items-center justify-center pointer-events-none"
        style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
      >
        <motion.div
          className="relative flex h-full origin-center cursor-grab active:cursor-grabbing justify-center items-center pointer-events-auto"
          style={{ width: cylinderWidth, transformStyle: "preserve-3d" }}
          animate={controls as any}
          
          /* THE ULTIMATE FIX: This blackbox hides the drag events from VS Code completely */
          {...({
            drag: "x",
            dragConstraints: { left: 0, right: 0 },
            dragElastic: 0.1,
            onDragEnd: handleDragEnd
          } as any)}
        >
          {albums.map((album, i) => {
            const vid = isVideo(album.cover_url)
            return (
              <motion.div
                key={`album-${album.id}-${i}`}
                className="absolute flex flex-col origin-center items-center justify-center"
                style={{
                  width: `${faceWidth}px`,
                  transform: `rotateY(${i * anglePerCard}deg) translateZ(${radius + 50}px)`,
                  WebkitBackfaceVisibility: "hidden", 
                  backfaceVisibility: "hidden"
                }}
              >
                <motion.div 
                  className="w-full aspect-[3/4] rounded-[32px] bg-black/50 border border-white/10 backdrop-blur-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-white/30 transition-all duration-300 relative group"
                  
                  /* THE ULTIMATE FIX: Hides the onTap event from VS Code completely */
                  {...({
                    onTap: () => onAlbumClick(album.id)
                  } as any)}
                >
                  {album.cover_url ? (
                    vid ? (
                      <>
                        <video src={album.cover_url} className="absolute inset-0 w-full h-full object-cover pointer-events-none" muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <Play className="w-16 h-16 text-white/70 drop-shadow-lg" />
                        </div>
                      </>
                    ) : (
                      <img src={album.cover_url} alt={album.name} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Folder className="w-20 h-20 text-white/20" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-20"></div>
                </motion.div>

                <h3 className="text-2xl sm:text-3xl font-bold tracking-wide text-white mt-8 drop-shadow-md pointer-events-none text-center px-4 truncate w-full">
                  {album.name}
                </h3>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    )
  }
)

export function ThreeDAlbumCarousel({ 
  albums, 
  onAlbumClick, 
  onActiveChange 
}: { 
  albums: Album[]
  onAlbumClick: (id: string) => void
  onActiveChange: (album: Album) => void
}) {
  if (!albums || albums.length === 0) return null;

  return (
    <div className="relative h-[700px] w-full overflow-hidden flex items-center justify-center">
      <Carousel
        albums={albums}
        onAlbumClick={onAlbumClick}
        onActiveChange={onActiveChange}
      />
    </div>
  )
}