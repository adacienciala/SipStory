/**
 * DashboardPage - Page Object Model for the dashboard page
 * Handles dashboard interactions and tasting notes grid
 */

import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DashboardPage extends BasePage {
  // Locators
  readonly addNewButtonDesktop: Locator;
  readonly addNewButtonMobile: Locator;
  readonly compareButton: Locator;
  readonly filterButton: Locator;
  readonly tastingNotesGrid: Locator;
  readonly errorMessage: Locator;
  readonly compareActionBar: Locator;
  readonly compareSelectedButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addNewButtonDesktop = this.getByTestId("add-new-tasting-button");
    this.addNewButtonMobile = this.getByTestId("add-new-tasting-fab");
    this.compareButton = this.getByRole("button", { name: /compare/i });
    this.filterButton = this.getByRole("button", { name: /filter/i });
    this.tastingNotesGrid = this.page.locator('[role="main"]');
    this.errorMessage = this.page.locator("text=Could not load tastings");
    this.compareActionBar = this.page.locator('[class*="bg-muted"]');
    this.compareSelectedButton = this.getByRole("button", { name: /compare selected/i });
  }

  /**
   * Navigate to the dashboard page
   */
  async navigate(): Promise<void> {
    await this.goto("/dashboard");
  }

  /**
   * Click "Add New" button (desktop version)
   */
  async clickAddNewDesktop(): Promise<void> {
    await this.addNewButtonDesktop.click();
    await this.waitForURL(/\/tastings\/new/);
  }

  /**
   * Click "Add New" floating action button (mobile version)
   */
  async clickAddNewMobile(): Promise<void> {
    await this.addNewButtonMobile.click();
    await this.waitForURL(/\/tastings\/new/);
  }

  /**
   * Toggle compare mode
   */
  async toggleCompareMode(): Promise<void> {
    await this.compareButton.click();
  }

  /**
   * Open filter panel (mobile)
   */
  async openFilterPanel(): Promise<void> {
    await this.filterButton.click();
  }

  /**
   * Check if dashboard is empty (no tasting notes)
   */
  async isEmpty(): Promise<boolean> {
    const currentUrl = this.page.url();
    // If redirected to onboarding, dashboard was empty
    return currentUrl.includes("/onboarding");
  }

  /**
   * Get all tasting note cards
   */
  getTastingNoteCards(): Locator {
    return this.page.locator('[data-testid="tasting-note-card"]');
  }

  /**
   * Get tasting note card by brand and blend
   * @param brand - Brand name
   * @param blend - Blend name
   */
  getTastingNoteByBrandAndBlend(brand: string, blend: string): Locator {
    return this.page.locator(`[data-testid="tasting-note-card"]:has-text("${brand}"):has-text("${blend}")`);
  }

  /**
   * Click on a specific tasting note card
   * @param index - Index of the card (0-based)
   */
  async clickTastingNote(index: number): Promise<void> {
    const cards = this.getTastingNoteCards();
    await cards.nth(index).click();
  }

  /**
   * Check if error is displayed
   */
  async isErrorDisplayed(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Check if compare mode is active
   */
  async isCompareModeActive(): Promise<boolean> {
    return await this.compareActionBar.isVisible();
  }

  /**
   * Select tasting notes for comparison
   * @param indices - Array of card indices to select
   */
  async selectTastingNotesForComparison(indices: number[]): Promise<void> {
    const cards = this.getTastingNoteCards();
    for (const index of indices) {
      await cards.nth(index).click();
    }
  }

  /**
   * Click "Compare Selected" button
   */
  async clickCompareSelected(): Promise<void> {
    await this.compareSelectedButton.click();
    await this.waitForURL(/\/tastings\/compare/);
  }

  /**
   * Get count of tasting notes displayed
   */
  async getTastingNotesCount(): Promise<number> {
    return await this.getTastingNoteCards().count();
  }
}
