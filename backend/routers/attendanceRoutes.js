import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getMyAttendance, getRealTimeStatusForTeam, getTeamAttendanceForEmployee, getTeamAttendanceForManager, getTeamAttendanceForManagerNew, punchIn, punchOut } from "../controllers/attendanceController.js";

const router = express.Router();



router.post("/punch-in",verifyToken, punchIn);
router.post("/punch-out", verifyToken,punchOut);
router.get("/get",verifyToken, getMyAttendance);
router.get("/team-attendance", verifyToken, getTeamAttendanceForManager);
router.get('/employee-team-status', verifyToken , getTeamAttendanceForEmployee)


router.get("/manager-team-status", verifyToken, getTeamAttendanceForManagerNew);


export default router;
