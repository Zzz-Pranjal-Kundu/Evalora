import test from "node:test";
import assert from "node:assert/strict";

test("gateway sanity", () => {
  assert.equal(typeof fetch, "function");
});
