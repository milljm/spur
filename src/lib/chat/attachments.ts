import type { Attachment } from "./types";

const TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "application/json",
  "application/javascript",
  "text/javascript",
  "text/x-python",
]);

const TEXT_EXT =
  /\.(txt|md|py|json|csv|html|htm|js|ts|tsx|jsx|css|yml|yaml|toml|xml|sh|rs|go|rb|sql|log)$/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

export function isImageFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  return IMAGE_EXT.test(file.name);
}

export function isAllowedFile(file: File): boolean {
  if (isImageFile(file)) return true;
  if (TEXT_TYPES.has(file.type)) return true;
  return TEXT_EXT.test(file.name);
}

export async function fileToAttachment(file: File): Promise<Attachment> {
  if (isImageFile(file)) {
    const dataUrl = await resizeImage(file, 1280);
    return {
      id: crypto.randomUUID(),
      name: file.name,
      mime: file.type || guessImageMime(file.name),
      kind: "image",
      dataUrl,
      size: file.size,
    };
  }
  const text = await file.text();
  return {
    id: crypto.randomUUID(),
    name: file.name,
    mime: file.type || "text/plain",
    kind: "text",
    text,
    size: file.size,
  };
}

function guessImageMime(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "png" || ext === "gif" || ext === "webp" || ext === "bmp") {
    return `image/${ext}`;
  }
  return "image/png";
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = url;
  });
}

async function resizeImage(file: File, maxEdge: number): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}
