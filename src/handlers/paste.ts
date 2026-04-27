import type { Editor, MarkdownView } from "obsidian";
import type DevonthinkAttachmentsPlugin from "../main";
import { filesFromClipboard } from "./files";
import { processIncomingFiles } from "../pipeline/process";

export function handlePaste(plugin: DevonthinkAttachmentsPlugin, event: ClipboardEvent, editor: Editor, view: MarkdownView): void {
  if (!plugin.settings.enableOnPaste || !plugin.canHandleView(view)) return;

  const files = filesFromClipboard(event, plugin.logger);
  if (!files.length) return;

  event.preventDefault();
  void processIncomingFiles({
    app: plugin.app,
    editor,
    view,
    files,
    settings: plugin.settings,
    client: plugin.getClient(),
    logger: plugin.logger
  });
}
