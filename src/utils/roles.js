// src/utils/roles.js
//
// Single source of truth for job titles and what each one grants in
// terms of dashboard access. Used both by the invite-generation dropdown
// (AdminDashboard) and by registration (Register.jsx) so the two never
// drift out of sync.

// Job titles an admin can pre-assign when generating an invite link.
export const JOB_TITLES = [
  "Waiter",
  "Chef",
  "Cashier",
  "Steward",
  "Security",
  "Director",
  "Manager",
  "Accountant",
];

// Maps a job title to the auth-level `role` (gates /admin vs /employee
// routing) and the finer-grained `access_level` (gates what an admin-route
// user can actually see/edit inside the dashboard). Anything not listed
// here defaults to plain staff — portal-only, no dashboard access.
const JOB_TITLE_ACCESS = {
  Director: { role: "admin", access_level: "director" },
  Manager: { role: "admin", access_level: "manager" },
  Accountant: { role: "admin", access_level: "accountant" },
};

const DEFAULT_ACCESS = { role: "employee", access_level: "staff" };

export function getAccessForJobTitle(jobTitle) {
  return JOB_TITLE_ACCESS[jobTitle] || DEFAULT_ACCESS;
}