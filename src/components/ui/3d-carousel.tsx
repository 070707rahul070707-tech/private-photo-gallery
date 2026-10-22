"use client"

import { memo, useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
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
  const [faceWidth, setFaceWidth] = useState(260); 
  const [activeIndex, setActiveIndex] = useState(0);

  // Native touch trackers (Replaces the heavy Framer Motion drag)
  const touchStartX = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      // Big, beautiful cards: 65% of screen width
      setFaceWidth(Math.min(window.innerWidth * 0.65, 340));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const displayCount = Math.max(albums.length, 6);
  const cylinderWidth = faceWidth * displayCount;
  const radius = cylinderWidth / (2 * Math.PI);
  const anglePerCard = 360 / displayCount;

  const isVideo = (url?: string | null) => /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url || "");

  useEffect(() => {
    if (albums.length > 0) {
      const wrappedIndex = ((activeIndex % albums.length) + albums.length) % albums.length;
      onActiveChange(albums[wrappedIndex]);
    }
  }, [activeIndex, albums, onActiveChange]);

  // Buttery smooth native touch physics
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;
    
    if (diff > 40) setActiveIndex(prev => prev - 1); // Swipe Right -> Go Left
    if (diff < -40) setActiveIndex(prev => prev + 1); // Swipe Left -> Go Right
  };

  return (
    <div className="flex h-full w-full items-center justify-center pointer-events-none" style={{ perspective: "1200px" }}>
      <motion.div
        className="relative flex h-full origin-center justify-center items-center pointer-events-auto cursor-grab active:cursor-grabbing"
        style={{ width: cylinderWidth, transformStyle: "preserve-3d" }}
        animate={{ rotateY: activeIndex * -anglePerCard }}
        transition={{ type: "spring", stiffness: 150, damping: 25, mass: 0.5 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {albums.map((album, i) => {
          const vid = isVideo(album.cover_url);
          return (
            <div
              key={`album-${album.id}-${i}`}
              className="absolute flex flex-col items-center justify-center"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${i * anglePerCard}deg) translateZ(${radius + 30}px)`,
              }}
            >
              <div
                onClick={() => onAlbumClick(album.id)}
                className="w-full aspect-[3/4] rounded-2xl sm:rounded-[32px] bg-black/40 border border-white/10 backdrop-blur-md overflow-hidden shadow-2xl hover:border-white/30 transition-all duration-300 relative cursor-pointer"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 pointer-events-none z-20"></div>
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mt-6 drop-shadow-md text-center px-4 truncate w-full">
                {album.name}
              </h3>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
});

export function ThreeDAlbumCarousel({ albums, onAlbumClick, onActiveChange }: CarouselProps) {
  if (!albums || albums.length === 0) return null;
  return (
    <div className="relative h-[450px] sm:h-[550px] w-full flex items-center justify-center mt-4">
      <Carousel albums={albums} onAlbumClick={onAlbumClick} onActiveChange={onActiveChange} />
    </div>
  )
}