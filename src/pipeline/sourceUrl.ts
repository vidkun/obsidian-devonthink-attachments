import type { App, TFile } from "obsidian";

export function buildObsidianNoteUrl(app: App, file: TFile | null): string {
  if (!file) return "";

  const vault = encodeURIComponent(app.vault.getName());
  const path = encodeURIComponent(file.path);
  return `obsidian://open?vault=${vault}&file=${path}`;
}
