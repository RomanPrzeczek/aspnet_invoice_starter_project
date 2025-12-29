export const TID = {
    auth: {
      email: "auth.email",
      password: "auth.password",
      submit: "auth.submit",
      error: "auth.error",
    },
    nav: {
      toggle: "nav.toggle",
      logout: "nav.logout",
    },
    persons: {
      table: "persons.table",
      row: "persons.row", // pro opakující se věci spíš prefix
    },
} as const;  