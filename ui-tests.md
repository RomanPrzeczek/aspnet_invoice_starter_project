# UI testy – InvoiceApp (Playwright)

## Účel

Tento dokument popisuje manuální i automatizované UI testy pro aplikaci InvoiceApp. Aktuálně je automatizován test **UI-LOGIN-001** pomocí Playwright.

## Testovací prostředí

* FE (Vite dev): `https://fe.local.test:5173`
* BE (ASP.NET Core): `https://api.local.test:5001`
* DB: Azure SQL (demo/produkční data)
* Poznámka: První přihlášení může být pomalejší (Azure cold-start / omezení školního účtu). Automatizovaný test proto čeká na odpověď API `/api/persons` místo pevného čekání.

## Spuštění aplikace (dev)

### Backend
* `POWERSHELL!`
* `aspnet_invoice_starter_project\invoice-server-starter\Invoices.Api`
* `\$env:ASPNETCORE_ENVIRONMENT="Development"`
* `\dotnet build`
* `\dotnet run --no-launch-profile`

### Frontend
* `CMD!`
* `aspnet_invoice_starter_project\invoice-client-starter`
* `\npm run dev`

## Spuštění UI testů

V kořeni FE projektu:

* `npx playwright test`
* nebo konkrétně: `npx playwright test ui-login-user-ok.spec.ts`

## Seznam testů

### UI-LOGIN-001 – Úspěšný login běžného uživatele (automatizováno)

**Cíl:** Ověřit, že uživatel se úspěšně přihlásí a je přesměrován na `/persons`, kde se zobrazí seznam osob.
**Synchronizace:** Test čeká na úspěšnou odpověď backendu `GET /api/persons (200 OK)`.
**Ověření cílového stavu:** URL obsahuje `/persons` a UI zobrazuje data stránky (např. tabulku/seznam osob).

## Další plánované testy

* UI-LOGIN-002 – Úspěšný login admina
* UI-LOGIN-003 – Neúspěšný login (neplatné údaje)
* CRUD testy (osoby, faktury) – odděleně od login testů
