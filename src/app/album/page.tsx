"use client";

import { useEffect, useState, useRef } from "react";
import { 
  ArrowLeft, Upload, Trash2, X, ChevronLeft, 
  ChevronRight, Loader2, Image as ImageIcon, Play, ImagePlus, Move, ListOrdered, Save
} from "lucide-react";
import { 
  getAlbumMediaSecure, 
  uploadMediaSecure, 
  deleteMediaSecure, 
  setAlbumCoverSecure, 
  saveMediaOrderSecure 
} from "./actions";

interface MediaItem {
  id: string;
  album_id: string;
  url: string;
  filename: string;
  created_at: string;
}

export default function AlbumPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingCover, setIsSettingCover] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  
  const [isReorderMode, setIsReorderMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const isDragging = useRef(false);

  const isVideo = (filename: string) => {
    return /\.(mp4|webm|ogg|mov|mkv)$/i.test(filename || "");
  };

  async function loadMedia() {
    const albumId = new URLSearchParams(window.location.search).get("id");
    if (!albumId) return;

    const secureMedia = await getAlbumMediaSecure(albumId);
    setMedia(secureMedia);
    setIsLoading(false);
  }

  async function uploadMedia() {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const albumId = new URLSearchParams(window.location.search).get("id");
    if (!albumId) return;

    // Use FormData to send files to the secure server action
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append("files", file);
    });

    await uploadMediaSecure(formData, albumId);

    setFiles(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await loadMedia();
    setIsUploading(false);
  }

  async function deleteMedia() {
    if (selectedIndex === null) return;
    const item = media[selectedIndex];
    if (!item || !item.filename) return;

    setIsLoading(true);
    setSelectedIndex(null);
    
    await deleteMediaSecure(item.filename);
    await loadMedia();
  }

  async function handleSetAsCover() {
    if (selectedIndex === null) return;
    
    const albumId = new URLSearchParams(window.location.search).get("id");
    if (!albumId) return;

    setIsSettingCover(true);
    const item = media[selectedIndex];

    const { success } = await setAlbumCoverSecure(albumId, item.filename);

    setIsSettingCover(false);
    if (success) {
      alert("Album cover successfully updated!");
    } else {
      alert("Failed to update album cover.");
    }
  }

  const handleDragStart = (index: number) => {
    if (!isReorderMode) return;
    isDragging.current = true;
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    if (!isReorderMode) return;
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (!isReorderMode) return;
    if (dragItem.current === null || dragOverItem.current === null) {
      setTimeout(() => { isDragging.current = false; }, 100);
      return;
    }

    const newMedia = [...media];
    const draggedItemContent = newMedia[dragItem.current];
    newMedia.splice(dragItem.current, 1);
    newMedia.splice(dragOverItem.current, 0, draggedItemContent);

    dragItem.current = null;
    dragOverItem.current = null;
    
    setMedia(newMedia);
    setTimeout(() => { isDragging.current = false; }, 100);
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    const now = Date.now();
    
    const orderItems = media.map((item, index) => ({
      id: item.id,
      created_at: new Date(now + index * 1000).toISOString(),
    }));

    await saveMediaOrderSecure(orderItems);
    
    setIsSavingOrder(false);
    setIsReorderMode(false);
    await loadMedia(); 
  };

  const handleCancelReorder = async () => {
    setIsReorderMode(false);
    setIsLoading(true);
    await loadMedia(); 
  };

  useEffect(() => {
    loadMedia();
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
              className={`flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4 group w-fit ${isReorderMode ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Back to Albums
            </button>
            <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-white/30" />
              {isReorderMode ? "Rearrange Photos" : "Album Media"}
              {isSavingOrder && <Loader2 className="w-5 h-5 text-white/40 animate-spin ml-2" />}
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-transparent p-2 rounded-[24px] border border-white/10 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            
            {isReorderMode ? (
              <>
                <button
                  onClick={handleCancelReorder}
                  className="px-6 py-3 rounded-2xl font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOrder}
                  disabled={isSavingOrder}
                  className="group flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-600 hover:-translate-y-[2px] disabled:opacity-50 transition-all shadow-lg shadow-green-500/20"
                >
                  {isSavingOrder ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Order
                </button>
              </>
            ) : (
              <>
                {media.length > 1 && (
                  <>
                    <button
                      onClick={() => setIsReorderMode(true)}
                      className="p-3 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all group"
                      title="Rearrange Photos"
                    >
                      <ListOrdered className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="w-px h-8 bg-white/10 mx-1"></div>
                  </>
                )}

                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  ref={fileInputRef}
                  onChange={(e) => setFiles(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload"
                  className="px-6 py-3 rounded-2xl font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10"
                >
                  {files && files.length > 0 ? `${files.length} selected` : "Select Media"}
                </label>
                <button
                  onClick={uploadMedia}
                  disabled={isUploading || !files || files.length === 0}
                  className="group flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-bold hover:bg-[#e5e5e5] hover:-translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  Upload
                </button>
              </>
            )}
          </div>
        </div>

        {/* Media Grid */}
        {media.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-white/10 bg-transparent rounded-[32px] backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <ImageIcon className="w-12 h-12 text-white/30 mb-4" />
            <p className="text-white/60 font-light">No media in this album yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item, index) => {
              const video = isVideo(item.filename);
              return (
                <div 
                  key={item.id}
                  draggable={isReorderMode}
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => {
                    if (isReorderMode) return;
                    if (isDragging.current) return;
                    setSelectedIndex(index);
                  }}
                  className={`group relative aspect-square rounded-[24px] overflow-hidden bg-black/40 border backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-500 flex items-center justify-center ${
                    isReorderMode 
                      ? "cursor-grab active:cursor-grabbing border-blue-500/40 hover:border-blue-400 scale-95 hover:scale-100" 
                      : "cursor-pointer border-white/10 hover:border-white/30"
                  }`}
                >
                  {video ? (
                    <>
                      <video 
                        src={item.url} 
                        className={`w-full h-full object-cover transition-transform duration-700 pointer-events-none ${!isReorderMode && 'group-hover:scale-110'}`} 
                        muted 
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white/90">
                          <Play className="w-8 h-8 fill-white/80" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={item.url}
                      alt={`Media ${index}`}
                      className={`w-full h-full object-cover transition-transform duration-700 pointer-events-none ${!isReorderMode && 'group-hover:scale-110'}`}
                    />
                  )}
                  
                  {isReorderMode ? (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center pointer-events-none border-2 border-transparent group-active:border-blue-500/50 rounded-[24px]">
                      <Move className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        <div className="p-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white">
                          {video ? <Play className="w-6 h-6 fill-white" /> : <ImageIcon className="w-6 h-6" />}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Media Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200">
          
          <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
            {!isVideo(media[selectedIndex].filename) && (
              <button 
                onClick={handleSetAsCover}
                disabled={isSettingCover}
                className="p-3 rounded-full bg-black/40 border border-white/10 text-white/70 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/10 backdrop-blur-xl transition-all group disabled:opacity-50"
                title="Set as Album Cover"
              >
                {isSettingCover ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
              </button>
            )}

            <button 
              onClick={deleteMedia}
              className="p-3 rounded-full bg-black/40 border border-white/10 text-white/70 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 backdrop-blur-xl transition-all group"
              title="Delete Media"
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
              setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : media.length - 1);
            }}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {isVideo(media[selectedIndex].filename) ? (
            <video
              src={media[selectedIndex].url}
              controls
              autoPlay
              playsInline
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
            />
          ) : (
            <img
              src={media[selectedIndex].url}
              alt="Fullscreen view"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
            />
          )}

          <button
            className="absolute right-6 p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white backdrop-blur-xl transition-all z-50"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex(selectedIndex < media.length - 1 ? selectedIndex + 1 : 0);
            }}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          
        </div>
      )}
    </div>
  );
}