/**
 * BasePage - Base class for all Page Object Models
 * Provides common functionality and utilities for page interactions
 */

import type { Locator, Page } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   * @param url - The URL path to navigate to
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  /**
   * Wait for the page to load a specific URL pattern
   * @param urlPattern - URL pattern to wait for (regex or string)
   */
  async waitForURL(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern);
  }

  /**
   * Get element by data-testid attribute
   * @param testId - The data-testid value
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by role
   * @param role - ARIA role
   * @param options - Additional locator options
   */
  getByRole(
    role: "button" | "textbox" | "heading" | "link" | "region" | "navigation" | "main" | "radiogroup",
    options?: { name?: string | RegExp; exact?: boolean }
  ): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Get element by label
   * @param label - Label text or pattern
   */
  getByLabel(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }
}
