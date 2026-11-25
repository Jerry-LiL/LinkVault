import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyDevice } from "../../lib/device";

describe("classifyDevice", () => {
  it("recognizes the common classes", () => {
    assert.equal(classifyDevice(null), "desktop");
    assert.equal(classifyDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"), "desktop");
    assert.equal(
      classifyDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Mobile/15E148",
      ),
      "mobile",
    );
    assert.equal(classifyDevice("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"), "tablet");
    assert.equal(classifyDevice("Mozilla/5.0 (Linux; Android 14; Pixel Tablet)"), "tablet");
    assert.equal(classifyDevice("Mozilla/5.0 (Linux; Android 14; Pixel) Mobile"), "mobile");
    assert.equal(classifyDevice("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), "bot");
  });
});
