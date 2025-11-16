# E2E Test Database Cleanup

This directory contains the global teardown configuration for cleaning up test data after E2E tests complete.

## Overview

The teardown process automatically cleans up the Supabase database after all E2E tests have finished running. This ensures:

- No test data pollution between test runs
- A clean slate for each test execution
- Proper resource cleanup

## Files

### `global.teardown.ts`

This file contains the teardown logic that:

1. Connects to Supabase using credentials from `.env.test`
2. Deletes all tasting notes created by the test user (identified by `E2E_USERNAME_ID`)
3. Provides detailed console logging for debugging
4. Handles errors gracefully with informative messages

## Configuration

The teardown is configured in `playwright.config.ts`:

```typescript
projects: [
  {
    name: "cleanup db",
    testMatch: /global\.teardown\.ts/,
  },
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
    teardown: "cleanup db",
  },
];
```

This setup ensures:

- The teardown runs after all tests in the "chromium" project complete
- Cleanup is isolated to a separate project for better visibility in reports
- Traces are captured if the teardown fails

## Environment Variables

Required variables in `.env.test`:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon/service key
- `E2E_USERNAME_ID` - The UUID of the test user whose data should be cleaned up

## How It Works

### Execution Flow

1. All E2E tests run in the "chromium" project
2. After all tests complete (success or failure), the "cleanup db" project runs
3. The teardown connects to Supabase and deletes tasting notes for the test user
4. Console output shows the number of records deleted

### Safety Features

- **User Isolation**: Only deletes data for the specific test user ID
- **Error Handling**: Throws errors if environment variables are missing
- **Logging**: Provides detailed console output for monitoring and debugging
- **Type Safety**: Uses generated TypeScript types from Supabase schema

## Running Tests

The teardown runs automatically when you execute E2E tests:

```bash
# Run all E2E tests with automatic cleanup
npm run test:e2e

# Run with UI mode (cleanup still runs after)
npm run test:e2e:ui
```

## Skipping Teardown

If you need to skip the teardown (e.g., to inspect test data):

```bash
# Run tests without dependencies/teardown
npx playwright test --no-deps
```

## Troubleshooting

### Teardown fails with "Missing Supabase configuration"

Ensure `.env.test` contains valid `SUPABASE_URL` and `SUPABASE_KEY` values.

### No records deleted (count shows 0)

This is normal if:

- Tests were skipped or didn't create any data
- The test user ID doesn't match any records
- Previous cleanup already removed the data

### Permission errors

Ensure the `SUPABASE_KEY` has sufficient permissions to delete records from the `tasting_notes` table.

## Maintenance

When adding new tables that need cleanup:

1. Open `e2e/global.teardown.ts`
2. Add additional delete operations for new tables
3. Follow the same pattern: filter by `user_id` and log the count
4. Ensure foreign key constraints are respected (delete child records first)

## Best Practices

- **Always use the test user**: Don't create data with production user IDs
- **Monitor cleanup logs**: Check that the expected number of records are deleted
- **Test locally first**: Verify teardown works before pushing to CI
- **Keep it fast**: Only delete what's necessary for a clean state
