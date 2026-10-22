"use client"
// @ts-nocheck

import { memo, useEffect, useState, useRef } from "react"
import { motion, useAnimation, useMotionValue } from "framer-motion"
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
  const controls = useAnimation();
  
  // This motion value stores the exact rotation of the cylinder
  const rotation = useMotionValue(0);
  const dragStartTime = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      // Big, beautiful cards taking up 65% of the screen
      setFaceWidth(Math.min(window.innerWidth * 0.65, 340));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const displayCount = Math.max(albums.length, 6);
  const anglePerCard = 360 / displayCount;
  
  // Mathematically calculates the exact radius needed to make a perfect 3D circle of cards
  const radius = (faceWidth / 2) / Math.tan(Math.PI / displayCount) + 30; 

  const isVideo = (url?: string | null) => /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url || "");

  useEffect(() => {
    if (albums.length > 0) {
      onActiveChange(albums[0]);
    }
  }, [albums, onActiveChange]);

  const handleDragStart = () => {
    dragStartTime.current = Date.now();
    // Immediately stop any snapping animation so your finger has 100% control
    controls.stop(); 
  };

  const handleDrag = (_: any, info: any) => {
    // THE FIX: 1-to-1 Finger Tracking. The cylinder moves exactly as your finger moves.
    rotation.set(rotation.get() + info.delta.x * 0.25);
    
    // Updates the Edit/Delete icons instantly as you drag between cards
    const currentAngle = rotation.get();
    const index = Math.round(currentAngle / -anglePerCard);
    const wrappedIndex = ((index % albums.length) + albums.length) % albums.length;
    onActiveChange(albums[wrappedIndex]);
  };

  const handleDragEnd = (_: any, info: any) => {
    const currentAngle = rotation.get();
    let targetIndex = Math.round(currentAngle / -anglePerCard);

    // If you do a fast flick, it will boost you one card over
    if (info.velocity.x > 300) targetIndex -= 1;
    else if (info.velocity.x < -300) targetIndex += 1;

    const targetAngle = targetIndex * -anglePerCard;

    // When you let go, snap perfectly to the nearest card
    controls.start({
      rotateY: targetAngle,
      transition: { type: "spring", stiffness: 200, damping: 30 }
    });

    const wrappedIndex = ((targetIndex % albums.length) + albums.length) % albums.length;
    onActiveChange(albums[wrappedIndex]);
  };

  const handleCardClick = (id: string) => {
    // Only enter the album if it was a quick tap, not a long drag
    if (Date.now() - dragStartTime.current < 200) {
      onAlbumClick(id);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center pointer-events-none" style={{ perspective: "1200px" }}>
      <motion.div
        className="relative flex h-full origin-center justify-center items-center pointer-events-auto cursor-grab active:cursor-grabbing"
        style={{ transformStyle: "preserve-3d", rotateY: rotation }}
        animate={controls as any}
        {...({
          drag: "x",
          dragMomentum: false, // THE FIX: Disables automatic spinning. It stops the second you lift your finger.
          onDragStart: handleDragStart,
          onDrag: handleDrag,
          onDragEnd: handleDragEnd
        } as any)}
      >
        {albums.map((album, i) => {
          const vid = isVideo(album.cover_url);
          return (
            <motion.div
              key={`album-${album.id}-${i}`}
              className="absolute flex flex-col origin-center items-center justify-center"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${i * anglePerCard}deg) translateZ(${radius}px)`,
                WebkitBackfaceVisibility: "hidden", // Forces cards on the back to be invisible so text is never backwards
                backfaceVisibility: "hidden"
              }}
            >
              <div 
                onClick={() => handleCardClick(album.id)}
                className="w-full aspect-[3/4] rounded-2xl sm:rounded-[32px] bg-black/40 border border-white/10 backdrop-blur-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:border-white/30 transition-all duration-300 relative group cursor-pointer"
              >
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 pointer-events-none z-20"></div>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mt-6 drop-shadow-md pointer-events-none text-center px-4 truncate w-full">
                {album.name}
              </h3>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
});

export function ThreeDAlbumCarousel({ albums, onAlbumClick, onActiveChange }: CarouselProps) {
  if (!albums || albums.length === 0) return null;
  return (
    <div className="relative h-[500px] sm:h-[600px] w-full flex items-center justify-center mt-4">
      <Carousel albums={albums} onAlbumClick={onAlbumClick} onActiveChange={onActiveChange} />
    </div>
  )
}