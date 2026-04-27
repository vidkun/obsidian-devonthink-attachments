import { App, normalizePath, TFile } from "obsidian";
import type { IncomingFile } from "../types";
import { resolvedExtension } from "../util/mime";
import { fallbackOriginalName, sanitizeFileName } from "./naming";

export async function fallbackToVaultAttachment(app: App, file: IncomingFile, sourcePath: string): Promise<string> {
  const originalName = sanitizeFileName(fallbackOriginalName(file)) || `attachment.${resolvedExtension(file)}`;
  const attachmentPath = await getAttachmentPath(app, originalName, sourcePath);
  const arrayBuffer = await file.blob.arrayBuffer();
  const created = await app.vault.createBinary(attachmentPath, arrayBuffer);
  return app.fileManager.generateMarkdownLink(created, sourcePath);
}

async function getAttachmentPath(app: App, fileName: string, sourcePath: string): Promise<string> {
  const fileManager = app.fileManager as typeof app.fileManager & {
    getAvailablePathForAttachment?: (filename: string, sourcePath?: string) => Promise<string>;
  };

  if (fileManager.getAvailablePathForAttachment) {
    return fileManager.getAvailablePathForAttachment(fileName, sourcePath);
  }

  const folder = getFallbackAttachmentFolder(app, sourcePath);
  const ext = resolvedExtension({ name: fileName, type: "" });
  const stem = fileName.toLowerCase().endsWith(`.${ext}`) ? fileName.slice(0, -ext.length - 1) : fileName;
  const basePath = folder ? `${folder}/${stem}` : stem;
  return getAvailableVaultPath(app, normalizePath(basePath), ext);
}

function getAvailableVaultPath(app: App, basePath: string, extension: string): string {
  let index = 0;
  while (true) {
    const suffix = index === 0 ? "" : ` ${index}`;
    const candidate = `${basePath}${suffix}.${extension}`;
    if (!app.vault.getAbstractFileByPath(candidate)) return candidate;
    index += 1;
  }
}

function getFallbackAttachmentFolder(app: App, sourcePath: string): string {
  const configured = (app.vault as unknown as { getConfig?: (key: string) => string | undefined }).getConfig?.(
    "attachmentFolderPath"
  );
  if (configured && configured !== "./" && configured !== "/") return normalizePath(configured).replace(/^\/+/, "");

  const source = app.vault.getAbstractFileByPath(sourcePath);
  if (source instanceof TFile && source.parent && source.parent.path !== "/") return source.parent.path;
  return "";
}
