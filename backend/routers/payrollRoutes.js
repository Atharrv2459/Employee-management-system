import express from "express";
import * as payrollController from "../controllers/payrollController.js";
import { verifyToken } from "../middleware/auth.js";
import isAdmin from "../middleware/adminCheck.js";

const router = express.Router();

// =====================================================
// SALARY COMPONENTS (Admin only)
// =====================================================
router.get("/components", payrollController.getAllComponents);
router.post("/components", verifyToken, isAdmin, payrollController.createComponent);
router.put("/components/:id", verifyToken, isAdmin, payrollController.updateComponent);


router.get("/structures", payrollController.getAllStructures);
router.get("/structures/:id", payrollController.getStructureById);
router.post("/structures", verifyToken, isAdmin, payrollController.createStructure);
router.put("/structures/:id/components", verifyToken, isAdmin, payrollController.updateStructureComponents);

router.get("/employee-salaries", verifyToken, isAdmin, payrollController.getAllEmployeeSalaries);
router.get("/employee-salaries/:userId", verifyToken, payrollController.getEmployeeSalary);
router.post("/employee-salaries", verifyToken, isAdmin, payrollController.assignEmployeeSalary);

// =====================================================
// PAYROLL PERIODS (Admin only)
// =====================================================
router.get("/periods", verifyToken, payrollController.getAllPayrollPeriods);
router.post("/periods", verifyToken, isAdmin, payrollController.createPayrollPeriod);
router.post("/periods/:periodId/process", verifyToken, isAdmin, payrollController.processPayroll);

// =====================================================
// PAYSLIPS
// =====================================================
router.get("/payslips/my", verifyToken, payrollController.getMyPayslips);
router.get("/payslips/period/:periodId", verifyToken, isAdmin, payrollController.getPayslipsByPeriod);
router.get("/payslips/:id", verifyToken, payrollController.getPayslipDetails);

// =====================================================
// LOANS
// =====================================================
router.get("/loans", verifyToken, isAdmin, payrollController.getAllLoans);
router.post("/loans", verifyToken, payrollController.applyForLoan);
router.put("/loans/:id/status", verifyToken, isAdmin, payrollController.updateLoanStatus);

// =====================================================
// REIMBURSEMENTS
// =====================================================
router.get("/reimbursements", verifyToken, payrollController.getReimbursements);
router.post("/reimbursements", verifyToken, payrollController.submitReimbursement);
router.put("/reimbursements/:id/status", verifyToken, isAdmin, payrollController.updateReimbursementStatus);

export default router;
