# E2E Test Database Setup and Cleanup

This directory contains the global setup and teardown configuration for managing test data in E2E tests.

## Overview

The setup and teardown processes automatically manage test data in Supabase:

- **Setup**: Creates a test user with seed data (brands, regions, blends, and a sample tasting note) before tests run
- **Teardown**: Cleans up the database after all E2E tests have finished running

This ensures:

- Consistent test data across all test runs
- No test data pollution between test runs
- A clean slate for each test execution
- Proper resource cleanup

## Files

### `global.setup.ts`

This file contains the setup logic that runs before all tests:

1. Connects to Supabase using credentials from `.env.test`
2. Creates or signs in the test user (using `E2E_USERNAME_WITH_DATA` and `E2E_PASSWORD_WITH_DATA`)
3. Seeds the database with:
   - 4 regions: Uji, Kagoshima, Shizuoka, Nishio
   - 4 brands: Ippodo, Marukyu Koyamaen, Hibiki-an, Aiya
   - 4 blends: Ummon-no-mukashi, Kusurinoki, Premium Ceremonial, Organic Matcha
   - 1 sample tasting note with all fields populated
4. Uses upsert operations to avoid duplicates on repeated runs
5. Provides detailed console logging for debugging
6. Handles errors gracefully with informative messages

### `global.teardown.ts`

This file contains the teardown logic that runs after all tests:

1. Connects to Supabase using credentials from `.env.test`
2. Deletes all tasting notes created by the test user (identified by `E2E_USERNAME_ID`)
3. Provides detailed console logging for debugging
4. Handles errors gracefully with informative messages

## Configuration

The setup and teardown are configured in `playwright.config.ts`:

```typescript
projects: [
  {
    name: "setup db",
    testMatch: /global\.setup\.ts/,
  },
  {
    name: "cleanup db",
    testMatch: /global\.teardown\.ts/,
  },
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
    dependencies: ["setup db"],
    teardown: "cleanup db",
  },
];
```

This setup ensures:

- The setup runs before any tests in the "chromium" project
- The teardown runs after all tests in the "chromium" project complete
- Setup and cleanup are isolated to separate projects for better visibility in reports
- Traces are captured if setup or teardown fails

## Environment Variables

Required variables in `.env.test`:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon/service key
- `E2E_USERNAME_WITH_DATA` - Email for the test user (e.g., "with-data@e2e.com")
- `E2E_PASSWORD_WITH_DATA` - Password for the test user (e.g., "Test123!")
- `E2E_USERNAME_ID` - The UUID of the test user whose data should be cleaned up (optional if user doesn't exist yet)

## How It Works

### Execution Flow

1. The "setup db" project runs first, creating/signing in the test user and seeding data
2. All E2E tests run in the "chromium" project with access to the seeded data
3. After all tests complete (success or failure), the "cleanup db" project runs
4. The teardown connects to Supabase and deletes tasting notes for the test user
5. Console output shows detailed information about created/deleted records

### Seed Data Created

The setup creates the following test data:

**Regions:**

- Uji
- Kagoshima
- Shizuoka
- Nishio

**Brands:**

- Ippodo
- Marukyu Koyamaen
- Hibiki-an
- Aiya

**Blends:**

- Ummon-no-mukashi (Ippodo, Uji)
- Kusurinoki (Marukyu Koyamaen, Uji)
- Premium Ceremonial (Ippodo, Kagoshima)
- Organic Matcha (Marukyu Koyamaen, Shizuoka)

**Sample Tasting Note:**

- Blend: Ummon-no-mukashi
- Overall Rating: 5 stars
- Umami: 5, Bitter: 2, Sweet: 4, Foam: 5
- Notes for Koicha and with Milk
- Price: 150 PLN
- Purchase Source: https://ippodo-tea.co.jp

### Safety Features

- **User Isolation**: Only deletes data for the specific test user ID
- **Error Handling**: Throws errors if environment variables are missing
- **Logging**: Provides detailed console output for monitoring and debugging
- **Type Safety**: Uses generated TypeScript types from Supabase schema

## Using Seed Data in Tests

The `helpers.ts` file exports a `SEED_DATA` constant that you can use in your tests:

```typescript
import { SEED_DATA } from "./helpers";

test("should use seed brand", async ({ page }) => {
  // Use a brand from seed data
  const brand = SEED_DATA.brands[0]; // "Ippodo"

  // Use a complete blend with brand and region
  const blend = SEED_DATA.blends[0]; // { name: "Ummon-no-mukashi", brand: "Ippodo", region: "Uji" }

  // Fill form with seed data
  await tastingFormPage.fillBrand(blend.brand);
  await tastingFormPage.fillBlend(blend.name);
  await tastingFormPage.fillRegion(blend.region);
});
```

This ensures your tests use consistent, known data that's already in the database.

## Running Tests

The setup and teardown run automatically when you execute E2E tests:

```bash
# Run all E2E tests with automatic setup and cleanup
npm run test:e2e

# Run with UI mode (setup and cleanup still run)
npm run test:e2e:ui
```

## Skipping Setup/Teardown

If you need to skip the setup or teardown (e.g., to inspect test data):

```bash
# Run tests without dependencies/teardown
npx playwright test --no-deps

# Run only setup
npx playwright test --project="setup db"

# Run only teardown
npx playwright test --project="cleanup db"
```

## Troubleshooting

### Setup fails with "Missing Supabase configuration"

Ensure `.env.test` contains valid `SUPABASE_URL` and `SUPABASE_KEY` values.

### Setup fails with "Missing test user credentials"

Ensure `.env.test` contains `E2E_USERNAME_WITH_DATA` and `E2E_PASSWORD_WITH_DATA` values.

### Teardown fails with "Missing Supabase configuration"

Ensure `.env.test` contains valid `SUPABASE_URL` and `SUPABASE_KEY` values.

### No records deleted (count shows 0)

This is normal if:

- Tests were skipped or didn't create any data
- The test user ID doesn't match any records
- Previous cleanup already removed the data

### Permission errors

Ensure the `SUPABASE_KEY` has sufficient permissions to:

- Create users (if using service role key)
- Insert records into `regions`, `brands`, `blends`, and `tasting_notes` tables
- Delete records from the `tasting_notes` table

### Duplicate key errors during setup

The setup uses `upsert` for regions and brands (which have unique constraints on `name`). For blends, it checks for existing blends first before inserting, since blends have a composite unique constraint on `(brand_id, name)` rather than `name` alone. This approach handles duplicate entries gracefully across repeated runs.

## Maintenance

### Adding New Seed Data

When you need to add more seed data:

1. Open `e2e/global.setup.ts`
2. Add new entries to the appropriate seed arrays (regions, brands, blends)
3. Use `upsert` with `ignoreDuplicates: true` to handle repeated runs
4. Update the console logging to reflect new data counts

### Adding New Tables for Cleanup

When adding new tables that need cleanup:

1. Open `e2e/global.teardown.ts`
2. Add additional delete operations for new tables
3. Follow the same pattern: filter by `user_id` and log the count
4. Ensure foreign key constraints are respected (delete child records first)

## Best Practices

- **Always use the test user**: Don't create data with production user IDs
- **Use seed data in tests**: Reference the seed brands, regions, and blends instead of creating duplicates
- **Monitor setup/cleanup logs**: Check that the expected number of records are created/deleted
- **Test locally first**: Verify setup and teardown work before pushing to CI
- **Keep it fast**: Only seed essential data and delete what's necessary for a clean state
- **Use idempotent operations**: The setup uses upsert to handle repeated runs gracefully
