import assert from "node:assert/strict";
import test from "node:test";
import { formatDevonthinkItemUrl, formatLink } from "../src/pipeline/linkFormat";

test("formats DEVONthink links with template variables", () => {
  const result = {
    uuid: "ABC-123",
    name: "Scan.pdf",
    database: "Research",
    location: "/Inbox/Obsidian/Scan.pdf"
  };
  const file = { blob: new Blob(["x"]), name: "Scan.pdf", type: "application/pdf" };

  assert.equal(
    formatLink("[${name}](${url}) ${database} ${ext}", result, file, "Note", "open-item", new Date("2026-04-27T15:04:05")),
    "[Scan.pdf](x-devonthink-item://ABC-123) Research pdf"
  );
});

test("formats DEVONthink reveal URLs when configured", () => {
  assert.equal(formatDevonthinkItemUrl("ABC-123", "open-item"), "x-devonthink-item://ABC-123");
  assert.equal(
    formatDevonthinkItemUrl("ABC-123", "reveal-item"),
    "obsidian://devonthink-attachments-reveal?ABC-123"
  );
});
