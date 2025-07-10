import express from "express";
import { createEmergencyContact, getEmergencyContact, updateEmergencyContact, deleteEmergencyContact } from "../controllers/emergencyContactController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", verifyToken, createEmergencyContact);
router.get("/get", verifyToken, getEmergencyContact);
router.put("/:id", verifyToken, updateEmergencyContact);
router.delete("/:id", verifyToken, deleteEmergencyContact);

export default router;
