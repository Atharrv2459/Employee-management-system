# Resume Upload & Analysis Workflow Guide

## Overview

Complete end-to-end workflow to:
1. Upload resumes (PDF, DOCX, TXT)
2. Extract text from files
3. Analyze with Gemini API
4. Rank candidates by match score
5. Display best matches

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    RESUME UPLOAD FLOW                        │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 1. FRONTEND - File Upload                                   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ResumeUpload Component                                  │ │
│ │ - Drag & drop resume file (PDF, DOCX, TXT)             │ │
│ │ - Display file preview                                 │ │
│ │ - Show upload progress                                 │ │
│ │ - Validate file type & size                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│        ↓                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FormData multipart/form-data                            │ │
│ │ - file (binary)                                         │ │
│ │ - jobId (UUID)                                          │ │
│ │ - candidateEmail (email)                                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. BACKEND - File Upload & Text Extraction                  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ POST /api/recruitment/upload-resume                     │ │
│ │ - Receive file from frontend                           │ │
│ │ - Validate file (type, size, virus scan)               │ │
│ │ - Store file temporarily or permanently                │ │
│ └─────────────────────────────────────────────────────────┘ │
│        ↓                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Extract Text Based on File Type                         │ │
│ │ - PDF  → Use pdfjs-dist or pdf-parse                   │ │
│ │ - DOCX → Use mammoth or docx-parser                    │ │
│ │ - TXT  → Read directly                                 │ │
│ │ Result: Plain text resume                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│        ↓                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Store in Database                                       │ │
│ │ - INSERT into job_applications                          │ │
│ │ - resume_text (TEXT column)                             │ │
│ │ - resume_file_path (for archive)                        │ │
│ │ - uploaded_at (TIMESTAMP)                               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. BACKEND - Gemini Analysis                                │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ POST /api/recruitment/resume-analysis                  │ │
│ │ - Get job requirements from DB                         │ │
│ │ - Send resume_text + job_details to Gemini             │ │
│ │ - Receive analysis JSON                                │ │
│ │ Result: Score 0-100, skills, recommendations           │ │
│ └─────────────────────────────────────────────────────────┘ │
│        ↓                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Store Analysis in Database                              │ │
│ │ - UPDATE job_applications                               │ │
│ │ - ai_analysis (JSON column)                             │ │
│ │ - analyzed_at (TIMESTAMP)                               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. BACKEND - Ranking & Selection                            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ GET /api/recruitment/jobs/:jobId/ranked-applications   │ │
│ │ - Get all applications for job                         │ │
│ │ - Filter by analyzed_at IS NOT NULL                    │ │
│ │ - Extract overall_score from ai_analysis              │ │
│ │ - Sort by score DESC                                   │ │
│ │ - Add rank position (1, 2, 3, ...)                     │ │
│ │ Result: Ranked list of best matches                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. FRONTEND - Display Results                               │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ RankedCandidates Component                              │ │
│ │ - Show ranked table                                    │ │
│ │ - Rank | Name | Email | Score | Match %               │ │
│ │ - Click to see detailed analysis                       │ │
│ │ - Highlight top 3 candidates                           │ │
│ │ - Quick actions (Schedule Interview, Send Offer)      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Step 1: Install Required Dependencies

```bash
cd backend
npm install multer pdfjs-dist mammoth dotenv
```

**Why these packages:**
- `multer` - Handle file uploads
- `pdfjs-dist` - Extract text from PDF files
- `mammoth` - Extract text from DOCX files
- `dotenv` - Already installed, for environment config

### Step 2: Create File Upload Endpoint

#### A. Configure Multer Middleware

Create `backend/middleware/uploadResume.js`:
```javascript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads/resumes';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, and TXT allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

export default upload;
```

#### B. Create Text Extraction Service

Create `backend/services/resumeTextExtractor.js`:
```javascript
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import fs from 'fs';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Extract text from PDF file
 */
export const extractFromPDF = async (filePath) => {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjs.getDocument({ data }).promise;
    let text = '';

    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const textContent = await page.getTextContent();
      text += textContent.items.map(item => item.str).join(' ');
      text += '\n';
    }

    return text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Extract text from DOCX file
 */
export const extractFromDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from DOCX');
  }
};

/**
 * Extract text from TXT file
 */
export const extractFromTXT = async (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error('TXT extraction error:', error);
    throw new Error('Failed to extract text from TXT');
  }
};

/**
 * Detect file type and extract accordingly
 */
export const extractResumeText = async (filePath, mimeType) => {
  if (mimeType === 'application/pdf') {
    return await extractFromPDF(filePath);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await extractFromDOCX(filePath);
  } else if (mimeType === 'text/plain') {
    return await extractFromTXT(filePath);
  } else {
    throw new Error('Unsupported file type');
  }
};
```

### Step 3: Add Upload Endpoint to Controller

Add to `backend/controllers/recruitmentController.js`:

```javascript
import upload from '../middleware/uploadResume.js';
import { extractResumeText } from '../services/resumeTextExtractor.js';

/**
 * Upload resume file and extract text
 */
export const uploadResume = async (req, res) => {
  const { jobId, candidateEmail } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!jobId || !candidateEmail) {
    return res.status(400).json({ error: "Missing jobId or candidateEmail" });
  }

  try {
    // Extract text from uploaded file
    const resumeText = await extractResumeText(req.file.path, req.file.mimetype);
    
    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: "Resume file is empty" });
    }

    // Check if job exists
    const jobResult = await pool.query(
      `SELECT id FROM job_postings WHERE id = $1`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if application already exists
    let application = await pool.query(
      `SELECT * FROM job_applications 
       WHERE job_id = $1 AND applicant_email = $2`,
      [jobId, candidateEmail]
    );

    if (application.rows.length > 0) {
      // Update existing application with new resume
      const result = await pool.query(
        `UPDATE job_applications 
         SET resume_text = $1, 
             resume_file_path = $2, 
             uploaded_at = CURRENT_TIMESTAMP,
             ai_analysis = NULL,
             analyzed_at = NULL
         WHERE job_id = $3 AND applicant_email = $4
         RETURNING id`,
        [resumeText.substring(0, 50000), req.file.path, jobId, candidateEmail]
      );

      return res.json({
        success: true,
        applicationId: result.rows[0].id,
        message: "Resume updated successfully"
      });
    } else {
      // Create new application with resume
      const result = await pool.query(
        `INSERT INTO job_applications 
         (job_id, applicant_email, resume_text, resume_file_path, status, uploaded_at)
         VALUES ($1, $2, $3, $4, 'new', CURRENT_TIMESTAMP)
         RETURNING id`,
        [jobId, candidateEmail, resumeText.substring(0, 50000), req.file.path]
      );

      return res.status(201).json({
        success: true,
        applicationId: result.rows[0].id,
        message: "Resume uploaded successfully"
      });
    }
  } catch (error) {
    console.error("Upload resume error:", error);
    res.status(500).json({ error: error.message || "Failed to upload resume" });
  }
};

/**
 * Get ranked applications for a job (sorted by match score)
 */
export const getRankedApplications = async (req, res) => {
  const { jobId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        ja.id,
        ja.applicant_email,
        ja.status,
        ja.uploaded_at,
        ja.analyzed_at,
        (ja.ai_analysis->>'overallScore')::INTEGER as match_score,
        ja.ai_analysis->>'recommendation' as recommendation,
        ja.ai_analysis->>'summary' as summary,
        ROW_NUMBER() OVER (ORDER BY (ja.ai_analysis->>'overallScore')::INTEGER DESC) as rank
      FROM job_applications ja
      WHERE ja.job_id = $1 
        AND ja.resume_text IS NOT NULL
        AND ja.ai_analysis IS NOT NULL
      ORDER BY (ja.ai_analysis->>'overallScore')::INTEGER DESC
    `, [jobId]);

    res.json({
      success: true,
      total: result.rows.length,
      ranked: result.rows.map(row => ({
        rank: row.rank,
        applicationId: row.id,
        email: row.applicant_email,
        matchScore: row.match_score,
        recommendation: row.recommendation,
        summary: row.summary,
        status: row.status
      }))
    });
  } catch (error) {
    console.error("Get ranked applications error:", error);
    res.status(500).json({ error: "Failed to fetch ranked applications" });
  }
};

/**
 * Auto-analyze all resumes for a job
 */
export const autoAnalyzeAllResumes = async (req, res) => {
  const { jobId } = req.params;

  try {
    // Get job details
    const jobResult = await pool.query(
      `SELECT * FROM job_postings WHERE id = $1`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const jobData = jobResult.rows[0];

    // Get all resumes that haven't been analyzed
    const applicationsResult = await pool.query(
      `SELECT id, applicant_email, resume_text FROM job_applications 
       WHERE job_id = $1 
         AND resume_text IS NOT NULL
         AND (ai_analysis IS NULL OR analyzed_at IS NULL)
       LIMIT 50`,
      [jobId]
    );

    const applications = applicationsResult.rows;
    const results = [];

    for (const app of applications) {
      try {
        // Call Gemini API for each resume
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `You are an expert HR recruiter. Analyze the following resume against the job requirements.

JOB: ${jobData.title}
REQUIREMENTS: ${jobData.requirements}
DESCRIPTION: ${jobData.description}

RESUME:
${app.resume_text.substring(0, 5000)}

Return ONLY a JSON object with: overallScore (0-100), recommendation (Strong Match/Good Match/Fair Match/Poor Match), missingSkills (array), and summary (brief text).`;

        const response = await model.generateContent(prompt);
        const responseText = response.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);

          // Store analysis in database
          await pool.query(
            `UPDATE job_applications 
             SET ai_analysis = $1, analyzed_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [JSON.stringify(analysis), app.id]
          );

          results.push({
            applicationId: app.id,
            email: app.applicant_email,
            score: analysis.overallScore,
            recommendation: analysis.recommendation,
            status: 'success'
          });
        }
      } catch (error) {
        results.push({
          applicationId: app.id,
          email: app.applicant_email,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      totalAnalyzed: results.length,
      results: results
    });
  } catch (error) {
    console.error("Auto-analyze error:", error);
    res.status(500).json({ error: "Failed to analyze resumes" });
  }
};
```

### Step 4: Add Routes

Update `backend/routers/recruitmentRoutes.js`:

```javascript
import upload from '../middleware/uploadResume.js';

// Resume upload and analysis
router.post("/upload-resume", upload.single('resume'), recruitmentController.uploadResume);
router.get("/jobs/:jobId/ranked-applications", verifyToken, recruitmentController.getRankedApplications);
router.post("/jobs/:jobId/auto-analyze", verifyToken, isAdmin, recruitmentController.autoAnalyzeAllResumes);
```

### Step 5: Create React Components

#### A. Resume Upload Component

Create `react-vite-tailwind-daisyui/src/wireframes/admin/ResumeUpload.jsx`:

```jsx
import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ResumeUpload({ jobId, onUploadSuccess }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    // Validate file
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, DOCX, and TXT files allowed');
      return;
    }

    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobId', jobId);
      formData.append('candidateEmail', 'candidate@example.com'); // Get from context

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 201 || xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          toast.success(response.message || 'Resume uploaded successfully');
          onUploadSuccess?.(response);
        } else {
          const error = JSON.parse(xhr.responseText);
          toast.error(error.error || 'Upload failed');
        }
        setUploading(false);
        setProgress(0);
      });

      xhr.addEventListener('error', () => {
        toast.error('Upload failed');
        setUploading(false);
      });

      xhr.open('POST', '/api/recruitment/upload-resume');
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
      xhr.send(formData);
    } catch (error) {
      toast.error(error.message);
      setUploading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h3 className="card-title flex items-center gap-2">
          <FiUploadCloud className="text-2xl" />
          Upload Resume
        </h3>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition
            ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt"
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <>
              <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
              <p className="text-sm text-gray-600 mb-2">Uploading...</p>
              <div className="w-full max-w-xs">
                <progress className="progress progress-primary w-full" value={progress} max="100"></progress>
                <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}%</p>
              </div>
            </>
          ) : (
            <>
              <FiUploadCloud className="text-4xl text-gray-400 mb-2" />
              <p className="text-lg font-semibold mb-1">Drag & drop resume here</p>
              <p className="text-sm text-gray-500">or click to select file</p>
              <p className="text-xs text-gray-400 mt-2">PDF, DOCX, or TXT (max 10MB)</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### B. Ranked Candidates Component

Create `react-vite-tailwind-daisyui/src/wireframes/admin/RankedCandidates.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { FiAward, FiMail, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function RankedCandidates({ jobId }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchRankedApplications();
  }, [jobId]);

  const fetchRankedApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/recruitment/jobs/${jobId}/ranked-applications`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      if (data.success) {
        setCandidates(data.ranked);
      }
    } catch (error) {
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch(
        `/api/recruitment/jobs/${jobId}/auto-analyze`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      const data = await response.json();
      toast.success(`Analyzed ${data.totalAnalyzed} resumes`);
      await fetchRankedApplications();
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'badge-success';
    if (score >= 60) return 'badge-warning';
    return 'badge-error';
  };

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h3 className="card-title flex items-center gap-2">
            <FiAward className="text-2xl" />
            Ranked Candidates
          </h3>
          <button
            onClick={handleAutoAnalyze}
            className="btn btn-primary btn-sm"
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Analyzing...
              </>
            ) : (
              <>
                <FiRefreshCw /> Analyze All
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center"><div className="loading loading-spinner"></div></div>
        ) : candidates.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No candidates analyzed yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Email</th>
                  <th>Match Score</th>
                  <th>Recommendation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.applicationId} className={c.rank <= 3 ? 'highlight' : ''}>
                    <td className="font-bold text-lg">#{c.rank}</td>
                    <td className="flex items-center gap-2">
                      <FiMail /> {c.email}
                    </td>
                    <td>
                      <div className={`badge ${getScoreColor(c.matchScore)}`}>
                        {c.matchScore}%
                      </div>
                    </td>
                    <td>{c.recommendation}</td>
                    <td>
                      <div className="badge badge-outline">{c.status}</div>
                    </td>
                    <td>
                      <button className="btn btn-xs btn-ghost">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Complete Workflow Summary

### 1️⃣ User Uploads Resume
- Admin/HR manager visits job details page
- Uses ResumeUpload component (drag & drop)
- File is uploaded and text extracted

### 2️⃣ Resume Text Stored
- Extracted text stored in `job_applications.resume_text`
- File path stored for archival
- Application created or updated

### 3️⃣ Gemini Analyzes
- Either manually via "Analyze Resume" button
- Or automatically via "Analyze All" button
- Gemini compares resume vs job requirements
- Analysis stored in `ai_analysis` JSON column

### 4️⃣ Results Ranked
- Fetch ranked applications sorted by score
- Display in table sorted best-first
- Show match percentage, recommendation, summary

### 5️⃣ Take Action
- Click candidate to see full analysis
- Schedule interview, send offer, etc.
- Mark as qualified/rejected

---

## Database Schema Updates

Add these columns to `job_applications` table if not already present:

```sql
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS resume_file_path TEXT;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP;
```

---

## Key Features

✅ **Multiple File Types**: PDF, DOCX, TXT support
✅ **Automatic Text Extraction**: Via pdfjs, mammoth
✅ **Gemini Integration**: Analyzes resumes against job requirements
✅ **Ranking**: Auto-sorted by match score
✅ **Batch Processing**: Analyze multiple resumes at once
✅ **Progress Tracking**: Show upload/analysis progress
✅ **Error Handling**: Graceful failure messages

---

## Testing the Complete Flow

```bash
# 1. Upload a test resume
curl -X POST http://localhost:5001/api/recruitment/upload-resume \
  -F "resume=@/path/to/resume.pdf" \
  -F "jobId=job-uuid" \
  -F "candidateEmail=test@example.com" \
  -H "Authorization: Bearer TOKEN"

# 2. Analyze the resume
curl -X POST http://localhost:5001/api/recruitment/resume-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"applicationId":"app-uuid","jobId":"job-uuid","resumeText":"..."}'

# 3. Get ranked candidates
curl http://localhost:5001/api/recruitment/jobs/job-uuid/ranked-applications \
  -H "Authorization: Bearer TOKEN"

# 4. Auto-analyze all resumes for a job
curl -X POST http://localhost:5001/api/recruitment/jobs/job-uuid/auto-analyze \
  -H "Authorization: Bearer TOKEN"
```

---

This complete implementation handles the entire workflow from resume upload to best candidate selection! 🎯
