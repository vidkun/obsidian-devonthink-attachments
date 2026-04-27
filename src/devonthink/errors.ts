export type DevonthinkErrorKind =
  | "not-installed"
  | "not-running"
  | "not-authorized"
  | "database-missing"
  | "timeout"
  | "bad-json"
  | "unknown";

export class DevonthinkError extends Error {
  constructor(
    message: string,
    public readonly kind: DevonthinkErrorKind,
    public readonly details = ""
  ) {
    super(message);
    this.name = "DevonthinkError";
  }
}

export function classifyDevonthinkError(message: string): DevonthinkError {
  const lower = message.toLowerCase();
  if (message.includes("-1743") || lower.includes("not authorized")) {
    return new DevonthinkError(
      "Obsidian is not authorized to control DEVONthink.",
      "not-authorized",
      message
    );
  }

  if (message.includes("-1728") || lower.includes("can't get application")) {
    return new DevonthinkError("DEVONthink is not installed or cannot be opened.", "not-installed", message);
  }

  if (lower.includes("devonthink is not running")) {
    return new DevonthinkError("DEVONthink is not running.", "not-running", message);
  }

  if (lower.includes("database not found")) {
    return new DevonthinkError(message, "database-missing", message);
  }

  return new DevonthinkError(message, "unknown", message);
}

export function userMessageForError(error: unknown): string {
  if (error instanceof DevonthinkError) {
    if (error.kind === "not-authorized") {
      return "Obsidian needs permission to control DEVONthink. Open System Settings -> Privacy & Security -> Automation, find Obsidian, and enable DEVONthink 3.";
    }
    return error.message;
  }

  return error instanceof Error ? error.message : String(error);
}
