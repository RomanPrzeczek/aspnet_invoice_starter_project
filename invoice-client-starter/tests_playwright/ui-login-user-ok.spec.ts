import { test, expect, Page } from '@playwright/test';
import { TID } from "../src/testIds";
import { pwStep } from './testStep';

async function ensureNavExpanded(page: Page) {
  const toggle = page.getByTestId(TID.appLayout_nav.toggle);
  const collapse = page.locator('#navbarNav'); // podle Bootstrap DOM

  // Pokud collapse není na stránce, není co řešit
  if (await collapse.count() === 0) return;

  // Pokud už je otevřené (má class "show"), nic nedělej
  const cls = await collapse.getAttribute('class');
  if (cls?.includes('show')) return;

  // Pokud toggle neexistuje (desktop), nic nedělej
  if (await toggle.count() === 0) return;

  // Otevři a počkej na "show"
  await toggle.click();
  await expect(collapse).toHaveClass(/show/, { timeout: 10_000 });
}

test('UI-LOGIN/LOGOUT-001 – úspěšný login/logout běžného uživatele', async ({ page }) => {
  const TC = "Playwright";
  const TOTAL = 8;

  await pwStep(TC, 1, TOTAL, "Izolace testu", async () => {
    await page.context().clearCookies();
    // 📱 vynucení mobilního viewportu (hamburger menu)
    await page.setViewportSize({ width: 390, height: 844 });
  });

  await pwStep(TC, 2, TOTAL, "Ověření přesměrování /login", async () => {
    await page.goto("/login");
  });

  await pwStep(TC, 3, TOTAL, "Vyplnění přihlašovacích údajů", async () => {
    await page.locator("#password").fill("Testino123+");
    await page.locator("#email").fill("testino@example.com");
  });

  await pwStep(TC, 4, TOTAL, "Klik na \"Přihlásit se\" + čekání na BE", async () => {
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes('/api/persons') && response.status() === 200,
        { timeout: 90_000 }
      ),
      page.getByRole('button', { name: /login|přihlásit se/i }).click(),
    ]);
  });

  await pwStep(TC, 5, TOTAL, "Ověření přesměrování na /persons", async () => {
    await expect(page).toHaveURL(/\/persons/, { timeout: 90_000 });
  });

  await pwStep(TC, 6, TOTAL, "Ověření přihlášeného uživatele (emailu) v navigaci", async () => {
    // ✅ nejdřív rozbalí nav, pokud je v hamburger stavu
    await ensureNavExpanded(page);

    // ✅ omezí to na navbar/collapse, ať nečte celý dokument
    const navArea = page.locator('nav.navbar');
    await expect(navArea).toContainText(/(Přihlášen|Logged in)\s*:\s*testino@example\.com/i, { timeout: 30_000 });
  });

  await pwStep(TC, 7, TOTAL, "Ověření odhlášení, přítomnost + klik tlačítka (Odhlásit se)", async () => {
    // ✅ pro jistotu také (kdyby se mezitím změnil viewport)
    await ensureNavExpanded(page);

    const logout = page.getByTestId(TID.appLayout_nav.logout);
    await expect(logout).toBeVisible({ timeout: 10_000 });
    await logout.click();
  });

  await pwStep(TC, 8, TOTAL, "Ověření přesměrování (návratu) na /login stránku", async () => {
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
  });
});