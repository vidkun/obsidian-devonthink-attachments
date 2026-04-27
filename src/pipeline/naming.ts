import { resolvedExtension } from "../util/mime";
import type { IncomingFile, TemplateContext } from "../types";
import { applyTemplate, formatDate, formatTime } from "./template";

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|#^[\]]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 180);
}

export function stripExtension(name: string): string {
  const ext = /\.[^.]+$/.exec(name);
  return ext ? name.slice(0, ext.index) : name;
}

export function fallbackOriginalName(file: IncomingFile, date = new Date()): string {
  if (file.name && file.name !== "image.png" && file.name !== "blob") return file.name;
  const ext = resolvedExtension(file);
  return `screenshot-${formatDate(date)}-${formatTime(date)}.${ext}`;
}

export function resolveName(
  template: string,
  file: IncomingFile,
  noteName: string,
  uuid = "",
  date = new Date()
): string {
  const original = fallbackOriginalName(file, date);
  const ext = resolvedExtension({ ...file, name: original });
  const context: Partial<TemplateContext> = {
    note: sanitizeFileName(noteName || "Untitled"),
    original: sanitizeFileName(stripExtension(original)),
    ext,
    uuid,
    date: formatDate(date),
    time: formatTime(date)
  };
  const rendered = applyTemplate(template, context);
  const sanitized = sanitizeFileName(rendered || stripExtension(original));
  return sanitized.toLowerCase().endsWith(`.${ext}`) ? sanitized : `${sanitized}.${ext}`;
}
