"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Initialize Supabase securely using your secret role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getAlbumMediaSecure(albumId: string) {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("album_id", albumId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  // Generate highly secure Signed URLs for the private media
  const mediaWithSignedUrls = await Promise.all(
    data.map(async (item) => {
      // Create a URL valid for 1 hour (3600 seconds)
      const { data: signData } = await supabase.storage
        .from("photos")
        .createSignedUrl(item.filename, 3600);
        
      return {
        id: item.id,
        album_id: item.album_id,
        url: signData?.signedUrl || "", 
        filename: item.filename,
        created_at: item.created_at
      };
    })
  );

  return mediaWithSignedUrls;
}

export async function uploadMediaSecure(formData: FormData, albumId: string) {
  const files = formData.getAll("files") as File[];
  
  for (const file of files) {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedName}`;
    
    // 1. CONVERT FILE TO BUFFER
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 2. Upload the raw buffer and specify the MIME type
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(fileName, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(uploadError.message);
    }

    const { error: dbError } = await supabase
      .from("photos")
      .insert([{
        album_id: albumId,
        filename: fileName,
        image_url: fileName, 
      }]);

    if (dbError) {
      console.error("Database insert error:", dbError);
      throw new Error(dbError.message);
    }
  }
  
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteMediaSecure(filename: string) {
  await supabase.storage.from("photos").remove([filename]);
  await supabase.from("photos").delete().eq("filename", filename);
  
  revalidatePath("/", "layout");
  return { success: true };
}

export async function setAlbumCoverSecure(albumId: string, filename: string) {
  await supabase.from("albums").update({ cover_url: filename }).eq("id", albumId);
  
  revalidatePath("/", "layout");
  return { success: true };
}

export async function saveMediaOrderSecure(orderItems: { id: string, created_at: string }[]) {
  for (const item of orderItems) {
    await supabase
      .from("photos")
      .update({ created_at: item.created_at })
      .eq("id", item.id);
  }
  
  revalidatePath("/", "layout");
  return { success: true };
}