import { Builder, By, until, WebDriver, WebElement } from "selenium-webdriver";
import { expect } from "chai";

import { TID } from "../src/testIds.js";

describe("UI-LOGIN-001 – úspěšný login běžného uživatele (Selenium)", function () {
  
  let driver: WebDriver;

  const baseUrl = process.env.FE_BASE_URL ?? "https://fe.local.test:5173/";
  const email = "testino@example.com";
  const password = "Testino123+";

  before(async () => {

    driver = await new Builder()
      .forBrowser("MicrosoftEdge")
      .build();
  });

  after(async () => {
    await driver.quit();
  });

  async function findButtonByText(
    driver: WebDriver,
    pattern: RegExp,
    timeoutMs: number
  ): Promise<WebElement> {
    const end = Date.now() + timeoutMs;
  
    while (Date.now() < end) {
      const buttons = await driver.findElements(By.css("button"));
      for (const b of buttons) {
        const txt = (await b.getText()).trim();
        if (pattern.test(txt)) return b;
      }
      await driver.sleep(200);
    }
  
    throw new Error(`Button not found by text: ${pattern}`);
  }
  

  async function ensureLogoutVisible() {
    const logoutSel = By.css(`[data-testid="${TID.nav.logout}"]`);
    const toggleSel = By.css(`[data-testid="${TID.nav.toggle}"]`);

    const logoutCandidates = await driver.findElements(logoutSel);
    const isVisible =
      logoutCandidates.length > 0 && (await logoutCandidates[0].isDisplayed()).valueOf();

    if (!isVisible) {
      const toggle = await driver.wait(until.elementLocated(toggleSel), 10_000);
      await toggle.click();
    }

    await driver.wait(until.elementLocated(logoutSel), 10_000);
    const logout = await driver.findElement(logoutSel);
    await driver.wait(async () => (await logout.isDisplayed()) === true, 10_000);
    return logout;
  }

  it("po loginu přesměruje na /persons a v navbaru ukáže přihlášeného uživatele + odhlášení", async () => {
    // 0) Izolace testu
    await driver.manage().deleteAllCookies();
    await driver.get(`${baseUrl}/login`);
    await driver.executeScript(`
      window.localStorage.clear();
      window.sessionStorage.clear();
    `);
    await driver.navigate().refresh();

    // 1) Jsme na login
    await driver.wait(until.urlContains("/login"), 10_000);

    // 2) Vyplnění údajů 
    const emailInput = await driver.wait(until.elementLocated(By.css("#email")), 10_000);
    await emailInput.clear();
    await emailInput.sendKeys(email);

    const passwordInput = await driver.findElement(By.css("#password"));
    await passwordInput.clear();
    await passwordInput.sendKeys(password);

    // 3) Klik na Login / Přihlásit se
    const loginBtn = await findButtonByText(driver, /^(login|přihlásit\s*se)$/i, 10_000);
    await loginBtn.click();

    // 4) Přesměrování na /persons
    await driver.wait(until.urlMatches(/\/persons/), 90_000);
    expect(await driver.getCurrentUrl()).to.match(/\/persons/);

    // 5) Navbar: přihlášený uživatel (CZ/EN)
    await driver.wait(async () => {
      const text = await driver.findElement(By.css("body")).getText();
      return /(Přihlášen|Logged in)\s*:\s*testino@example\.com/i.test(text);
    }, 90_000);

    // 6) Logout button (CZ/EN)
    const logoutBtn = await ensureLogoutVisible();
    await logoutBtn.click();

    await driver.wait(until.urlMatches(/\/login/), 30_000);
  });
}).timeout(120_000);