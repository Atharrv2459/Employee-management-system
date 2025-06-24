// routes/managersRouter.jsx
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { createManager, deleteManager, getAllManagers, getOwnManager, updateManager } from "../controllers/managerController.js";

const router = express.Router();



router.post("/create",verifyToken, createManager);      
router.get("/get", verifyToken,getOwnManager);       
router.patch("/update",verifyToken, updateManager);       
router.delete("/delete", deleteManager);    
router.get("/getAll",getAllManagers)

export default router;
