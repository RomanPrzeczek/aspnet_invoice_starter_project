import { test, expect } from '@playwright/test';

test('UI-LOGIN-001 – úspěšný login běžného uživatele', async ({ page }) => {
  // 1️⃣ Otevření login stránky
  await page.goto('/login');

  // 2️⃣ Vyplnění přihlašovacích údajů
  await page.locator('#password').fill('Testino123+');
  await page.locator('#email').fill('testino@example.com'); // pokud má input id=email

// 3️⃣ Klik na "Přihlásit se" + čekání na BE
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/persons') &&
        response.status() === 200,
      { timeout: 90_000 }
    ),
    page.getByRole('button', { name: 'Login' }).click(),
  ]);

  // 4️⃣ Ověření přesměrování
  await expect(page).toHaveURL(/\/persons/, { timeout: 90_000 });

  // 5️⃣ Ověření, že stránka opravdu obsahuje seznam osob
  await expect(page.getByText(/Jméno|Name/i)).toBeVisible({ timeout: 90_000 });
  });
