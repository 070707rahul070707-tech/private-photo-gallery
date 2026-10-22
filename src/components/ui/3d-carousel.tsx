"use client"
// @ts-nocheck

import { memo, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Folder, Play } from "lucide-react"

interface Album {
  id: string;
  name: string;
  created_at: string;
  cover_url?: string | null;
}

interface CarouselProps {
  albums: Album[];
  onAlbumClick: (id: string) => void;
  onActiveChange: (album: Album) => void;
}

const Carousel = memo(({ albums, onAlbumClick, onActiveChange }: CarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [faceWidth, setFaceWidth] = useState(280);

  useEffect(() => {
    const handleResize = () => {
      // Big center card: 65% of screen
      setFaceWidth(Math.min(window.innerWidth * 0.65, 340));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const n = albums.length;

  useEffect(() => {
    if (n > 0) {
      const realIndex = ((activeIndex % n) + n) % n;
      onActiveChange(albums[realIndex]);
    }
  }, [activeIndex, n, albums, onActiveChange]);

  const handleDragEnd = (_: any, info: any) => {
    const swipe = info.offset.x;
    const velocity = info.velocity.x;
    
    // PERFECT SWIPE MATH: Swipe Left (negative) = Next Card. Swipe Right (positive) = Previous Card.
    if (swipe < -30 || velocity < -300) {
      setActiveIndex(prev => prev + 1); 
    } else if (swipe > 30 || velocity > 300) {
      setActiveIndex(prev => prev - 1); 
    }
  };

  const isVideo = (url?: string | null) => /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url || "");

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      
      {/* Invisible drag layer covering the whole screen for smooth swiping */}
      <motion.div
        className="absolute inset-0 z-50 cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      />

      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        <AnimatePresence initial={false}>
          {albums.map((album, i) => {
            // Calculates where the card is relative to the active index
            let offset = (i - (activeIndex % n));
            if (offset > n / 2) offset -= n;
            if (offset < -n / 2) offset += n;

            // Only show 3 cards (center, left, right)
            if (Math.abs(offset) > 1.5) return null;

            const isCenter = offset === 0;
            const vid = isVideo(album.cover_url);

            // FAKE 3D MATH: No browser crashing. Just standard X/Y/Scale.
            const xOffset = offset * (faceWidth * 0.65); // Spacing between cards
            const scale = isCenter ? 1 : 0.75; // Side cards are 75% size
            const zIndex = 10 - Math.abs(offset); // Center card is always on top
            const opacity = isCenter ? 1 : 0.6; // Side cards are slightly faded

            return (
              <motion.div
                key={album.id}
                className="absolute flex flex-col items-center justify-center pointer-events-auto"
                style={{ width: faceWidth, zIndex }}
                initial={false}
                animate={{ x: xOffset, scale, opacity }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}
              >
                <div 
                  onClick={() => {
                    if (isCenter) onAlbumClick(album.id);
                    else setActiveIndex(prev => prev + Math.sign(offset)); 
                  }}
                  className={`w-full aspect-[3/4] rounded-2xl sm:rounded-[32px] border border-white/10 overflow-hidden shadow-2xl transition-all duration-300 relative cursor-pointer ${isCenter ? 'bg-black/60 shadow-[0_20px_50px_rgba(0,0,0,0.8)]' : 'bg-black/90'}`}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none z-20"></div>
                </div>

                <motion.h3 
                  className="text-2xl sm:text-3xl font-bold tracking-wide text-white mt-6 drop-shadow-md pointer-events-none text-center px-4 truncate w-full"
                  animate={{ opacity: isCenter ? 1 : 0, y: isCenter ? 0 : 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {album.name}
                </motion.h3>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
});

export function ThreeDAlbumCarousel({ albums, onAlbumClick, onActiveChange }: CarouselProps) {
  if (!albums || albums.length === 0) return null;
  return (
    <div className="relative h-[480px] sm:h-[600px] w-full flex items-center justify-center mt-4">
      <Carousel albums={albums} onAlbumClick={onAlbumClick} onActiveChange={onActiveChange} />
    </div>
  )
}