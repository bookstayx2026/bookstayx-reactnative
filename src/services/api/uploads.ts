import type { ImagePickerAsset } from "expo-image-picker";
import { ApiError, apiUrl } from "./client";

export type UploadedImage = { url: string; public_id: string; width?: number; height?: number };

export async function uploadImage(token: string, asset: ImagePickerAsset, owner = false): Promise<UploadedImage> {
  const form = new FormData();
  if (asset.file) {
    form.append("image", asset.file);
  } else {
    form.append("image", {
      uri: asset.uri,
      name: asset.fileName || `bookstayx-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    } as unknown as Blob);
  }
  const response = await fetch(apiUrl(owner ? "/api/owners/dashboard/upload-image" : "/api/properties/upload-image"), {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    body: form,
  });
  const raw = await response.text();
  let data: Record<string, unknown> = {};
  try { data = raw ? JSON.parse(raw) as Record<string, unknown> : {}; } catch { throw new ApiError("The image service returned an unreadable response.", "INVALID_RESPONSE", response.status, raw); }
  if (!response.ok) throw new ApiError(String(data.message || "Image upload failed."), "HTTP", response.status, data);
  return data as UploadedImage;
}
