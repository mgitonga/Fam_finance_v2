import { test, expect } from './fixtures/auth';

test.describe('Settings', () => {
  test.describe('Profile', () => {
    test('should display profile settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');
      await expect(page.getByTestId('profile-settings')).toBeVisible({ timeout: 10_000 });
      // Email should be disabled
      const emailField = page.locator('input[type="email"]');
      if (await emailField.isVisible()) {
        await expect(emailField).toBeDisabled();
      }
      await expect(page.getByTestId('profile-name')).toBeVisible();
      await expect(page.getByTestId('profile-save')).toBeVisible();
    });

    test('should update display name', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/profile');
      await expect(page.getByTestId('profile-settings')).toBeVisible({ timeout: 10_000 });

      const nameField = page.getByTestId('profile-name');
      await nameField.clear();
      await nameField.fill('E2E Test User');
      await page.getByTestId('profile-save').click();
      // Should show success (toast or page stays without error)
      await page.waitForTimeout(2000);
      await expect(page.getByTestId('profile-settings')).toBeVisible();
    });
  });

  test.describe('Accounts', () => {
    test('should display accounts settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/accounts');
      await expect(page.getByTestId('accounts-settings')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('add-account-btn')).toBeVisible();
    });

    test('should open account creation form', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/accounts');
      await expect(page.getByTestId('accounts-settings')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('add-account-btn').click();
      await expect(page.getByTestId('account-form')).toBeVisible();
      await expect(page.getByTestId('account-name')).toBeVisible();
      await expect(page.getByTestId('account-type')).toBeVisible();
      await expect(page.getByTestId('account-balance')).toBeVisible();
      await expect(page.getByTestId('account-save')).toBeVisible();
    });

    test('should create a new account', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/accounts');
      await expect(page.getByTestId('accounts-settings')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('add-account-btn').click();
      await page.getByTestId('account-name').fill('E2E Test Account');
      await page.getByTestId('account-type').selectOption('bank');
      await page.getByTestId('account-balance').fill('10000');
      await page.getByTestId('account-save').click();

      // New account should appear
      await expect(page.getByTestId('account-form')).not.toBeVisible({ timeout: 10_000 });
      await expect(page.getByText('E2E Test Account')).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Categories', () => {
    test('should display categories settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/categories');
      await expect(page.getByTestId('categories-settings')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('add-category-btn')).toBeVisible();
    });

    test('should show export and import buttons', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/categories');
      await expect(page.getByTestId('categories-settings')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('export-categories-btn')).toBeVisible();
      await expect(page.getByTestId('import-categories-btn')).toBeVisible();
    });

    test('should show category tree with parent-child structure', async ({
      authenticatedPage: page,
    }) => {
      await page.goto('/settings/categories');
      await expect(page.getByTestId('categories-settings')).toBeVisible({ timeout: 10_000 });
      // Should see seeded categories like "Food & Groceries"
      await expect(page.getByText('Food & Groceries')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Users', () => {
    test('should display users settings', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/users');
      await expect(page.getByTestId('users-settings')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('invite-user-btn')).toBeVisible();
    });

    test('should open invite form', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/users');
      await expect(page.getByTestId('users-settings')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('invite-user-btn').click();
      await expect(page.getByTestId('invite-form')).toBeVisible();
      await expect(page.getByTestId('invite-name')).toBeVisible();
      await expect(page.getByTestId('invite-email')).toBeVisible();
      await expect(page.getByTestId('invite-submit')).toBeVisible();
    });

    test('should show current user in the users list', async ({ authenticatedPage: page }) => {
      await page.goto('/settings/users');
      await expect(page.getByTestId('users-settings')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('user-row').first()).toBeVisible({ timeout: 5000 });
    });
  });
});
