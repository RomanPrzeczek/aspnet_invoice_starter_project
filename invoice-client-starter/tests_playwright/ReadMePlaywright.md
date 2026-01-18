# Run test HEADLESS (w/o UI)
npx playwright test ui-login-user-ok.spec.ts

# Run test HEADED (with UI)

npx playwright test ui-login-user-ok.spec.ts --headed
- runs test in browser

npx playwright test ui-login-user-ok.spec.ts --ui
- opens Playwright UI
- choose test form the left list & run with ▶
- after test complation list of steps in left panel, choosing/clicking them allows inspection-debug