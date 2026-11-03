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
  { name: "Aditi Choudhary", src: "/people/network/aditi-choudhary.webp", width: 480, height: 600 },
  { name: "Alpa Kapadia", src: "/people/network/alpa-kapadia.webp", width: 480, height: 600 },
  { name: "Dr Archana Gupta", src: "/people/network/archana-gupta.webp", width: 480, height: 600 },
  { name: "Debarati Roy", src: "/people/network/debarati-roy.webp", width: 480, height: 600 },
  { name: "Deepali Sadavarte", src: "/people/network/deepali-sadavarte.webp", width: 480, height: 600 },
  { name: "Dr Raina Khatri Tandon", src: "/people/network/raina-khatri-tandon.webp", width: 480, height: 600 },
  { name: "Gourav Maharshi", src: "/people/network/gourav-maharshi.webp", width: 480, height: 600 },
  { name: "Jyotirmoy Bose", src: "/people/network/jyotirmoy-bose.webp", width: 480, height: 600 },
  { name: "Latha Sundaram Verghese", src: "/people/network/latha-sundaram-verghese.webp", width: 480, height: 600 },
  { name: "Mahrukh Bandorawalla", src: "/people/network/mahrukh-bandorawalla.webp", width: 480, height: 600 },
  { name: "Malati Vasudeva", src: "/people/network/malati-vasudeva.webp", width: 480, height: 600 },
  { name: "Mandeep Merwah", src: "/people/network/mandeep-merwah.webp", width: 480, height: 600 },
  { name: "Monica Alex", src: "/people/network/monica-alex.webp", width: 480, height: 600 },
  { name: "Nivedita Rath", src: "/people/network/nivedita-rath.webp", width: 480, height: 600 },
  { name: "Pooja Sahitya", src: "/people/network/pooja-sahitya.webp", width: 480, height: 600 },
  { name: "R. SreeKumar", src: "/people/network/sreekumar.webp", width: 480, height: 600 },
  { name: "Rajeev Malik", src: "/people/network/rajeev-malik.webp", width: 480, height: 600 },
  { name: "Rajneesh Mathur", src: "/people/network/rajneesh-mathur.webp", width: 480, height: 600 },
  { name: "Rashmi Shetty", src: "/people/network/rashmi-shetty.webp", width: 480, height: 600 },
  { name: "Rekha Radhakrishnan", src: "/people/network/rekha-radhakrishnan.webp", width: 480, height: 600 },
  { name: "Ripudaman Singh Sujlana", src: "/people/network/ripudaman-singh-sujlana.webp", width: 480, height: 600 },
  { name: "Rubal Sabharwal", src: "/people/network/rubal-sabharwal.webp", width: 480, height: 600 },
  { name: "Satadru Chakraborty", src: "/people/network/satadru-chakraborty.webp", width: 480, height: 600 },
  { name: "Sneha Venkataram", src: "/people/network/sneha-venkataram.webp", width: 480, height: 600 },
  { name: "Supriiya Patil", src: "/people/network/supriiya-patil.webp", width: 480, height: 600 },
  { name: "Swati Adhikary", src: "/people/network/swati-adhikary.webp", width: 480, height: 600 },
  { name: "Tamanna Khurana", src: "/people/network/tamanna-khurana.webp", width: 480, height: 600 },
  { name: "Vikram Nandwani", src: "/people/network/vikram-nandwani.webp", width: 480, height: 600 },
  { name: "Vipul Jain", src: "/people/network/vipul-jain.webp", width: 480, height: 600 },
  { name: "Yogambika Kumaraguru", src: "/people/network/yogambika-kumaraguru.webp", width: 480, height: 600 },
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
