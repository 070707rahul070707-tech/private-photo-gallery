"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// 1. Initialize Supabase securely on the server using your secret key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to extract the file path if a full URL was stored in the database
function getFilePath(urlOrPath: string) {
  if (!urlOrPath) return null;
  if (urlOrPath.includes("/public/photos/")) {
    return urlOrPath.split("/public/photos/")[1];
  }
  return urlOrPath;
}

// --- AUTHENTICATION ---

export async function verifyPassword(password: string) {
  const correctPassword = process.env.GALLERY_PASSWORD;

  if (password === correctPassword) {
    (await cookies()).set("gallery-auth-token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return { success: true };
  }
  return { success: false };
}

export async function logoutGallery() {
  (await cookies()).delete("gallery-auth-token");
}

// --- SECURE GALLERY ACTIONS ---

export async function getAlbumsSecure() {
  const { data: albumsData, error } = await supabase
    .from("albums")
    .select("id, name, created_at, cover_url")
    .order("created_at", { ascending: false });

  if (error || !albumsData) return [];

  const albumsWithCovers = await Promise.all(
    albumsData.map(async (album) => {
      let imagePath = getFilePath(album.cover_url);

      // Fallback to first photo if no cover
      if (!imagePath) {
        const { data: mediaData } = await supabase
          .from("photos")
          .select("image_url")
          .eq("album_id", album.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .single();
        
        imagePath = getFilePath(mediaData?.image_url);
      }

      // Generate a highly secure Signed URL valid for 1 hour
      let signedUrl = null;
      if (imagePath) {
        const { data } = await supabase.storage
          .from("photos")
          .createSignedUrl(imagePath, 3600);
        
        signedUrl = data?.signedUrl || null;
      }

      return { ...album, cover_url: signedUrl };
    })
  );

  return albumsWithCovers;
}

export async function createAlbumSecure(name: string) {
  const { data, error } = await supabase
    .from("albums")
    .insert([{ name }])
    .select()
    .single();
  return { data, error: error?.message };
}

export async function renameAlbumSecure(id: string, name: string) {
  const { error } = await supabase
    .from("albums")
    .update({ name })
    .eq("id", id);
  return { success: !error };
}

export async function deleteAlbumSecure(id: string) {
  const { error } = await supabase
    .from("albums")
    .delete()
    .eq("id", id);
  return { success: !error };
}