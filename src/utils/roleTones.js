// Role -> chip color, shared so a Chef looks the same everywhere
const ROLE_TONES = {
  Chef: "amber",
  Cashier: "sky",
  Waiter: "emerald",
  Steward: "violet",
  Security: "zinc",
  Manager: "sky",
  Director: "violet",
  Accountant: "sky",
};

export const toneForRole = (role) => ROLE_TONES[role] || "zinc";