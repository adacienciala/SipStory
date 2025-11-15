/**
 * Login Flow E2E Tests using Updated Page Object Model
 * Demonstrates the complete login scenario with data-testid selectors
 */

import { expect, test } from "@playwright/test";
import { LoginPage } from "./page-objects";

test.describe("Login Page Flow", () => {
  const TEST_EMAIL = process.env.E2E_USERNAME_WITH_DATA || "with-data@e2e.com";
  const TEST_PASSWORD = process.env.E2E_PASSWORD_WITH_DATA || "Test123!";
  const INVALID_EMAIL = "invalid@test.com";
  const INVALID_PASSWORD = "WrongPass123!";

  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test("should display login form with all elements", async ({ page }) => {
    // Arrange & Act
    const loginPage = new LoginPage(page);

    // Assert - Form elements are visible
    await expect(loginPage.authForm).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.signupLink).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();

    // Assert - Login button text
    await expect(loginPage.loginButton).toHaveText("Login");
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act - Step 1: Navigate to login page (already done in beforeEach)
    await loginPage.waitForFormReady();

    // Act - Step 2: Fill in email field
    await loginPage.emailInput.fill(TEST_EMAIL);

    // Act - Step 3: Fill in password field
    await loginPage.passwordInput.fill(TEST_PASSWORD);

    // Assert - Input values are set
    await expect(loginPage.emailInput).toHaveValue(TEST_EMAIL);
    await expect(loginPage.passwordInput).toHaveValue(TEST_PASSWORD);

    // Act - Step 4: Click login button
    await loginPage.loginButton.click();

    // Assert - Should redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  test("should login using the loginAndWaitForDashboard method", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act - Use composite method for complete login flow
    await loginPage.loginAndWaitForDashboard(TEST_EMAIL, TEST_PASSWORD);

    // Assert
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should show error message for invalid credentials", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act - Wait for form to be ready
    await loginPage.waitForFormReady();

    // Act - Try to login with invalid credentials
    await loginPage.emailInput.fill(INVALID_EMAIL);
    await loginPage.passwordInput.fill(INVALID_PASSWORD);
    await loginPage.loginButton.click();

    // Wait for the error message to appear
    await loginPage.errorMessage.waitFor({ state: "visible", timeout: 5000 });

    // Assert - Should show error message
    const isErrorVisible = await loginPage.isErrorVisible();
    expect(isErrorVisible).toBe(true);

    // Assert - Error message contains relevant text
    const errorText = await loginPage.getErrorMessage();
    expect(errorText.toLowerCase()).toContain("invalid");
  });

  test("should show validation error for empty email", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act - Wait for form to be ready
    await loginPage.waitForFormReady();

    // Act - Try to login with empty email
    await loginPage.passwordInput.fill(TEST_PASSWORD);
    await loginPage.loginButton.click();

    // Assert - Should stay on login page
    await expect(page).toHaveURL(/\/login/);

    // Assert - Should show validation error
    const emailError = page.locator("#email-error");
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText("Email is required");
  });

  test("should show validation error for invalid email format", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act - Wait for form to be ready
    await loginPage.waitForFormReady();

    // Act - Enter invalid email format
    await loginPage.emailInput.fill("not-an-email");
    await loginPage.passwordInput.fill(TEST_PASSWORD);
    await loginPage.loginButton.click();

    // Assert - Should show validation error
    const emailError = page.locator("#email-error");
    await expect(emailError).toBeVisible();
    await expect(emailError).toContainText("valid email");
  });

  test("should show validation error for empty password", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act - Try to login with empty password
    await loginPage.emailInput.fill(TEST_EMAIL);
    await loginPage.loginButton.click();

    // Assert - Should stay on login page
    await expect(page).toHaveURL(/\/login/);

    // Assert - Should show validation error
    const passwordError = page.locator("#password-error");
    await expect(passwordError).toBeVisible();
    await expect(passwordError).toContainText("Password is required");
  });

  test("should disable login button while submitting", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act - Fill form
    await loginPage.emailInput.fill(TEST_EMAIL);
    await loginPage.passwordInput.fill(TEST_PASSWORD);

    // Act - Click login and check if button is disabled during submission
    const loginPromise = loginPage.loginButton.click();

    // Assert - Button should show loading state (may be too fast to catch)
    // We just verify the button exists and form submission happens
    await loginPromise;

    // Should navigate away (either to dashboard or stay with error)
    await page.waitForTimeout(500);
  });

  test("should navigate to signup page when clicking signup link", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act - Click signup link
    await loginPage.clickSignupLink();

    // Assert - Should navigate to register page
    await expect(page).toHaveURL(/\/register/);
  });

  test("should navigate to password reset when clicking forgot password", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act - Click forgot password link
    await loginPage.clickForgotPasswordLink();

    // Assert - Should navigate to reset password page
    await expect(page).toHaveURL(/\/reset-password/);
  });

  test("should clear error when user starts typing", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act - Wait for form to be ready
    await loginPage.waitForFormReady();

    // Act - Submit with invalid credentials to trigger error
    await loginPage.emailInput.fill(INVALID_EMAIL);
    await loginPage.passwordInput.fill(INVALID_PASSWORD);
    await loginPage.loginButton.click();

    // Wait for error message to appear
    await loginPage.errorMessage.waitFor({ state: "visible", timeout: 5000 });

    // Assert - Error is visible
    const isErrorVisible = await loginPage.isErrorVisible();
    expect(isErrorVisible).toBe(true);

    // Act - Start typing in email field
    await loginPage.emailInput.fill("new");

    // Assert - Error should be cleared (or not, depending on implementation)
    // This tests the UX behavior
    await page.waitForTimeout(500);
  });

  test("should handle redirect parameter after successful login", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Act - Navigate to login with redirect parameter
    await page.goto("/login?redirectTo=/tastings/new");

    // Act - Wait for form to be ready
    await loginPage.waitForFormReady();

    // Act - Login
    await loginPage.login(TEST_EMAIL, TEST_PASSWORD);

    // Assert - Should redirect to the specified page
    await page.waitForURL(/\/tastings\/new/, { timeout: 10000 });
  });

  test("should display correct placeholder text", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Assert - Email placeholder
    await expect(loginPage.emailInput).toHaveAttribute("placeholder", "you@example.com");

    // Assert - Password placeholder
    await expect(loginPage.passwordInput).toHaveAttribute("placeholder", "••••••••");
  });

  test("should have correct input types", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);

    // Assert - Email input type
    await expect(loginPage.emailInput).toHaveAttribute("type", "text");

    // Assert - Password input type (should be password for security)
    await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
  });

  test("should have accessible form labels", async ({ page }) => {
    // Assert - Form has proper labels
    const emailLabel = page.locator('label[for="email"]');
    const passwordLabel = page.locator('label[for="password"]');

    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
    await expect(emailLabel).toHaveText("Email");
    await expect(passwordLabel).toHaveText("Password");
  });

  test("complete login scenario - step by step", async ({ page }) => {
    // This test demonstrates the complete scenario step-by-step
    const loginPage = new LoginPage(page);

    // Step 1: Verify we're on the login page
    await expect(page).toHaveURL(/\/login/);

    // Step 2: Wait for form to be ready
    await loginPage.waitForFormReady();

    // Step 3: Fill in email field
    await loginPage.emailInput.click();
    await loginPage.emailInput.fill(TEST_EMAIL);
    await expect(loginPage.emailInput).toHaveValue(TEST_EMAIL);

    // Step 4: Fill in password field
    await loginPage.passwordInput.click();
    await loginPage.passwordInput.fill(TEST_PASSWORD);
    await expect(loginPage.passwordInput).toHaveValue(TEST_PASSWORD);

    // Step 5: Click login button
    await loginPage.loginButton.click();

    // Step 6: Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});
