import { test, expect } from '@playwright/test';
import { loginViaUI, TEST_EMAIL } from './fixtures/auth';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should display the login page', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByTestId('login-page')).toBeVisible();
      await expect(page.getByTestId('login-form')).toBeVisible();
      await expect(page.getByTestId('login-email')).toBeVisible();
      await expect(page.getByTestId('login-password')).toBeVisible();
      await expect(page.getByTestId('login-submit')).toBeVisible();
    });

    test('should show links to register and forgot password', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByTestId('forgot-password-link')).toBeVisible();
      await expect(page.getByTestId('register-link')).toBeVisible();
    });

    test('should log in with valid credentials and redirect to dashboard', async ({ page }) => {
      await loginViaUI(page);
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByTestId('dashboard-page')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.getByTestId('login-email').fill('wrong@email.com');
      await page.getByTestId('login-password').fill('WrongPassword123!');
      await page.getByTestId('login-submit').click();
      await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10_000 });
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');
      await page.getByTestId('login-submit').click();
      // Zod validation should prevent submission — form stays on login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should navigate to forgot password page', async ({ page }) => {
      await page.goto('/login');
      await page.getByTestId('forgot-password-link').click();
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test('should navigate to register page', async ({ page }) => {
      await page.goto('/login');
      await page.getByTestId('register-link').click();
      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe('Register', () => {
    test('should display the register page with all fields', async ({ page }) => {
      await page.goto('/register');
      await expect(page.getByTestId('register-page')).toBeVisible();
      await expect(page.getByTestId('register-form')).toBeVisible();
      await expect(page.getByTestId('register-name')).toBeVisible();
      await expect(page.getByTestId('register-email')).toBeVisible();
      await expect(page.getByTestId('register-household')).toBeVisible();
      await expect(page.getByTestId('register-password')).toBeVisible();
      await expect(page.getByTestId('register-confirm-password')).toBeVisible();
      await expect(page.getByTestId('register-submit')).toBeVisible();
    });

    test('should navigate to login from register page', async ({ page }) => {
      await page.goto('/register');
      await page.getByTestId('login-link').click();
      await expect(page).toHaveURL(/\/login/);
    });

    test('should show validation errors for empty submission', async ({ page }) => {
      await page.goto('/register');
      await page.getByTestId('register-submit').click();
      // Should stay on register page due to validation
      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe('Forgot Password', () => {
    test('should display the forgot password page', async ({ page }) => {
      await page.goto('/forgot-password');
      await expect(page.getByTestId('forgot-password-page')).toBeVisible();
      await expect(page.getByTestId('forgot-form')).toBeVisible();
      await expect(page.getByTestId('forgot-email')).toBeVisible();
      await expect(page.getByTestId('forgot-submit')).toBeVisible();
    });

    test('should submit email and show success message', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.getByTestId('forgot-email').fill(TEST_EMAIL);
      await page.getByTestId('forgot-submit').click();
      await expect(page.getByTestId('forgot-success')).toBeVisible({ timeout: 10_000 });
    });

    test('should navigate back to login', async ({ page }) => {
      await page.goto('/forgot-password');
      await page.getByTestId('back-to-login').click();
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Auth Guard', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated users from transactions', async ({ page }) => {
      await page.goto('/transactions');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated users from settings', async ({ page }) => {
      await page.goto('/settings');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Logout', () => {
    test('should log out and redirect to login', async ({ page }) => {
      // First log in
      await loginViaUI(page);
      // Open user menu and click logout
      await page.getByTestId('user-menu').click();
      await page.getByTestId('logout-button').click();
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
      // Trying to access dashboard should redirect to login
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
