import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllowedFile, isImageFile } from "./attachments.ts";

function fake(name: string, type: string): File {
  return new File(["x"], name, { type });
}

test("empty MIME still allows images by extension (LAN / drag-drop)", () => {
  const png = fake("shot.png", "");
  assert.equal(isImageFile(png), true);
  assert.equal(isAllowedFile(png), true);
  assert.equal(isAllowedFile(fake("notes.md", "")), true);
  assert.equal(isAllowedFile(fake("photo.JPEG", "application/octet-stream")), true);
});

test("unknown binaries stay rejected", () => {
  assert.equal(isAllowedFile(fake("payload.bin", "")), false);
  assert.equal(isAllowedFile(fake("doc.docx", "")), false);
});
