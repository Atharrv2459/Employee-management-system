import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { applyLeave, cancelLeave, getOwnLeaves, updateLeaveRequest } from "../controllers/leaveController.js";
import { getLeaveBalances } from "../controllers/leaveBalanceController.js";


const router = express.Router();

router.post("/apply",verifyToken, applyLeave);
router.get("/get", verifyToken, getOwnLeaves);
router.delete("/cancel/:id", verifyToken, cancelLeave);
router.put("/update/:id", verifyToken , updateLeaveRequest);
router.get("/balance", verifyToken, getLeaveBalances);

export default router;
