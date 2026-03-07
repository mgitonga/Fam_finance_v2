import { test, expect } from './fixtures/auth';

test.describe('Dashboard', () => {
  test('should display the dashboard with metrics', async ({ authenticatedPage: page }) => {
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    // Metric cards widget should be visible
    await expect(page.getByTestId('widget-metric-cards')).toBeVisible();
  });

  test('should show budget vs actual bullet chart widget', async ({ authenticatedPage: page }) => {
    await expect(page.getByTestId('widget-budget-vs-actual')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('budget-actual-chart')).toBeVisible();
  });

  test('should show recent transactions widget', async ({ authenticatedPage: page }) => {
    await expect(page.getByTestId('widget-recent-transactions')).toBeVisible({ timeout: 10_000 });
  });

  test('should show account balances widget', async ({ authenticatedPage: page }) => {
    await expect(page.getByTestId('widget-account-balances')).toBeVisible({ timeout: 10_000 });
  });

  test('should show debt overview widget', async ({ authenticatedPage: page }) => {
    await expect(page.getByTestId('widget-debt-overview')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('debt-overview-widget')).toBeVisible();
  });

  test('should navigate months with month selector', async ({ authenticatedPage: page }) => {
    const monthSelector = page.getByTestId('month-selector');
    await expect(monthSelector).toBeVisible();
    // Click previous month
    await monthSelector.locator('button').first().click();
    // Dashboard should reload (no error)
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    // Click next month to go back
    await monthSelector.locator('button').last().click();
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });
});
