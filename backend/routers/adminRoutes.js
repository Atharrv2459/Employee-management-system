import express from "express";
import { getAllUsers, updateUser } from "../controllers/adminController.js";
import { verifyToken } from "../middleware/auth.js";
import { isAdmin } from "../middleware/adminCheck.js";

const router = express.Router();

router.get("/users", verifyToken, isAdmin, getAllUsers);
router.put("/users/:user_id", verifyToken, isAdmin, updateUser);

export default router;
