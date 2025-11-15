/**
 * OnboardingPage - Page Object Model for the onboarding page
 * Handles first-time user onboarding flow
 */

import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class OnboardingPage extends BasePage {
  // Locators
  readonly pageHeading: Locator;
  readonly getStartedButton: Locator;
  readonly umamiCard: Locator;
  readonly foamQualityCard: Locator;
  readonly bitternessCard: Locator;
  readonly sweetnessCard: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = this.getByRole("heading", { name: /welcome to sipstory/i });
    this.getStartedButton = this.getByTestId("get-started-button");
    this.umamiCard = this.page.locator("text=Umami").locator("..");
    this.foamQualityCard = this.page.locator("text=Foam Quality").locator("..");
    this.bitternessCard = this.page.locator("text=Bitterness").locator("..");
    this.sweetnessCard = this.page.locator("text=Sweetness").locator("..");
  }

  /**
   * Navigate to the onboarding page
   */
  async navigate(): Promise<void> {
    await this.goto("/onboarding");
  }

  /**
   * Click "Get Started" button and wait for navigation to new tasting form
   */
  async clickGetStarted(): Promise<void> {
    await this.getStartedButton.click();
    await this.waitForURL(/\/tastings\/new/);
  }

  /**
   * Check if onboarding page is displayed
   */
  async isOnboardingDisplayed(): Promise<boolean> {
    return await this.pageHeading.isVisible();
  }

  /**
   * Verify all educational cards are visible
   */
  async areAllCardsVisible(): Promise<boolean> {
    const umamiVisible = await this.umamiCard.isVisible();
    const foamVisible = await this.foamQualityCard.isVisible();
    const bitterVisible = await this.bitternessCard.isVisible();
    const sweetVisible = await this.sweetnessCard.isVisible();

    return umamiVisible && foamVisible && bitterVisible && sweetVisible;
  }
}
