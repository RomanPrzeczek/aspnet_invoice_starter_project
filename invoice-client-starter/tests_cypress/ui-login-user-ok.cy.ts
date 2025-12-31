/// <reference types="cypress" />
import {TID} from "../src/testIds";
import {cyStep} from "../tests_cypress/cypressStep";

describe("UI-LOGIN/LOGOUT-001 – úspěšný login/logout běžného uživatele", () => {
  it("", () => {
    const TC = "Cypress";
    const TOTAL = 8;

    // 0) Izolace testu (podobně jako clearCookies v Playwrightu)
    cyStep(TC, 1, TOTAL, "Izolace testu", () => {
      cy.clearCookies();
      cy.clearLocalStorage();
    });

    // 1) Otevření login stránky
    cyStep(TC, 2, TOTAL, "Ověření přesměrování /login ", () => {
      cy.visit("/login");
      cy.location("pathname").should("eq", "/login");
    });

    // 2) Vyplnění přihlašovacích údajů
    cyStep(TC, 3, TOTAL, "Vyplnění přihlašovacích údajů", () => {
      cy.get("#email").clear().type("testino@example.com");
      cy.get("#password").clear().type("Testino123+");
    });

    // 3) Čekání na BE call (GET /api/persons 200) + klik
    // Pozn.: Pokud se request jmenuje jinak (např. obsahuje querystring), zachytíme ho přes glob
    cyStep(TC, 4, TOTAL, "Klik na (Přihlásit se) + čekání na BE", () => {
      cy.intercept("GET", "**/api/persons*").as("getPersons");
      cy.contains("button", /(Login|Přihlásit se)/i).click();
      cy.wait("@getPersons").its("response.statusCode").should("eq", 200);
    });

    // 4) Ověření přesměrování
    cyStep(TC, 5, TOTAL, "Ověření přesměrování na /persons", () => {
      cy.location("pathname", { timeout: 10_000 }).should("eq", "/persons");
    });

    // 5) Ověření přihlášeného uživatele v navigaci (CZ/EN)
    // Varianta A: ověř text "Přihlášen:" nebo "Logged in:" a email
    cyStep(TC, 6, TOTAL, "Ověření přihlášeného uživatele (emailu) v navigaci", () => {
      cy.contains(/(Přihlášen|Logged in)\s*:\s*testino@example\.com/i, {
        timeout: 10_000,
      }).should("be.visible");
    });

    // 6) Ověření dostupnosti odhlášení (CZ/EN) + případně otevření menu + klik na logout
    cyStep(TC, 7, TOTAL, "Ověření odhlášení, přítomnost + klik tlačítka (Odhlásit se)", () => {
      cy.get("body").then(($body) => {
        const logoutSel = `[data-testid="${TID.appLayout_nav.logout}"]`;
        const toggleSel = `[data-testid="${TID.appLayout_nav.toggle}"]`;

        if ($body.find(`${logoutSel}:visible`).length === 0) {
          cy.get(toggleSel).click();
        }
        cy.get(`[data-testid="${TID.appLayout_nav.logout}"]`)
          .should("be.visible")
          .click();
      });
    });

    // 7) Ověření návratu na /login
    cyStep(TC, 8, TOTAL, "Ověření přesměrování (návratu) na /login stránku", () => {
      cy.location("pathname", { timeout: 10_000 }).should("match", /\/login/);
    });
  });

  // it("FORCE FAIL – špatná URL", () => {
  //   cyStep("FF-001", 1, 1, "Špatná URL", () => {
  //     cy.location("pathname").should("eq", "/neexistuje");
  //   });
  // });

  // it("FORCE FAIL – manual error", () => {
  //   cyStep("FF-002", 1, 1, "Manual error", () => {
  //     throw new Error("Forced failure for testing");
  //   });
  // });

  // it("FORCE FAIL – timeout", () => {
  //   cyStep("FF-003", 1, 1, "Timeout", () => {
  //     cy.get("[data-testid='does-not-exist']", { timeout: 2000 });
  //   });
  // });

});
