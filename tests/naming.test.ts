import assert from "node:assert/strict";
import test from "node:test";
import { fallbackOriginalName, resolveName, sanitizeFileName } from "../src/pipeline/naming";

const fixedDate = new Date("2026-04-27T15:04:05");

test("sanitizes file names for filesystem and Obsidian link use", () => {
  assert.equal(sanitizeFileName('My: bad/file? name#[].png'), "My- bad-file- name-.png");
});

test("generates screenshot names for anonymous clipboard images", () => {
  const file = { blob: new Blob(["x"]), name: "image.png", type: "image/png" };
  assert.equal(fallbackOriginalName(file, fixedDate), "screenshot-20260427-150405.png");
});

test("resolves naming templates and preserves extension", () => {
  const file = { blob: new Blob(["x"]), name: "Scan.pdf", type: "application/pdf" };
  assert.equal(resolveName("${note}-${date}-${original}", file, "Project Note", "", fixedDate), "Project Note-20260427-Scan.pdf");
});
