/**
 * TastingFormPage - Page Object Model for the tasting form (create/edit)
 * Handles all form interactions for creating and editing tasting notes
 */

import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export interface TastingFormData {
  brand: string;
  blend: string;
  region: string;
  overallRating: number;
  umami?: number;
  bitter?: number;
  sweet?: number;
  foam?: number;
  notesKoicha?: string;
  notesMilk?: string;
  pricePln?: number;
  purchaseSource?: string;
}

export class TastingFormPage extends BasePage {
  // Required Field Locators
  readonly brandInput: Locator;
  readonly blendInput: Locator;
  readonly overallRatingInput: Locator;

  // Optional Field Locators
  readonly regionInput: Locator;
  readonly umamiRatingInput: Locator;
  readonly bitterRatingInput: Locator;
  readonly sweetRatingInput: Locator;
  readonly foamRatingInput: Locator;
  readonly notesKoichaInput: Locator;
  readonly notesMilkInput: Locator;
  readonly priceInput: Locator;
  readonly purchaseSourceInput: Locator;

  // Action Buttons
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  // Page Elements
  readonly pageHeading: Locator;
  readonly backButton: Locator;
  readonly errorMessages: Locator;

  constructor(page: Page) {
    super(page);

    // Required fields
    this.brandInput = this.getByTestId("brand-input");
    this.blendInput = this.getByTestId("blend-input");
    this.overallRatingInput = this.getByTestId("overall-rating-input");

    // Optional fields
    this.regionInput = this.getByTestId("region-input");
    this.umamiRatingInput = this.getByTestId("umami-rating-input");
    this.bitterRatingInput = this.getByTestId("bitter-rating-input");
    this.sweetRatingInput = this.getByTestId("sweet-rating-input");
    this.foamRatingInput = this.getByTestId("foam-rating-input");
    this.notesKoichaInput = this.getByTestId("notes-koicha-input");
    this.notesMilkInput = this.getByTestId("notes-milk-input");
    this.priceInput = this.getByTestId("price-input");
    this.purchaseSourceInput = this.getByTestId("purchase-source-input");

    // Actions
    this.submitButton = this.getByTestId("submit-button");
    this.cancelButton = this.getByTestId("cancel-button");

    // Page elements
    this.pageHeading = this.getByTestId("page-heading");
    this.backButton = this.getByRole("link", { name: /back/i });
    this.errorMessages = this.page.locator(".text-red-500");
  }

  /**
   * Navigate to the new tasting note form
   */
  async navigateToNew(): Promise<void> {
    await this.goto("/tastings/new");
  }

  /**
   * Navigate to edit tasting note form
   * @param tastingId - ID of the tasting note to edit
   */
  async navigateToEdit(tastingId: string): Promise<void> {
    await this.goto(`/tastings/${tastingId}/edit`);
  }

  /**
   * Fill in brand field
   * @param brand - Brand name
   */
  async fillBrand(brand: string): Promise<void> {
    // Click the combobox button to open the popover
    await this.brandInput.click();
    // Wait for popover to open and find the input inside
    const input = this.page.getByPlaceholder(/search brand/i);
    await input.fill(brand);
    // Wait a bit for autocomplete to process
    await this.page.waitForTimeout(300);
  }

  /**
   * Fill in blend field
   * @param blend - Blend name
   */
  async fillBlend(blend: string): Promise<void> {
    // Click the combobox button to open the popover
    await this.blendInput.click();
    // Wait for popover to open and find the input inside
    const input = this.page.getByPlaceholder(/search blend/i);
    await input.fill(blend);
    await this.page.waitForTimeout(300);
  }

  /**
   * Fill in region field
   * @param region - Region name
   */
  async fillRegion(region: string): Promise<void> {
    // Click the combobox button to open the popover
    await this.regionInput.click();
    // Wait for popover to open and find the input inside
    const input = this.page.getByPlaceholder(/search region/i);
    await input.fill(region);
    await this.page.waitForTimeout(300);
  }

  /**
   * Set overall star rating
   * @param rating - Rating value (1-5)
   */
  async setOverallRating(rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    const starButton = this.getByTestId(`overall-rating-input-star-${rating}`);
    await starButton.click();
  }

  /**
   * Set umami dot rating
   * @param rating - Rating value (1-5)
   */
  async setUmamiRating(rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    const dotButton = this.getByTestId(`umami-rating-input-dot-${rating}`);
    await dotButton.click();
  }

  /**
   * Set bitter dot rating
   * @param rating - Rating value (1-5)
   */
  async setBitterRating(rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    const dotButton = this.getByTestId(`bitter-rating-input-dot-${rating}`);
    await dotButton.click();
  }

  /**
   * Set sweet dot rating
   * @param rating - Rating value (1-5)
   */
  async setSweetRating(rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    const dotButton = this.getByTestId(`sweet-rating-input-dot-${rating}`);
    await dotButton.click();
  }

  /**
   * Set foam quality dot rating
   * @param rating - Rating value (1-5)
   */
  async setFoamRating(rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    const dotButton = this.getByTestId(`foam-rating-input-dot-${rating}`);
    await dotButton.click();
  }

  /**
   * Fill in notes as koicha
   * @param notes - Tasting notes text
   */
  async fillNotesKoicha(notes: string): Promise<void> {
    await this.notesKoichaInput.fill(notes);
  }

  /**
   * Fill in notes with milk
   * @param notes - Tasting notes text
   */
  async fillNotesMilk(notes: string): Promise<void> {
    await this.notesMilkInput.fill(notes);
  }

  /**
   * Fill in price per 100g
   * @param price - Price in PLN
   */
  async fillPrice(price: number): Promise<void> {
    await this.priceInput.fill(price.toString());
  }

  /**
   * Fill in purchase source
   * @param source - Purchase source URL or name
   */
  async fillPurchaseSource(source: string): Promise<void> {
    await this.purchaseSourceInput.fill(source);
  }

  /**
   * Fill the entire form with provided data
   * @param data - Complete form data
   */
  async fillForm(data: TastingFormData): Promise<void> {
    // Required fields
    await this.fillBrand(data.brand);
    await this.fillBlend(data.blend);
    await this.fillRegion(data.region);
    await this.setOverallRating(data.overallRating);

    // Optional fields
    if (data.umami) await this.setUmamiRating(data.umami);
    if (data.bitter) await this.setBitterRating(data.bitter);
    if (data.sweet) await this.setSweetRating(data.sweet);
    if (data.foam) await this.setFoamRating(data.foam);
    if (data.notesKoicha) await this.fillNotesKoicha(data.notesKoicha);
    if (data.notesMilk) await this.fillNotesMilk(data.notesMilk);
    if (data.pricePln) await this.fillPrice(data.pricePln);
    if (data.purchaseSource) await this.fillPurchaseSource(data.purchaseSource);
  }

  /**
   * Submit the form and wait for navigation
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
    await this.waitForURL(/\/dashboard/);
  }

  /**
   * Cancel form and go back
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Submit form without waiting for navigation (for error testing)
   */
  async submitWithoutWaiting(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Check if form has validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    return (await this.errorMessages.count()) > 0;
  }

  /**
   * Get all validation error messages
   */
  async getValidationErrors(): Promise<string[]> {
    const errors = await this.errorMessages.allTextContents();
    return errors.filter((error) => error.trim().length > 0);
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if form is in edit mode (vs create mode)
   */
  async isEditMode(): Promise<boolean> {
    const heading = await this.pageHeading.textContent();
    return heading?.toLowerCase().includes("edit") || false;
  }

  /**
   * Check if brand field is disabled (should be disabled in edit mode)
   */
  async isBrandDisabled(): Promise<boolean> {
    return await this.brandInput.isDisabled();
  }

  /**
   * Check if blend field is disabled (should be disabled in edit mode)
   */
  async isBlendDisabled(): Promise<boolean> {
    return await this.blendInput.isDisabled();
  }

  /**
   * Fill form with minimum required fields only
   * @param brand - Brand name
   * @param blend - Blend name
   * @param region - Region name
   * @param rating - Overall rating (1-5)
   */
  async fillMinimumRequiredFields(brand: string, blend: string, region: string, rating: number): Promise<void> {
    await this.fillBrand(brand);
    await this.fillBlend(blend);
    await this.fillRegion(region);
    await this.setOverallRating(rating);
  }
}
