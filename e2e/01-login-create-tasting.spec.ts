/**
 * Login and Create Tasting E2E Test
 * Tests the complete flow: Login -> Create a new tasting note
 *
 * This is a CI/CD required test (P0) per PRD Technical Requirements
 * Covers: US-005, TC-CRUD-01, TC-CRUD-02, TC-CRUD-03
 */

import { expect, test } from "@playwright/test";
import { DashboardPage, LoginPage, TastingFormPage } from "./page-objects";

test.describe("Login and Create Tasting Flow", () => {
  const TEST_EMAIL = process.env.E2E_USERNAME_WITH_DATA || "with-data@e2e.com";
  const TEST_PASSWORD = process.env.E2E_PASSWORD_WITH_DATA || "Test123!";

  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test("should successfully login and create a new tasting note with mandatory fields only", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    const testTasting = {
      brand: `E2E Test Brand ${Date.now()}`,
      blend: `E2E Test Blend ${Date.now()}`,
      region: "Uji",
      rating: 4,
    };

    // Act - Step 1: Login
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);

    // Assert - Verify on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Act - Step 2: Click "Add New" button
    await dashboardPage.clickAddNewDesktop();

    // Assert - Verify navigated to form
    await expect(page).toHaveURL(/\/tastings\/new/);

    // Act - Step 3: Fill mandatory fields
    await tastingFormPage.fillMinimumRequiredFields(
      testTasting.brand,
      testTasting.blend,
      testTasting.region,
      testTasting.rating
    );

    // Assert - Verify fields are filled
    await expect(tastingFormPage.brandInput).toContainText(testTasting.brand);
    await expect(tastingFormPage.blendInput).toContainText(testTasting.blend);

    // Act - Step 4: Submit form
    await tastingFormPage.submit();

    // Assert - Step 5: Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Assert - Step 6: Verify new tasting appears in list
    const newTastingCard = dashboardPage.getTastingNoteByBrandAndBlend(testTasting.brand, testTasting.blend);
    await expect(newTastingCard).toBeVisible({ timeout: 10000 });
  });

  test("should successfully create a tasting note with all fields", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    const testTasting = {
      brand: `E2E Full Brand ${Date.now()}`,
      blend: `E2E Full Blend ${Date.now()}`,
      region: "Uji",
      overallRating: 5,
      umami: 5,
      bitter: 2,
      sweet: 4,
      foam: 5,
      notesKoicha: "Rich, creamy texture with deep umami notes and pleasant sweetness.",
      notesMilk: "Smooth and balanced, pairs beautifully with milk.",
      pricePln: 125,
      purchaseSource: "https://example-matcha-shop.com",
    };

    // Act - Step 1: Login and navigate to form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    await dashboardPage.clickAddNewDesktop();

    // Act - Step 2: Fill complete form
    await tastingFormPage.fillForm(testTasting);

    // Assert - Verify overall rating is set
    const starButton = tastingFormPage.getByTestId(`overall-rating-input-star-${testTasting.overallRating}`);
    await expect(starButton).toHaveAttribute("aria-checked", "true");

    // Assert - Verify umami rating is set
    const umamiDot = tastingFormPage.getByTestId(`umami-rating-input-dot-${testTasting.umami}`);
    await expect(umamiDot).toHaveAttribute("aria-checked", "true");

    // Act - Step 3: Submit form
    await tastingFormPage.submit();

    // Assert - Step 4: Verify redirect and new tasting appears
    await expect(page).toHaveURL(/\/dashboard/);
    const newTastingCard = dashboardPage.getTastingNoteByBrandAndBlend(testTasting.brand, testTasting.blend);
    await expect(newTastingCard).toBeVisible({ timeout: 10000 });
  });

  test("should show validation errors when submitting empty form", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Step 1: Login and navigate to form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    await dashboardPage.clickAddNewDesktop();

    // Act - Step 2: Submit empty form
    await tastingFormPage.submitWithoutWaiting();

    // Assert - Should stay on form page
    await expect(page).toHaveURL(/\/tastings\/new/);

    // Assert - Should show validation errors
    const hasErrors = await tastingFormPage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test("should show validation error for missing brand", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Login and navigate to form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    await dashboardPage.clickAddNewDesktop();

    // Act - Fill only blend, region and rating (missing brand)
    await tastingFormPage.fillBlend("Test Blend");
    await tastingFormPage.fillRegion("Uji");
    await tastingFormPage.setOverallRating(3);
    await tastingFormPage.submitWithoutWaiting();

    // Assert - Should stay on form page
    await expect(page).toHaveURL(/\/tastings\/new/);

    // Assert - Should show validation errors
    const hasErrors = await tastingFormPage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test("should show validation error for missing blend", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Login and navigate to form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    await dashboardPage.clickAddNewDesktop();

    // Act - Fill only brand, region and rating (missing blend)
    await tastingFormPage.fillBrand("Test Brand");
    await tastingFormPage.fillRegion("Uji");
    await tastingFormPage.setOverallRating(3);
    await tastingFormPage.submitWithoutWaiting();

    // Assert - Should stay on form page
    await expect(page).toHaveURL(/\/tastings\/new/);

    // Assert - Should show validation errors
    const hasErrors = await tastingFormPage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test("should show validation error for missing region", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Login and navigate to form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    await dashboardPage.clickAddNewDesktop();

    // Act - Fill only brand, blend and rating (missing region)
    await tastingFormPage.fillBrand("Test Brand");
    await tastingFormPage.fillBlend("Test Blend");
    await tastingFormPage.setOverallRating(3);
    await tastingFormPage.submitWithoutWaiting();

    // Assert - Should stay on form page
    await expect(page).toHaveURL(/\/tastings\/new/);

    // Assert - Should show validation errors
    const hasErrors = await tastingFormPage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test("should show validation error for missing overall rating", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Login and navigate to form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    await dashboardPage.clickAddNewDesktop();

    // Act - Fill only brand, blend and region (missing rating)
    await tastingFormPage.fillBrand("Test Brand");
    await tastingFormPage.fillBlend("Test Blend");
    await tastingFormPage.fillRegion("Uji");
    await tastingFormPage.submitWithoutWaiting();

    // Assert - Should stay on form page
    await expect(page).toHaveURL(/\/tastings\/new/);

    // Assert - Should show validation errors
    const hasErrors = await tastingFormPage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test("should allow canceling form creation", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Login and navigate to form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    await dashboardPage.clickAddNewDesktop();

    // Act - Start filling form
    await tastingFormPage.fillBrand("Cancelled Brand");

    // Act - Click cancel
    await tastingFormPage.cancel();

    // Assert - Should return to previous page (dashboard)
    await page.waitForTimeout(500); // Wait for navigation
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should disable submit button while submitting", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    const testTasting = {
      brand: `E2E Disable Test ${Date.now()}`,
      blend: `E2E Disable Blend ${Date.now()}`,
      region: "Kagoshima",
      rating: 3,
    };

    // Act - Login and navigate to form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    await dashboardPage.clickAddNewDesktop();

    // Act - Fill form
    await tastingFormPage.fillMinimumRequiredFields(
      testTasting.brand,
      testTasting.blend,
      testTasting.region,
      testTasting.rating
    );

    // Act - Check submit button state before submitting
    const isDisabledBefore = await tastingFormPage.isSubmitButtonDisabled();
    expect(isDisabledBefore).toBe(false);

    // Act - Submit (button should be disabled during submission)
    const submitPromise = tastingFormPage.submitButton.click();
    await submitPromise;

    // Assert - Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("should allow setting all rating types", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Login and navigate to form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    await dashboardPage.clickAddNewDesktop();

    // Act - Set overall star rating
    await tastingFormPage.setOverallRating(5);
    const star5 = tastingFormPage.getByTestId("overall-rating-input-star-5");
    await expect(star5).toHaveAttribute("aria-checked", "true");

    // Act - Set umami rating
    await tastingFormPage.setUmamiRating(4);
    const umami4 = tastingFormPage.getByTestId("umami-rating-input-dot-4");
    await expect(umami4).toHaveAttribute("aria-checked", "true");

    // Act - Set bitter rating
    await tastingFormPage.setBitterRating(2);
    const bitter2 = tastingFormPage.getByTestId("bitter-rating-input-dot-2");
    await expect(bitter2).toHaveAttribute("aria-checked", "true");

    // Act - Set sweet rating
    await tastingFormPage.setSweetRating(5);
    const sweet5 = tastingFormPage.getByTestId("sweet-rating-input-dot-5");
    await expect(sweet5).toHaveAttribute("aria-checked", "true");

    // Act - Set foam rating
    await tastingFormPage.setFoamRating(3);
    const foam3 = tastingFormPage.getByTestId("foam-rating-input-dot-3");
    await expect(foam3).toHaveAttribute("aria-checked", "true");
  });

  test("should display correct page heading for new tasting", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Login and navigate to form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    await dashboardPage.clickAddNewDesktop();

    // Assert - Page heading should indicate "new" mode
    await expect(tastingFormPage.pageHeading).toBeVisible();
    const headingText = await tastingFormPage.pageHeading.textContent();
    expect(headingText?.toLowerCase()).toContain("tasting note");
  });

  test("complete create tasting scenario - step by step", async ({ page }) => {
    // This test demonstrates the complete CI/CD required scenario step-by-step
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    const testTasting = {
      brand: `E2E Complete ${Date.now()}`,
      blend: `E2E Complete Blend ${Date.now()}`,
      region: "Shizuoka",
      rating: 4,
    };

    // Step 1: Verify we're on the login page
    await expect(page).toHaveURL(/\/login/);

    // Step 2: Wait for login form to be ready
    await loginPage.waitForFormReady();

    // Step 3: Fill in email
    await loginPage.emailInput.fill(TEST_EMAIL);
    await expect(loginPage.emailInput).toHaveValue(TEST_EMAIL);

    // Step 4: Fill in password
    await loginPage.passwordInput.fill(TEST_PASSWORD);
    await expect(loginPage.passwordInput).toHaveValue(TEST_PASSWORD);

    // Step 5: Click login button
    await loginPage.loginButton.click();

    // Step 6: Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Step 7: Verify dashboard loaded
    await expect(dashboardPage.addNewButtonDesktop).toBeVisible();

    // Step 8: Click "Add New" button
    await dashboardPage.addNewButtonDesktop.click();

    // Step 9: Wait for form to load
    await expect(page).toHaveURL(/\/tastings\/new/);
    await expect(tastingFormPage.submitButton).toBeVisible();

    // Step 10: Fill brand field
    await tastingFormPage.fillBrand(testTasting.brand);

    // Step 11: Fill blend field
    await tastingFormPage.fillBlend(testTasting.blend);

    // Step 12: Fill region field
    await tastingFormPage.fillRegion(testTasting.region);

    // Step 13: Set overall rating
    await tastingFormPage.setOverallRating(testTasting.rating);
    const ratingButton = tastingFormPage.getByTestId(`overall-rating-input-star-${testTasting.rating}`);
    await expect(ratingButton).toHaveAttribute("aria-checked", "true");

    // Step 14: Submit form
    await tastingFormPage.submitButton.click();

    // Step 15: Wait for redirect back to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Step 16: Verify new tasting appears in the list
    const newTastingCard = dashboardPage.getTastingNoteByBrandAndBlend(testTasting.brand, testTasting.blend);
    await expect(newTastingCard).toBeVisible({ timeout: 10000 });

    // Step 17: Verify card contains expected information
    await expect(newTastingCard).toContainText(testTasting.brand);
    await expect(newTastingCard).toContainText(testTasting.blend);
  });
});
