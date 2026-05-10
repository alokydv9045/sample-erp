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

// ----------------------------------------------------
// STUDENT/PARENT SPECIFIC (Read-only)
// ----------------------------------------------------
router.get('/my-transport', requireRole('STUDENT', 'PARENT'), transportController.getMyTransport);

// ----------------------------------------------------
// VEHICLES
// ----------------------------------------------------
router.get('/vehicles', requirePermission('transport.view'), transportController.getVehicles);
router.post('/vehicles', requirePermission('transport.vehicle.create'), transportController.createVehicle);
router.put('/vehicles/:id', requirePermission('transport.vehicle.update'), transportController.updateVehicle);
router.delete('/vehicles/:id', requirePermission('transport.vehicle.delete'), transportController.deleteVehicle);

// ----------------------------------------------------
// ROUTES & STOPS
// ----------------------------------------------------
router.get('/routes', requirePermission('transport.view'), transportController.getRoutes);
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

module.exports = router;
