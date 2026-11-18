"use client"
// @ts-nocheck

import { memo, useEffect, useState, useRef } from "react"
import { motion, useMotionValue, useTransform, useMotionValueEvent, animate } from "framer-motion"
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

function getCircularOffset(index: number, current: number, total: number) {
  if (total <= 1) return 0;
  let diff = (((index - current) % total) + total) % total;
  if (diff > total / 2) diff -= total;
  return diff;
}

const isVideo = (url?: string | null) => /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url || "");

// Individual card driven directly by GPU MotionValues (zero React re-renders while spinning)
const CarouselCard = memo(({ album, index, total, progress, faceWidth, onSelect }: any) => {
  const spacing = faceWidth * 0.68;

  const offset = useTransform(progress, (latest: number) =>
    getCircularOffset(index, latest, total)
  );

  const x = useTransform(offset, (o: number) => o * spacing);
  const scale = useTransform(offset, [-2, -1, 0, 1, 2], [0.55, 0.78, 1, 0.78, 0.55]);
  const opacity = useTransform(offset, [-2, -1.2, -1, 0, 1, 1.2, 2], [0, 0.2, 0.6, 1, 0.6, 0.2, 0]);
  const rotateY = useTransform(offset, [-2, -1, 0, 1, 2], [28, 16, 0, -16, -28]);
  const zIndex = useTransform(offset, (o: number) => Math.round(20 - Math.abs(o) * 5));
  const titleOpacity = useTransform(offset, [-0.45, 0, 0.45], [0, 1, 0]);
  const titleY = useTransform(offset, [-0.45, 0, 0.45], [10, 0, 10]);

  const vid = isVideo(album.cover_url);

  return (
    <motion.div
      className="absolute flex flex-col items-center justify-center transform-gpu will-change-transform"
      style={{
        width: faceWidth,
        x,
        scale,
        opacity,
        rotateY,
        zIndex,
        transformPerspective: 1000,
      }}
    >
      <div
        onClick={() => onSelect(album.id, offset.get())}
        className="w-full aspect-[3/4] rounded-2xl sm:rounded-[32px] border border-white/10 overflow-hidden relative cursor-pointer bg-zinc-900 shadow-2xl"
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
              draggable={false}
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
        style={{ opacity: titleOpacity, y: titleY }}
      >
        {album.name}
      </motion.h3>
    </motion.div>
  );
});

CarouselCard.displayName = "CarouselCard";

const Carousel = memo(({ albums, initialAlbumId, onAlbumClick, onActiveChange }: CarouselProps) => {
  const n = albums.length;
  const [faceWidth, setFaceWidth] = useState(280);

  const getInitialIndex = () => {
    if (!initialAlbumId || n === 0) return 0;
    const found = albums.findIndex((a) => a.id === initialAlbumId);
    return found !== -1 ? found : 0;
  };

  const progress = useMotionValue(getInitialIndex());
  const animControls = useRef<any>(null);
  const lastReportedIndex = useRef<number>(-1);

  const dragState = useRef({
    active: false,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0, // px per ms
    moved: false,
  });

  // Restore last opened album if initialAlbumId arrives after mount
  useEffect(() => {
    if (initialAlbumId && n > 0) {
      const found = albums.findIndex((a) => a.id === initialAlbumId);
      if (found !== -1) {
        animControls.current?.stop();
        progress.set(found);
      }
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

  // Notify parent only when the centered album actually changes
  const reportActive = (val: number) => {
    if (n === 0) return;
    const idx = ((Math.round(val) % n) + n) % n;
    if (idx !== lastReportedIndex.current) {
      lastReportedIndex.current = idx;
      onActiveChange(albums[idx]);
    }
  };

  useEffect(() => {
    reportActive(progress.get());
  }, [n, albums]);

  useMotionValueEvent(progress, "change", (latest) => {
    reportActive(latest);
  });

  const spinTo = (target: number, velocityCardsPerSec = 0) => {
    animControls.current?.stop();
    animControls.current = animate(progress, target, {
      type: "spring",
      stiffness: 170,
      damping: 26,
      mass: 0.85,
      velocity: velocityCardsPerSec,
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    animControls.current?.stop();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    dragState.current = {
      active: true,
      startX: e.clientX,
      lastX: e.clientX,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d.active) return;

    const now = performance.now();
    const dx = e.clientX - d.lastX;
    const dt = Math.max(1, now - d.lastTime);

    if (Math.abs(e.clientX - d.startX) > 6) {
      d.moved = true;
    }

    // Smooth velocity tracking (px/ms)
    const instantV = dx / dt;
    d.velocity = d.velocity * 0.65 + instantV * 0.35;
    d.lastX = e.clientX;
    d.lastTime = now;

    // 1:1 finger tracking
    const pixelsPerCard = faceWidth * 0.72;
    progress.set(progress.get() - dx / pixelsPerCard);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d.active) return;
    d.active = false;

    if (!d.moved) return;

    const pixelsPerCard = faceWidth * 0.72;
    // Convert px/ms -> cards/sec
    const velocityCardsPerSec = (-d.velocity * 1000) / pixelsPerCard;

    // Project target based on applied flick force (wheel momentum)
    const momentumCards = velocityCardsPerSec * 0.28;
    const target = Math.round(progress.get() + momentumCards);

    spinTo(target, velocityCardsPerSec);
  };

  const handleSelect = (albumId: string, cardOffset: number) => {
    if (dragState.current.moved) return;

    if (Math.abs(cardOffset) < 0.3) {
      onAlbumClick(albumId);
    } else {
      const target = Math.round(progress.get() + Math.sign(cardOffset));
      spinTo(target);
    }
  };

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden touch-pan-y select-none cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {albums.map((album, i) => (
          <CarouselCard
            key={album.id}
            album={album}
            index={i}
            total={n}
            progress={progress}
            faceWidth={faceWidth}
            onSelect={handleSelect}
          />
        ))}
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