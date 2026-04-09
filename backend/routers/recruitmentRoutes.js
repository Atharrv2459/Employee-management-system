import express from "express";
import * as recruitmentController from "../controllers/recruitmentController.js";
import { verifyToken } from "../middleware/auth.js";
import isAdmin from "../middleware/adminCheck.js";

const router = express.Router();

// =====================================================
// PUBLIC ROUTES (Careers Page)
// =====================================================
router.get("/careers", recruitmentController.getPublishedJobs);
router.get("/careers/:slug", recruitmentController.getJobBySlug);
router.post("/apply", recruitmentController.submitApplication);

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

// =====================================================
// RESUME ANALYSIS WITH AI
// =====================================================
router.post("/resume-analysis", verifyToken, isAdmin, recruitmentController.analyzeResumeJobMatch);
router.post("/resume-analysis/batch", verifyToken, isAdmin, recruitmentController.batchAnalyzeResumes);
router.get("/resume-analysis/:applicationId", verifyToken, recruitmentController.getApplicationAnalysis);

// =====================================================
// INTERVIEWS
// =====================================================
router.get("/interviews/my", verifyToken, recruitmentController.getMyInterviews);
router.post("/interviews", verifyToken, recruitmentController.scheduleInterview);
router.post("/interviews/:interviewId/feedback", verifyToken, recruitmentController.submitFeedback);
router.get("/stages", recruitmentController.getInterviewStages);

// =====================================================
// OFFER LETTERS
// =====================================================
router.post("/offers", verifyToken, isAdmin, recruitmentController.createOffer);
router.put("/offers/:id/status", verifyToken, recruitmentController.updateOfferStatus);

// =====================================================
// DASHBOARD
// =====================================================
router.get("/dashboard", verifyToken, recruitmentController.getDashboardStats);

export default router;
