import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "https://fe.local.test:5173",
    specPattern: "tests_cypress/**/*.cy.{js,ts}",
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      on("task", {
        log(message: string) {
          console.log(message);
          return null;
        },
        logLine(message: string) {
          process.stdout.write(message);      // bez \n
          return null;
        },
        logLineEnd(message: string) {
          process.stdout.write(message + "\n"); // ukončí řádek
          return null;
        },
      });
    },
  },
});
