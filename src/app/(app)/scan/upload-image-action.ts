
"use server";

export async function uploadImage(base64Image: string): Promise<{ success: boolean; url?: string; error?: string; }> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'ImageBB API key is not configured.' };
  }

  const formData = new FormData();
  formData.append('image', base64Image);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return { success: true, url: result.data.display_url };
    } else {
      return { success: false, error: result.error?.message || 'Failed to upload image to ImageBB.' };
    }
  } catch (error) {
    console.error('Image upload failed:', error);
    return { success: false, error: 'An unexpected error occurred during image upload.' };
  }
}
