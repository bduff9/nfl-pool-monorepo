export const PaymentMethod = ["Paypal", "Venmo", "Zelle"] as const;

export const AutoPickStrategy = ["Away", "Home", "Random"] as const;

export const SURVIVOR_PICK_INSTRUCTIONS =
  "Pick one team you think will win by clicking a team’s logo. You cannot pick the same team more than once during the season.";

export const DEFAULT_PAGE_SIZE = 10;

export const AdminEmailType = ["Custom", "Interest", "Interest - Final"] as const;

export const AdminEmailTo = ["All", "New", "Registered", "Unregistered"] as const;
