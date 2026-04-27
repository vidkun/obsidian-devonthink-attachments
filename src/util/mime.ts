import type { IncomingFile } from "../types";

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "heic",
  "heif",
  "tiff",
  "tif",
  "bmp",
  "svg"
]);

const PDF_EXTENSIONS = new Set(["pdf"]);

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/tiff": "tiff",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf"
};

export function getExtension(name: string): string {
  const cleanName = name.split("?")[0] ?? name;
  const match = /\.([^.\\/]+)$/.exec(cleanName);
  return match ? match[1].toLowerCase() : "";
}

export function extensionFromMime(type: string): string {
  return MIME_TO_EXTENSION[type.toLowerCase()] ?? "";
}

export function isSupportedFile(file: Pick<IncomingFile, "name" | "type">): boolean {
  const type = file.type.toLowerCase();
  if (type.startsWith("image/") || type === "application/pdf") return true;

  const ext = getExtension(file.name);
  return IMAGE_EXTENSIONS.has(ext) || PDF_EXTENSIONS.has(ext);
}

export function isPdf(file: Pick<IncomingFile, "name" | "type">): boolean {
  return file.type.toLowerCase() === "application/pdf" || getExtension(file.name) === "pdf";
}

export function resolvedExtension(file: Pick<IncomingFile, "name" | "type">): string {
  return getExtension(file.name) || extensionFromMime(file.type) || "bin";
}
