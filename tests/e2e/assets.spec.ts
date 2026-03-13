import { test, expect } from './fixtures/auth';

test.describe('Assets', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/assets');
    await expect(page.getByTestId('assets-page')).toBeVisible({ timeout: 10_000 });
  });

  test('should display the assets page with summary cards', async ({ authenticatedPage: page }) => {
    await expect(page.getByTestId('assets-page')).toBeVisible();
    await expect(page.getByTestId('asset-summary')).toBeVisible();
    await expect(page.getByText('Total Assets')).toBeVisible();
    await expect(page.getByText('Fixed Assets')).toBeVisible();
    await expect(page.getByText('Current Assets')).toBeVisible();
    await expect(page.getByText('Asset Count')).toBeVisible();
  });

  test('should open the add asset form', async ({ authenticatedPage: page }) => {
    await page.getByTestId('add-asset-btn').click();
    await expect(page.getByTestId('asset-form')).toBeVisible();
    await expect(page.getByTestId('asset-name')).toBeVisible();
    await expect(page.getByTestId('asset-classification')).toBeVisible();
    await expect(page.getByTestId('asset-type')).toBeVisible();
    await expect(page.getByTestId('asset-purchase-price')).toBeVisible();
    await expect(page.getByTestId('asset-current-value')).toBeVisible();
    await expect(page.getByTestId('asset-purchase-date')).toBeVisible();
  });

  test('should create a fixed asset', async ({ authenticatedPage: page }) => {
    await page.getByTestId('add-asset-btn').click();

    await page.getByTestId('asset-name').fill('Test Property');
    await page.getByTestId('asset-classification').selectOption('fixed');
    await page.getByTestId('asset-type').selectOption('real_estate');
    await page.getByTestId('asset-purchase-price').fill('5000000');
    await page.getByTestId('asset-current-value').fill('6000000');
    await page.getByTestId('asset-purchase-date').fill('2023-01-15');
    await page.getByTestId('asset-save').click();

    // Form should close and asset should appear
    await expect(page.getByTestId('asset-form')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Test Property')).toBeVisible({ timeout: 10_000 });
  });

  test('should create a current asset', async ({ authenticatedPage: page }) => {
    await page.getByTestId('add-asset-btn').click();

    await page.getByTestId('asset-name').fill('Test Investment');
    await page.getByTestId('asset-classification').selectOption('current');
    await page.getByTestId('asset-type').selectOption('investment');
    await page.getByTestId('asset-purchase-price').fill('100000');
    await page.getByTestId('asset-current-value').fill('115000');
    await page.getByTestId('asset-purchase-date').fill('2024-06-01');
    await page.getByTestId('asset-save').click();

    await expect(page.getByTestId('asset-form')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Test Investment')).toBeVisible({ timeout: 10_000 });
  });

  test('should filter assets by classification', async ({ authenticatedPage: page }) => {
    await expect(page.getByTestId('asset-filters')).toBeVisible();
    // Click Fixed Assets tab
    await page.getByRole('button', { name: 'Fixed Assets' }).click();
    // Click Current Assets tab
    await page.getByRole('button', { name: 'Current Assets' }).click();
    // Click All tab
    await page.getByRole('button', { name: 'All' }).click();
  });

  test('should navigate to asset detail page', async ({ authenticatedPage: page }) => {
    const card = page.getByTestId('asset-card').first();
    if (await card.isVisible()) {
      await card.click();
      await expect(page.getByTestId('asset-detail-page')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('asset-metrics')).toBeVisible();
    }
  });

  test('should add a valuation on detail page', async ({ authenticatedPage: page }) => {
    const card = page.getByTestId('asset-card').first();
    if (await card.isVisible()) {
      await card.click();
      await expect(page.getByTestId('asset-detail-page')).toBeVisible({ timeout: 10_000 });

      const addBtn = page.getByTestId('add-valuation-btn');
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await expect(page.getByTestId('add-valuation-form')).toBeVisible();

        await page.getByTestId('valuation-value').fill('7000000');
        await page.getByTestId('valuation-date').fill('2025-01-15');
        await page.getByTestId('valuation-notes').fill('Annual revaluation');
        await page.getByTestId('valuation-save').click();

        await expect(page.getByTestId('add-valuation-form')).not.toBeVisible({ timeout: 10_000 });
      }
    }
  });

  test('should open dispose dialog on detail page', async ({ authenticatedPage: page }) => {
    const card = page.getByTestId('asset-card').first();
    if (await card.isVisible()) {
      await card.click();
      await expect(page.getByTestId('asset-detail-page')).toBeVisible({ timeout: 10_000 });

      const disposeBtn = page.getByTestId('dispose-asset-btn');
      if (await disposeBtn.isVisible()) {
        await disposeBtn.click();
        await expect(page.getByTestId('dispose-asset-dialog')).toBeVisible();
        await expect(page.getByTestId('dispose-amount')).toBeVisible();
        await expect(page.getByTestId('dispose-account')).toBeVisible();
        await expect(page.getByTestId('dispose-date')).toBeVisible();
      }
    }
  });
});
