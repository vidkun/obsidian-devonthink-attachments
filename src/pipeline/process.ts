import { Notice } from "obsidian";
import type { App, Editor, MarkdownView } from "obsidian";
import type { DevonthinkClient } from "../devonthink/client";
import { userMessageForError } from "../devonthink/errors";
import type { IncomingFile, PluginSettings } from "../types";
import { Logger } from "../util/log";
import { isPdf } from "../util/mime";
import { showErrorNotice } from "../util/notice";
import { fallbackToVaultAttachment } from "./fallback";
import { formatLink } from "./linkFormat";
import { resolveName } from "./naming";
import { buildObsidianNoteUrl } from "./sourceUrl";
import { cleanupTempFile, writeTempFile } from "./tempFile";

interface ProcessContext {
  app: App;
  editor: Editor;
  view: MarkdownView;
  files: IncomingFile[];
  settings: PluginSettings;
  client: DevonthinkClient;
  logger: Logger;
}

export async function processIncomingFiles(context: ProcessContext): Promise<void> {
  const { app, editor, view, files, settings, client, logger } = context;
  const sourcePath = view.file?.path ?? "";
  const noteName = view.file?.basename ?? "Untitled";
  const sourceUrl = settings.writeObsidianUrlToDevonthink ? buildObsidianNoteUrl(app, view.file) : "";
  const links: string[] = [];
  let devonthinkImports = 0;
  let fallbackImports = 0;

  if (!settings.targetDatabase.trim()) {
    new Notice("DEVONthink Attachments needs a target database in settings before it can import.", 8000);
    if (settings.failureMode === "abort-with-notice") return;
  }

  for (const file of files) {
    let tempPath: string | null = null;
    try {
      const temp = await writeTempFile(file);
      tempPath = temp.path;
      const desiredName = resolveName(settings.namingTemplate, file, noteName);
      const result = await client.importFile({
        path: temp.path,
        database: settings.targetDatabase,
        groupPath: settings.targetGroupPath,
        name: desiredName,
        tags: buildTags(settings, noteName),
        sourceUrl,
        launchOnDemand: settings.launchOnDemand
      });
      const template = isPdf(file) ? settings.pdfLinkTemplate : settings.imageLinkTemplate;
      links.push(formatLink(template, result, file, noteName, settings.devonthinkLinkBehavior));
      devonthinkImports += 1;
      await cleanupTempFile(temp.path, false);
      tempPath = null;
    } catch (error) {
      logger.warn("DEVONthink import failed", error);
      if (tempPath) await cleanupTempFile(tempPath, settings.keepTempFilesOnError || settings.debugLogging);

      if (settings.failureMode === "default-paste") {
        try {
          links.push(await fallbackToVaultAttachment(app, file, sourcePath));
          fallbackImports += 1;
          showErrorNotice(
            app,
            `DEVONthink import failed, used Obsidian attachment fallback: ${userMessageForError(error)}`,
            error instanceof Error ? error.stack ?? error.message : String(error),
            8000
          );
        } catch (fallbackError) {
          showErrorNotice(
            app,
            `DEVONthink import and Obsidian fallback both failed: ${userMessageForError(fallbackError)}`,
            fallbackError instanceof Error ? fallbackError.stack ?? fallbackError.message : String(fallbackError)
          );
        }
      } else {
        showErrorNotice(app, userMessageForError(error), error instanceof Error ? error.stack ?? error.message : String(error));
      }
    }
  }

  if (links.length) {
    editor.replaceSelection(links.join("\n"));
    if (devonthinkImports > 0 && fallbackImports === 0) {
      new Notice(
        `Imported ${devonthinkImports} item${devonthinkImports === 1 ? "" : "s"} to DEVONthink -> ${settings.targetGroupPath}.`,
        5000
      );
    } else if (fallbackImports > 0) {
      new Notice(`Inserted ${links.length} link${links.length === 1 ? "" : "s"} with ${fallbackImports} fallback attachment(s).`, 5000);
    }
  }
}

function buildTags(settings: PluginSettings, noteName: string): string[] {
  const tags = new Set<string>();
  for (const tag of settings.staticTags) {
    if (tag.trim()) tags.add(tag.trim());
  }
  if (settings.autoTagWithNoteName && noteName.trim()) {
    tags.add(noteName.trim());
    const slug = noteName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (slug && slug !== noteName) tags.add(slug);
  }
  return [...tags];
}
