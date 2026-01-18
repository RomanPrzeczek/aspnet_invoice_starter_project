import { WebDriver } from "selenium-webdriver";
let stderrPatched = false;

export async function seStep(
  tc: string,
  stepNo: number,
  total: number,
  title: string,
  driver: WebDriver,
  fn: () => Promise<void>
) {
    if (!stderrPatched) {
    stderrPatched = true;

    const origWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: any, ...args: any[]) => {
      const s = chunk?.toString?.() ?? "";
      if (s.includes("fallback_task_provider") || s.includes("crbug.com/739782")) {
        return true;
      }
      return origWrite(chunk, ...args);
    }) as any;
  }

  // testHelper-script
  const label = `[${tc}][STEP ${stepNo}/${total}] ${title}`;
  const t0 = Date.now();

  try {
    await fn();
    console.log(`${label} ✅ OK (${Date.now() - t0} ms)`);
  } catch (e) {
    console.error(`${label} ❌ FAIL`);

    try {
      const png = await driver.takeScreenshot();
      require("fs").writeFileSync(
        `test-artifacts/${tc}-step-${stepNo}.png`,
        png,
        "base64"
      );
    } catch {}

    throw e;
  }
}