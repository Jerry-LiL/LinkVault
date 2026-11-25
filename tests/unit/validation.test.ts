import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLinkSchema, loginSchema, registerSchema } from "../../lib/validation";

describe("createLinkSchema", () => {
  it("accepts a url, an optional slug, and a datetime-local expiry", () => {
    const parsed = createLinkSchema.parse({
      destination: " https://example.com/docs ",
      slug: "Hand-Book",
      title: " Docs ",
      expiresAt: "2026-12-01T15:30",
    });
    assert.equal(parsed.destination, "https://example.com/docs");
    assert.equal(parsed.slug, "hand-book");
    assert.equal(parsed.title, "Docs");
    assert.equal(parsed.expiresAt, "2026-12-01T15:30:00.000Z");
  });

  it("treats blank optional fields as absent", () => {
    const parsed = createLinkSchema.parse({
      destination: "https://example.com",
      slug: "  ",
      title: "",
      expiresAt: "",
    });
    assert.equal(parsed.slug, undefined);
    assert.equal(parsed.title, undefined);
    assert.equal(parsed.expiresAt, undefined);
  });

  it("rejects non-http urls and unusable slugs", () => {
    assert.equal(createLinkSchema.safeParse({ destination: "javascript:alert(1)" }).success, false);
    assert.equal(createLinkSchema.safeParse({ destination: "ftp://files.example/a" }).success, false);
    assert.equal(
      createLinkSchema.safeParse({ destination: "https://example.com", slug: "no" }).success,
      false,
    );
    assert.equal(
      createLinkSchema.safeParse({ destination: "https://example.com", expiresAt: "tomorrow" }).success,
      false,
    );
  });
});

describe("account schemas", () => {
  it("normalizes email and requires a password of 8 characters", () => {
    const registered = registerSchema.parse({
      name: " Ada ",
      email: "Ada@Example.com",
      password: "correct-horse",
    });
    assert.equal(registered.email, "ada@example.com");
    assert.equal(registered.name, "Ada");
    assert.equal(registerSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "short" }).success, false);
    assert.equal(loginSchema.parse({ email: "A@B.co", password: "x" }).email, "a@b.co");
  });
});
