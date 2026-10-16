"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SMARTER HELPER: Extracts the exact filename even from old, messy public URLs
function getFilePath(urlOrPath: string | null | undefined) {
  if (!urlOrPath) return null;
  
  try {
    // If it is an old full URL, grab just the very last part (the filename)
    if (urlOrPath.startsWith("http")) {
      const parts = new URL(urlOrPath).pathname.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    }
    // If it has the old public folder path in it, strip it out
    if (urlOrPath.includes("/public/photos/")) {
      return decodeURIComponent(urlOrPath.split("/public/photos/")[1]);
    }
  } catch (e) {
    // Failsafe
  }
  
  // If it's already a clean filename, just return it
  return decodeURIComponent(urlOrPath);
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

      // Fallback to first photo if no cover is set
      if (!imagePath) {
        const { data: mediaData } = await supabase
          .from("photos")
          .select("filename, image_url") // Safely request both
          .eq("album_id", album.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .single();
        
        // Prefer the clean filename if it exists, otherwise clean the old URL
        imagePath = mediaData?.filename ? mediaData.filename : getFilePath(mediaData?.image_url);
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