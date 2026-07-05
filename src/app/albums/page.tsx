"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Album = {
  id: string;
  name: string;
};

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumName, setAlbumName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const auth = localStorage.getItem("gallery-auth");

    if (auth !== "true") {
      window.location.href = "/";
      return;
    }

    fetchAlbums();
  }, []);

  async function fetchAlbums() {
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAlbums(data);
    }
  }

  async function createAlbum() {
    if (!albumName.trim()) return;

    const { error } = await supabase
      .from("albums")
      .insert([{ name: albumName }]);

    if (!error) {
      setAlbumName("");
      fetchAlbums();
    }
  }

  async function deleteAlbum(id: string) {
    if (!confirm("Delete this album?")) return;

    const { error } = await supabase
      .from("albums")
      .delete()
      .eq("id", id);

    if (!error) {
      fetchAlbums();
    }
  }

  async function saveEdit() {
    if (!editingId) return;

    const { error } = await supabase
      .from("albums")
      .update({ name: editName })
      .eq("id", editingId);

    if (!error) {
      setEditingId(null);
      setEditName("");
      fetchAlbums();
    }
  }

  return (
    <main
      style={{
        padding: "30px",
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          marginBottom: "25px",
        }}
      >
        📁 My Albums
      </h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "30px",
          flexWrap: "wrap",
        }}
      >
        <input
          value={albumName}
          onChange={(e) => setAlbumName(e.target.value)}
          placeholder="Album Name"
          style={{
            padding: "12px",
            width: "300px",
            borderRadius: "10px",
            border: "1px solid #334155",
            background: "#1e293b",
            color: "white",
          }}
        />

        <button
          onClick={createAlbum}
          style={{
            padding: "12px 18px",
            borderRadius: "10px",
            border: "none",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
          }}
        >
          Create Album
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill,minmax(280px,1fr))",
          gap: "20px",
        }}
      >
        {albums.map((album) => (
          <div
            key={album.id}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            {editingId === album.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "10px",
                    borderRadius: "8px",
                  }}
                />

                <button onClick={saveEdit}>
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    window.location.href = `/album?id=${album.id}`;
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    fontSize: "20px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginBottom: "15px",
                  }}
                >
                  📁 {album.name}
                </button>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => {
                      setEditingId(album.id);
                      setEditName(album.name);
                    }}
                  >
                    Rename
                  </button>

                  <button
                    onClick={() => deleteAlbum(album.id)}
                    style={{
                      background: "#dc2626",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}