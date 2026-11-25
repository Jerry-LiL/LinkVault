import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword, verifyPassword } from "../../lib/password";

describe("passwords", () => {
  it("round-trips a password and rejects a different one", async () => {
    const stored = await hashPassword("correct-horse");
    assert.equal(stored.startsWith("scrypt$"), true);
    assert.equal(await verifyPassword("correct-horse", stored), true);
    assert.equal(await verifyPassword("wrong-horse", stored), false);
    assert.equal(await verifyPassword("correct-horse", "nope"), false);
  });
});
