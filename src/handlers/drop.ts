import type { Editor, MarkdownView } from "obsidian";
import type DevonthinkAttachmentsPlugin from "../main";
import { processIncomingFiles } from "../pipeline/process";
import { filesFromDrop } from "./files";

export function handleDrop(plugin: DevonthinkAttachmentsPlugin, event: DragEvent, editor: Editor, view: MarkdownView): void {
  if (!plugin.settings.enableOnDrop || !plugin.canHandleView(view)) return;

  const files = filesFromDrop(event, plugin.logger);
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
