import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * TastingDetailPage POM
 *
 * Page Object Model for the tasting note detail view page.
 * Handles viewing tasting note details and accessing edit/delete actions.
 *
 * URL Pattern: /tastings/[id]
 *
 * @example
 * ```ts
 * const detailPage = new TastingDetailPage(page);
 * await detailPage.waitForLoad();
 * await detailPage.clickEdit();
 * ```
 */
export class TastingDetailPage extends BasePage {
  // Locators
  readonly pageHeading: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly backButton: Locator;

  // Detail content locators
  readonly overallRating: Locator;
  readonly umamiRating: Locator;
  readonly bitterRating: Locator;
  readonly sweetRating: Locator;
  readonly foamRating: Locator;
  readonly regionValue: Locator;
  readonly priceValue: Locator;
  readonly notesKoichaValue: Locator;

  // Delete dialog locators
  readonly deleteDialog: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteCancelButton: Locator;
  readonly deleteErrorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Main elements
    this.pageHeading = this.getByTestId("detail-page-heading");
    this.editButton = this.getByTestId("edit-button");
    this.deleteButton = this.getByTestId("delete-button");
    this.backButton = this.page.locator('a:has-text("Back to Dashboard")');

    // Detail content
    this.overallRating = this.getByTestId("detail-overall-rating");
    this.umamiRating = this.getByTestId("detail-umami-rating");
    this.bitterRating = this.getByTestId("detail-bitter-rating");
    this.sweetRating = this.getByTestId("detail-sweet-rating");
    this.foamRating = this.getByTestId("detail-foam-rating");
    this.regionValue = this.getByTestId("detail-region");
    this.priceValue = this.getByTestId("detail-price");
    this.notesKoichaValue = this.getByTestId("detail-notes-koicha");

    // Delete dialog
    this.deleteDialog = this.getByTestId("delete-confirm-dialog");
    this.deleteConfirmButton = this.getByTestId("delete-confirm-button");
    this.deleteCancelButton = this.getByTestId("delete-cancel-button");
    this.deleteErrorMessage = this.getByTestId("delete-error-message");
  }

  /**
   * Navigate to a specific tasting note detail page
   * @param id - The tasting note ID
   */
  async navigate(id: string) {
    await this.goto(`/tastings/${id}`);
  }

  /**
   * Wait for the detail page to fully load
   */
  async waitForLoad() {
    await this.pageHeading.waitFor({ state: "visible" });
    await this.editButton.waitFor({ state: "visible" });
  }

  /**
   * Click the Edit button to navigate to edit form
   */
  async clickEdit() {
    // Use Promise.all to wait for navigation and click at the same time
    await Promise.all([this.page.waitForURL(/\/tastings\/.*\/edit/, { timeout: 15000 }), this.editButton.click()]);
  }

  /**
   * Click the Delete button to open delete confirmation dialog
   */
  async clickDelete() {
    await this.deleteButton.click();
    await this.deleteDialog.waitFor({ state: "visible" });
  }

  /**
   * Confirm deletion in the dialog
   */
  async confirmDelete() {
    // Wait for redirect to dashboard or onboarding
    await Promise.all([
      this.page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 15000 }),
      this.deleteConfirmButton.click(),
    ]);
  }

  /**
   * Cancel deletion in the dialog
   */
  async cancelDelete() {
    await this.deleteCancelButton.click();
    await this.deleteDialog.waitFor({ state: "hidden" });
  }

  /**
   * Check if the delete dialog is visible
   */
  async isDeleteDialogVisible(): Promise<boolean> {
    return await this.deleteDialog.isVisible();
  }

  /**
   * Check if delete error message is visible
   */
  async isDeleteErrorVisible(): Promise<boolean> {
    return await this.deleteErrorMessage.isVisible();
  }

  /**
   * Get the heading text (brand | blend)
   */
  async getHeadingText(): Promise<string> {
    return (await this.pageHeading.textContent()) || "";
  }

  /**
   * Get the region value displayed
   */
  async getRegionValue(): Promise<string> {
    return (await this.regionValue.textContent()) || "";
  }

  /**
   * Get the price value displayed
   */
  async getPriceValue(): Promise<string> {
    return (await this.priceValue.textContent()) || "";
  }

  /**
   * Check if a specific rating type is visible
   */
  async isRatingVisible(ratingType: "umami" | "bitter" | "sweet" | "foam"): Promise<boolean> {
    const locatorMap = {
      umami: this.umamiRating,
      bitter: this.bitterRating,
      sweet: this.sweetRating,
      foam: this.foamRating,
    };
    return await locatorMap[ratingType].isVisible();
  }

  /**
   * Get the notes as koicha value displayed
   */
  async getNotesKoichaValue(): Promise<string> {
    return (await this.notesKoichaValue.textContent()) || "";
  }

  /**
   * Check if a specific umami rating dot is filled
   * @param dotNumber - The dot number (1-5) to check
   * @returns true if the dot is filled (active), false otherwise
   */
  async isUmamiDotFilled(dotNumber: number): Promise<boolean> {
    const dot = this.getByTestId(`detail-umami-rating-dot-${dotNumber}`);
    const dataFilled = await dot.getAttribute("data-filled");
    return dataFilled === "true";
  }

  /**
   * Click the back button
   */
  async clickBack() {
    await this.backButton.click();
    await this.page.waitForURL(/\/dashboard/);
  }
}
