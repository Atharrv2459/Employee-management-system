import express from "express";
import {
  createOfficeLocation,
  getAllOfficeLocations,
  getOfficeLocationById,
  updateOfficeLocation,
  deleteOfficeLocation,
  checkGeofence,
  createRemoteLocation,
  getMyRemoteLocations,
  getPendingRemoteRequests,
  approveRemoteLocation,
  rejectRemoteLocation,
  getGeolocationSettings,
  updateGeolocationSettings,
} from "../controllers/locationController.js";
import { verifyToken } from "../middleware/auth.js";
import { isAdmin } from "../middleware/adminCheck.js";

const router = express.Router();

// Public routes
router.get("/offices", getAllOfficeLocations);
router.get("/offices/:id", getOfficeLocationById);

// Protected routes - require authentication
router.use(verifyToken);

// Geofence validation
router.post("/check-geofence", checkGeofence);

// Office locations management (Admin only)
router.post("/offices", isAdmin, createOfficeLocation);
router.put("/offices/:id", isAdmin, updateOfficeLocation);
router.delete("/offices/:id", isAdmin, deleteOfficeLocation);

// Remote work locations
router.post("/remote", createRemoteLocation);
router.get("/remote/my", getMyRemoteLocations);
router.get("/remote/pending", getPendingRemoteRequests);
router.put("/remote/:id/approve", approveRemoteLocation);
router.put("/remote/:id/reject", rejectRemoteLocation);

// Geolocation settings
router.get("/settings", getGeolocationSettings);
router.put("/settings", isAdmin, updateGeolocationSettings);

export default router;