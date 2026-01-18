/// <reference types="cypress" />
import { TID } from "../src/testIds";
import { cyStep } from "../tests_cypress/cypressStep";

const ensureNavExpanded = () => {
  const collapseSel = "#navbarNav";
  const toggleSel = `[data-testid="${TID.appLayout_nav.toggle}"]`;

  cy.get("body").then(($body) => {
    if ($body.find(collapseSel).length === 0) return;

    const isOpen = $body.find(collapseSel).hasClass("show");
    if (isOpen) return;

    if ($body.find(toggleSel).length === 0) return;

    cy.get(toggleSel).click();
    cy.get(collapseSel).should("have.class", "show");
  });
};

describe("UI-LOGIN/LOGOUT-001 – úspěšný login/logout běžného uživatele", () => {
  it("", () => {
    const TC = "Cypress";
    const TOTAL = 8;

    cyStep(TC, 1, TOTAL, "Izolace testu", () => {
      cy.clearCookies();
      cy.clearLocalStorage();

      // 📱 vynucení mobilního viewportu (hamburger menu)
      cy.viewport(390, 844);
    });

    cyStep(TC, 2, TOTAL, "Ověření přesměrování /login ", () => {
      cy.visit("/login");
      cy.location("pathname").should("eq", "/login");
    });

    cyStep(TC, 3, TOTAL, "Vyplnění přihlašovacích údajů", () => {
      cy.get("#email").clear().type("testino@example.com");
      cy.get("#password").clear().type("Testino123+");
    });

    cyStep(TC, 4, TOTAL, "Klik na (Přihlásit se) + čekání na BE", () => {
      cy.intercept("GET", "**/api/persons*").as("getPersons");
      cy.contains("button", /(Login|Přihlásit se)/i).click();
      cy.wait("@getPersons").its("response.statusCode").should("eq", 200);
    });

    cyStep(TC, 5, TOTAL, "Ověření přesměrování na /persons", () => {
      cy.location("pathname", { timeout: 10_000 }).should("eq", "/persons");
    });

    // ✅ KROK 6: nejdřív rozbalí nav (pokud je sbalená)
    cyStep(TC, 6, TOTAL, "Ověření přihlášeného uživatele (emailu) v navigaci", () => {
      ensureNavExpanded();

      // kontrola přihlášení = přihlášeného
      cy.get("nav.navbar", { timeout: 10_000 })
        .should("be.visible")
        .and("contain.text", "testino@example.com");
      // volitelně i CZ/EN label:
      cy.get("nav.navbar").invoke("text").should("match", /(Přihlášen|Logged in)\s*:/i);
    });

    // ✅ KROK 7: logout už bez hacků
    cyStep(TC, 7, TOTAL, "Ověření odhlášení, přítomnost + klik tlačítka (Odhlásit se)", () => {
      ensureNavExpanded();

      cy.get(`[data-testid="${TID.appLayout_nav.logout}"]`, { timeout: 10_000 })
        .should("be.visible")
        .click();
    });

    cyStep(TC, 8, TOTAL, "Ověření přesměrování (návratu) na /login stránku", () => {
      cy.location("pathname", { timeout: 10_000 }).should("match", /\/login/);
    });
  });
});
