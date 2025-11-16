import type { Page } from "@playwright/test";

/**
 * Seed data created by global.setup.ts
 * This data is available for all tests to use
 */
export const SEED_DATA = {
  regions: ["Uji", "Kagoshima", "Shizuoka", "Nishio"],
  brands: ["Ippodo", "Marukyu Koyamaen", "Hibiki-an", "Aiya"],
  blends: [
    { name: "Ummon-no-mukashi", brand: "Ippodo", region: "Uji" },
    { name: "Kusurinoki", brand: "Marukyu Koyamaen", region: "Uji" },
    { name: "Premium Ceremonial", brand: "Ippodo", region: "Kagoshima" },
    { name: "Organic Matcha", brand: "Marukyu Koyamaen", region: "Shizuoka" },
  ],
  sampleTastingNote: {
    blend: "Ummon-no-mukashi",
    brand: "Ippodo",
    region: "Uji",
    overallRating: 5,
    umami: 5,
    bitter: 2,
    sweet: 4,
    foam: 5,
    notesKoicha: "Rich, creamy texture with deep umami. Excellent balance of flavors.",
    notesMilk: "Smooth and pleasant. Pairs beautifully with oat milk.",
    pricePln: 150,
    purchaseSource: "https://ippodo-tea.co.jp",
  },
};

/**
 * Helper function to login a user during E2E tests
 * @param page - Playwright page object
 * @param email - User email (defaults to E2E_USERNAME_WITH_DATA from .env.test)
 * @param password - User password (defaults to E2E_PASSWORD_WITH_DATA from .env.test)
 */
export async function loginUser(
  page: Page,
  email = process.env.E2E_USERNAME_WITH_DATA || "with-data@e2e.com",
  password = process.env.E2E_PASSWORD_WITH_DATA || "Test123!"
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /log in/i }).click();
  await page.waitForURL(/\/dashboard/);
}

/**
 * Helper function to create a test tasting note
 * @param page - Playwright page object
 * @param brand - Matcha brand name
 * @param blend - Matcha blend name
 * @param rating - Star rating (1-5)
 */
export async function createTasting(page: Page, brand = "Test Brand", blend = "Test Blend", rating = 5) {
  await page.getByRole("button", { name: /add new tasting/i }).click();
  await page.waitForURL(/\/tastings\/new/);

  await page.getByLabel(/brand/i).fill(brand);
  await page.getByLabel(/blend/i).fill(blend);

  // Click the appropriate star for rating
  const stars = page.getByRole("button").filter({ hasText: "★" });
  await stars.nth(rating - 1).click();

  await page.getByRole("button", { name: /save tasting/i }).click();
  await page.waitForURL(/\/dashboard/);
}

/**
 * Helper function to logout a user
 * @param page - Playwright page object
 */
export async function logoutUser(page: Page) {
  await page.getByRole("button", { name: /logout/i }).click();
  await page.waitForURL(/\/login/);
}
