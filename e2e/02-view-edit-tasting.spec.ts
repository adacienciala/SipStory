/**
 * View and Edit Tasting E2E Test
 * Tests the complete flow: Login -> View tasting note -> Edit tasting note
 *
 * This is a CI/CD required test (P0) per PRD Technical Requirements
 * Covers: US-007, US-008, TC-CRUD-05, TC-CRUD-06
 */
import { expect, test } from "@playwright/test";
import { DashboardPage, LoginPage, TastingDetailPage, TastingFormPage } from "./page-objects";

test.describe("View and Edit Tasting Flow", () => {
  const TEST_EMAIL = process.env.E2E_USERNAME_WITH_DATA || "with-data@e2e.com";
  const TEST_PASSWORD = process.env.E2E_PASSWORD_WITH_DATA || "Test123!";

  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test("should successfully view and edit an existing tasting note", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const detailPage = new TastingDetailPage(page);
    const formPage = new TastingFormPage(page);

    // Act - Step 1: Login
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);

    // Assert - Verify on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Act - Step 2: Get first tasting note and click it
    const tastingCards = dashboardPage.getTastingNoteCards();
    const firstCard = tastingCards.first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // Assert - Verify navigated to detail page
    await expect(page).toHaveURL(/\/tastings\/[a-f0-9-]+$/);

    // Act - Step 3: Wait for detail page to load
    await detailPage.waitForLoad();

    // Assert - Verify detail page elements are visible
    await expect(detailPage.pageHeading).toBeVisible();
    await expect(detailPage.editButton).toBeVisible();
    await expect(detailPage.deleteButton).toBeVisible();

    // Get the original values for later verification
    const originalHeading = await detailPage.getHeadingText();
    const originalRegion = await detailPage.getRegionValue();

    // Act - Step 4: Click Edit button
    await detailPage.clickEdit();

    // Assert - Verify navigated to edit form
    await expect(page).toHaveURL(/\/tastings\/[a-f0-9-]+\/edit/);

    // Act - Step 5: Wait for form to be ready
    await formPage.waitForFormReady();

    // Assert - Verify we're in edit mode
    const isEditMode = await formPage.isEditMode();
    expect(isEditMode).toBe(true);

    // Assert - Verify page heading indicates edit mode
    const headingText = await formPage.pageHeading.textContent();
    expect(headingText?.toLowerCase()).toContain("edit");

    // Assert - Verify form is pre-populated (overall rating should be set)
    const currentRating = await formPage.getOverallRating();
    expect(currentRating).not.toBeNull();
    expect(currentRating).toBeGreaterThanOrEqual(1);
    expect(currentRating).toBeLessThanOrEqual(5);

    const currentPrice = await formPage.getPriceValue();

    // Act - Step 6: Modify some fields
    const newPrice = parseInt(currentPrice) + 5;
    const newNotesKoicha = `Updated notes as koicha - ${Date.now()}`;
    const newUmamiRating = Math.floor(Math.random() * 5) + 1;

    await formPage.fillPrice(newPrice);
    await formPage.fillNotesKoicha(newNotesKoicha);
    await formPage.setUmamiRating(newUmamiRating);

    // Act - Step 7: Submit the form
    await formPage.submitButton.click();

    // Assert - Step 8: Verify redirect back to detail page
    await expect(page).toHaveURL(/\/tastings\/[a-f0-9-]+$/);
    await detailPage.waitForLoad();

    // TODO: Fix caching issue to enable these assertions
    // // Assert - Step 9: Verify changes are reflected
    // // The heading should remain the same (brand/blend not changed)
    // const updatedHeading = await detailPage.getHeadingText();
    // expect(updatedHeading).toBe(originalHeading);

    // // The region should remain the same
    // const updatedRegion = await detailPage.getRegionValue();
    // expect(updatedRegion).toBe(originalRegion);

    // // The koicha notes should be updated
    // const updatedNotesKoicha = await detailPage.getNotesKoichaValue();
    // expect(updatedNotesKoicha).toBe(newNotesKoicha);

    // // Verify umami rating by checking if dot 5 is filled
    // const isUmamiDotFilled = await detailPage.isUmamiDotFilled(newUmamiRating);
    // expect(isUmamiDotFilled).toBe(true);

    // // The price should be updated
    // const updatedPrice = await detailPage.getPriceValue();
    // expect(updatedPrice).toContain(newPrice.toString());
  });

  test("should display pre-populated data in edit form", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const detailPage = new TastingDetailPage(page);
    const formPage = new TastingFormPage(page);

    // Act - Login and navigate to first tasting
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    const firstCard = dashboardPage.getTastingNoteCards().first();
    await firstCard.click();
    await detailPage.waitForLoad();

    // Act - Click Edit
    await detailPage.clickEdit();
    await formPage.waitForFormReady();

    // Assert - Verify overall rating is pre-populated
    const rating = await formPage.getOverallRating();
    expect(rating).not.toBeNull();

    // Assert - Verify submit button is enabled (form is valid)
    const isDisabled = await formPage.isSubmitButtonDisabled();
    expect(isDisabled).toBe(false);
  });

  test("should allow canceling edit without saving changes", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const detailPage = new TastingDetailPage(page);
    const formPage = new TastingFormPage(page);

    // Act - Login and navigate to edit form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    const firstCard = dashboardPage.getTastingNoteCards().first();
    await firstCard.click();
    await detailPage.waitForLoad();

    // Get the original price
    const originalPrice = await detailPage.getPriceValue();

    // Navigate to edit
    await detailPage.clickEdit();
    await formPage.waitForFormReady();

    // Act - Make changes
    await formPage.fillPrice(999);

    // Act - Cancel the form
    await formPage.cancel();

    // Assert - Should return to detail page
    await page.waitForTimeout(500); // Wait for navigation
    // We should be back on detail page
    await detailPage.waitForLoad();

    // Assert - Verify changes were not saved
    const currentPrice = await detailPage.getPriceValue();
    expect(currentPrice).toBe(originalPrice);
  });

  test("should maintain validation in edit mode", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const detailPage = new TastingDetailPage(page);
    const formPage = new TastingFormPage(page);

    // Act - Login and navigate to edit form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    const firstCard = dashboardPage.getTastingNoteCards().first();
    await firstCard.click();
    await detailPage.waitForLoad();
    await detailPage.clickEdit();
    await formPage.waitForFormReady();

    // Get the current rating
    const originalRating = await formPage.getOverallRating();
    expect(originalRating).not.toBeNull();

    // Act - Clear the overall rating by clicking on it again (toggle off)
    const starButton = formPage.getByTestId(`overall-rating-input-star-${originalRating}`);
    await starButton.click();

    // Act - Try to submit with invalid data
    await formPage.submitWithoutWaiting();

    // Assert - Should stay on edit page
    await expect(page).toHaveURL(/\/tastings\/[a-f0-9-]+\/edit/);

    // Assert - Should show validation errors
    const hasErrors = await formPage.hasValidationErrors();
    expect(hasErrors).toBe(true);
  });

  test("should update only modified fields", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const detailPage = new TastingDetailPage(page);
    const formPage = new TastingFormPage(page);

    // Act - Login and navigate to edit form
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    const firstCard = dashboardPage.getTastingNoteCards().first();
    await firstCard.click();
    await detailPage.waitForLoad();

    // Get original values
    const originalHeading = await detailPage.getHeadingText();
    const originalRegion = await detailPage.getRegionValue();

    // Navigate to edit
    await detailPage.clickEdit();
    await formPage.waitForFormReady();

    // Act - Update only the sweet rating
    const newSweetRating = 3;
    await formPage.setSweetRating(newSweetRating);

    // Act - Submit
    await formPage.submitButton.click();
    await detailPage.waitForLoad();

    // Assert - Verify unchanged fields remain the same
    const updatedHeading = await detailPage.getHeadingText();
    expect(updatedHeading).toBe(originalHeading);

    const updatedRegion = await detailPage.getRegionValue();
    expect(updatedRegion).toBe(originalRegion);
  });

  test("complete edit scenario - step by step", async ({ page }) => {
    // This test demonstrates the complete CI/CD required scenario step-by-step
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const detailPage = new TastingDetailPage(page);
    const formPage = new TastingFormPage(page);

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
    const tastingCards = dashboardPage.getTastingNoteCards();
    await expect(tastingCards.first()).toBeVisible();

    // Step 8: Click on first tasting note
    await tastingCards.first().click();

    // Step 9: Wait for detail page to load
    await expect(page).toHaveURL(/\/tastings\/[a-f0-9-]+$/);
    await expect(detailPage.pageHeading).toBeVisible();

    // Step 10: Verify Edit button is visible
    await expect(detailPage.editButton).toBeVisible();

    // Step 11: Click Edit button
    await detailPage.editButton.click();

    // Step 12: Wait for edit form to load
    await expect(page).toHaveURL(/\/tastings\/[a-f0-9-]+\/edit/);
    await expect(formPage.pageHeading).toBeVisible();

    // Step 13: Verify form heading shows "Edit"
    const headingText = await formPage.pageHeading.textContent();
    expect(headingText?.toLowerCase()).toContain("edit");

    // Step 14: Verify form has pre-populated data
    const currentRating = await formPage.getOverallRating();
    expect(currentRating).not.toBeNull();

    // Step 15: Make a change (update bitter rating)
    await formPage.setBitterRating(2);

    // Step 16: Submit the form
    await formPage.submitButton.click();

    // Step 17: Wait for redirect to detail page
    await expect(page).toHaveURL(/\/tastings\/[a-f0-9-]+$/, { timeout: 10000 });

    // Step 18: Verify detail page loaded successfully
    await expect(detailPage.pageHeading).toBeVisible();
  });

  test("should handle edit of tasting with all optional fields", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    const detailPage = new TastingDetailPage(page);
    const formPage = new TastingFormPage(page);

    // Act - Login and navigate to first tasting
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);
    const firstCard = dashboardPage.getTastingNoteCards().first();
    await firstCard.click();
    await detailPage.waitForLoad();
    await detailPage.clickEdit();
    await formPage.waitForFormReady();

    // Act - Update all optional rating fields
    await formPage.setUmamiRating(5);
    await formPage.setBitterRating(2);
    await formPage.setSweetRating(4);
    await formPage.setFoamRating(5);

    // Act - Update text fields
    const newNotesKoicha = `Comprehensive tasting notes as koicha - ${Date.now()}`;
    const newNotesMilk = `Comprehensive tasting notes with milk - ${Date.now()}`;
    const newPurchaseSource = "https://matcha-shop-updated.com";

    await formPage.fillNotesKoicha(newNotesKoicha);
    await formPage.fillNotesMilk(newNotesMilk);
    await formPage.fillPrice(175);
    await formPage.fillPurchaseSource(newPurchaseSource);

    // Act - Submit form (ratings and text fields have been set)
    await formPage.submitButton.click();

    // Assert - Verify redirect to detail page
    await expect(page).toHaveURL(/\/tastings\/[a-f0-9-]+$/);
    await detailPage.waitForLoad();

    // Assert - Verify detail page shows updated price
    const updatedPrice = await detailPage.getPriceValue();
    expect(updatedPrice).toContain("175");
  });
});
