import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeReferrer } from "../../lib/referrer";

describe("normalizeReferrer", () => {
  it("keeps the host and drops a missing or unusable value", () => {
    assert.equal(normalizeReferrer(null), null);
    assert.equal(normalizeReferrer("  "), null);
    assert.equal(normalizeReferrer("not a url"), null);
    assert.equal(normalizeReferrer("javascript:alert(1)"), null);
    assert.equal(normalizeReferrer("https://WWW.News.Example/story"), "news.example");
    assert.equal(normalizeReferrer("https://chat.example/room"), "chat.example");
  });
});
