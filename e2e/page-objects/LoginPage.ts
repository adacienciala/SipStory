/**
 * LoginPage - Page Object Model for the login page
 * Handles login functionality
 */

import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  // Locators
  readonly authForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly signupLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    // Using data-testid for resilient selectors
    this.authForm = this.getByTestId("auth-form");
    this.emailInput = this.getByTestId("email-input");
    this.passwordInput = this.getByTestId("password-input");
    this.loginButton = this.getByTestId("submit-button");
    this.signupLink = this.getByTestId("signup-link");
    this.forgotPasswordLink = this.getByTestId("forgot-password-link");
    this.errorMessage = this.getByTestId("auth-error-message");
    this.successMessage = this.getByTestId("auth-success-message");
  }

  /**
   * Navigate to the login page
   */
  async navigate(): Promise<void> {
    await this.goto("/login");
  }

  /**
   * Perform login with credentials
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Login and wait for redirect to dashboard
   * @param email - User email
   * @param password - User password
   */
  async loginAndWaitForDashboard(email: string, password: string): Promise<void> {
    await this.waitForFormReady();
    await this.login(email, password);
    await this.page.waitForURL("**/dashboard", { timeout: 10000 });
  }

  /**
   * Check if error message is visible
   */
  async isErrorVisible(): Promise<boolean> {
    try {
      return await this.errorMessage.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  /**
   * Check if success message is visible
   */
  async isSuccessVisible(): Promise<boolean> {
    try {
      return await this.successMessage.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    return (await this.successMessage.textContent()) || "";
  }

  /**
   * Click the "Sign up" link to go to registration
   */
  async clickSignupLink(): Promise<void> {
    await this.signupLink.click();
    await this.waitForURL(/\/register/);
  }

  /**
   * Click the "Forgot password?" link
   */
  async clickForgotPasswordLink(): Promise<void> {
    await this.forgotPasswordLink.click();
    await this.waitForURL(/\/reset-password/);
  }

  /**
   * Check if the login button is disabled
   */
  async isLoginButtonDisabled(): Promise<boolean> {
    return await this.loginButton.isDisabled();
  }

  /**
   * Wait for the form to be ready
   */
  async waitForFormReady(): Promise<void> {
    await this.authForm.waitFor({ state: "visible" });
    // Small wait to ensure React has hydrated and event handlers are attached
    await this.page.waitForLoadState("networkidle");
  }
}
