"use client";

import { createUploadTarget, deleteMedia, listMedia } from "@/app/admin/actions";
import { MEDIA_BUCKET } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";

export type MediaItem = { name: string; src: string; width: number; height: number; builtIn?: boolean };

/** Images that ship with the site, so admins can reuse them. */
export const BUILT_IN_IMAGES: MediaItem[] = [
  { name: "Logo", src: "/brand/logo-gold.png", width: 604, height: 576 },
  { name: "Richa Singh", src: "/people/richa.webp", width: 640, height: 800 },
  { name: "Suresh Tripathi", src: "/people/suresh.webp", width: 480, height: 600 },
  { name: "Shailesh Singh", src: "/people/shailesh.webp", width: 480, height: 600 },
  { name: "Vikas Baijal", src: "/people/vikas.webp", width: 480, height: 600 },
  { name: "Swati Adhikary", src: "/people/swati.webp", width: 480, height: 600 },
  { name: "Vipul Jain", src: "/people/vipul.webp", width: 480, height: 600 },
  { name: "Vikram Nandwani", src: "/people/vikram.webp", width: 480, height: 600 },
  { name: "R. SreeKumar", src: "/people/sreekumar.webp", width: 480, height: 600 },
  { name: "Vineet Saraiwala", src: "/people/vineet.webp", width: 480, height: 600 },
  { name: "Luxury", src: "/hospitality/luxury.webp", width: 690, height: 792 },
  { name: "Restaurant", src: "/hospitality/restaurant.webp", width: 690, height: 1032 },
  { name: "Retail", src: "/hospitality/retail.webp", width: 690, height: 1031 },
  { name: "Strengthscape", src: "/partners/strengthscape.png", width: 637, height: 187 },
  { name: "London Speaker Bureau", src: "/partners/london-speakers-bureau.webp", width: 600, height: 600 },
].map((item) => ({ ...item, builtIn: true }));

export const MAX_UPLOAD_MB = 10;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif", "image/svg+xml"];
export const ACCEPT_ATTR = ACCEPTED.join(",");

function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 1200, height: img.naturalHeight || 800 });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 1200, height: 800 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * Uploads an image: the server checks the admin session and issues a signed
 * upload URL, then the browser sends the file straight to storage.
 */
export async function uploadImage(file: File): Promise<MediaItem> {
  if (!ACCEPTED.includes(file.type)) throw new Error("Please choose a PNG, JPG, WebP, GIF, AVIF or SVG image.");
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`Images must be smaller than ${MAX_UPLOAD_MB} MB.`);

  const { width, height } = await readDimensions(file);
  const target = await createUploadTarget({ name: file.name, type: file.type, size: file.size, width, height });
  if (!target.ok) throw new Error(target.error);

  const { error } = await createPublicClient()
    .storage.from(MEDIA_BUCKET)
    .uploadToSignedUrl(target.path, target.token, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return { name: file.name, src: target.publicUrl, width, height };
}

export async function listUploads(): Promise<MediaItem[]> {
  const result = await listMedia();
  if (!result.ok) throw new Error(result.error);
  return result.items;
}

export async function deleteUpload(src: string) {
  const result = await deleteMedia(src);
  if (!result.ok) throw new Error(result.error);
}
