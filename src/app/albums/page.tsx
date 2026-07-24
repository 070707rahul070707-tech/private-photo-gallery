"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Folder, Plus, Edit2, Trash2, 
  X, Loader2, LogOut
} from "lucide-react";
import { supabase } from "@/lib/supabase"; 

interface Album {
  id: string;
  name: string;
  created_at: string;
}

export default function AlbumsPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        router.push("/");
        return;
      }
      await fetchAlbums();
      setIsLoading(false);
    };
    checkAuthAndFetch();
  }, [router]);

  const fetchAlbums = async () => {
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setAlbums(data);
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from("albums")
      .insert([{ name: newAlbumName.trim() }])
      .select()
      .single();

    if (!error && data) {
      setAlbums([data, ...albums]);
      setIsCreateOpen(false);
      setNewAlbumName("");
    }
    setIsSubmitting(false);
  };

  const handleRenameAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim() || !activeAlbum) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from("albums")
      .update({ name: newAlbumName.trim() })
      .eq("id", activeAlbum.id);

    if (!error) {
      setAlbums(albums.map(a => a.id === activeAlbum.id ? { ...a, name: newAlbumName.trim() } : a));
      setIsRenameOpen(false);
      setActiveAlbum(null);
      setNewAlbumName("");
    }
    setIsSubmitting(false);
  };

  const handleDeleteAlbum = async () => {
    if (!activeAlbum) return;
    
    setIsSubmitting(true);
    const { error } = await supabase
      .from("albums")
      .delete()
      .eq("id", activeAlbum.id);

    if (!error) {
      setAlbums(albums.filter(a => a.id !== activeAlbum.id));
      setIsDeleteOpen(false);
      setActiveAlbum(null);
    }
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("gallery-auth");
    router.push("/");
  };

  const handleMenuClick = (e: React.MouseEvent, album: Album, action: 'rename' | 'delete') => {
    e.stopPropagation();
    setActiveAlbum(album);
    if (action === 'rename') {
      setNewAlbumName(album.name);
      setIsRenameOpen(true);
    } else {
      setIsDeleteOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-[#050505]"
      >
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="w-full h-screen overflow-y-auto overflow-x-hidden text-white relative font-sans selection:bg-white/20 bg-[#050505]"
    >
      
      {/* Premium Twinkling Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="ambient-glow glow-blue"></div>
        <div className="ambient-glow glow-purple"></div>
        
        {/* Twinkling Stars */}
        <div className="twinkle-light t1"></div>
        <div className="twinkle-light t2"></div>
        <div className="twinkle-light t3"></div>
        <div className="twinkle-light t4"></div>
        <div className="twinkle-light t5"></div>
        <div className="twinkle-light t6"></div>
        <div className="twinkle-light t7"></div>
        <div className="twinkle-light t8"></div>
        <div className="twinkle-light t9"></div>
        <div className="twinkle-light t10"></div>
        <div className="twinkle-light t11"></div>
        <div className="twinkle-light t12"></div>
        <div className="twinkle-light t13"></div>
        <div className="twinkle-light t14"></div>
        <div className="twinkle-light t15"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:px-8 min-h-screen pb-24">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Albums</h1>
            <p className="text-[#9ca3af] font-light tracking-wide">Organize your private memories.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="group flex items-center gap-2 bg-transparent hover:bg-white/5 border border-white/10 backdrop-blur-md px-6 py-3 rounded-full transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300 text-white" />
              <span className="font-medium tracking-wide text-white">Create</span>
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

        {/* Grid */}
        {albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-white/10 bg-transparent rounded-[32px] backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <Folder className="w-12 h-12 text-white/30 mb-4" />
            <p className="text-[#9ca3af] font-light">No albums yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {albums.map((album) => (
              <div 
                key={album.id}
                onClick={() => router.push(`/album?id=${album.id}`)}
                // FIX: Made the cards mostly transparent (bg-transparent) with a beautiful frosted blur
                className="group cursor-pointer relative aspect-square rounded-[32px] bg-transparent border border-white/10 backdrop-blur-md overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:bg-white/5 hover:border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)]"
              >
                <div className="absolute inset-0 p-6 flex flex-col justify-end z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none">
                  <h3 className="text-xl font-medium tracking-tight text-white mb-1 drop-shadow-md">
                    {album.name}
                  </h3>
                  <p className="text-xs text-white/60 font-light">
                    {new Date(album.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Folder className="w-16 h-16 text-white/20 group-hover:scale-110 group-hover:text-white/40 transition-all duration-500" />
                </div>

                <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <button 
                    onClick={(e) => handleMenuClick(e, album, 'rename')}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleMenuClick(e, album, 'delete')}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-lg border border-white/10 text-white/70 hover:text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {(isCreateOpen || isRenameOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-transparent backdrop-blur-2xl border border-white/10 rounded-[32px] w-full max-w-md p-8 shadow-[0_25px_70px_rgba(0,0,0,0.65)] relative">
            <button 
              onClick={() => { setIsCreateOpen(false); setIsRenameOpen(false); }}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
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
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); setIsRenameOpen(false); }}
                  className="px-5 py-3 rounded-2xl font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newAlbumName.trim()}
                  className="px-6 py-3 bg-white text-black rounded-2xl font-bold hover:bg-[#e5e5e5] hover:-translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[100px]"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-transparent backdrop-blur-2xl border border-white/10 rounded-[32px] w-full max-w-md p-8 shadow-[0_25px_70px_rgba(0,0,0,0.65)] relative">
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-red-400">Delete Album</h2>
            <p className="text-white/70 font-light mb-8">
              Are you sure you want to delete <span className="text-white font-medium">"{activeAlbum?.name}"</span>? All photos inside will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-5 py-3 rounded-2xl font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAlbum}
                disabled={isSubmitting}
                className="px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl font-bold hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}