import express from "express";
import {
  // Shift Templates
  createShiftTemplate,
  getAllShiftTemplates,
  updateShiftTemplate,
  deleteShiftTemplate,
  // Preferences
  getMyPreferences,
  savePreferences,
  addUnavailableDate,
  removeUnavailableDate,
  getMyUnavailableDates,
  // Scheduling
  assignShift,
  getSchedule,
  getMySchedule,
  updateShiftStatus,
  publishSchedule,
  // Swap Requests
  createSwapRequest,
  getMySwapRequests,
  respondToSwapRequest,
  approveSwapRequest,
  getPendingSwapRequests,
} from "../controllers/shiftScheduleController.js";
import { verifyToken } from "../middleware/auth.js";
import { isAdmin } from "../middleware/adminCheck.js";

const router = express.Router();

// =====================================================
// SHIFT TEMPLATES (Admin/Manager)
// =====================================================
router.get("/templates", getAllShiftTemplates);
router.post("/templates", verifyToken, isAdmin, createShiftTemplate);
router.put("/templates/:id", verifyToken, isAdmin, updateShiftTemplate);
router.delete("/templates/:id", verifyToken, isAdmin, deleteShiftTemplate);

// =====================================================
// EMPLOYEE PREFERENCES
// =====================================================
router.get("/preferences/my", verifyToken, getMyPreferences);
router.post("/preferences", verifyToken, savePreferences);
router.get("/unavailable", verifyToken, getMyUnavailableDates);
router.post("/unavailable", verifyToken, addUnavailableDate);
router.delete("/unavailable/:date", verifyToken, removeUnavailableDate);

// =====================================================
// SHIFT SCHEDULING
// =====================================================
router.get("/schedule", verifyToken, getSchedule);
router.get("/schedule/my", verifyToken, getMySchedule);
router.post("/schedule/assign", verifyToken, assignShift);
router.patch("/schedule/:id/status", verifyToken, updateShiftStatus);
router.post("/schedule/publish", verifyToken, publishSchedule);

// =====================================================
// SHIFT SWAP REQUESTS
// =====================================================
router.get("/swaps/my", verifyToken, getMySwapRequests);
router.get("/swaps/pending", verifyToken, getPendingSwapRequests);
router.post("/swaps", verifyToken, createSwapRequest);
router.patch("/swaps/:id/respond", verifyToken, respondToSwapRequest);
router.patch("/swaps/:id/approve", verifyToken, approveSwapRequest);

export default router;
