import express from "express";
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  getDepartmentHierarchy,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees,
  transferEmployee,
  getTransferHistory,
} from "../controllers/departmentController.js";
import { verifyToken } from "../middleware/auth.js";
import { isAdmin } from "../middleware/adminCheck.js";

const router = express.Router();

// Public routes (for dropdown lists, etc.)
router.get("/", getAllDepartments);
router.get("/hierarchy", getDepartmentHierarchy);
router.get("/:id", getDepartmentById);

// Protected routes - require authentication
router.use(verifyToken);

// Department management (Admin only)
router.post("/", verifyToken, isAdmin, createDepartment);
router.put("/:id", verifyToken, isAdmin, updateDepartment);
router.delete("/:id", verifyToken, isAdmin, deleteDepartment);

// Employee management within departments (Manager/Admin)
router.get("/:id/employees", verifyToken, getDepartmentEmployees);
router.post("/transfer", verifyToken, transferEmployee);
router.get("/transfer-history/:user_id", verifyToken, getTransferHistory);

export default router;