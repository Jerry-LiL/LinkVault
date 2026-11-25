import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isHttps, originFromRequest } from "../../lib/request";

describe("isHttps", () => {
  it("follows the forwarded protocol, then the request url", () => {
    const httpRequest = new Request("http://localhost:3000/api/auth/login");
    assert.equal(isHttps(httpRequest), false);

    const forwarded = new Request("http://localhost:3000/api/auth/login", {
      headers: { "x-forwarded-proto": "https" },
    });
    assert.equal(isHttps(forwarded), true);

    const direct = new Request("https://links.example/api/auth/login");
    assert.equal(isHttps(direct), true);
  });
});

describe("originFromRequest", () => {
  it("uses the host header when the request url points at localhost", () => {
    const request = new Request("http://localhost:3000/api/links", {
      headers: { host: "127.0.0.1:3000" },
    });
    assert.equal(originFromRequest(request), "http://127.0.0.1:3000");
  });

  it("prefers the forwarded host and protocol", () => {
    const request = new Request("http://localhost:3000/api/links", {
      headers: {
        host: "127.0.0.1:3000",
        "x-forwarded-host": "links.example",
        "x-forwarded-proto": "https",
      },
    });
    assert.equal(originFromRequest(request), "https://links.example");
  });
});