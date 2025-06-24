// routes/employeesRouter.jsx
import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { createEmployee, deleteEmployee, getAllEmployees, getOwnEmployee, updateEmployee } from "../controllers/employeeController.js";


const router = express.Router();

router.post("/create",verifyToken, createEmployee);
router.get("/get",verifyToken,getOwnEmployee);
router.get("/getAll",getAllEmployees);
router.put("/update",verifyToken,updateEmployee);
router.delete("/delete",verifyToken, deleteEmployee);

export default router;
