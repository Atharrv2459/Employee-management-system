import express from "express";
import { verifyToken } from "../middleware/auth.js"; // your JWT middleware
import { getAuthOptions, getRegisterOptions, hasDevice, verifyAuth, verifyRegister } from "../controllers/webauthController.js";

const router = express.Router();

router.post("/register-options", verifyToken, getRegisterOptions);
router.post("/register-verify", verifyToken, verifyRegister);
router.get("/has-device", verifyToken, hasDevice);
router.post("/auth-options", verifyToken, getAuthOptions);
router.post("/auth-verify", verifyToken, verifyAuth);


export default router;
