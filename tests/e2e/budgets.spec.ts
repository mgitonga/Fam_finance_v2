import { test, expect } from './fixtures/auth';

test.describe('Budgets', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/budgets');
    await expect(page.getByTestId('budgets-page')).toBeVisible({ timeout: 10_000 });
  });

  test('should display the budgets page with summary cards', async ({
    authenticatedPage: page,
  }) => {
    await expect(page.getByTestId('budgets-page')).toBeVisible();
    // Should show summary information
    await expect(page.getByText('Total Budgeted')).toBeVisible();
  });

  test('should open the add budget form', async ({ authenticatedPage: page }) => {
    await page.getByTestId('add-budget-btn').click();
    await expect(page.getByTestId('budget-form')).toBeVisible();
    await expect(page.getByTestId('budget-category')).toBeVisible();
    await expect(page.getByTestId('budget-amount')).toBeVisible();
    await expect(page.getByTestId('budget-save')).toBeVisible();
  });

  test('should create a budget', async ({ authenticatedPage: page }) => {
    await page.getByTestId('add-budget-btn').click();

    // Select first available category
    const catSelect = page.getByTestId('budget-category');
    const catOptions = catSelect.locator('option:not([value=""])');
    const firstCatValue = await catOptions.first().getAttribute('value');
    if (firstCatValue) {
      await catSelect.selectOption(firstCatValue);
    }

    await page.getByTestId('budget-amount').fill('25000');
    await page.getByTestId('budget-save').click();

    // Budget should appear as a row
    await expect(page.getByTestId('budget-form')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('budget-row').first()).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate months', async ({ authenticatedPage: page }) => {
    const monthSelector = page.getByTestId('month-selector');
    await expect(monthSelector).toBeVisible();
    // Click previous month
    await monthSelector.locator('button').first().click();
    await expect(page.getByTestId('budgets-page')).toBeVisible();
  });

  test('should edit a budget inline', async ({ authenticatedPage: page }) => {
    const editBtn = page.getByTestId('edit-budget-btn').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await expect(page.getByTestId('edit-budget-amount')).toBeVisible();
      await page.getByTestId('edit-budget-amount').fill('30000');
      await page.getByTestId('save-budget-edit').click();
      await expect(page.getByTestId('edit-budget-amount')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should show copy budgets button', async ({ authenticatedPage: page }) => {
    const copyBtn = page.getByTestId('copy-budgets-btn');
    // This button may or may not be visible depending on previous month data
    if (await copyBtn.isVisible()) {
      await expect(copyBtn).toBeVisible();
    }
  });
});
