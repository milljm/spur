import assert from "node:assert/strict";
import { test } from "node:test";
import {
  artifactsFromMessages,
  extractArtifacts,
  isFilename,
  parseFenceInfo,
} from "./artifacts.ts";

test("plain language fences are not files", () => {
  assert.equal(isFilename("python"), false);
  assert.equal(parseFenceInfo("python").file, null);
  assert.equal(extractArtifacts("```python\nprint(1)\n```").length, 0);
});

test("info-string filenames are harvested", () => {
  const a = extractArtifacts("```python app.py\nprint(1)\n```");
  assert.equal(a[0]?.file, "app.py");
  assert.equal(a[0]?.text, "print(1)");
  assert.equal(parseFenceInfo("js:src/main.ts").file, "src/main.ts");
  assert.equal(parseFenceInfo('filename="notes.md"').file, "notes.md");
});

test("heading before a fence names the file", () => {
  const a = extractArtifacts("**lib.rs**\n```rust\nfn main() {}\n```");
  assert.equal(a[0]?.file, "lib.rs");
});

test("latest assistant file of the same name wins", () => {
  const list = artifactsFromMessages([
    { role: "assistant", content: "```txt a.txt\none\n```" },
    { role: "user", content: "again" },
    { role: "assistant", content: "```txt a.txt\ntwo\n```" },
  ]);
  assert.equal(list.length, 1);
  assert.equal(list[0]?.text, "two");
});
