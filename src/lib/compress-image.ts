"use client";

const MAX_SIDE = 1600;

/** Shrinks a phone photo to a web-friendly JPEG before upload (5 MB photo → ~300 KB). */
export async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.82));
    if (blob) return blob;
  } catch {
    // fall through: format the browser can't decode (e.g. HEIC)
  }
  if (["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 4 * 1024 * 1024) return file;
  throw new Error("unsupported_format"); // translated by the UI
}
