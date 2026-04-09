import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { validateGeolocation } from "../middleware/geolocationMiddleware.js";
import { getMyAttendance, getRealTimeStatusForTeam, getTeamAttendanceForEmployee, getTeamAttendanceForManager, getTeamAttendanceForManagerNew, punchIn, punchOut } from "../controllers/attendanceController.js";

const router = express.Router();

// Apply geolocation validation to punch in/out
router.post("/punch-in", verifyToken, validateGeolocation, punchIn);
router.post("/punch-out", verifyToken, validateGeolocation, punchOut);

// Other routes
router.get("/get", verifyToken, getMyAttendance);
router.get("/team-attendance", verifyToken, getTeamAttendanceForManager);
router.get('/employee-team-status', verifyToken, getTeamAttendanceForEmployee);
router.get("/manager-team-status", verifyToken, getTeamAttendanceForManagerNew);


export default router;
