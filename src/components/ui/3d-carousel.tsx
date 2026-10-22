"use client"

import { useEffect, useRef } from "react"
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

export function ThreeDAlbumCarousel({ albums, onAlbumClick, onActiveChange }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isVideo = (url?: string | null) => /\.(mp4|webm|ogg|mov|mkv)(\?|$)/i.test(url || "");

  // Sets the first album as active immediately
  useEffect(() => {
    if (albums.length > 0) {
      onActiveChange(albums[0]);
    }
  }, [albums, onActiveChange]);

  // Native scroll listener to update the Edit/Delete buttons at the top
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    
    // Calculates which card is currently in the center of the screen
    const scrollPosition = container.scrollLeft;
    const cardWidth = container.children[0]?.clientWidth || 1;
    
    // The gap + card width determines the snap distance
    const snapDistance = cardWidth + 24; // 24px is the gap-6
    const activeIndex = Math.round(scrollPosition / snapDistance);
    
    const safeIndex = Math.min(Math.max(activeIndex, 0), albums.length - 1);
    onActiveChange(albums[safeIndex]);
  };

  if (!albums || albums.length === 0) return null;

  return (
    <div className="w-full relative mt-4 sm:mt-8">
      {/* Hides the ugly scrollbar on all browsers but keeps the scrolling functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        // Native CSS snapping: Zero lag, perfect physics
        className="flex w-full overflow-x-auto snap-x snap-mandatory gap-6 px-[10vw] sm:px-[35vw] pb-10 pt-4 hide-scroll"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {albums.map((album) => {
          const vid = isVideo(album.cover_url);
          return (
            <div 
              key={album.id} 
              // MASSIVE CARDS: 80% of screen width on phone (w-[80vw])
              className="snap-center shrink-0 w-[80vw] sm:w-[360px] flex flex-col items-center transition-all duration-300"
            >
              <div 
                onClick={() => onAlbumClick(album.id)}
                className="w-full aspect-[3/4] rounded-[32px] bg-black/50 border border-white/10 backdrop-blur-md overflow-hidden shadow-2xl hover:border-white/30 transition-all duration-300 relative group cursor-pointer"
              >
                {album.cover_url ? (
                  vid ? (
                    <>
                      <video src={album.cover_url} className="absolute inset-0 w-full h-full object-contain pointer-events-none bg-black/40" muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <Play className="w-16 h-16 text-white/70 drop-shadow-lg" />
                      </div>
                    </>
                  ) : (
                    <img src={album.cover_url} alt={album.name} className="absolute inset-0 w-full h-full object-contain pointer-events-none bg-black/40" />
                  )
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Folder className="w-20 h-20 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 pointer-events-none z-20"></div>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-bold tracking-wide text-white mt-6 drop-shadow-md text-center px-4 truncate w-full">
                {album.name}
              </h3>
            </div>
          )
        })}
      </div>
    </div>
  )
}