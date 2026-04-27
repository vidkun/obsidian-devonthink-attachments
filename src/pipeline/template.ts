import type { TemplateContext } from "../types";

export function applyTemplate(template: string, context: Partial<TemplateContext>): string {
  return template.replace(/\$\{([a-zA-Z0-9_]+)\}/g, (match, key: keyof TemplateContext) => {
    const value = context[key];
    return value === undefined || value === null ? match : String(value);
  });
}

export function formatDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function formatTime(date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}${minutes}${seconds}`;
}
