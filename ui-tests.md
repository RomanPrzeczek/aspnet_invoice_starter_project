# UI testy – InvoiceApp (Playwright)

## Účel

Tento dokument popisuje manuální i automatizované UI testy pro aplikaci InvoiceApp.
Testy budou rozděleny do dvou skupin, hlavní skupiny a podskupin doplňkových testů příslušné hlavní skupiny (začínají písmenem d), např.:
Hlavní test: UI-LOGIN-001
jeho doplňkov= testy (podskupiny): UI-LOGIN-d1, UI-LOGIN-d2.

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

## Použité technologie testů
Primární technologií je Playwright, použitá pro všechny (hlavní i doplňkové) testy.
Dodatečně budou použity technologie Cypress a Selenium pro otestování hlavních skupin testů a porovnání výkonu technologií.

## Seznam testů

### UI-LOGIN-001

**Cíl:** Ověřit, přihlášení uživatele pomocí prvku v navigaci, zobrazující jeho email po úspěšném přihlášení.

**Předpoklad:** Uživatel není přihlášen.

**Ověření cílového stavu:**
- Na stránce `/login` navigace obsahuje email přihlášeného.

**Poznámka:**  
Test zároveň ověřuje přítomnost tlačítka pro odhlášení a na začátku čistí mezipaměť pro zajištění předpokladu - uživatel nepřihlášen.

### UI-LOGIN-d1 – Přepínání navigačního odkazu (nepřihlášený uživatel, automatizováno)

**Cíl:** Ověřit správné chování navigačního odkazu v horní liště aplikace pro nepřihlášeného uživatele.  
Odkaz se dynamicky přepíná mezi stránkami `/aboutApp` a `/login` v závislosti na aktuální routě.

**Předpoklad:** Uživatel není přihlášen.

**Ověření cílového stavu:**
- Na stránce `/aboutApp` navigační brand odkazuje na `/login` a obsahuje text „Login / Přihlásit se“.
- Po kliknutí je uživatel přesměrován na `/login`.
- Na stránce `/login` navigační brand odkazuje na `/aboutApp` a obsahuje text „About / O aplikaci“.

**Poznámka:**  
Test ověřuje skutečné chování navigace z pohledu uživatele (href + viditelný text), nikoliv interní stav aplikace.

### UI-LOGIN-d2 – Přepínání viditelnosti hesla (toggle „oko“, automatizováno)

**Cíl:** Ověřit, že uživatel může pomocí ovládacího prvku („oko“) přepínat viditelnost hesla na přihlašovací stránce.

**Předpoklad:** Uživatel se nachází na stránce `/login`.

**Ověření cílového stavu:**
- Pole pro heslo má ve výchozím stavu atribut `type="password"`.
- Po kliknutí na tlačítko pro zobrazení hesla se atribut změní na `type="text"`.
- Opětovným kliknutím se atribut vrátí na `type="password"`.

**Poznámka:**  
Test používá stabilní selektor podle CSS třídy ovládacího prvku (`.password-toggle-icon`), protože přístupné popisky (`aria-label`) se při přepnutí mění (Show / Hide password).

## Další plánované testy

* UI-LOGIN-002 – Neúspěšný login (neplatné údaje)
* UI-REGISTRACE - Úspěšná registrace
* UI-AUTORIZACE-001 - Úspěšný login uživatele (vidí jen svá data, nemůže je smazat)
* UI-AUTORIZACE-002 - Úspěšný login admina (vidí všechna data, může i mazat)
* CRUD testy (osoby, faktury) – odděleně od login testů
* Filtrace dle atributů (bude specifikováno).
* Statistiky (existence grafu, data - souhrné informace).
* Cíl globál - test každé obrazovky (shora, sdola).
