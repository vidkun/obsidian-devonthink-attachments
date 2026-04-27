export type FailureMode = "default-paste" | "abort-with-notice";
export type DevonthinkLinkBehavior = "open-item" | "reveal-item";

export interface PluginSettings {
  targetDatabase: string;
  targetGroupPath: string;
  devonthinkAppName: string;
  launchOnDemand: boolean;
  failureMode: FailureMode;
  enableOnPaste: boolean;
  enableOnDrop: boolean;
  writeObsidianUrlToDevonthink: boolean;
  devonthinkLinkBehavior: DevonthinkLinkBehavior;
  namingTemplate: string;
  imageLinkTemplate: string;
  pdfLinkTemplate: string;
  autoTagWithNoteName: boolean;
  staticTags: string[];
  noteExclusionFrontmatterKey: string;
  debugLogging: boolean;
  keepTempFilesOnError: boolean;
}

export interface IncomingFile {
  blob: Blob;
  name: string;
  type: string;
  lastModified?: number;
}

export interface TemplateContext {
  name: string;
  uuid: string;
  url: string;
  database: string;
  location: string;
  ext: string;
  date: string;
  time: string;
  note: string;
  original: string;
}

export interface ImportResult {
  uuid: string;
  name: string;
  database: string;
  location: string;
  sourceUrlField?: string | null;
}

export interface DevonthinkDatabase {
  name: string;
  uuid: string;
  path: string;
}
