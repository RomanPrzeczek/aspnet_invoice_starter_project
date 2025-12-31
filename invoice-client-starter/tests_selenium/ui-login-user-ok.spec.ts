import { Builder, By, until, WebDriver, WebElement } from "selenium-webdriver";
import { expect } from "chai";

import { TID } from "../src/testIds.js";
import { seStep } from "../tests_selenium/seStep.js";

const TC = "Selenium";
const TOTAL = 8;

describe("UI-LOGIN/LOGOUT-001 – úspěšný login/logout běžného uživatele", function () {
  
  let driver: WebDriver;

  const baseUrl = process.env.FE_BASE_URL ?? "https://fe.local.test:5173/";
  const email = "testino@example.com";
  const password = "Testino123+";

  before(async () => {

    driver = await new Builder()
      .forBrowser("MicrosoftEdge")
      .build();

      console.log("\n");

      // simulace mobilního viewportu (390x844)
      //await driver.manage().window().setRect({ width: 390, height: 844, x: 0, y: 0 });
  });

  after(async () => {
    await driver.quit();
  });
 
  async function clickNavbarIcon() {
    const toggleSel  = By.css(`[data-testid="${TID.appLayout_nav.toggle}"]`);
    const toggleExists = await driver.findElements(toggleSel).then(elems => elems.length) > 0;
    const toggleIsVisible = toggleExists ? await driver.findElement(toggleSel).isDisplayed() : false; 
    if(!toggleIsVisible) {
      return;
    } else {
      const toggle = await driver.wait(until.elementLocated(toggleSel), 10_000);
      await driver.wait(until.elementIsVisible(toggle), 10_000);
      await toggle.click();
    }
 }

  it("", async () => {
    // 0) Izolace testu
    await seStep(TC, 1, TOTAL, "Izolace testu", driver, async () => {
      await driver.manage().deleteAllCookies();
      await driver.get(`${baseUrl}/login`);
      await driver.executeScript(`
        window.localStorage.clear();
        window.sessionStorage.clear();
      `);
      await driver.navigate().refresh();
    });
    
    // 1) Navigace na /login
    await seStep(TC, 2, TOTAL, "Ověření přesměrování /login", driver, async () => {
      await driver.wait(until.urlContains("/login"), 10_000);
      expect(await driver.getCurrentUrl()).to.match(/\/login/);});

    // 2) Vyplnění údajů 
    await seStep(TC, 3, TOTAL, "Vyplnění přihlašovacích údajů", driver, async () => {
      const emailInput = await driver.wait(until.elementLocated(By.css("#email")), 10_000);
      await emailInput.clear();
      await emailInput.sendKeys(email);

      const passwordInput = await driver.findElement(By.css("#password"));
      await passwordInput.clear();
      await passwordInput.sendKeys(password);
    });

    // 3) Klik na Login / Přihlásit se
    await seStep(TC, 4, TOTAL, "Klik na (Přihlásit se) + čekání na BE", driver, async () => {
      const loginSel  = By.css(`[data-testid="${TID.login.login}"]`);
      const loginBtn = await driver.wait(until.elementLocated(loginSel), 10_000);
      await driver.wait(until.elementIsVisible(loginBtn), 10_000);
      await loginBtn.click();
    });

    // 4) Přesměrování na /persons
    await seStep(TC, 5, TOTAL, "Ověření přesměrování na /persons", driver, async () => {
        await driver.wait(until.urlMatches(/\/persons/), 90_000);
        expect(await driver.getCurrentUrl()).to.match(/\/persons/);
    });

    // Otevření navbaru pokud je sbalený (mobil)
    await clickNavbarIcon();

    // 5) Navbar: přihlášený uživatel (CZ/EN)
    await seStep(TC, 6, TOTAL, "Ověření přihlášeného uživatele (emailu) v navigaci", driver, async () => {
      await driver.wait(async () => {
        const text = await driver.findElement(By.css("body")).getText();
        return /(Přihlášen|Logged in)\s*:\s*testino@example\.com/i.test(text);
      }, 90_000);
    });

    // 6) Navbar: tlačítko Logout / Odhlásit se
    await seStep(TC, 7, TOTAL, "Ověření odhlášení, přítomnost + klik tlačítka (Odhlásit se)", driver, async () => {
      const logoutSel  = By.css(`[data-testid="${TID.appLayout_nav.logout}"]`);
      const logoutBtn = await driver.wait(until.elementLocated(logoutSel), 10_000);
      await driver.wait(until.elementIsVisible(logoutBtn), 10_000);
      const logoutBtnText = await logoutBtn.getText();
      expect(logoutBtnText).to.match(/^(Logout|Odhlásit)$/i);
      await logoutBtn.click();
    });

    // 7) Přesměrování na /login
    await seStep(TC, 8, TOTAL, "Ověření přesměrování (návratu) na /login stránku", driver, async () => {
      await driver.wait(until.urlMatches(/\/login/), 30_000);
    });
  });
}).timeout(120_000);