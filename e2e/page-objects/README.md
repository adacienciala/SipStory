# Page Object Model (POM) for E2E Tests

This directory contains Page Object Model classes for the SipStory E2E tests using Playwright.

## 📁 Structure

```
e2e/page-objects/
├── BasePage.ts           # Base class with common functionality
├── LoginPage.ts          # Login page interactions
├── OnboardingPage.ts     # Onboarding page interactions
├── DashboardPage.ts      # Dashboard page interactions
├── TastingFormPage.ts    # Tasting form (create/edit) interactions
└── index.ts              # Central export file
```

## 🎯 Design Pattern

The Page Object Model (POM) pattern provides:

- **Encapsulation**: Page-specific logic is contained in dedicated classes
- **Reusability**: Common actions can be reused across multiple tests
- **Maintainability**: UI changes only require updates to page objects, not all tests
- **Readability**: Tests read like user stories with clear, semantic method names

## 🏗️ Class Hierarchy

```
BasePage (base functionality)
├── LoginPage
├── OnboardingPage
├── DashboardPage
└── TastingFormPage
```

### BasePage

Base class providing common functionality for all page objects:

- Navigation (`goto`, `waitForURL`)
- Locator helpers (`getByTestId`, `getByRole`, `getByLabel`)
- Wait utilities

### LoginPage

Handles authentication flow:

```typescript
const loginPage = new LoginPage(page);
await loginPage.navigate();
await loginPage.loginAndWaitForDashboard(email, password);
```

**Key Methods:**

- `login(email, password)` - Perform login
- `loginAndWaitForDashboard(email, password)` - Login and wait for redirect
- `isErrorVisible()` - Check for error messages
- `getErrorMessage()` - Get error text

### OnboardingPage

Handles first-time user onboarding:

```typescript
const onboardingPage = new OnboardingPage(page);
await onboardingPage.clickGetStarted();
```

**Key Methods:**

- `clickGetStarted()` - Click "Get Started" button
- `isOnboardingDisplayed()` - Check if on onboarding page
- `areAllCardsVisible()` - Verify educational cards

### DashboardPage

Handles dashboard interactions and tasting notes list:

```typescript
const dashboardPage = new DashboardPage(page);
await dashboardPage.clickAddNewDesktop();
const count = await dashboardPage.getTastingNotesCount();
```

**Key Methods:**

- `clickAddNewDesktop()` - Click desktop "Add New" button
- `clickAddNewMobile()` - Click mobile FAB button
- `toggleCompareMode()` - Toggle comparison mode
- `getTastingNoteCards()` - Get all tasting note cards
- `getTastingNoteByBrandAndBlend(brand, blend)` - Find specific note
- `selectTastingNotesForComparison(indices)` - Select notes for comparison

### TastingFormPage

Handles tasting note form (create and edit):

```typescript
const formPage = new TastingFormPage(page);
await formPage.navigateToNew();
await formPage.fillMinimumRequiredFields("Brand", "Blend", 5);
await formPage.submit();
```

**Key Methods:**

**Required Fields:**

- `fillBrand(brand)` - Fill brand autocomplete
- `fillBlend(blend)` - Fill blend autocomplete
- `setOverallRating(1-5)` - Set star rating

**Optional Fields:**

- `fillRegion(region)` - Fill region autocomplete
- `setUmamiRating(1-5)` - Set umami dot rating
- `setBitterRating(1-5)` - Set bitter dot rating
- `setSweetRating(1-5)` - Set sweet dot rating
- `setFoamRating(1-5)` - Set foam quality dot rating
- `fillNotesKoicha(notes)` - Fill koicha notes
- `fillNotesMilk(notes)` - Fill milk notes
- `fillPrice(price)` - Fill price per 100g
- `fillPurchaseSource(source)` - Fill purchase source

**Composite Methods:**

- `fillForm(data: TastingFormData)` - Fill entire form
- `fillMinimumRequiredFields(brand, blend, rating)` - Fill only required fields

**Actions:**

- `submit()` - Submit form and wait for navigation
- `submitWithoutWaiting()` - Submit without waiting (for error testing)
- `cancel()` - Cancel and go back

**Validations:**

- `hasValidationErrors()` - Check for errors
- `getValidationErrors()` - Get error messages
- `isSubmitButtonDisabled()` - Check submit state
- `isEditMode()` - Check if in edit mode

## 💡 Usage Examples

### Basic Test Flow

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage, DashboardPage, TastingFormPage } from "./page-objects";

test("create new tasting note", async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const formPage = new TastingFormPage(page);

  // Act - Login
  await loginPage.navigate();
  await loginPage.loginAndWaitForDashboard("user@test.com", "password");

  // Act - Navigate to form
  await dashboardPage.clickAddNewDesktop();

  // Act - Fill and submit form
  await formPage.fillMinimumRequiredFields("Brand", "Blend", 5);
  await formPage.submit();

  // Assert
  await expect(page).toHaveURL(/\/dashboard/);
});
```

### Complex Form with All Fields

```typescript
const formData: TastingFormData = {
  brand: "Premium Matcha",
  blend: "Ceremonial",
  region: "Uji, Japan",
  overallRating: 5,
  umami: 5,
  bitter: 2,
  sweet: 4,
  foam: 5,
  notesKoicha: "Rich umami notes",
  notesMilk: "Smooth with milk",
  pricePln: 150,
  purchaseSource: "https://shop.com",
};

await formPage.fillForm(formData);
await formPage.submit();
```

### Error Handling

```typescript
await formPage.submitWithoutWaiting();

const hasErrors = await formPage.hasValidationErrors();
expect(hasErrors).toBe(true);

const errors = await formPage.getValidationErrors();
console.log(errors); // ["Brand is required", "Blend is required", ...]
```

## 🎨 Best Practices

### 1. Use data-testid Selectors

All page objects use `data-testid` attributes for resilient selectors:

```typescript
this.brandInput = this.getByTestId("brand-input");
this.submitButton = this.getByTestId("submit-button");
```

### 2. Follow AAA Pattern in Tests

- **Arrange**: Create page objects
- **Act**: Perform actions via page object methods
- **Assert**: Verify results

### 3. Method Naming

- Actions: Use verbs (`click`, `fill`, `toggle`, `select`)
- Queries: Use descriptive names (`getTastingNoteCards`, `isErrorVisible`)
- Booleans: Start with `is`, `has`, or `are`

### 4. Composite Methods

Provide both granular and composite methods:

```typescript
// Granular
await formPage.fillBrand("Brand");
await formPage.fillBlend("Blend");
await formPage.setOverallRating(5);

// Composite
await formPage.fillMinimumRequiredFields("Brand", "Blend", 5);
```

### 5. Wait Strategies

Page objects handle waits internally:

```typescript
async clickAddNewDesktop(): Promise<void> {
  await this.addNewButtonDesktop.click();
  await this.waitForURL(/\/tastings\/new/); // Built-in wait
}
```

## 📚 TypeScript Types

### TastingFormData Interface

```typescript
export interface TastingFormData {
  brand: string;
  blend: string;
  region?: string;
  overallRating: number; // 1-5
  umami?: number; // 1-5
  bitter?: number; // 1-5
  sweet?: number; // 1-5
  foam?: number; // 1-5
  notesKoicha?: string;
  notesMilk?: string;
  pricePln?: number;
  purchaseSource?: string;
}
```

## 🔄 Migration Guide

To migrate existing tests to use POM:

1. **Import page objects:**

   ```typescript
   import { LoginPage, DashboardPage, TastingFormPage } from "./page-objects";
   ```

2. **Replace direct page interactions:**

   ```typescript
   // Before
   await page.goto("/login");
   await page.getByLabel("Email").fill(email);
   await page.getByRole("button", { name: /log in/i }).click();

   // After
   const loginPage = new LoginPage(page);
   await loginPage.navigate();
   await loginPage.login(email, password);
   ```

3. **Use semantic method names:**

   ```typescript
   // Before
   await page.getByTestId("add-new-tasting-button").click();
   await page.waitForURL(/\/tastings\/new/);

   // After
   await dashboardPage.clickAddNewDesktop();
   ```

## 🧪 Testing the Page Objects

See `example-pom.spec.ts` for complete test examples demonstrating:

- First-time user flow (onboarding)
- Existing user flow (dashboard)
- Form validation
- Optional fields
- Cancel actions

## 📖 References

- [Playwright Page Object Model](https://playwright.dev/docs/pom)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- Project Guidelines: `.github/copilot-instructions.md`
