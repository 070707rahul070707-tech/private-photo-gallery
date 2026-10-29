export async function uploadMediaSecure(formData: FormData, albumId: string) {
  const files = formData.getAll("files") as File[];
  
  for (const file of files) {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedName}`;
    
    // 1. CONVERT FILE TO BUFFER (This fixes the Supabase backend failure)
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