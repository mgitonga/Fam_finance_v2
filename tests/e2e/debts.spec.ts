import { test, expect } from './fixtures/auth';

test.describe('Debt Tracking', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/debts');
    await expect(page.getByTestId('debts-page')).toBeVisible({ timeout: 10_000 });
  });

  test('should display the debts page with summary', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Debt Tracking')).toBeVisible();
    await expect(page.getByText('Total Outstanding')).toBeVisible();
    await expect(page.getByText('Total Monthly Payments')).toBeVisible();
  });

  test('should open and close the add debt form', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Add Debt/i }).click();
    // Form should show all required fields
    await expect(page.getByPlaceholder('e.g., KCB Mortgage')).toBeVisible();
    // Close form
    await page.getByRole('button', { name: /Cancel/i }).click();
  });

  test('should create a debt', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Add Debt/i }).click();

    // Fill debt form
    await page.getByPlaceholder('e.g., KCB Mortgage').fill('E2E Test Loan');
    await page.locator('select').first().selectOption('personal_loan');

    // Fill numeric fields
    const inputs = page.locator('input[type="number"]');
    await inputs.nth(0).fill('100000'); // Original amount
    await inputs.nth(1).fill('80000'); // Outstanding balance
    await inputs.nth(2).fill('12'); // Interest rate
    await inputs.nth(3).fill('5000'); // Monthly payment

    // Start date
    await page.locator('input[type="date"]').fill('2026-01-01');

    await page.getByRole('button', { name: /Create/i }).click();

    // Debt card should appear
    await expect(page.getByText('E2E Test Loan')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Personal Loan')).toBeVisible();
  });

  test('should show payment form when clicking Pay', async ({ authenticatedPage: page }) => {
    const payBtn = page.getByRole('button', { name: /Pay/i }).first();
    if (await payBtn.isVisible()) {
      await payBtn.click();
      // Payment form should show amount and account fields
      await expect(page.getByPlaceholder('Amount')).toBeVisible();
    }
  });

  test('should show payment history toggle', async ({ authenticatedPage: page }) => {
    const historyBtn = page.getByRole('button', { name: /History/i }).first();
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      // Should show payment history section or "No payments yet"
      await page.waitForTimeout(1000);
    }
  });

  test('should delete a debt', async ({ authenticatedPage: page }) => {
    // Find the test debt we created
    const testDebt = page.locator('text=E2E Test Loan').first();
    if (await testDebt.isVisible()) {
      // Accept the confirmation dialog
      page.on('dialog', (dialog) => dialog.accept());
      // Find the delete button in the same card
      const debtCard = testDebt.locator('xpath=ancestor::div[contains(@class, "rounded-lg")]');
      await debtCard
        .locator('button')
        .filter({ has: page.locator('.text-red-500') })
        .last()
        .click();
      await page.waitForTimeout(2000);
      await expect(testDebt).not.toBeVisible({ timeout: 5000 });
    }
  });
});
