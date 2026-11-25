import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { linkStatus } from "../../lib/expiry";
import { alignWindow } from "../../lib/quota";
import { fillDailySeries } from "../../lib/series";

describe("alignWindow", () => {
  it("floors the timestamp to the start of the window", () => {
    const start = alignWindow(new Date("2026-11-25T18:47:12.000Z"), 3600);
    assert.equal(start.toISOString(), "2026-11-25T18:00:00.000Z");
  });
});

describe("fillDailySeries", () => {
  it("fills missing days and keeps the ones the query returned", () => {
    const now = new Date("2026-11-25T18:00:00.000Z");
    const points = fillDailySeries(
      [{ day: new Date("2026-11-25T00:00:00.000Z"), count: 4 }],
      3,
      now,
    );
    assert.deepEqual(
      points.map((point) => point.day),
      ["2026-11-23", "2026-11-24", "2026-11-25"],
    );
    assert.deepEqual(
      points.map((point) => point.count),
      [0, 0, 4],
    );
  });
});

describe("linkStatus", () => {
  it("treats a past expiry as expired and a missing one as active", () => {
    const now = new Date("2026-11-25T00:00:00.000Z");
    assert.equal(linkStatus(null, now), "active");
    assert.equal(linkStatus(new Date("2026-11-26T00:00:00.000Z"), now), "active");
    assert.equal(linkStatus(new Date("2026-11-24T00:00:00.000Z"), now), "expired");
    assert.equal(linkStatus(now, now), "expired");
  });
});
