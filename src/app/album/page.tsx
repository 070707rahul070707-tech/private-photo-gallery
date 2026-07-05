"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AlbumPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  async function loadPhotos() {
    const albumId = new URLSearchParams(window.location.search).get("id");

    if (!albumId) return;

    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("album_id", albumId);

    if (error) {
      console.error(error);
      return;
    }

    setPhotos(data.map((photo) => photo.image_url));
  }

  async function uploadPhoto() {
    if (!files || files.length === 0) return;

    const albumId =
      new URLSearchParams(window.location.search).get("id");

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

    await loadPhotos();
    alert("Photos uploaded successfully!");
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

  return (
    <main style={{ padding: "40px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <h1>📸 Album Photos</h1>

        <button
          onClick={() => {
            window.location.href = "/albums";
          }}
        >
          ← Back To Albums
        </button>
      </div>

      <input
        type="file"
        multiple
        onChange={(e) => {
          setFiles(e.target.files);
        }}
      />

      <button
        onClick={uploadPhoto}
        style={{
          marginLeft: "10px",
          padding: "10px",
        }}
      >
        Upload Photos
      </button>

      <div
        style={{
          marginTop: "30px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
          gap: "15px",
        }}
      >
        {photos.map((url, index) => (
          <img
            key={index}
            src={url}
            alt=""
            onClick={() => setSelectedIndex(index)}
            style={{
              width: "100%",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {selectedIndex !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            zIndex: 9999,
          }}
        >
          <img
            src={photos[selectedIndex]}
            alt=""
            style={{
              maxWidth: "90%",
              maxHeight: "80vh",
            }}
          />

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() =>
                setSelectedIndex(
                  selectedIndex > 0
                    ? selectedIndex - 1
                    : photos.length - 1
                )
              }
            >
              ◀ Previous
            </button>

            <button
              onClick={() =>
                setSelectedIndex(
                  selectedIndex < photos.length - 1
                    ? selectedIndex + 1
                    : 0
                )
              }
            >
              Next ▶
            </button>

            <button onClick={deletePhoto}>
              Delete Photo
            </button>

            <button onClick={() => setSelectedIndex(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}