## Autentizace
| Metoda | Endpoint             | Popis                       |
| ------ | -------------------- | --------------------------- |
| POST   | `/api/auth/register` | Registrace uživatele        |
| POST   | `/api/auth/login`    | Přihlášení, vrací JWT token |

## Osoby (Person)
| Metoda | Endpoint            | Popis                           |
| ------ | ------------------- | ------------------------------- |
| GET    | `/api/persons`      | Získat seznam osob (podle role) |
| GET    | `/api/persons/{id}` | Detail osoby                    |
| POST   | `/api/persons`      | Vytvoření nové osoby            |
| PUT    | `/api/persons/{id}` | Úprava osoby                    |
| DELETE | `/api/persons/{id}` | Smazání osoby                   |

## Faktury (Invoice)
| Metoda | Endpoint             | Popis                           |
| ------ | -------------------- | ------------------------------- |
| GET    | `/api/invoices`      | Seznam faktur (možno filtrovat) |
| GET    | `/api/invoices/{id}` | Detail faktury                  |
| POST   | `/api/invoices`      | Vytvoření nové faktury          |
| PUT    | `/api/invoices/{id}` | Úprava faktury                  |
| DELETE | `/api/invoices/{id}` | Smazání faktury                 |

### Faktury – Filtrování
| Metoda | Endpoint        | Popis                                     |
| ------ | --------------- | ----------------------------------------- |
| GET    | `/api/invoices` | Vrací seznam faktur s možností filtrování |

#### Query parametry
| Parametr   | Typ        | Význam                               |
| ---------- | ---------- | ------------------------------------ |
| `buyerId`  | `ulong?`   | ID kupující osoby                    |
| `sellerId` | `ulong?`   | ID prodávající osoby                 |
| `product`  | `string?`  | Název produktu (obsahuje část textu) |
| `minPrice` | `decimal?` | Minimální cena faktury               |
| `maxPrice` | `decimal?` | Maximální cena faktury               |
| `limit`    | `int?`     | Omezení počtu výsledků               |
💡 Pokud není zadán žádný filtr, vrací se všechny faktury (limitováno serverem resp. databází v budoucím rozšíření).
💡 Filtrace implementována pomocí ASP knihovny IQueryable.

## Statistika
| Metoda | Endpoint                   | Popis                           |
| ------ | -------------------------- | ------------------------------- |
| GET    | `/api/invoices/statistics` | Součty za aktuální rok a celkem |
| GET    | `/api/persons/statistics`  | Počet faktur na každou osobu    |