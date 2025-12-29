import { test, expect } from '@playwright/test';
import {TID} from "../src/testIds";

test('UI-LOGIN-001 – úspěšný login běžného uživatele', async ({ page }) => {
  // 0️⃣ ověření existujícího přihlášen (izolace testu)
  await page.context().clearCookies();

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
    page.getByRole('button', { name: /login|přihlásit se/i }).click(),
  ]);

  // 4️⃣ Ověření přesměrování
  await expect(page).toHaveURL(/\/persons/, { timeout: 90_000 });

  // 5️⃣ Ověření přihlášeného uživatele v navigaci
  await expect(
    page.getByText(/Přihlášen|Logged in\:\s*testino@example\.com/i)
  ).toBeVisible({ timeout: 90_000 });

  // 6️⃣ Ověření, že je k dispozici odhlášení (autentizovaný stav)
  const logout = page.getByTestId(TID.nav.logout);

  if (!(await logout.isVisible())) {
    await page.getByTestId(TID.nav.toggle).click();
  }
  await expect(logout).toBeVisible({ timeout: 10_000 });
  await logout.click();

  // 7️⃣ Ověření návratu na /login stránku.
  await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
    
  });
