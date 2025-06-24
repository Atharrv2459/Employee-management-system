// routes/leavesRouter.jsx
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { applyLeave, cancelLeave, getOwnLeaves, updateLeaveRequest } from "../controllers/leaveController.js";


const router = express.Router();
router.use(verifyToken);
router.post("/apply", applyLeave);
router.get("/get", getOwnLeaves);
router.delete("/cancel/:id", cancelLeave);
router.put("/update/:id", updateLeaveRequest);

export default router;
