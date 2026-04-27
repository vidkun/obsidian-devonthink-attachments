import type { DevonthinkLinkBehavior, ImportResult, TemplateContext } from "../types";
import { resolvedExtension } from "../util/mime";
import type { IncomingFile } from "../types";
import { applyTemplate, formatDate, formatTime } from "./template";

export function formatLink(
  template: string,
  result: ImportResult,
  file: IncomingFile,
  noteName: string,
  linkBehavior: DevonthinkLinkBehavior = "open-item",
  date = new Date()
): string {
  const url = formatDevonthinkItemUrl(result.uuid, linkBehavior);
  const context: TemplateContext = {
    name: result.name,
    uuid: result.uuid,
    url,
    database: result.database,
    location: result.location,
    ext: resolvedExtension(file),
    date: formatDate(date),
    time: formatTime(date),
    note: noteName,
    original: file.name
  };
  return applyTemplate(template, context);
}

export function formatDevonthinkItemUrl(uuid: string, linkBehavior: DevonthinkLinkBehavior): string {
  const baseUrl = `x-devonthink-item://${uuid}`;
  if (linkBehavior === "reveal-item") {
    return `obsidian://devonthink-attachments-reveal?${encodeURIComponent(uuid)}`;
  }
  return baseUrl;
}
