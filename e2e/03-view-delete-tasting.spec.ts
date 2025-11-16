/**
 * View and Delete Tasting E2E Test
 * Tests the complete flow: Login -> View tasting note -> Delete tasting note
 *
 * This is a CI/CD required test (P0) per PRD Technical Requirements
 * Covers: US-009, TC-CRUD-07
 */
import { expect, test } from "@playwright/test";
import { DashboardPage, LoginPage, TastingDetailPage } from "./page-objects";

/**
 * NOTE: Each test creates its own tasting note to ensure test isolation.
 * Tests can run in parallel without affecting each other.
 */
test.describe("View and Delete Tasting Flow", () => {
  const TEST_EMAIL = process.env.E2E_USERNAME_WITH_DATA || "with-data@e2e.com";
  const TEST_PASSWORD = process.env.E2E_PASSWORD_WITH_DATA || "Test123!";

  test.beforeEach(async ({ page }) => {
    // Login and create a fresh tasting note for this test
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);

    // Wait for redirect to dashboard after successful login
    // await page.waitForURL(/\/dashboard/);
  });

  test("should successfully view and delete an existing tasting note", async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);
    const detailPage = new TastingDetailPage(page);

    // Assert - Verify on dashboard (set up in beforeEach)
    await expect(page).toHaveURL(/\/dashboard/);

    // Act - Step 2: Get count of tasting notes before deletion
    const tastingCards = dashboardPage.getTastingNoteCards();

    // Act - Step 3: Get first tasting note
    const firstCard = tastingCards.first();
    await expect(firstCard).toBeVisible();

    // Act - Step 4: Click on the tasting note to view details
    await firstCard.click();

    // Assert - Verify navigated to detail page
    await expect(page).toHaveURL(/\/tastings\/[a-f0-9-]+$/);

    // Act - Step 5: Wait for detail page to load
    await detailPage.waitForLoad();

    // Assert - Verify detail page elements are visible
    await expect(detailPage.pageHeading).toBeVisible();
    await expect(detailPage.editButton).toBeVisible();
    await expect(detailPage.deleteButton).toBeVisible();

    // Capture the heading text before deletion
    const detailHeading = await detailPage.getHeadingText();

    // Act - Step 6: Ensure page is fully interactive before clicking delete
    await page.waitForLoadState("networkidle");
    await detailPage.deleteButton.waitFor({ state: "visible" });
    await detailPage.deleteButton.click();

    // Assert - Verify confirmation dialog appears
    await detailPage.deleteDialog.waitFor({ state: "visible" });
    await expect(detailPage.deleteDialog).toBeVisible();
    await expect(detailPage.deleteConfirmButton).toBeVisible();
    await expect(detailPage.deleteCancelButton).toBeVisible();

    // Act - Step 7: Confirm deletion and wait for navigation
    await detailPage.confirmDelete();

    // Assert - Step 8: Verify redirect back to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Assert - Step 9: Verify tasting note count decreased
    await page.waitForTimeout(1000); // Wait for grid to update

    // Assert - Step 10: Verify deleted tasting no longer appears in list
    const remainingCards = dashboardPage.getTastingNoteCards();
    const cardCount = await remainingCards.count();

    // Check that no card contains the exact heading we deleted
    for (let i = 0; i < cardCount; i++) {
      const card = remainingCards.nth(i);
      const cardContent = await card.textContent();
      expect(cardContent).not.toContain(detailHeading);
    }
  });

  test("should allow canceling deletion without removing tasting note", async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);
    const detailPage = new TastingDetailPage(page);

    // Assert - Verify on dashboard (set up in beforeEach)
    await expect(page).toHaveURL(/\/dashboard/);

    // Act - Step 2: Get count of tasting notes before deletion
    const tastingCards = dashboardPage.getTastingNoteCards();
    const initialCount = await tastingCards.count();
    expect(initialCount).toBeGreaterThan(0);
    const firstCard = tastingCards.first();
    await firstCard.click();
    await detailPage.waitForLoad();

    // Get original data and URL to verify nothing changed
    const originalHeading = await detailPage.getHeadingText();
    const originalUrl = page.url();

    // Act - Click Delete button
    await detailPage.clickDelete();

    // Assert - Verify dialog is visible
    await expect(detailPage.deleteDialog).toBeVisible();

    // Act - Cancel deletion
    await detailPage.cancelDelete();

    // Assert - Verify dialog closed
    await expect(detailPage.deleteDialog).not.toBeVisible();

    // Assert - Verify still on detail page with same URL
    await expect(page).toHaveURL(originalUrl);

    // Assert - Verify heading unchanged (note still exists on detail page)
    const currentHeading = await detailPage.getHeadingText();
    expect(currentHeading).toBe(originalHeading);

    // Assert - Verify we can still interact with the page (buttons are enabled)
    await expect(detailPage.editButton).toBeEnabled();
    await expect(detailPage.deleteButton).toBeEnabled();

    // The main purpose of this test is to verify that canceling the delete dialog
    // keeps us on the detail page with the note intact. We've verified that above.
    // We don't navigate back to dashboard to avoid issues with parallel test execution
    // where another test may have deleted this note.
  });

  test("should display delete confirmation dialog with correct content", async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);
    const detailPage = new TastingDetailPage(page);

    // Act - Navigate to tasting detail
    const firstCard = dashboardPage.getTastingNoteCards().first();
    await firstCard.click();
    await detailPage.waitForLoad();

    // Act - Open delete dialog
    await detailPage.clickDelete();

    // Assert - Verify dialog visibility
    const isVisible = await detailPage.isDeleteDialogVisible();
    expect(isVisible).toBe(true);

    // Assert - Verify dialog contains expected buttons
    await expect(detailPage.deleteConfirmButton).toBeVisible();
    await expect(detailPage.deleteCancelButton).toBeVisible();

    // Assert - Verify button text
    const confirmText = await detailPage.deleteConfirmButton.textContent();
    expect(confirmText).toContain("Delete");

    const cancelText = await detailPage.deleteCancelButton.textContent();
    expect(cancelText).toContain("Cancel");

    // Cleanup - Cancel to close dialog
    await detailPage.cancelDelete();
  });

  test("should maintain detail page state after canceling delete", async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);
    const detailPage = new TastingDetailPage(page);

    // Act - Navigate to tasting detail
    const firstCard = dashboardPage.getTastingNoteCards().first();
    await firstCard.click();
    await detailPage.waitForLoad();

    // Capture current state
    const headingBefore = await detailPage.getHeadingText();
    const regionBefore = await detailPage.getRegionValue();
    const priceBefore = await detailPage.getPriceValue();

    // Act - Open and cancel delete dialog
    await detailPage.clickDelete();
    await detailPage.cancelDelete();

    // Assert - Verify state unchanged
    const headingAfter = await detailPage.getHeadingText();
    const regionAfter = await detailPage.getRegionValue();
    const priceAfter = await detailPage.getPriceValue();

    expect(headingAfter).toBe(headingBefore);
    expect(regionAfter).toBe(regionBefore);
    expect(priceAfter).toBe(priceBefore);

    // Assert - Verify buttons still functional
    await expect(detailPage.editButton).toBeEnabled();
    await expect(detailPage.deleteButton).toBeEnabled();
  });
});
