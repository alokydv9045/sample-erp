const transportService = require('../services/transportService');

class TransportController {
  // VEHICLES
  async getVehicles(req, res) {
    try {
      const vehicles = await transportService.getVehicles();
      res.json({ success: true, vehicles });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createVehicle(req, res) {
    try {
      const vehicle = await transportService.createVehicle(req.body);
      res.status(201).json({ success: true, vehicle });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateVehicle(req, res) {
    try {
      const vehicle = await transportService.updateVehicle(req.params.id, req.body);
      res.json({ success: true, vehicle });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deleteVehicle(req, res) {
    try {
      await transportService.deleteVehicle(req.params.id);
      res.json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getVehicleById(req, res) {
    try {
      const vehicle = await transportService.getVehicleById(req.params.id);
      res.json({ success: true, vehicle });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async logMaintenance(req, res) {
    try {
      const log = await transportService.logMaintenance(req.params.id, req.body);
      res.status(201).json({ success: true, log });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async logFuel(req, res) {
    try {
      const log = await transportService.logFuel(req.params.id, req.body);
      res.status(201).json({ success: true, log });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ROUTES
  async getRoutes(req, res) {
    try {
      const routes = await transportService.getRoutes();
      res.json({ success: true, routes });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createRoute(req, res) {
    try {
      const route = await transportService.createRoute(req.body);
      res.status(201).json({ success: true, route });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateRoute(req, res) {
    try {
      const route = await transportService.updateRoute(req.params.id, req.body);
      res.json({ success: true, route });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getRouteById(req, res) {
    try {
      const route = await transportService.getRouteById(req.params.id);
      res.json({ success: true, route });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // DRIVERS
  async getDrivers(req, res) {
    try {
      const drivers = await transportService.getDrivers();
      res.json({ success: true, drivers });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ALLOCATIONS
  async getAllocations(req, res) {
    try {
      const allocations = await transportService.getAllocations();
      res.json({ success: true, allocations });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async assignStudent(req, res) {
    try {
      const allocation = await transportService.assignStudent(req.body);
      res.status(201).json({ success: true, allocation });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async removeAssignment(req, res) {
    try {
      await transportService.removeStudentAssignment(req.params.studentId);
      res.json({ success: true, message: 'Assignment removed' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // DASHBOARD
  async getDashboardStats(req, res) {
    try {
      const stats = await transportService.getDashboardStats();
      res.json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // STUDENT VIEW
  async getMyTransport(req, res) {
    try {
      // Assuming req.user.studentId is available from auth middleware
      const studentId = req.user.studentId;
      if (!studentId) {
        return res.status(403).json({ success: false, error: 'User is not a student' });
      }
      const allocation = await transportService.getStudentAllocation(studentId);
      res.json({ success: true, allocation });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getActiveTrip(req, res) {
    try {
      const trip = await transportService.getActiveTripForUser(req.user.id, req.user.role);
      res.json({ success: true, trip });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // DRIVER OPS
  async getDriverAssignment(req, res) {
    try {
      const assignment = await transportService.getDriverAssignment(req.user.id);
      res.json({ success: true, ...assignment });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async startTrip(req, res) {
    try {
      const trip = await transportService.startTrip(req.body);
      res.status(201).json({ success: true, trip });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async stopTrip(req, res) {
    try {
      const trip = await transportService.stopTrip(req.params.tripId);
      res.json({ success: true, trip });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateLocation(req, res) {
    try {
      const log = await transportService.updateLocation(req.body.tripId, req.body);
      res.json({ success: true, log });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getGlobalLogs(req, res) {
    try {
      const logs = await transportService.getGlobalLogs(req.query);
      res.json({ success: true, ...logs });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getSettings(req, res) {
    try {
      const settings = await transportService.getTransportSettings();
      res.json({ success: true, settings });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateSettings(req, res) {
    try {
      const settings = await transportService.updateTransportSettings(req.body);
      res.json({ success: true, settings });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new TransportController();
