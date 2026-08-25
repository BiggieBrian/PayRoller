// src/utils/permissions.js
//
// What each access_level can see/do inside the Admin Dashboard.
// role='admin' just gets you through ProtectedRoute to /admin — this is
// what governs what you can actually do once you're there.

const DASHBOARD_PERMISSIONS = {
  owner: {
    viewOverview: true,
    viewDirectory: true,
    editDirectory: true,
    deleteEmployees: true,
    manageInvites: true,
    viewPayroll: true,
    editPayroll: true,
  },
  director: {
    viewOverview: true,
    viewDirectory: true,
    editDirectory: true,
    deleteEmployees: true,
    manageInvites: true,
    viewPayroll: true,
    editPayroll: true,
  },
  manager: {
    viewOverview: true,
    viewDirectory: true,
    editDirectory: false,
    deleteEmployees: false,
    manageInvites: false,
    viewPayroll: true,
    editPayroll: false,
  },
  accountant: {
    viewOverview: true,
    viewDirectory: false,
    editDirectory: false,
    deleteEmployees: false,
    manageInvites: false,
    viewPayroll: true,
    editPayroll: true,
  },
  // Staff never reach the admin route at all (ProtectedRoute blocks it),
  // this is just a safe fallback in case something reaches this code path
  // unexpectedly.
  staff: {
    viewOverview: false,
    viewDirectory: false,
    editDirectory: false,
    deleteEmployees: false,
    manageInvites: false,
    viewPayroll: false,
    editPayroll: false,
  },
};

export function getPermissions(accessLevel) {
  return DASHBOARD_PERMISSIONS[accessLevel] || DASHBOARD_PERMISSIONS.staff;
}