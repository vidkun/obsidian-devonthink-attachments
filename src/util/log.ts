export class Logger {
  constructor(private readonly enabled: () => boolean) {}

  debug(message: string, ...details: unknown[]): void {
    if (!this.enabled()) return;
    console.debug(`[DEVONthink Attachments] ${message}`, ...details);
  }

  warn(message: string, ...details: unknown[]): void {
    console.warn(`[DEVONthink Attachments] ${message}`, ...details);
  }
}
