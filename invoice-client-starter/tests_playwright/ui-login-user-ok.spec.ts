import { test, expect } from '@playwright/test';
import {TID} from "../src/testIds";
import { pwStep } from './testStep';

test('UI-LOGIN/LOGOUT-001 – úspěšný login/logout běžného uživatele', async ({ page }) => {
  const TC = "Playwright";
  const TOTAL = 8;

  // 0️⃣ ověření existujícího přihlášen (izolace testu)
  await pwStep(TC, 1, TOTAL, "Izolace testu", async () => {
    await page.context().clearCookies();
  });

  // 1️⃣ Otevření login stránky
  await pwStep(TC, 2, TOTAL, "Ověření přesměrování /login", async () => {
    await page.goto("/login");
  });

  // 2️⃣ Vyplnění přihlašovacích údajů
  await pwStep(TC, 3, TOTAL, "Vyplnění přihlašovacích údajů", async () => {
    await page.locator("#password").fill("Testino123+");
    await page.locator("#email").fill("testino@example.com");
  });

  // 3️⃣ Klik na "Přihlásit se" + čekání na BE
  await pwStep(TC, 4, TOTAL, "Klik na \"Přihlásit se\" + čekání na BE", async () => {
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/persons') &&
          response.status() === 200,
        { timeout: 90_000 }
      ),
      page.getByRole('button', { name: /login|přihlásit se/i }).click(),
    ]);
  });

  // 4️⃣ Ověření přesměrování
  await pwStep(TC, 5, TOTAL, "Ověření přesměrování na /persons", async () => {
    await expect(page).toHaveURL(/\/persons/, { timeout: 90_000 });
  });

  // 5️⃣ Ověření přihlášeného uživatele v navigaci
  await pwStep(TC, 6, TOTAL, "Ověření přihlášeného uživatele (emailu) v navigaci", async () => {
    await expect(
      page.getByText(/Přihlášen|Logged in\:\s*testino@example\.com/i)
    ).toBeVisible({ timeout: 90_000 });
  });

  // 6️⃣ Ověření, že je k dispozici odhlášení (autentizovaný stav)
  await pwStep(TC, 7, TOTAL, "Ověření odhlášení, přítomnost + klik tlačítka (Odhlásit se)", async () => {
    const logout = page.getByTestId(TID.appLayout_nav.logout);
    if (!(await logout.isVisible())) {
      await page.getByTestId(TID.appLayout_nav.toggle).click();
    }
    await expect(logout).toBeVisible({ timeout: 10_000 });
    await logout.click();
  });

  // 7️⃣ Ověření návratu na /login stránku.
  await pwStep(TC, 8, TOTAL, "Ověření přesměrování (návratu) na /login stránku", async () => {
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
  });
});