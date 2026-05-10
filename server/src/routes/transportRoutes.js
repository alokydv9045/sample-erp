const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

// All transport routes require authentication
router.use(authMiddleware);

// ----------------------------------------------------
// DASHBOARD
// ----------------------------------------------------
// Super Admin, Admin, Transport Manager, Accountant can view reports/dashboard
router.get('/dashboard/stats', requirePermission('transport.view.reports'), transportController.getDashboardStats);
router.get('/logs', requirePermission('transport.view.reports'), transportController.getGlobalLogs);
router.get('/settings', requirePermission('transport.manage.settings'), transportController.getSettings);
router.put('/settings', requirePermission('transport.manage.settings'), transportController.updateSettings);

// ----------------------------------------------------
// STUDENT/PARENT SPECIFIC (Read-only)
// ----------------------------------------------------
router.get('/my-transport', requireRole('STUDENT', 'PARENT'), transportController.getMyTransport);
router.get('/active-trip', transportController.getActiveTrip);

// ----------------------------------------------------
// VEHICLES
// ----------------------------------------------------
router.get('/vehicles', requirePermission('transport.view'), transportController.getVehicles);
router.get('/vehicles/:id', requirePermission('transport.view'), transportController.getVehicleById);
router.post('/vehicles', requirePermission('transport.vehicle.create'), transportController.createVehicle);
router.put('/vehicles/:id', requirePermission('transport.vehicle.update'), transportController.updateVehicle);
router.delete('/vehicles/:id', requirePermission('transport.vehicle.delete'), transportController.deleteVehicle);
router.post('/vehicles/:id/maintenance', requirePermission('transport.vehicle.update'), transportController.logMaintenance);
router.post('/vehicles/:id/fuel', requirePermission('transport.vehicle.update'), transportController.logFuel);

// ----------------------------------------------------
// ROUTES & STOPS
// ----------------------------------------------------
router.get('/routes', requirePermission('transport.view'), transportController.getRoutes);
router.get('/routes/:id', requirePermission('transport.view'), transportController.getRouteById);
router.post('/routes', requirePermission('transport.route.create'), transportController.createRoute);
router.put('/routes/:id', requirePermission('transport.route.update'), transportController.updateRoute);

// ----------------------------------------------------
// DRIVERS
// ----------------------------------------------------
router.get('/drivers', requirePermission('transport.manage.drivers'), transportController.getDrivers);

// ----------------------------------------------------
// ALLOCATIONS (Students -> Transport)
// ----------------------------------------------------
router.get('/allocations', requirePermission('transport.view'), transportController.getAllocations);
router.post('/allocations', requirePermission('transport.assign.student'), transportController.assignStudent);
router.delete('/allocations/:studentId', requirePermission('transport.assign.student'), transportController.removeAssignment);

// ----------------------------------------------------
// DRIVER OPERATIONS
// ----------------------------------------------------
router.get('/driver/assignment', requireRole('DRIVER', 'ADMIN'), transportController.getDriverAssignment);
router.post('/trips/start', requireRole('DRIVER', 'ADMIN'), transportController.startTrip);
router.post('/trips/:tripId/stop', requireRole('DRIVER', 'ADMIN'), transportController.stopTrip);
router.post('/trips/location', requireRole('DRIVER', 'ADMIN'), transportController.updateLocation);

module.exports = router;
