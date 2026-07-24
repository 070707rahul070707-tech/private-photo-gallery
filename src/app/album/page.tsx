"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Upload, Trash2, X, ChevronLeft, ChevronRight, Loader2, Image as ImageIcon } from "lucide-react";

export default function AlbumPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadPhotos() {
    const albumId = new URLSearchParams(window.location.search).get("id");
    if (!albumId) return;

    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("album_id", albumId);

    if (error) {
      console.error(error);
      setIsLoading(false);
      return;
    }

    setPhotos(data.map((photo) => photo.image_url));
    setIsLoading(false);
  }

  async function uploadPhoto() {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const albumId = new URLSearchParams(window.location.search).get("id");

    for (const file of Array.from(files)) {
      const fileName = `${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from("photos")
        .upload(fileName, file);

      if (error) continue;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("photos")
        .getPublicUrl(fileName);

      await supabase
        .from("photos")
        .insert([
          {
            album_id: albumId,
            filename: fileName,
            image_url: publicUrl,
          },
        ]);
    }

    setFiles(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await loadPhotos();
    setIsUploading(false);
  }

  async function deletePhoto() {
    if (selectedIndex === null) return;

    const url = photos[selectedIndex];
    const fileName = url.split("/").pop();

    if (!fileName) return;

    const { error } = await supabase.storage
      .from("photos")
      .remove([fileName]);

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedIndex(null);
    await loadPhotos();
  }

  useEffect(() => {
    const auth = localStorage.getItem("gallery-auth");
    if (auth !== "true") {
      window.location.href = "/";
      return;
    }
    loadPhotos();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-y-auto overflow-x-hidden text-white relative font-sans selection:bg-white/20 bg-[#050505]">
      
      {/* Premium Twinkling Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="ambient-glow glow-blue"></div>
        <div className="ambient-glow glow-purple"></div>
        
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
        
        {/* Header Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <button
              onClick={() => { window.location.href = "/albums"; }}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4 group w-fit"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Back to Albums
            </button>
            <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-white/30" />
              Album Photos
            </h1>
          </div>

          {/* Upload Controls */}
          <div className="flex items-center gap-3 bg-transparent p-2 rounded-[24px] border border-white/10 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={(e) => setFiles(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label 
              htmlFor="file-upload"
              className="px-6 py-3 rounded-2xl font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10"
            >
              {files && files.length > 0 ? `${files.length} selected` : "Select Files"}
            </label>
            <button
              onClick={uploadPhoto}
              disabled={isUploading || !files || files.length === 0}
              className="group flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-bold hover:bg-[#e5e5e5] hover:-translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              Upload
            </button>
          </div>
        </div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-white/10 bg-transparent rounded-[32px] backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <ImageIcon className="w-12 h-12 text-white/30 mb-4" />
            <p className="text-white/60 font-light">No photos in this album yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((url, index) => (
              <div 
                key={index}
                onClick={() => setSelectedIndex(index)}
                // Photo cards now match the translucent aesthetic
                className="group relative aspect-square rounded-[24px] overflow-hidden cursor-pointer bg-transparent border border-white/10 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:border-white/20 transition-all duration-500"
              >
                <img
                  src={url}
                  alt={`Photo ${index}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Photo Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200">
          
          <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
            <button 
              onClick={deletePhoto}
              className="p-3 rounded-full bg-black/40 border border-white/10 text-white/70 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 backdrop-blur-xl transition-all group"
              title="Delete Photo"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setSelectedIndex(null)}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white backdrop-blur-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            className="absolute left-6 p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white backdrop-blur-xl transition-all z-50"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : photos.length - 1);
            }}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <img
            src={photos[selectedIndex]}
            alt="Fullscreen view"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
          />

          <button
            className="absolute right-6 p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white backdrop-blur-xl transition-all z-50"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(selectedIndex < photos.length - 1 ? selectedIndex + 1 : 0);
            }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          
        </div>
      )}
    </div>
  );
}