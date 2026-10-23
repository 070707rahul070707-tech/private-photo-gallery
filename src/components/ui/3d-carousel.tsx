"use client"
// @ts-nocheck

import { memo, useEffect, useState, useRef } from "react"
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
  
  const touchStartX = useRef(0);
  const dragStartTime = useRef(0);

  useEffect(() => {
    const handleResize = () => {
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

  // NATIVE, LAG-FREE SWIPE PHYSICS
  const handleTouchStart = (e: any) => {
    touchStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: any) => {
    const touchEndX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = touchStartX.current - touchEndX;
    const timeDiff = Date.now() - dragStartTime.current;

    // Snappy detection: Triggers if you drag far enough OR flick quickly
    if (diff > 30 || (diff > 10 && timeDiff < 200)) {
      setActiveIndex(prev => prev + 1); 
    } else if (diff < -30 || (diff < -10 && timeDiff < 200)) {
      setActiveIndex(prev => prev - 1); 
    }
  };

  const handleCardClick = (albumId: string, isCenter: boolean, offset: number) => {
    const timeDiff = Date.now() - dragStartTime.current;
    // Safely differentiates between a purposeful click and an accidental tap while swiping
    if (timeDiff < 250) {
      if (isCenter) onAlbumClick(albumId);
      else setActiveIndex(prev => prev + Math.sign(offset));
    }
  };

  const isVideo = (url?: string | null) => /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url || "");

  return (
    <div 
      className="relative flex h-full w-full items-center justify-center overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        <AnimatePresence initial={false}>
          {albums.map((album, i) => {
            let offset = (i - (activeIndex % n));
            if (offset > n / 2) offset -= n;
            if (offset < -n / 2) offset += n;

            if (Math.abs(offset) > 1.5) return null;

            const isCenter = offset === 0;
            const vid = isVideo(album.cover_url);

            const xOffset = offset * (faceWidth * 0.65); 
            const scale = isCenter ? 1 : 0.75; 
            const zIndex = 10 - Math.abs(offset); 
            const opacity = isCenter ? 1 : 0.6; 

            return (
              <motion.div
                key={album.id}
                className="absolute flex flex-col items-center justify-center pointer-events-auto"
                style={{ width: faceWidth, zIndex }}
                initial={false}
                animate={{ x: xOffset, scale, opacity }}
                // FASTER ANIMATION: Higher stiffness and lower damping snaps the cards instantly without lag
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              >
                <div 
                  onClick={() => handleCardClick(album.id, isCenter, offset)}
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