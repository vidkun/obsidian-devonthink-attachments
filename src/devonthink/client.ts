import { spawn } from "child_process";
import type { DevonthinkDatabase, ImportResult } from "../types";
import { DevonthinkError, classifyDevonthinkError } from "./errors";

interface ClientOptions {
  appName: string;
  timeoutMs?: number;
}

interface ImportOptions {
  path: string;
  database: string;
  groupPath: string;
  name: string;
  tags: string[];
  sourceUrl?: string;
  launchOnDemand: boolean;
}

export interface PingResult {
  running: boolean;
  version: string | null;
}

export interface RevealResult {
  ok: boolean;
  uuid: string;
  name: string;
}

export class DevonthinkClient {
  private readonly timeoutMs: number;

  constructor(private readonly options: ClientOptions) {
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  ping(): Promise<PingResult> {
    return this.runJXA<PingResult>(
      `
(() => {
  const dt = Application(ARGS.appName);
  const running = dt.running();
  const version = running ? dt.version() : null;
  return JSON.stringify({ running, version });
})();
`,
      {}
    );
  }

  listDatabases(launchOnDemand: boolean): Promise<DevonthinkDatabase[]> {
    return this.runJXA<DevonthinkDatabase[]>(
      `
(() => {
  const dt = Application(ARGS.appName);
  if (!dt.running()) {
    if (ARGS.launchOnDemand) dt.launch();
    else throw new Error('DEVONthink is not running');
  }
  const dbs = dt.databases().map(db => ({
    name: db.name(),
    uuid: db.uuid(),
    path: db.path()
  }));
  return JSON.stringify(dbs);
})();
`,
      { launchOnDemand }
    );
  }

  importFile(options: ImportOptions): Promise<ImportResult> {
    return this.runJXA<ImportResult>(
      `
(() => {
  const dt = Application(ARGS.appName);
  dt.includeStandardAdditions = true;
  if (!dt.running()) {
    if (ARGS.launchOnDemand) dt.launch();
    else throw new Error('DEVONthink is not running');
  }

  const dbs = dt.databases();
  const db = dbs.find(candidate => candidate.uuid() === ARGS.database || candidate.name() === ARGS.database);
  if (!db) throw new Error('Database not found: ' + ARGS.database);

  const group = dt.createLocation(ARGS.groupPath, { in: db });
  if (!group) throw new Error('Group could not be resolved: ' + ARGS.groupPath);

  const record = importIntoGroup(dt, ARGS.path, group);
  if (!record) throw new Error('Import returned null');

  if (ARGS.name) {
    record.name = ARGS.name;
  }

  if (ARGS.tags && ARGS.tags.length) {
    const existing = record.tags();
    record.tags = Array.from(new Set(existing.concat(ARGS.tags)));
  }

  const sourceUrlField = setSourceUrl(record, ARGS.sourceUrl);

  return JSON.stringify({
    uuid: record.uuid(),
    name: record.name(),
    database: db.name(),
    location: record.location(),
    sourceUrlField
  });

  function importIntoGroup(dt, path, group) {
    try {
      return dt.importPath(path, { to: group });
    } catch (importPathError) {
      try {
        return dt.import(path, { to: group });
      } catch (importError) {
        throw new Error(
          'DEVONthink import failed. importPath: ' +
            importPathError.message +
            '; import: ' +
            importError.message
        );
      }
    }
  }

  function setSourceUrl(record, sourceUrl) {
    if (!sourceUrl) return null;

    try {
      record.URL = sourceUrl;
      return 'URL';
    } catch (error) {
    }

    try {
      record.url = sourceUrl;
      return 'url';
    } catch (error) {
    }

    try {
      record.referenceUrl = sourceUrl;
      return 'referenceUrl';
    } catch (error) {
    }

    try {
      const currentComment = readValue(record.comment) || '';
      const prefix = currentComment ? currentComment + '\\n' : '';
      record.comment = prefix + 'Obsidian source: ' + sourceUrl;
      return 'comment';
    } catch (error) {
      return null;
    }
  }

  function readValue(value) {
    if (typeof value === 'function') return value();
    return value;
  }
})();
`,
      options
    );
  }

  revealRecord(uuid: string, launchOnDemand: boolean): Promise<RevealResult> {
    return this.runJXA<RevealResult>(
      `
(() => {
  const dt = Application(ARGS.appName);
  dt.includeStandardAdditions = true;
  if (!dt.running()) {
    if (ARGS.launchOnDemand) dt.launch();
    else throw new Error('DEVONthink is not running');
  }

  const record = dt.getRecordWithUuid(ARGS.uuid);
  if (!record) throw new Error('Record not found: ' + ARGS.uuid);

  const group = record.locationGroup();
  if (!group) throw new Error('Could not resolve location group for: ' + ARGS.uuid);

  const viewerWindows = dt.viewerWindows();
  if (viewerWindows.length > 0) {
    viewerWindows[0].root = group;
  } else {
    dt.openWindowFor({ record: group });
  }
  dt.activate();

  return JSON.stringify({
    ok: true,
    uuid: record.uuid(),
    name: record.name()
  });
})();
`,
      { uuid, launchOnDemand }
    );
  }

  private runJXA<T>(script: string, args: object): Promise<T> {
    return this.runOsaScript<T>("JavaScript", `const ARGS = ${JSON.stringify({ ...args, appName: this.options.appName })};\n${script}`);
  }

  private runOsaScript<T>(language: "JavaScript" | "AppleScript", script: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const child = spawn("osascript", ["-l", language]);
      let stdout = "";
      let stderr = "";
      let settled = false;

      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill();
        reject(new DevonthinkError("DEVONthink request timed out.", "timeout"));
      }, this.timeoutMs);

      child.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });
      child.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });
      child.on("error", error => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(classifyDevonthinkError(error.message));
      });
      child.on("close", code => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);

        if (code !== 0) {
          reject(classifyDevonthinkError(stderr || stdout || `osascript exited ${code}`));
          return;
        }

        try {
          resolve(JSON.parse(stdout.trim()) as T);
        } catch {
          reject(new DevonthinkError(`Bad JXA output: ${stdout}`, "bad-json", stderr));
        }
      });

      child.stdin.write(script);
      child.stdin.end();
    });
  }
}
