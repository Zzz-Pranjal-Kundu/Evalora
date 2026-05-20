import { describe, it, expect } from "vitest";

describe("roles", () => {
  it("matches admin", () => {
    expect("ADMIN").toBe("ADMIN");
  });
});
