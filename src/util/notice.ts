import { Modal, Notice, type App } from "obsidian";

export function showErrorNotice(app: App, message: string, details?: string, timeout = 10000): void {
  const notice = new Notice(message, timeout);
  if (!details || details === message) return;

  const noticeEl = (notice as Notice & { noticeEl?: HTMLElement }).noticeEl;
  if (!noticeEl) return;

  const button = noticeEl.createEl("button", { text: "Show details" });
  button.addEventListener("click", () => {
    new ErrorDetailsModal(app, message, details).open();
  });
}

class ErrorDetailsModal extends Modal {
  constructor(app: App, private readonly message: string, private readonly details: string) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "DEVONthink Attachments error" });
    contentEl.createEl("p", { text: this.message });
    contentEl.createEl("pre", { text: this.details });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
