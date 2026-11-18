"use client"
// @ts-nocheck

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
  initialAlbumId?: string | null;
  onAlbumClick: (id: string) => void;
  onActiveChange: (album: Album) => void;
}

const Carousel = memo(({ albums, initialAlbumId, onAlbumClick, onActiveChange }: CarouselProps) => {
  const n = albums.length;

  // Start on the previously opened album if available
  const getInitialIndex = () => {
    if (!initialAlbumId || n === 0) return 0;
    const found = albums.findIndex((a) => a.id === initialAlbumId);
    return found !== -1 ? found : 0;
  };

  const [activeIndex, setActiveIndex] = useState(getInitialIndex);
  const [faceWidth, setFaceWidth] = useState(280);

  const touchStartX = useRef(0);
  const dragStartTime = useRef(0);
  const didDrag = useRef(false);

  // Sync if initialAlbumId arrives after mount
  useEffect(() => {
    if (initialAlbumId && n > 0) {
      const found = albums.findIndex((a) => a.id === initialAlbumId);
      if (found !== -1) setActiveIndex(found);
    }
  }, [initialAlbumId, n]);

  useEffect(() => {
    const handleResize = () => {
      setFaceWidth(Math.min(window.innerWidth * 0.65, 340));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const realIndex = n > 0 ? ((activeIndex % n) + n) % n : 0;

  useEffect(() => {
    if (n > 0 && albums[realIndex]) {
      onActiveChange(albums[realIndex]);
    }
  }, [realIndex, n, albums, onActiveChange]);

  const handleTouchStart = (e: any) => {
    touchStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    dragStartTime.current = Date.now();
    didDrag.current = false;
  };

  const handleTouchEnd = (e: any) => {
    const touchEndX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = touchStartX.current - touchEndX;
    const timeDiff = Date.now() - dragStartTime.current;

    if (Math.abs(diff) > 10) {
      didDrag.current = true;
    }

    if (diff > 30 || (diff > 10 && timeDiff < 200)) {
      setActiveIndex((prev) => prev + 1);
    } else if (diff < -30 || (diff < -10 && timeDiff < 200)) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  const handleCardClick = (albumId: string, isCenter: boolean, offset: number) => {
    if (didDrag.current) return;
    if (isCenter) {
      onAlbumClick(albumId);
    } else {
      setActiveIndex((prev) => prev + Math.sign(offset));
    }
  };

  const isVideo = (url?: string | null) => /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url || "");

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden touch-pan-y select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        {albums.map((album, i) => {
          // Normalized circular offset (fixes negative modulo jump when swiping left)
          let offset = i - realIndex;
          if (offset > n / 2) offset -= n;
          if (offset < -n / 2) offset += n;

          // Keep 2 cards on each side mounted so images don't re-decode mid-swipe
          if (Math.abs(offset) > 2) return null;

          const isCenter = offset === 0;
          const isVisible = Math.abs(offset) <= 1;
          const vid = isVideo(album.cover_url);

          const xOffset = offset * (faceWidth * 0.65);
          const scale = isCenter ? 1 : isVisible ? 0.78 : 0.6;
          const zIndex = 10 - Math.abs(offset);
          const opacity = isCenter ? 1 : isVisible ? 0.55 : 0;

          return (
            <motion.div
              key={album.id}
              className="absolute flex flex-col items-center justify-center transform-gpu will-change-transform"
              style={{
                width: faceWidth,
                zIndex,
                pointerEvents: isVisible ? "auto" : "none",
              }}
              initial={false}
              animate={{ x: xOffset, scale, opacity }}
              transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
            >
              <div
                onClick={() => handleCardClick(album.id, isCenter, offset)}
                className={`w-full aspect-[3/4] rounded-2xl sm:rounded-[32px] border border-white/10 overflow-hidden relative cursor-pointer ${
                  isCenter ? "bg-zinc-900 shadow-2xl" : "bg-zinc-950"
                }`}
              >
                {album.cover_url ? (
                  vid ? (
                    <>
                      <video
                        src={album.cover_url}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <Play className="w-16 h-16 text-white/70" />
                      </div>
                    </>
                  ) : (
                    <img
                      src={album.cover_url}
                      alt={album.name}
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                  )
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Folder className="w-20 h-20 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none z-20" />
              </div>

              <motion.h3
                className="text-2xl sm:text-3xl font-bold tracking-wide text-white mt-6 pointer-events-none text-center px-4 truncate w-full"
                animate={{ opacity: isCenter ? 1 : 0, y: isCenter ? 0 : 8 }}
                transition={{ duration: 0.15 }}
              >
                {album.name}
              </motion.h3>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

Carousel.displayName = "Carousel";

export function ThreeDAlbumCarousel({
  albums,
  initialAlbumId,
  onAlbumClick,
  onActiveChange,
}: CarouselProps) {
  if (!albums || albums.length === 0) return null;
  return (
    <div className="relative h-[480px] sm:h-[600px] w-full flex items-center justify-center mt-4">
      <Carousel
        albums={albums}
        initialAlbumId={initialAlbumId}
        onAlbumClick={onAlbumClick}
        onActiveChange={onActiveChange}
      />
    </div>
  );
}