export const cyStep = (
  tc: string,
  stepNo: number,
  total: number,
  title: string,
  fn: () => void,
) => {
  const label = `[Cypress][STEP ${stepNo}/${total}] ${title}`;
  const t0 = Date.now();

  // START: otevři řádek a nech ho "viset"
  cy.task("logLine", `${label} ... `, { log: false });

  // FAIL: dopiš ❌ (sync, bez cy.task)
  cy.once("fail", (err: unknown) => {
    const ms = Date.now() - t0;
    const msg = (err instanceof Error ? err.message : String(err)).split("\n")[0];

    // dopíše se za "..." a udělá nový řádek
    // eslint-disable-next-line no-console
    console.error(`❌ FAIL (${ms} ms) – ${msg}`);

    throw err;
  });

  // STEP body
  return cy.then(() => fn()).then(() => {
    // OK: dopiš ✅ na stejný řádek a ukonči ho
    const ms = Date.now() - t0;
    cy.task("logLineEnd", `✅ OK (${ms} ms)`, { log: false });
  });
};
