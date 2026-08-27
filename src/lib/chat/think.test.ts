import assert from "node:assert/strict";
import { test } from "node:test";
import { feedThink } from "./think.ts";

test("splits think tags out of the visible answer", () => {
  const state = { inThink: false };
  const a = feedThink("Hello <think>secret", state);
  assert.equal(a.content, "Hello ");
  assert.equal(a.reasoning, "secret");
  assert.equal(state.inThink, true);
  const b = feedThink(" plan</think>\n```js\n1\n```", state);
  assert.equal(b.reasoning, " plan");
  assert.equal(b.content, "\n```js\n1\n```");
  assert.equal(state.inThink, false);
});

test("plain tokens pass through", () => {
  const state = { inThink: false };
  const a = feedThink("no tags here", state);
  assert.equal(a.content, "no tags here");
  assert.equal(a.reasoning, "");
});
