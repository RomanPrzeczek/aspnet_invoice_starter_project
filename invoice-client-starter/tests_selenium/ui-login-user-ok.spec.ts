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

      // simulace mobilního viewportu (390x844)
      await driver.manage().window().setRect({ width: 390, height: 844, x: 0, y: 0 });
  });

  after(async () => {
    await driver.quit();
  });
 
  async function clickNavbarIcon() {
    const toggleSel  = By.css(`[data-testid="${TID.appLayout_nav.toggle}"]`);
    const toggleExists = await driver.findElements(toggleSel).then(elems => elems.length) > 0;
    const toggleIsVisible = toggleExists ? await driver.findElement(toggleSel).isDisplayed() : false; 
    console.log(`\nNavbar toggle visible: ${toggleIsVisible}\n`);
    if(!toggleIsVisible) {
      console.log("\nNavbar toggle neexistuje, pravděpodobně desktop – není potřeba klikat\n");
      return;
    } else {
      console.log("\nNavbar toggle existuje.\n");
      const toggle = await driver.wait(until.elementLocated(toggleSel), 10_000);
      await driver.wait(until.elementIsVisible(toggle), 10_000);
      await toggle.click();
    }
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
    const loginSel  = By.css(`[data-testid="${TID.login.login}"]`);
    const loginBtn = await driver.wait(until.elementLocated(loginSel), 10_000);
    await driver.wait(until.elementIsVisible(loginBtn), 10_000);
    await loginBtn.click();

    // 4) Přesměrování na /persons
    await driver.wait(until.urlMatches(/\/persons/), 90_000);
    expect(await driver.getCurrentUrl()).to.match(/\/persons/);

    // Otevření navbaru
    await clickNavbarIcon();

    // 5) Navbar: přihlášený uživatel (CZ/EN)
    await driver.wait(async () => {
      const text = await driver.findElement(By.css("body")).getText();
      return /(Přihlášen|Logged in)\s*:\s*testino@example\.com/i.test(text);
    }, 90_000);

    // 6) Navbar: tlačítko Logout / Odhlásit se
    const logoutSel  = By.css(`[data-testid="${TID.appLayout_nav.logout}"]`);
    const logoutBtn = await driver.wait(until.elementLocated(logoutSel), 10_000);
    await driver.wait(until.elementIsVisible(logoutBtn), 10_000);
    const logoutBtnText = await logoutBtn.getText();
    expect(logoutBtnText).to.match(/^(Logout|Odhlásit)$/i);

    // 7) Klik na Logout
    await logoutBtn.click();

    // 8) Přesměrování na /login
    await driver.wait(until.urlMatches(/\/login/), 30_000);
  });

}).timeout(120_000);