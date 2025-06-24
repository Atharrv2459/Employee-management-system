import { getPendingLeavesForManager, updateLeaveStatus } from "../controllers/leaveManagerController.js";
import { verifyToken } from "../middleware/auth.js";
import express from "express";
const router = express.Router();
router.get('/get',verifyToken,getPendingLeavesForManager);
router.patch('/status/:id',verifyToken,updateLeaveStatus);
export default router;

