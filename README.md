# Invoice App (React + ASP.NET Core + MSSQL LocalDB)

Fakturační webová aplikace, která umožňuje správu osob, vystavování faktur a základní statistiky. Vytvořena jako fullstack projekt v rámci studia a rekvalifikace.

---

## 🔧 Technologie

- **Frontend (React)**  
  - React (Vite)
  - React Router DOM
  - Bootstrap 5
  - JWT autentizace (s AuthContextem)
  - React fetch pro komunikaci s API
  - nasazeno na Railway.com

- **Backend (ASP.NET Core)**  
  - ASP.NET Core Web API (.NET 8)
  - Entity Framework Core
  - AutoMapper
  - Role-based autentizace s ASP.NET Identity
  - Azure-Web-App hosting, slinkován s FE a DB

- **Database**
  - AzureSQL (MSSQL) Database-as-a-Service
---

## 🧱 Struktura projektu

aspnet_invoice_starter_project/
├── invoice-client-starter/ # Frontend (React)
│ └── src/
│ ├── auth/ # Login, Register, Context, Route guard
│ ├── components/ # Opakované komponenty (formuláře, pole, UI)
│ ├── invoices/ # Správa faktur (CRUD, tabulka, detail)
│ ├── persons/ # Správa osob (CRUD, role, země)
│ ├── statistics/ # Statistická stránka (grafy, souhrny)
│ ├── utils/ # Pomocné funkce (např. api.js)
│ ├── App.jsx # Kořenová komponenta
│ └── index.css # Vzhled aplikace
│
├── invoice-server-starter/ # Backend (ASP.NET Core)
│ ├── Invoices.Api/ # Web API – controllery, business logika
│ └── Invoices.Data/ # Datový přístup – DbContext, modely, repo
│
├── .gitignore
├── .gitattributes
└── README.md 

## Uživatelské role
Admin – má plný přístup k osobám i fakturám

User – může upravovat pouze své osoby a faktury

## 📊 Funkcionalita
- Registrace a přihlášení s JWT
- CRUD pro osoby (včetně DIČ, IČO, země, banky...)
- CRUD pro faktury (produkt, DPH, splatnost...)
- Statistiky a grafy (Roční součty, počet faktur na osobu)

## Rozšíření stav
- Nasazení DB ➡ AzureSQL:  ✔ 16.7.25
- Nasazení BE ➡ Azure-Webb-App:  ✔ 17.7.25
- Nasazení FE ➡ Railway:   ✔ 21.7.25
- CI/CD workflow s GitHub Actions:   ✔ 16.7.25
- Automatizované testy (unit, integrační, UI – Playwright nebo Cypress): 🧭