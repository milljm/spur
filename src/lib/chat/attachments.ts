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

const TEXT_EXT = /\.(txt|md|py|json|csv|html|js|ts|tsx|css|yml|yaml|toml)$/i;

export function isAllowedFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (TEXT_TYPES.has(file.type)) return true;
  return TEXT_EXT.test(file.name);
}

export async function fileToAttachment(file: File): Promise<Attachment> {
  if (file.type.startsWith("image/")) {
    const dataUrl = await resizeImage(file, 1280);
    return {
      id: crypto.randomUUID(),
      name: file.name,
      mime: file.type || "image/png",
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
