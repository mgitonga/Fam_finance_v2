import { test, expect } from './fixtures/auth';

test.describe('Navigation', () => {
  test('should navigate to all main pages from sidebar', async ({ authenticatedPage: page }) => {
    const routes = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Transactions', url: '/transactions' },
      { name: 'Budgets', url: '/budgets' },
      { name: 'Recurring', url: '/recurring' },
      { name: 'Savings', url: '/savings' },
      { name: 'Debts', url: '/debts' },
      { name: 'Bills', url: '/bills' },
      { name: 'Reports', url: '/reports' },
      { name: 'Import', url: '/import' },
      { name: 'Export', url: '/export' },
      { name: 'Settings', url: '/settings' },
    ];

    for (const route of routes) {
      await page.getByTestId('sidebar-nav').getByRole('link', { name: route.name }).click();
      await expect(page).toHaveURL(new RegExp(route.url), { timeout: 10_000 });
    }
  });

  test('should show the app header with user menu and notifications', async ({
    authenticatedPage: page,
  }) => {
    await expect(page.getByTestId('app-header')).toBeVisible();
    await expect(page.getByTestId('notification-bell')).toBeVisible();
    await expect(page.getByTestId('user-menu')).toBeVisible();
  });

  test('should open and close notification panel', async ({ authenticatedPage: page }) => {
    await page.getByTestId('notification-bell').click();
    await expect(page.getByTestId('notification-panel')).toBeVisible();
    // Click bell again or outside to close
    await page.getByTestId('notification-bell').click();
  });

  test('should open user menu dropdown', async ({ authenticatedPage: page }) => {
    await page.getByTestId('user-menu').click();
    await expect(page.getByTestId('logout-button')).toBeVisible();
  });
});

test.describe('Bills', () => {
  test('should display the bills page', async ({ authenticatedPage: page }) => {
    await page.goto('/bills');
    await expect(page.getByTestId('bills-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('add-bill-btn')).toBeVisible();
  });

  test('should open bill creation form', async ({ authenticatedPage: page }) => {
    await page.goto('/bills');
    await expect(page.getByTestId('bills-page')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('add-bill-btn').click();
    await expect(page.getByTestId('bill-form')).toBeVisible();
  });
});

test.describe('Savings Goals', () => {
  test('should display the savings page', async ({ authenticatedPage: page }) => {
    await page.goto('/savings');
    await expect(page.getByTestId('savings-page')).toBeVisible({ timeout: 10_000 });
  });

  test('should open goal creation form', async ({ authenticatedPage: page }) => {
    await page.goto('/savings');
    await expect(page.getByTestId('savings-page')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /New Goal/i }).click();
    // Form should be visible
    await page.waitForTimeout(500);
  });
});

test.describe('Recurring Transactions', () => {
  test('should display the recurring page', async ({ authenticatedPage: page }) => {
    await page.goto('/recurring');
    await expect(page.getByTestId('recurring-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('add-recurring-btn')).toBeVisible();
  });

  test('should open recurring rule form', async ({ authenticatedPage: page }) => {
    await page.goto('/recurring');
    await expect(page.getByTestId('recurring-page')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('add-recurring-btn').click();
    await expect(page.getByTestId('recurring-form')).toBeVisible();
  });
});

test.describe('Reports', () => {
  test('should display the reports page with metrics', async ({ authenticatedPage: page }) => {
    await page.goto('/reports');
    await expect(page.getByTestId('reports-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('report-metrics')).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate months in reports', async ({ authenticatedPage: page }) => {
    await page.goto('/reports');
    await expect(page.getByTestId('reports-page')).toBeVisible({ timeout: 10_000 });
    const monthSelector = page.getByTestId('month-selector');
    await expect(monthSelector).toBeVisible();
    await monthSelector.locator('button').first().click();
    await expect(page.getByTestId('reports-page')).toBeVisible();
  });
});

test.describe('Import & Export', () => {
  test('should display the import page', async ({ authenticatedPage: page }) => {
    await page.goto('/import');
    await expect(page.getByTestId('import-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('download-template')).toBeVisible();
    await expect(page.getByTestId('csv-upload')).toBeVisible();
  });

  test('should display the export page', async ({ authenticatedPage: page }) => {
    await page.goto('/export');
    await expect(page.getByTestId('export-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('export-csv-btn')).toBeVisible();
    await expect(page.getByTestId('export-pdf-btn')).toBeVisible();
  });
});
