import express from "express";
import { createEmergencyContact, getEmergencyContact, updateEmergencyContact, deleteEmergencyContact } from "../controllers/emergencyContactController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", verifyToken, createEmergencyContact);
router.get("/get", verifyToken, getEmergencyContact);
router.patch("/update", verifyToken, updateEmergencyContact);
router.delete("/delete", verifyToken, deleteEmergencyContact);

export default router;
