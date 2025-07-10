import express from "express";
import { createShift, getShift, updateShift, deleteShift } from "../controllers/shiftController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", verifyToken, createShift);
router.get("/get", verifyToken, getShift);
router.put("/update", verifyToken, updateShift);
router.delete("/delete", verifyToken, deleteShift);

export default router;
