import express from "express";

import { verifyToken } from "../middleware/auth.js";
import { approveManualEntry, createManualEntry, deleteManualEntry, getManualEntries, rejectManualEntry, submitManualEntry, updateManualEntry } from "../controllers/manual_entryController.js";

const router = express.Router();

router.post("/create", verifyToken, createManualEntry);
router.get("/myEntries", verifyToken, getManualEntries);
router.patch("/:id/submit", verifyToken, submitManualEntry);
router.patch("/:id/approve", verifyToken, approveManualEntry);
router.patch("/:id/reject", verifyToken, rejectManualEntry);
router.put("/:id/update", verifyToken, updateManualEntry);       
router.delete("/:id/delete", verifyToken, deleteManualEntry);    

export default router;
