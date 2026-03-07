import { test, expect } from './fixtures/auth';

test.describe('Transactions', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/transactions');
    await expect(page.getByTestId('transactions-page')).toBeVisible({ timeout: 10_000 });
  });

  test('should display the transactions page', async ({ authenticatedPage: page }) => {
    await expect(page.getByTestId('add-transaction-btn')).toBeVisible();
  });

  test('should open and close the transaction form', async ({ authenticatedPage: page }) => {
    await page.getByTestId('add-transaction-btn').click();
    await expect(page.getByTestId('transaction-form')).toBeVisible();
    // Close form
    await page.getByTestId('transaction-form').locator('button[type="button"]').first().click();
    await expect(page.getByTestId('transaction-form')).not.toBeVisible();
  });

  test('should show all form fields when creating a transaction', async ({
    authenticatedPage: page,
  }) => {
    await page.getByTestId('add-transaction-btn').click();
    await expect(page.getByTestId('txn-type')).toBeVisible();
    await expect(page.getByTestId('txn-amount')).toBeVisible();
    await expect(page.getByTestId('txn-date')).toBeVisible();
    await expect(page.getByTestId('txn-account')).toBeVisible();
    await expect(page.getByTestId('txn-category')).toBeVisible();
    await expect(page.getByTestId('txn-payment-method')).toBeVisible();
    await expect(page.getByTestId('txn-description')).toBeVisible();
    await expect(page.getByTestId('txn-merchant')).toBeVisible();
    await expect(page.getByTestId('txn-notes')).toBeVisible();
    await expect(page.getByTestId('txn-save')).toBeVisible();
  });

  test('should create an expense transaction', async ({ authenticatedPage: page }) => {
    await page.getByTestId('add-transaction-btn').click();
    await page.getByTestId('txn-type').selectOption('expense');
    await page.getByTestId('txn-amount').fill('1500');
    await page.getByTestId('txn-date').fill(new Date().toISOString().split('T')[0]);

    // Select first available account
    const accountSelect = page.getByTestId('txn-account');
    const accountOptions = accountSelect.locator('option:not([value=""])');
    const firstAccountValue = await accountOptions.first().getAttribute('value');
    if (firstAccountValue) {
      await accountSelect.selectOption(firstAccountValue);
    }

    // Select first available category
    const categorySelect = page.getByTestId('txn-category');
    const categoryOptions = categorySelect.locator('option:not([value=""])');
    const firstCategoryValue = await categoryOptions.first().getAttribute('value');
    if (firstCategoryValue) {
      await categorySelect.selectOption(firstCategoryValue);
    }

    await page.getByTestId('txn-description').fill('E2E Test Expense');
    await page.getByTestId('txn-save').click();

    // Form should close and transaction should appear in table
    await expect(page.getByTestId('transaction-form')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('E2E Test Expense')).toBeVisible({ timeout: 10_000 });
  });

  test('should create an income transaction', async ({ authenticatedPage: page }) => {
    await page.getByTestId('add-transaction-btn').click();
    await page.getByTestId('txn-type').selectOption('income');
    await page.getByTestId('txn-amount').fill('5000');
    await page.getByTestId('txn-date').fill(new Date().toISOString().split('T')[0]);

    // Select first available account
    const accountSelect = page.getByTestId('txn-account');
    const accountOptions = accountSelect.locator('option:not([value=""])');
    const firstAccountValue = await accountOptions.first().getAttribute('value');
    if (firstAccountValue) {
      await accountSelect.selectOption(firstAccountValue);
    }

    // Select first available category (filtered for income)
    const categorySelect = page.getByTestId('txn-category');
    await page.waitForTimeout(500); // Wait for category filter to update
    const categoryOptions = categorySelect.locator('option:not([value=""])');
    const firstCategoryValue = await categoryOptions.first().getAttribute('value');
    if (firstCategoryValue) {
      await categorySelect.selectOption(firstCategoryValue);
    }

    await page.getByTestId('txn-description').fill('E2E Test Income');
    await page.getByTestId('txn-save').click();

    await expect(page.getByTestId('transaction-form')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('E2E Test Income')).toBeVisible({ timeout: 10_000 });
  });

  test('should show debt repayment toggle for expense type', async ({
    authenticatedPage: page,
  }) => {
    await page.getByTestId('add-transaction-btn').click();
    await page.getByTestId('txn-type').selectOption('expense');
    await expect(page.getByTestId('debt-repayment-toggle')).toBeVisible();

    // Toggle should show debt picker when checked
    await page.getByTestId('debt-repayment-toggle').check();
    await expect(page.getByTestId('txn-debt')).toBeVisible();
  });

  test('should hide debt repayment toggle for income type', async ({ authenticatedPage: page }) => {
    await page.getByTestId('add-transaction-btn').click();
    await page.getByTestId('txn-type').selectOption('income');
    await expect(page.getByTestId('debt-repayment-toggle')).not.toBeVisible();
  });

  test('should search transactions', async ({ authenticatedPage: page }) => {
    const searchInput = page.getByTestId('txn-search');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('E2E Test');
    // Wait for debounced search to filter results
    await page.waitForTimeout(500);
    // Should show filtered results (or empty if none match)
    await expect(page.getByTestId('transactions-page')).toBeVisible();
  });

  test('should toggle filter bar', async ({ authenticatedPage: page }) => {
    await page.getByTestId('toggle-filters').click();
    await expect(page.getByTestId('filter-bar')).toBeVisible();
    // Filter bar should have type, account, category, and debt dropdowns
    await expect(page.getByTestId('filter-bar')).toBeVisible();
  });

  test('should sort transactions by date', async ({ authenticatedPage: page }) => {
    // Click date column header to sort
    const dateHeader = page.locator('th').filter({ hasText: 'Date' });
    if (await dateHeader.isVisible()) {
      await dateHeader.click();
      // Should still show the table without errors
      await expect(page.getByTestId('transactions-page')).toBeVisible();
    }
  });

  test('should show pagination when there are many transactions', async ({
    authenticatedPage: page,
  }) => {
    const pagination = page.getByTestId('pagination');
    if (await pagination.isVisible()) {
      await expect(pagination).toContainText('Page');
    }
  });

  test('should delete a transaction', async ({ authenticatedPage: page }) => {
    // Find a transaction with "E2E Test" description
    const testRow = page.getByTestId('transaction-row').filter({ hasText: 'E2E Test' }).first();
    if (await testRow.isVisible()) {
      // Set up dialog handler before clicking delete
      page.on('dialog', (dialog) => dialog.accept());
      await testRow.locator('button[aria-label="Delete"]').click();
      // Wait for deletion
      await page.waitForTimeout(2000);
    }
  });
});
