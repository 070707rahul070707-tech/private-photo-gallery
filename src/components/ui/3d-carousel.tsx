"use client"
// @ts-nocheck

import { memo, useEffect, useState, useRef } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
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

const CarouselCard = memo(({ album, index, total, progress, faceWidth, onSelect }: any) => {
  const spacing = faceWidth * 0.68;

  const offset = useTransform(progress, (latest: number) =>
    getCircularOffset(index, latest, total)
  );

  const x = useTransform(offset, (o: number) => o * spacing);
  const scale = useTransform(offset, [-2, -1, 0, 1, 2], [0.6, 0.78, 1, 0.78, 0.6]);
  const opacity = useTransform(offset, [-2, -1.3, -1, 0, 1, 1.3, 2], [0, 0.15, 0.55, 1, 0.55, 0.15, 0]);
  const zIndex = useTransform(offset, (o: number) => Math.round(20 - Math.abs(o) * 5));
  const visibility = useTransform(offset, (o: number) => (Math.abs(o) > 2.2 ? "hidden" : "visible"));
  const titleOpacity = useTransform(offset, [-0.4, 0, 0.4], [0, 1, 0]);
  const titleY = useTransform(offset, [-0.4, 0, 0.4], [8, 0, 8]);

  const vid = isVideo(album.cover_url);

  return (
    <motion.div
      className="absolute flex flex-col items-center justify-center transform-gpu will-change-transform"
      style={{
        width: faceWidth,
        x,
        scale,
        opacity,
        zIndex,
        visibility,
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
    startProgress: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
  });

  const reportActive = (val: number) => {
    if (n === 0) return;
    const idx = ((Math.round(val) % n) + n) % n;
    if (idx !== lastReportedIndex.current) {
      lastReportedIndex.current = idx;
      onActiveChange(albums[idx]);
    }
  };

  useEffect(() => {
    if (initialAlbumId && n > 0) {
      const found = albums.findIndex((a) => a.id === initialAlbumId);
      if (found !== -1) {
        animControls.current?.stop();
        progress.set(found);
        reportActive(found);
      }
    }
  }, [initialAlbumId, n]);

  useEffect(() => {
    reportActive(progress.get());
  }, [n, albums]);

  useEffect(() => {
    const handleResize = () => {
      setFaceWidth(Math.min(window.innerWidth * 0.65, 340));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const spinTo = (target: number, velocityCardsPerSec = 0) => {
    animControls.current?.stop();
    animControls.current = animate(progress, target, {
      type: "spring",
      stiffness: 260,
      damping: 30,
      mass: 0.75,
      velocity: velocityCardsPerSec,
      onComplete: () => {
        reportActive(target);
      },
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (n <= 1) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    animControls.current?.stop();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    dragState.current = {
      active: true,
      startX: e.clientX,
      startProgress: progress.get(),
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

    const totalDx = e.clientX - d.startX;
    if (Math.abs(totalDx) > 6) {
      d.moved = true;
    }

    const instantV = dx / dt;
    d.velocity = d.velocity * 0.6 + instantV * 0.4;
    d.lastX = e.clientX;
    d.lastTime = now;

    // 1:1 finger tracking without drift
    const pixelsPerCard = faceWidth * 0.8;
    progress.set(d.startProgress - totalDx / pixelsPerCard);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d.active) return;
    d.active = false;

    if (!d.moved) return;

    const pixelsPerCard = faceWidth * 0.8;
    const totalDx = e.clientX - d.startX;
    const draggedCards = -totalDx / pixelsPerCard;
    const velocityCardsPerSec = (-d.velocity * 1000) / pixelsPerCard;
    const baseIndex = Math.round(d.startProgress);

    let target = baseIndex;

    if (Math.abs(velocityCardsPerSec) >= 3.2) {
      // Deliberate hard flick: spin 2 to 3 cards max
      const steps = Math.min(Math.max(2, Math.round(Math.abs(velocityCardsPerSec) * 0.25)), 3);
      target = baseIndex + Math.sign(velocityCardsPerSec) * steps;
    } else if (Math.abs(draggedCards) > 0.16 || Math.abs(velocityCardsPerSec) > 0.45) {
      // Normal swipe: always move exactly 1 card (never skips the next album)
      const dir = Math.sign(draggedCards || velocityCardsPerSec);
      target = baseIndex + dir;
    }

    spinTo(target, Math.max(-6, Math.min(6, velocityCardsPerSec)));
  };

  const handleSelect = (albumId: string, cardOffset: number) => {
    if (dragState.current.moved) return;

    if (Math.abs(cardOffset) < 0.3) {
      onAlbumClick(albumId);
    } else {
      const target = Math.round(progress.get()) + Math.sign(cardOffset);
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