import { test as base, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Test‑user credentials – use an existing seeded user on the dev DB.
// Override via env vars if needed: E2E_EMAIL / E2E_PASSWORD
// ---------------------------------------------------------------------------
const TEST_EMAIL = process.env.E2E_EMAIL ?? 'meshack@gitonga.me';
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? 'Tester@2025';

// ---------------------------------------------------------------------------
// Helper: log in via the UI and wait for the dashboard to load
// ---------------------------------------------------------------------------
async function loginViaUI(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  // Wait for navigation to dashboard (server action redirects)
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Custom fixture: `authenticatedPage` — a page that is already logged in.
// Uses storageState to persist cookies between tests in the same worker.
// ---------------------------------------------------------------------------
type AuthFixtures = {
  authenticatedPage: Page;
};

/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, context }, use) => {
    await loginViaUI(page);
    // Save auth state for potential reuse
    await context.storageState({ path: '.auth/user.json' });
    await use(page);
  },
});
/* eslint-enable react-hooks/rules-of-hooks */

export { expect, loginViaUI, TEST_EMAIL, TEST_PASSWORD };
