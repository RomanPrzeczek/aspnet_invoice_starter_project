import { test, expect } from '@playwright/test';

test('UI-LOGIN-d1 – brand link přepíná /aboutApp <-> /login pro nepřihlášeného', async ({ page }) => {
  // 1) jdi na aboutApp (jinak tě useEffect přesměruje na /login)
  await page.goto('/aboutApp');
  await expect(page).toHaveURL(/\/aboutApp/);

  // brand je Link s class navbar-brand
  const brand = page.locator('a.navbar-brand');

  // 2) na /aboutApp má brand vést na /login a label má obsahovat "Login"
  await expect(brand).toHaveAttribute('href', '/login');
  await expect(brand).toContainText(/Login|Přihlásit/i);

  // 3) klik -> /login
  await brand.click();
  await expect(page).toHaveURL(/\/login/);

  // 4) na /login má brand vést na /aboutApp a obsahovat "About"
  await expect(brand).toHaveAttribute('href', '/aboutApp');
  await expect(brand).toContainText(/About|O aplikaci/i);
});

test('UI-LOGIN-d2 – toggle oka přepíná viditelnost hesla', async ({ page }) => {
  await page.goto('/login');

  const passwordInput = page.locator('#password');
  await expect(passwordInput).toBeVisible();
  await expect(passwordInput).toHaveAttribute('type', 'password');

  // stabilní selektor (nezávislý na aria-label / jazyku)
  const toggle = page.locator('button.password-toggle-icon');
  await expect(toggle).toBeVisible();

  await toggle.click();
  await expect(passwordInput).toHaveAttribute('type', 'text');

  await toggle.click();
  await expect(passwordInput).toHaveAttribute('type', 'password');
});

