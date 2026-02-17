import express from "express";
import { adminDeleteUser, createUserByAdmin, getAllUsers, updateUser } from "../controllers/adminController.js";
import { verifyToken } from "../middleware/auth.js";
import { isAdmin } from "../middleware/adminCheck.js";

const router = express.Router();

router.get("/users", verifyToken, isAdmin, getAllUsers);
router.put("/users/:user_id", verifyToken, isAdmin, updateUser);

router.post("/users", verifyToken, isAdmin, createUserByAdmin);
router.delete("/delete-user/:id", verifyToken, adminDeleteUser);

export default router;
