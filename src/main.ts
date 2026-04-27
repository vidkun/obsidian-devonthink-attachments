import { MarkdownView, Notice, Plugin } from "obsidian";
import { DevonthinkClient } from "./devonthink/client";
import { handleDrop } from "./handlers/drop";
import { handlePaste } from "./handlers/paste";
import { DEFAULT_SETTINGS, DevonthinkAttachmentsSettingTab, type SettingsHost } from "./settings";
import type { PluginSettings } from "./types";
import { Logger } from "./util/log";

export default class DevonthinkAttachmentsPlugin extends Plugin implements SettingsHost {
  settings: PluginSettings = { ...DEFAULT_SETTINGS };
  readonly logger = new Logger(() => this.settings.debugLogging);
  private client: DevonthinkClient | null = null;
  private clientAppName = "";

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addSettingTab(new DevonthinkAttachmentsSettingTab(this.app, this));
    this.registerObsidianProtocolHandler("devonthink-attachments-reveal", async params => {
      const uuid = extractDevonthinkUuid(params);
      if (!uuid) {
        new Notice("DEVONthink Attachments could not reveal an item because the link is missing a UUID.", 8000);
        return;
      }

      try {
        const result = await this.getClient().revealRecord(uuid, this.settings.launchOnDemand);
        new Notice(`Opened containing group for ${result.name} in DEVONthink.`, 4000);
      } catch (error) {
        new Notice(error instanceof Error ? error.message : String(error), 8000);
      }
    });

    this.registerEvent(
      this.app.workspace.on("editor-paste", (event: ClipboardEvent, editor, view) => {
        if (view instanceof MarkdownView) handlePaste(this, event, editor, view);
      })
    );

    this.registerEvent(
      this.app.workspace.on("editor-drop", (event: DragEvent, editor, view) => {
        if (view instanceof MarkdownView) handleDrop(this, event, editor, view);
      })
    );

    this.addCommand({
      id: "test-devonthink-connection",
      name: "Test DEVONthink connection",
      callback: async () => {
        const started = performance.now();
        try {
          const result = await this.getClient().ping();
          const elapsed = Math.round(performance.now() - started);
          const status = result.running ? `running, version ${result.version ?? "unknown"}` : "not running";
          new Notice(`DEVONthink is ${status}. Round trip: ${elapsed}ms.`, 8000);
        } catch (error) {
          new Notice(error instanceof Error ? error.message : String(error), 8000);
        }
      }
    });

    this.addCommand({
      id: "list-devonthink-databases",
      name: "List DEVONthink databases",
      callback: async () => {
        try {
          const databases = await this.getClient().listDatabases(this.settings.launchOnDemand);
          if (!databases.length) {
            new Notice("No DEVONthink databases found.", 6000);
            return;
          }
          console.table(databases);
          new Notice(`Found ${databases.length} DEVONthink database(s). See developer console for details.`, 8000);
        } catch (error) {
          new Notice(error instanceof Error ? error.message : String(error), 8000);
        }
      }
    });
  }

  onunload(): void {
    this.client = null;
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<PluginSettings> | null;
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...loaded,
      staticTags: Array.isArray(loaded?.staticTags) ? loaded.staticTags : DEFAULT_SETTINGS.staticTags,
      devonthinkLinkBehavior: loaded?.devonthinkLinkBehavior ?? DEFAULT_SETTINGS.devonthinkLinkBehavior
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  getClient(): DevonthinkClient {
    if (!this.client || this.clientAppName !== this.settings.devonthinkAppName) {
      this.clientAppName = this.settings.devonthinkAppName;
      this.client = new DevonthinkClient({ appName: this.settings.devonthinkAppName });
    }
    return this.client;
  }

  canHandleView(view: MarkdownView): boolean {
    if (!view.file) return false;

    const key = this.settings.noteExclusionFrontmatterKey.trim();
    if (!key) return true;

    const frontmatter = this.app.metadataCache.getFileCache(view.file)?.frontmatter;
    const value = frontmatter?.[key];
    return value !== false && value !== "false";
  }
}

const DEVONTHINK_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractDevonthinkUuid(params: Record<string, string | "true">): string {
  for (const key of ["id", "item", "record", "dtid", "uuid"]) {
    const value = params[key];
    if (typeof value === "string" && DEVONTHINK_UUID_PATTERN.test(value)) return value;
  }

  for (const key of Object.keys(params)) {
    if (DEVONTHINK_UUID_PATTERN.test(key)) return key;
  }

  return "";
}
