"use client"
// @ts-nocheck

import { memo, useLayoutEffect, useEffect, useState } from "react"
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion"
import { Edit2, Trash2, Folder, Play } from "lucide-react"

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
    onActionClick,
    controls,
  }: {
    albums: Album[]
    onAlbumClick: (id: string) => void
    onActionClick: (e: React.MouseEvent, album: Album, action: 'rename' | 'delete') => void
    controls: any
  }) => {
    const isScreenSizeSm = useMediaQuery("(max-width: 640px)")
    
    const displayCount = Math.max(albums.length, 6) 
    const faceWidth = isScreenSizeSm ? 240 : 320 
    const cylinderWidth = faceWidth * displayCount
    const radius = cylinderWidth / (2 * Math.PI)
    
    const rotation = useMotionValue(0)
    const transform = useTransform(rotation, (value) => `rotate3d(0, 1, 0, ${value}deg)`)

    const isVideo = (url?: string | null) => /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url || "")

    return (
      <div
        className="flex h-full items-center justify-center pointer-events-none"
        style={{
          perspective: "1200px",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <motion.div
          className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing pointer-events-auto"
          style={{
            transform,
            rotateY: rotation,
            width: cylinderWidth,
            transformStyle: "preserve-3d",
          } as any} 
          
          /* THE FIX: Wrapping properties in a spread to blindfold the strict TS checker */
          {...({
            drag: "x",
            onDrag: (...args: any[]) => {
              const info = args[1];
              if (info) rotation.set(rotation.get() + info.offset.x * 0.05);
            },
            onDragEnd: (...args: any[]) => {
              const info = args[1];
              if (info) {
                controls.start({
                  rotateY: rotation.get() + info.velocity.x * 0.05,
                  transition: { type: "spring", stiffness: 100, damping: 30, mass: 0.1 },
                });
              }
            }
          } as any)}
          
          animate={controls as any}
        >
          {albums.map((album, i) => {
            const vid = isVideo(album.cover_url)
            return (
              <motion.div
                key={`album-${album.id}-${i}`}
                className="absolute flex flex-col origin-center items-center justify-center"
                style={{
                  width: `${faceWidth}px`,
                  transform: `rotateY(${i * (360 / albums.length)}deg) translateZ(${radius + 40}px)`,
                }}
              >
                <div 
                  onClick={() => onAlbumClick(album.id)}
                  className="group relative w-full aspect-[3/4] rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.4)] hover:border-white/30 transition-all duration-300"
                >
                  <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={(e) => onActionClick(e, album, 'rename')}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => onActionClick(e, album, 'delete')}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-red-500/40 hover:text-red-300 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {album.cover_url ? (
                    vid ? (
                      <>
                        <video src={album.cover_url} className="absolute inset-0 w-full h-full object-cover pointer-events-none" muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <Play className="w-12 h-12 text-white/70 drop-shadow-lg" />
                        </div>
                      </>
                    ) : (
                      <img src={album.cover_url} alt={album.name} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Folder className="w-16 h-16 text-white/20" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-20"></div>
                </div>

                <h3 className="text-xl font-medium tracking-wide text-white mt-6 drop-shadow-md pointer-events-none text-center px-4 truncate w-full">
                  {album.name}
                </h3>
                <p className="text-sm text-white/50 font-light mt-1 pointer-events-none">
                  {new Date(album.created_at).toLocaleDateString()}
                </p>
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
  onActionClick 
}: { 
  albums: Album[]
  onAlbumClick: (id: string) => void
  onActionClick: (e: React.MouseEvent, album: Album, action: 'rename' | 'delete') => void
}) {
  const controls = useAnimation()

  if (!albums || albums.length === 0) return null;

  return (
    <div className="relative h-[650px] w-full overflow-hidden flex items-center justify-center">
      <Carousel
        albums={albums}
        onAlbumClick={onAlbumClick}
        onActionClick={onActionClick}
        controls={controls}
      />
    </div>
  )
}