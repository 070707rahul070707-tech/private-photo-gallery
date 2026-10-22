"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Edit2, Trash2, X, Loader2, LogOut
} from "lucide-react";
import { FluidParticlesBackground } from "@/components/ui/fluid-particles-background";
import { ThreeDAlbumCarousel } from "@/components/ui/3d-carousel";
import { 
  getAlbumsSecure, 
  createAlbumSecure, 
  renameAlbumSecure, 
  deleteAlbumSecure, 
  logoutGallery 
} from "../actions";

interface Album {
  id: string;
  name: string;
  created_at: string;
  cover_url?: string | null;
}

export default function AlbumsPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New State: Tracks which album is facing forward in the 3D Carousel
  const [centeredAlbum, setCenteredAlbum] = useState<Album | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const authStatus = localStorage.getItem("gallery-auth");
      if (authStatus !== "true") {
        window.location.href = "/";
        return;
      }
      try {
        const secureAlbums = await getAlbumsSecure();
        setAlbums(secureAlbums);
      } catch (error) {
        console.error("Failed to load albums securely");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthAndFetch();
  }, []);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    
    setIsSubmitting(true);
    const { data, error } = await createAlbumSecure(newAlbumName.trim());

    if (!error && data) {
      setAlbums([{...data, cover_url: null}, ...albums]);
      setIsCreateOpen(false);
      setNewAlbumName("");
    }
    setIsSubmitting(false);
  };

  const handleRenameAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim() || !activeAlbum) return;

    setIsSubmitting(true);
    const { success } = await renameAlbumSecure(activeAlbum.id, newAlbumName.trim());

    if (success) {
      setAlbums(albums.map(a => a.id === activeAlbum.id ? { ...a, name: newAlbumName.trim() } : a));
      setIsRenameOpen(false);
      setActiveAlbum(null);
      setNewAlbumName("");
      // Update the centered title instantly as well
      if (centeredAlbum?.id === activeAlbum.id) {
        setCenteredAlbum({ ...centeredAlbum, name: newAlbumName.trim() });
      }
    }
    setIsSubmitting(false);
  };

  const handleDeleteAlbum = async () => {
    if (!activeAlbum) return;
    
    setIsSubmitting(true);
    const { success } = await deleteAlbumSecure(activeAlbum.id);

    if (success) {
      setAlbums(albums.filter(a => a.id !== activeAlbum.id));
      setIsDeleteOpen(false);
      setActiveAlbum(null);
    }
    setIsSubmitting(false);
  };

  const handleLogout = async () => {
    await logoutGallery();
    localStorage.removeItem("gallery-auth");
    window.location.href = "/";
  };

  // Triggers the Modals
  const handleMenuClick = (album: Album, action: 'rename' | 'delete') => {
    setActiveAlbum(album);
    if (action === 'rename') {
      setNewAlbumName(album.name);
      setIsRenameOpen(true);
    } else {
      setIsDeleteOpen(true);
    }
  };

  // Teleports into the Album
  const handleAlbumClick = (id: string) => {
    router.push(`/album?id=${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-y-auto overflow-x-hidden text-white relative font-sans selection:bg-white/20">
      
      <FluidParticlesBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:px-8 min-h-screen pb-24 flex flex-col">
        
        {/* Top Navigation & Action Icons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Albums</h1>
            <p className="text-[#9ca3af] font-light tracking-wide">Organize your private memories.</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap z-50">
            
            {/* THE FIX: Dynamic Edit/Delete buttons that target the middle card */}
            {centeredAlbum && albums.length > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <button 
                  onClick={() => handleMenuClick(centeredAlbum, 'rename')}
                  className="p-3 rounded-full bg-black/60 border border-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-all shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
                  title="Rename Focused Album"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleMenuClick(centeredAlbum, 'delete')}
                  className="p-3 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/20 backdrop-blur-md transition-all shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
                  title="Delete Focused Album"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="w-px h-8 bg-white/10 mx-1 sm:mx-2 hidden sm:block"></div>
              </div>
            )}

            <button 
              onClick={() => setIsCreateOpen(true)}
              className="group flex items-center gap-2 bg-transparent hover:bg-white/5 border border-white/10 backdrop-blur-md px-5 sm:px-6 py-3 rounded-full transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300 text-white" />
              <span className="font-medium tracking-wide text-white text-sm sm:text-base">Create</span>
            </button>
            
            <button 
              onClick={handleLogout}
              className="p-3 rounded-full bg-transparent hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white hover:text-red-400 backdrop-blur-md transition-all shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
              title="Lock Gallery"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D Carousel */}
        <div className="flex-1 flex flex-col justify-center -mt-8">
          {albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border border-white/10 bg-black/40 rounded-[32px] backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
              <p className="text-[#9ca3af] font-light">No albums yet. Create one to get started.</p>
            </div>
          ) : (
            <ThreeDAlbumCarousel 
              albums={albums} 
              onAlbumClick={handleAlbumClick} 
              onActiveChange={setCenteredAlbum} 
            />
          )}
        </div>
      </div>

      {/* Modals remain exactly the same below */}
      {(isCreateOpen || isRenameOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[32px] w-full max-w-md p-8 shadow-[0_25px_70px_rgba(0,0,0,0.65)] relative">
            <button onClick={() => { setIsCreateOpen(false); setIsRenameOpen(false); }} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold tracking-tight mb-6 text-white">
              {isCreateOpen ? "Create Album" : "Rename Album"}
            </h2>
            <form onSubmit={isCreateOpen ? handleCreateAlbum : handleRenameAlbum}>
              <input
                type="text"
                autoFocus
                placeholder="Album name..."
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                className="w-full h-[58px] bg-black/40 border border-white/10 rounded-2xl px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-black/60 transition-all mb-6"
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setIsCreateOpen(false); setIsRenameOpen(false); }} className="px-5 py-3 rounded-2xl font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting || !newAlbumName.trim()} className="px-6 py-3 bg-white text-black rounded-2xl font-bold hover:bg-[#e5e5e5] hover:-translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[100px]">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[32px] w-full max-w-md p-8 shadow-[0_25px_70px_rgba(0,0,0,0.65)] relative">
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-red-400">Delete Album</h2>
            <p className="text-white/70 font-light mb-8">
              Are you sure you want to delete <span className="text-white font-medium">"{activeAlbum?.name}"</span>? All photos inside will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDeleteOpen(false)} className="px-5 py-3 rounded-2xl font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleDeleteAlbum} disabled={isSubmitting} className="px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl font-bold hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all flex items-center justify-center">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}