/**
 * Example E2E Test using Page Object Model
 * Demonstrates the complete flow: Login -> Create Tasting Note
 *
 * This test demonstrates the POM pattern usage and can be used as a reference
 * for refactoring existing tests.
 */

import { expect, test } from "@playwright/test";
import { DashboardPage, LoginPage, OnboardingPage, TastingFormPage } from "./page-objects";

test.describe("Create Tasting Note Flow (POM Example)", () => {
  const TEST_EMAIL = process.env.E2E_USERNAME_WITH_DATA || "with-data@e2e.com";
  const TEST_PASSWORD = process.env.E2E_PASSWORD_WITH_DATA || "Test123!";

  test("should login and create a new tasting note (first time user)", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const onboardingPage = new OnboardingPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Login
    await loginPage.navigate();
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);

    // If user has no tastings, they'll be on onboarding
    const isOnboarding = await onboardingPage.isOnboardingDisplayed();

    if (isOnboarding) {
      // Assert - Onboarding is shown
      expect(isOnboarding).toBe(true);

      // Act - Click Get Started
      await onboardingPage.clickGetStarted();
    }

    // Assert - Should be on the new tasting form
    await expect(page).toHaveURL(/\/tastings\/new/);
    expect(await tastingFormPage.pageHeading.isVisible()).toBe(true);

    // Act - Fill in minimum required fields
    await tastingFormPage.fillMinimumRequiredFields("Test Brand POM", "Test Blend POM", 5);

    // Act - Submit the form
    await tastingFormPage.submit();

    // Assert - Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should login and create a new tasting note (existing user)", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Login
    await loginPage.navigate();
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);

    // Act - Click Add New button
    await dashboardPage.clickAddNewDesktop();

    // Assert - Should be on the new tasting form
    await expect(page).toHaveURL(/\/tastings\/new/);

    // Act - Fill in complete form
    const formData = {
      brand: "Premium Matcha Co",
      blend: "Ceremonial Grade",
      region: "Uji, Japan",
      overallRating: 5,
      umami: 5,
      bitter: 2,
      sweet: 4,
      foam: 5,
      notesKoicha: "Rich, creamy texture with deep umami notes. Excellent quality.",
      notesMilk: "Smooth and well-balanced with milk. Not too bitter.",
      pricePln: 150.0,
      purchaseSource: "https://example-matcha-shop.com",
    };

    await tastingFormPage.fillForm(formData);

    // Act - Submit
    await tastingFormPage.submit();

    // Assert - Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Assert - New tasting should be visible
    const tastingCard = dashboardPage.getTastingNoteByBrandAndBlend(formData.brand, formData.blend);
    await expect(tastingCard).toBeVisible();
  });

  test("should show validation errors for empty required fields", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Login
    await loginPage.navigate();
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);

    // Act - Navigate to new tasting form
    await dashboardPage.clickAddNewDesktop();

    // Act - Try to submit without filling required fields
    await tastingFormPage.submitWithoutWaiting();

    // Assert - Should still be on form page
    await expect(page).toHaveURL(/\/tastings\/new/);

    // Assert - Should show validation errors
    const hasErrors = await tastingFormPage.hasValidationErrors();
    expect(hasErrors).toBe(true);

    // Assert - Should have at least 3 errors (brand, blend, rating)
    const errors = await tastingFormPage.getValidationErrors();
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  test("should allow filling optional fields", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Login and navigate to form
    await loginPage.navigate();
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    await dashboardPage.clickAddNewDesktop();

    // Act - Fill required fields
    await tastingFormPage.fillBrand("Optional Test Brand");
    await tastingFormPage.fillBlend("Optional Test Blend");
    await tastingFormPage.setOverallRating(4);

    // Act - Fill all optional fields
    await tastingFormPage.fillRegion("Kyoto, Japan");
    await tastingFormPage.setUmamiRating(4);
    await tastingFormPage.setBitterRating(3);
    await tastingFormPage.setSweetRating(3);
    await tastingFormPage.setFoamRating(4);
    await tastingFormPage.fillNotesKoicha("Test koicha notes");
    await tastingFormPage.fillNotesMilk("Test milk notes");
    await tastingFormPage.fillPrice(120.5);
    await tastingFormPage.fillPurchaseSource("https://test-shop.com");

    // Act - Submit
    await tastingFormPage.submit();

    // Assert - Should successfully create tasting
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should cancel form and return to dashboard", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const tastingFormPage = new TastingFormPage(page);

    // Act - Login and navigate to form
    await loginPage.navigate();
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    await dashboardPage.clickAddNewDesktop();

    // Act - Fill some fields
    await tastingFormPage.fillBrand("Cancel Test Brand");
    await tastingFormPage.fillBlend("Cancel Test Blend");

    // Act - Cancel
    await tastingFormPage.cancel();

    // Assert - Should return to previous page (could be dashboard or detail page)
    // We just check we're not on the new form anymore
    await expect(page).not.toHaveURL(/\/tastings\/new/);
  });
});
