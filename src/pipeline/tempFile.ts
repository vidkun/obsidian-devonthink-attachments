import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";
import type { IncomingFile } from "../types";
import { resolvedExtension } from "../util/mime";
import { fallbackOriginalName, sanitizeFileName } from "./naming";

export interface TempFile {
  path: string;
  originalName: string;
}

export async function writeTempFile(file: IncomingFile): Promise<TempFile> {
  const originalName = fallbackOriginalName(file);
  const safeName = sanitizeFileName(originalName) || `attachment.${resolvedExtension(file)}`;
  const tempPath = path.join(os.tmpdir(), `obsidian-dt-paste-${randomUUID()}-${safeName}`);
  const bytes = Buffer.from(await file.blob.arrayBuffer());
  await fs.writeFile(tempPath, bytes);
  return { path: tempPath, originalName };
}

export async function cleanupTempFile(tempPath: string, keep: boolean): Promise<void> {
  if (keep) return;
  try {
    await fs.unlink(tempPath);
  } catch {
    // Best-effort cleanup only.
  }
}
