import assert from "node:assert/strict";
import test from "node:test";
import { buildObsidianNoteUrl } from "../src/pipeline/sourceUrl";

test("builds encoded Obsidian note URLs", () => {
  const app = {
    vault: {
      getName: () => "Knowledge Vault"
    }
  };
  const file = {
    path: "Projects/DEVONthink Attachments.md"
  };

  assert.equal(
    buildObsidianNoteUrl(app as never, file as never),
    "obsidian://open?vault=Knowledge%20Vault&file=Projects%2FDEVONthink%20Attachments.md"
  );
});
