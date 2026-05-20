import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

test("bcrypt hash and compare", async () => {
  const h = await bcrypt.hash("password123", 4);
  assert.ok(await bcrypt.compare("password123", h));
  assert.equal(await bcrypt.compare("wrong", h), false);
});
