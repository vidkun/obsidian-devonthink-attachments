import assert from "node:assert/strict";
import test from "node:test";
import { extensionFromMime, getExtension, isPdf, isSupportedFile, resolvedExtension } from "../src/util/mime";

test("detects supported files by MIME type", () => {
  assert.equal(isSupportedFile({ name: "clipboard", type: "image/png" }), true);
  assert.equal(isSupportedFile({ name: "scan", type: "application/pdf" }), true);
  assert.equal(isSupportedFile({ name: "note.txt", type: "text/plain" }), false);
});

test("falls back to supported extensions", () => {
  assert.equal(isSupportedFile({ name: "photo.heic", type: "" }), true);
  assert.equal(isSupportedFile({ name: "diagram.svg", type: "" }), true);
  assert.equal(isSupportedFile({ name: "document.pdf", type: "" }), true);
  assert.equal(isSupportedFile({ name: "archive.zip", type: "" }), false);
});

test("resolves extensions from names and MIME types", () => {
  assert.equal(getExtension("Example.PNG"), "png");
  assert.equal(extensionFromMime("image/svg+xml"), "svg");
  assert.equal(resolvedExtension({ name: "clipboard", type: "image/jpeg" }), "jpg");
  assert.equal(isPdf({ name: "paper.pdf", type: "" }), true);
});
