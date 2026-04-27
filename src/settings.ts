import { App, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import type { DevonthinkClient } from "./devonthink/client";
import type { PluginSettings } from "./types";

export const DEFAULT_SETTINGS: PluginSettings = {
  targetDatabase: "",
  targetGroupPath: "/Inbox/Obsidian",
  devonthinkAppName: "DEVONthink 3",
  launchOnDemand: true,
  failureMode: "default-paste",
  enableOnPaste: true,
  enableOnDrop: true,
  writeObsidianUrlToDevonthink: true,
  devonthinkLinkBehavior: "open-item",
  namingTemplate: "${note}-${date}-${time}-${original}",
  imageLinkTemplate: "[📎 ${name}](${url})",
  pdfLinkTemplate: "[📄 ${name}](${url})",
  autoTagWithNoteName: true,
  staticTags: [],
  noteExclusionFrontmatterKey: "dt-paste",
  debugLogging: false,
  keepTempFilesOnError: false
};

export interface SettingsHost extends Plugin {
  settings: PluginSettings;
  saveSettings(): Promise<void>;
  getClient(): DevonthinkClient;
}

export class DevonthinkAttachmentsSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly host: SettingsHost) {
    super(app, host);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "DEVONthink Attachments" });

    new Setting(containerEl)
      .setName("DEVONthink app name")
      .setDesc("Default is DEVONthink 3. Change only if a future DEVONthink release uses a different scripting application name.")
      .addText(text =>
        text
          .setPlaceholder("DEVONthink 3")
          .setValue(this.host.settings.devonthinkAppName)
          .onChange(async value => {
            this.host.settings.devonthinkAppName = value.trim() || DEFAULT_SETTINGS.devonthinkAppName;
            await this.host.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Target database")
      .setDesc("Database name or UUID. Use Refresh databases to populate choices from DEVONthink.")
      .addText(text =>
        text
          .setPlaceholder("Database name or UUID")
          .setValue(this.host.settings.targetDatabase)
          .onChange(async value => {
            this.host.settings.targetDatabase = value.trim();
            await this.host.saveSettings();
          })
      )
      .addButton(button =>
        button.setButtonText("Refresh databases").onClick(async () => {
          const buttonEl = button.buttonEl;
          const originalText = buttonEl.textContent ?? "Refresh databases";
          button.setButtonText("Loading...");
          try {
            const databases = await this.host.getClient().listDatabases(this.host.settings.launchOnDemand);
            this.showDatabasePicker(databases.map(db => `${db.name} (${db.uuid})`));
          } catch (error) {
            new Notice(error instanceof Error ? error.message : String(error), 8000);
          } finally {
            button.setButtonText(originalText);
          }
        })
      );

    new Setting(containerEl)
      .setName("Target group path")
      .setDesc("DEVONthink group path. It will be created if it does not already exist.")
      .addText(text =>
        text
          .setPlaceholder("/Inbox/Obsidian")
          .setValue(this.host.settings.targetGroupPath)
          .onChange(async value => {
            this.host.settings.targetGroupPath = value.trim() || DEFAULT_SETTINGS.targetGroupPath;
            await this.host.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Launch DEVONthink if needed")
      .addToggle(toggle =>
        toggle.setValue(this.host.settings.launchOnDemand).onChange(async value => {
          this.host.settings.launchOnDemand = value;
          await this.host.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Fallback behavior")
      .setDesc("Default paste writes the file to Obsidian's normal attachment location if DEVONthink import fails.")
      .addDropdown(dropdown =>
        dropdown
          .addOption("default-paste", "Default paste")
          .addOption("abort-with-notice", "Abort with notice")
          .setValue(this.host.settings.failureMode)
          .onChange(async value => {
            this.host.settings.failureMode = value as PluginSettings["failureMode"];
            await this.host.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Enable on paste")
      .addToggle(toggle =>
        toggle.setValue(this.host.settings.enableOnPaste).onChange(async value => {
          this.host.settings.enableOnPaste = value;
          await this.host.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Enable on drop")
      .addToggle(toggle =>
        toggle.setValue(this.host.settings.enableOnDrop).onChange(async value => {
          this.host.settings.enableOnDrop = value;
          await this.host.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Write Obsidian note URL to DEVONthink")
      .setDesc("Adds an obsidian:// link back to the source note, preferring the DEVONthink URL field.")
      .addToggle(toggle =>
        toggle.setValue(this.host.settings.writeObsidianUrlToDevonthink).onChange(async value => {
          this.host.settings.writeObsidianUrlToDevonthink = value;
          await this.host.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("DEVONthink link behavior")
      .setDesc("Choose whether inserted links open the item directly or open its containing group in DEVONthink.")
      .addDropdown(dropdown =>
        dropdown
          .addOption("open-item", "Open item")
          .addOption("reveal-item", "Open containing group")
          .setValue(this.host.settings.devonthinkLinkBehavior)
          .onChange(async value => {
            this.host.settings.devonthinkLinkBehavior = value as PluginSettings["devonthinkLinkBehavior"];
            await this.host.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Naming template")
      .setDesc("Supports ${note}, ${date}, ${time}, ${original}, ${ext}, and ${uuid}.")
      .addText(text =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.namingTemplate)
          .setValue(this.host.settings.namingTemplate)
          .onChange(async value => {
            this.host.settings.namingTemplate = value || DEFAULT_SETTINGS.namingTemplate;
            await this.host.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Image link template")
      .setDesc("Supports ${name}, ${uuid}, ${url}, ${database}, ${location}, ${ext}, ${date}, ${time}, ${note}, and ${original}.")
      .addText(text =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.imageLinkTemplate)
          .setValue(this.host.settings.imageLinkTemplate)
          .onChange(async value => {
            this.host.settings.imageLinkTemplate = value || DEFAULT_SETTINGS.imageLinkTemplate;
            await this.host.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("PDF link template")
      .setDesc("Supports the same variables as the image link template.")
      .addText(text =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.pdfLinkTemplate)
          .setValue(this.host.settings.pdfLinkTemplate)
          .onChange(async value => {
            this.host.settings.pdfLinkTemplate = value || DEFAULT_SETTINGS.pdfLinkTemplate;
            await this.host.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Auto-tag with note name")
      .addToggle(toggle =>
        toggle.setValue(this.host.settings.autoTagWithNoteName).onChange(async value => {
          this.host.settings.autoTagWithNoteName = value;
          await this.host.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Additional static tags")
      .setDesc("Comma-separated tags to add to every imported DEVONthink item.")
      .addText(text =>
        text
          .setPlaceholder("obsidian, inbox")
          .setValue(this.host.settings.staticTags.join(", "))
          .onChange(async value => {
            this.host.settings.staticTags = value
              .split(",")
              .map(tag => tag.trim())
              .filter(Boolean);
            await this.host.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Frontmatter opt-out key")
      .setDesc("When this key is false in note frontmatter, the plugin skips paste/drop handling.")
      .addText(text =>
        text
          .setPlaceholder("dt-paste")
          .setValue(this.host.settings.noteExclusionFrontmatterKey)
          .onChange(async value => {
            this.host.settings.noteExclusionFrontmatterKey = value.trim() || DEFAULT_SETTINGS.noteExclusionFrontmatterKey;
            await this.host.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Debug logging")
      .addToggle(toggle =>
        toggle.setValue(this.host.settings.debugLogging).onChange(async value => {
          this.host.settings.debugLogging = value;
          await this.host.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Keep temp files on error")
      .addToggle(toggle =>
        toggle.setValue(this.host.settings.keepTempFilesOnError).onChange(async value => {
          this.host.settings.keepTempFilesOnError = value;
          await this.host.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Test connection")
      .setDesc("Runs a no-op JXA ping against DEVONthink.")
      .addButton(button =>
        button.setButtonText("Test").setCta().onClick(async () => {
          const start = performance.now();
          try {
            const result = await this.host.getClient().ping();
            const elapsed = Math.round(performance.now() - start);
            const status = result.running ? `running, version ${result.version ?? "unknown"}` : "not running";
            new Notice(`DEVONthink is ${status}. Round trip: ${elapsed}ms.`, 8000);
          } catch (error) {
            new Notice(error instanceof Error ? error.message : String(error), 8000);
          }
        })
      );
  }

  private showDatabasePicker(options: string[]): void {
    if (!options.length) {
      new Notice("No DEVONthink databases found.", 6000);
      return;
    }

    const modal = this.containerEl.createDiv({ cls: "devonthink-attachments-setting-subtext" });
    modal.setText(`Databases: ${options.join(", ")}`);
    new Notice(`Found ${options.length} DEVONthink database(s). Copy the name or UUID into Target database.`, 8000);
  }
}
