import { expect, test, type Page } from "@playwright/test";

async function register(page: Page) {
  const email = `ada-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Name").fill("Ada");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe.configure({ timeout: 60_000 });

test("a short link redirects and the visit shows up in analytics", async ({ page }) => {
  await register(page);
  const slug = `docs-${Date.now().toString(36)}`;

  await page.getByLabel("Destination").fill("http://127.0.0.1:3000/arrived");
  await page.getByLabel("Custom slug").fill(slug);
  await page.getByRole("button", { name: "Create short link" }).click();
  await expect(page.getByRole("status").getByRole("link", { name: `/${slug}`, exact: true })).toBeVisible();

  const recorded = await page.request.get(`/${slug}`, {
    maxRedirects: 0,
    headers: {
      referer: "https://news.example/story",
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    },
  });
  expect(recorded.status()).toBe(302);
  expect(recorded.headers().location).toBe("http://127.0.0.1:3000/arrived");

  await page.goto(`/${slug}`);
  await expect(page).toHaveURL("http://127.0.0.1:3000/arrived");
  await expect(page.getByRole("heading", { name: "You arrived." })).toBeVisible();

  await page.goto(`/dashboard/links/${slug}`);
  await expect(page.getByTestId("total-clicks")).toHaveText("2");
  await expect(page.getByTestId("device-mobile")).toBeVisible();
  await expect(page.getByTestId("referrer-news.example")).toBeVisible();
});

test("an expired link does not redirect", async ({ page }) => {
  await register(page);
  const slug = `old-${Date.now().toString(36)}`;

  await page.getByLabel("Destination").fill("http://127.0.0.1:3000/arrived");
  await page.getByLabel("Custom slug").fill(slug);
  await page.getByLabel("Expiry (UTC)").fill("2020-01-01T00:00");
  await page.getByRole("button", { name: "Create short link" }).click();
  await expect(page.getByRole("status").getByRole("link", { name: `/${slug}`, exact: true })).toBeVisible();

  const response = await page.request.get(`/${slug}`, { maxRedirects: 0 });
  expect(response.status()).toBe(410);
  expect(await response.text()).toContain("Link expired");
});

test("link creation is limited per account", async ({ page }) => {
  await register(page);

  for (let index = 0; index < 5; index += 1) {
    const slug = `cap-${Date.now().toString(36)}-${index}`;
    await page.getByLabel("Destination").fill(`https://example.com/item-${index}`);
    await page.getByLabel("Custom slug").fill(slug);
    await page.getByRole("button", { name: "Create short link" }).click();
    await expect(page.getByRole("status").getByRole("link", { name: `/${slug}`, exact: true })).toBeVisible();
  }

  await page.getByLabel("Destination").fill("https://example.com/overflow");
  await page.getByLabel("Custom slug").fill(`overflow-${Date.now().toString(36)}`);
  await page.getByRole("button", { name: "Create short link" }).click();
  await expect(page).toHaveURL(/error=rate_limited/);
  await expect(page.getByRole("alert")).toContainText(/too many links/i);
});

test("an unknown slug is a not-found", async ({ request }) => {
  const response = await request.get("/missing-slug-xyz", { maxRedirects: 0 });
  expect(response.status()).toBe(404);
});
