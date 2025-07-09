import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getMyAttendance, getTeamAttendanceForManager, punchIn, punchOut } from "../controllers/attendanceController.js";

const router = express.Router();



router.post("/punch-in",verifyToken, punchIn);
router.post("/punch-out", verifyToken,punchOut);
router.get("/get",verifyToken, getMyAttendance);
router.get("/team-attendance", verifyToken, getTeamAttendanceForManager);

export default router;
