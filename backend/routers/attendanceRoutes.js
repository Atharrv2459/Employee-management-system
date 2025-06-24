import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getMyAttendance, punchIn, punchOut } from "../controllers/attendanceController.js";

const router = express.Router();



router.post("/punch-in",verifyToken, punchIn);
router.post("/punch-out", verifyToken,punchOut);
router.get("/get",verifyToken, getMyAttendance);

export default router;
