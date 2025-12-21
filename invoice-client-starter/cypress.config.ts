import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "https://fe.local.test:5173",
    specPattern: "tests_cypress/**/*.cy.{js,ts}",
    chromeWebSecurity: false,
  },
});
