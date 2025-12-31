import { test } from "@playwright/test";

export async function pwStep(
  tc: string,
  stepNo: number,
  total: number,
  title: string,
  fn: () => Promise<void>
) {
  const label = `[${tc}][STEP ${stepNo}/${total}] ${title}`;

  await test.step(label, async () => {
    const t0 = Date.now();
    try {
      await fn();
      console.log(`${label} ✅ OK (${Date.now() - t0} ms)`);
    } catch (e) {
      console.error(`${label} ❌ FAIL`);
      throw e;
    }
  });
}