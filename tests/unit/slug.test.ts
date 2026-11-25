import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SLUG_LENGTH, generateSlug, isReservedSlug } from "../../lib/slug";

describe("generateSlug", () => {
  it("uses the unbiased alphabet and the default length", () => {
    const alphabet = "abcdefghijkmnopqrstuvwxyz23456789";
    for (let i = 0; i < 30; i++) {
      const slug = generateSlug();
      assert.equal(slug.length, SLUG_LENGTH);
      for (const char of slug) assert.equal(alphabet.includes(char), true);
    }
  });

  it("honors a requested length", () => {
    assert.equal(generateSlug(10).length, 10);
  });
});

describe("reserved slugs", () => {
  it("blocks routes the app already owns", () => {
    assert.equal(isReservedSlug("dashboard"), true);
    assert.equal(isReservedSlug("arrived"), true);
    assert.equal(isReservedSlug("handbook"), false);
  });
});
