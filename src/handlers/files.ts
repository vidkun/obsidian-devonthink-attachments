import type { IncomingFile } from "../types";
import { isSupportedFile } from "../util/mime";
import type { Logger } from "../util/log";

export function filesFromClipboard(event: ClipboardEvent, logger: Logger): IncomingFile[] {
  const data = event.clipboardData;
  if (!data) return [];

  const files: IncomingFile[] = [];
  for (const file of Array.from(data.files ?? [])) {
    files.push(fromDomFile(file));
  }

  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file) files.push(fromDomFile(file));
  }

  return uniqueSupportedFiles(files, logger);
}

export function filesFromDrop(event: DragEvent, logger: Logger): IncomingFile[] {
  const data = event.dataTransfer;
  if (!data) return [];

  const files = Array.from(data.files ?? []).map(fromDomFile);
  return uniqueSupportedFiles(files, logger);
}

function fromDomFile(file: File): IncomingFile {
  return {
    blob: file,
    name: file.name,
    type: file.type,
    lastModified: file.lastModified
  };
}

function uniqueSupportedFiles(files: IncomingFile[], logger: Logger): IncomingFile[] {
  const seen = new Set<string>();
  const supported: IncomingFile[] = [];

  for (const file of files) {
    if (!isSupportedFile(file)) {
      logger.debug("Skipping unsupported file", { name: file.name, type: file.type });
      continue;
    }

    const key = `${file.name}:${file.type}:${file.blob.size}:${file.lastModified ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    supported.push(file);
  }

  return supported;
}
