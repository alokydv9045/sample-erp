const { requireRole } = require('./auth');

// Define a central mapping of granular permissions to roles
const PERMISSION_ROLES = {
  // Transport Module
  'transport.view': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER', 'ADMISSION_MANAGER'],
  'transport.vehicle.create': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'],
  'transport.vehicle.update': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'],
  'transport.vehicle.delete': ['SUPER_ADMIN', 'ADMIN'],
  'transport.route.create': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'],
  'transport.route.update': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'],
  'transport.assign.student': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER', 'ADMISSION_MANAGER'],
  'transport.manage.drivers': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'],
  'transport.view.reports': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER', 'ACCOUNTANT'],
  'transport.send.notifications': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER', 'NOTIFICATION_MANAGER'],
};

/**
 * Middleware to check if the user has a specific granular permission.
 * It maps the permission string to a list of allowed roles and uses requireRole.
 * @param {string} permission - The granular permission string (e.g., 'transport.view')
 */
const requirePermission = (permission) => {
  const allowedRoles = PERMISSION_ROLES[permission];
  if (!allowedRoles) {
    throw new Error(`Permission '${permission}' is not mapped to any roles.`);
  }
  return requireRole(...allowedRoles);
};

module.exports = {
  PERMISSION_ROLES,
  requirePermission,
};
