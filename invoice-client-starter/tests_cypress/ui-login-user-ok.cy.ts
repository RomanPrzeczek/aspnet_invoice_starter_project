/// <reference types="cypress" />

describe("UI-LOGIN-001 – úspěšný login běžného uživatele", () => {
  it("po loginu přesměruje na /persons a v navbaru ukáže přihlášeného uživatele + odhlášení", () => {
    // 0) Izolace testu (podobně jako clearCookies v Playwrightu)
    cy.clearCookies();
    cy.clearLocalStorage();

    // 1) Otevření login stránky
    cy.visit("/login");

    // 2) Vyplnění přihlašovacích údajů
    cy.get("#email").clear().type("testino@example.com");
    cy.get("#password").clear().type("Testino123+");

    // 3) Čekání na BE call (GET /api/persons 200) + klik
    // Pozn.: Pokud se request jmenuje jinak (např. obsahuje querystring), zachytíme ho přes glob
    cy.intercept("GET", "**/api/persons*").as("getPersons");

    cy.contains("button", /(Login|Přihlásit se)/i).click();

    cy.wait("@getPersons").its("response.statusCode").should("eq", 200);

    // 4) Ověření přesměrování
    cy.location("pathname", { timeout: 90_000 }).should("match", /\/persons/);

    // 5) Ověření přihlášeného uživatele v navigaci (CZ/EN)
    // Varianta A: ověř text "Přihlášen:" nebo "Logged in:" a email
    cy.contains(/(Přihlášen|Logged in)\s*:\s*testino@example\.com/i, {
      timeout: 90_000,
    }).should("be.visible");

    // 6) Ověření dostupnosti odhlášení (CZ/EN)
    cy.contains("button", /(Odhlásit|Logout)/i, { timeout: 90_000 }).should(
      "be.visible"
    );
  });
});
