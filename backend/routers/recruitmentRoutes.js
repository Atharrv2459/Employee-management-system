import express from "express";
import multer from "multer";
import * as recruitmentController from "../controllers/recruitmentController.js";
import { verifyToken } from "../middleware/auth.js";
import isAdmin from "../middleware/adminCheck.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// =====================================================
// PUBLIC ROUTES (Careers Page)
// =====================================================
router.get("/careers", recruitmentController.getPublishedJobs);
router.get("/careers/:slug", recruitmentController.getJobBySlug);
router.post("/apply", upload.single("resume"), recruitmentController.submitApplication);

// =====================================================
// JOB POSTINGS (Admin/HR)
// =====================================================
router.get("/jobs", verifyToken, recruitmentController.getAllJobs);
router.post("/jobs", verifyToken, isAdmin, recruitmentController.createJob);
router.put("/jobs/:id", verifyToken, isAdmin, recruitmentController.updateJob);

// =====================================================
// APPLICATIONS (Admin/HR)
// =====================================================
router.get("/jobs/:jobId/applications", verifyToken, recruitmentController.getApplicationsByJob);
router.get("/applications/:id", verifyToken, recruitmentController.getApplicationDetails);
router.put("/applications/:id/status", verifyToken, recruitmentController.updateApplicationStatus);
router.get("/applications/:id/resume", verifyToken, isAdmin, recruitmentController.downloadApplicationResume);

// =====================================================
// RESUME ANALYSIS WITH AI
// =====================================================
router.post("/resume-analysis", verifyToken, isAdmin, recruitmentController.analyzeResumeJobMatch);
router.post("/resume-analysis/batch", verifyToken, isAdmin, recruitmentController.batchAnalyzeResumes);
router.get("/resume-analysis/:applicationId", verifyToken, recruitmentController.getApplicationAnalysis);

// =====================================================
// GOOGLE FORM INTEGRATION
// =====================================================
router.post("/jobs/:jobId/generate-form", verifyToken, isAdmin, recruitmentController.generateGoogleForm);
router.get("/jobs/:jobId/form-link", recruitmentController.getFormLink);

// =====================================================
// RANKED CANDIDATES
// =====================================================
router.get("/jobs/:jobId/ranked-applications", verifyToken, recruitmentController.getRankedApplications);
router.post("/jobs/:jobId/auto-analyze", verifyToken, isAdmin, recruitmentController.autoAnalyzeAllResumes);

// =====================================================
// DASHBOARD
// =====================================================
router.get("/dashboard", verifyToken, recruitmentController.getDashboardStats);

export default router;
