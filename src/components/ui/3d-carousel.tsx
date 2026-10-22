"use client"
// @ts-nocheck

import { memo, useEffect, useState } from "react"
import { motion, useAnimation } from "framer-motion"
import { Folder, Play } from "lucide-react"

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
    // Safe default width so the app never renders "null" and goes blank
    const [faceWidth, setFaceWidth] = useState(300);
    
    const [activeIndex, setActiveIndex] = useState(0)
    const controls = useAnimation()

    // Safely updates size on the client without blocking the screen
    useEffect(() => {
      const handleResize = () => {
        // 260px for phones, up to 380px for PC
        setFaceWidth(window.innerWidth < 640 ? 260 : Math.min(window.innerWidth * 0.4, 380));
      };
      handleResize(); 
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

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
        className="flex h-full w-full items-center justify-center pointer-events-none"
        style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
      >
        <motion.div
          className="relative flex h-full origin-center cursor-grab active:cursor-grabbing justify-center items-center pointer-events-auto"
          style={{ width: cylinderWidth, transformStyle: "preserve-3d" }}
          animate={controls as any}
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
                  transform: `rotateY(${i * anglePerCard}deg) translateZ(${radius + 40}px)`,
                  WebkitBackfaceVisibility: "hidden", 
                  backfaceVisibility: "hidden"
                }}
              >
                <motion.div 
                  className="w-full aspect-[3/4] rounded-[32px] bg-black/50 border border-white/10 backdrop-blur-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-white/30 transition-all duration-300 relative group"
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

                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-wide text-white mt-6 drop-shadow-md pointer-events-none text-center px-4 truncate w-full">
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
    // THE FIX: Removed `overflow-hidden` which crashes 3D rendering on mobile Safari/Chrome.
    // Also added absolute heights so it never collapses to 0 pixels tall!
    <div className="relative h-[500px] sm:h-[600px] w-full flex items-center justify-center mt-4 sm:mt-8">
      <Carousel
        albums={albums}
        onAlbumClick={onAlbumClick}
        onActiveChange={onActiveChange}
      />
    </div>
  )
}