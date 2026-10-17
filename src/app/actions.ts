"use server";

import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getFilePath(urlOrPath: string | null | undefined) {
  if (!urlOrPath) return null;
  try {
    if (urlOrPath.startsWith("http")) {
      const parts = new URL(urlOrPath).pathname.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    }
    if (urlOrPath.includes("/public/photos/")) {
      return decodeURIComponent(urlOrPath.split("/public/photos/")[1]);
    }
  } catch (e) {}
  return decodeURIComponent(urlOrPath);
}

// --- AUTHENTICATION ---

export async function verifyPassword(password: string) {
  const correctPassword = process.env.GALLERY_PASSWORD;

  if (password === correctPassword) {
    (await cookies()).set("gallery-auth-token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", 
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
  // THE CACHE KILLER: Forces Next.js to fetch fresh database info every single time
  noStore(); 
  
  const { data: albumsData, error } = await supabase
    .from("albums")
    .select("id, name, created_at, cover_url")
    .order("created_at", { ascending: false });

  if (error || !albumsData) return [];

  const albumsWithCovers = await Promise.all(
    albumsData.map(async (album) => {
      let imagePath = getFilePath(album.cover_url);

      if (!imagePath) {
        const { data: mediaData } = await supabase
          .from("photos")
          .select("filename, image_url") 
          .eq("album_id", album.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .single();
        
        imagePath = mediaData?.filename || getFilePath(mediaData?.image_url);
      }

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