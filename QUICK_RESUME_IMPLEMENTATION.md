# Simplified Resume Selection - Quick Implementation (No Interviews)

## 🎯 Complete Workflow

### 1️⃣ Backend: Upload & Extraction

**Install packages:**
```bash
cd backend
npm install multer pdfjs-dist mammoth
```

**Create middleware** (`backend/middleware/uploadResume.js`):
- Configure multer for file storage
- Set file type whitelist (PDF, DOCX, TXT)
- Set max file size (10MB)

**Create service** (`backend/services/resumeTextExtractor.js`):
- Extract text from PDF (pdfjs-dist)
- Extract text from DOCX (mammoth)
- Extract text from TXT (fs)

**Add controller functions** to `recruitmentController.js`:
- `uploadResume()` - Handle file upload & text extraction
- `getRankedApplications()` - Get sorted list of candidates
- `autoAnalyzeAllResumes()` - Batch analyze all resumes

**Add routes** to `recruitmentRoutes.js`:
```javascript
router.post("/upload-resume", upload.single('resume'), uploadResume);
router.get("/jobs/:jobId/ranked-applications", getRankedApplications);
router.post("/jobs/:jobId/auto-analyze", autoAnalyzeAllResumes);
```

---

### 2️⃣ Frontend: Upload Component

**Create `ResumeUpload.jsx`:**
- Drag & drop file input
- File type validation
- Upload progress bar
- Error handling
- Success toast notification

**Features:**
- Display upload progress %
- Show loading spinner
- Handle upload errors
- Call parent callback on success

---

### 3️⃣ Frontend: Ranking Component

**Create `RankedCandidates.jsx`:**
- Fetch ranked applications via API
- Display in sorted table
- Color-code by score (green/yellow/red)
- "Analyze All" button
- Click to view full analysis

**Features:**
- Auto-refresh after analysis
- Show rank, email, score, recommendation
- Highlight top 3 candidates
- Quick action buttons

---

## Database Changes Needed

```sql
-- Add columns to job_applications (if not already present)
ALTER TABLE job_applications 
  ADD COLUMN resume_file_path TEXT,
  ADD COLUMN uploaded_at TIMESTAMP,
  ADD COLUMN analyzed_at TIMESTAMP;
```

---

## Complete Flow (30 seconds)

```
Admin → Upload Resume (ResumeUpload.jsx)
           ↓
Backend → Extract Text (uploadResume controller)
           ↓
Database → Store resume_text
           ↓
Admin → Click "Analyze All" (RankedCandidates.jsx)
           ↓
Backend → Batch call Gemini API (autoAnalyzeAllResumes)
           ↓
Database → Store ai_analysis JSON
           ↓
Frontend → Display ranked table (RankedCandidates.jsx)
           ↓
Admin → Click candidate → See detailed analysis
```

---

## Code Snippets

### Upload Controller (Key Part)
```javascript
export const uploadResume = async (req, res) => {
  const resumeText = await extractResumeText(req.file.path, req.file.mimetype);
  
  const result = await pool.query(
    `INSERT/UPDATE job_applications SET resume_text = $1, ...`,
    [resumeText]
  );
  
  res.json({ success: true, applicationId: result.rows[0].id });
};
```

### Ranking Query (Key Part)
```sql
SELECT 
  ja.id,
  ja.applicant_email,
  (ja.ai_analysis->>'overallScore')::INTEGER as match_score,
  ROW_NUMBER() OVER (ORDER BY ... DESC) as rank
FROM job_applications ja
WHERE job_id = $1 AND ai_analysis IS NOT NULL
ORDER BY match_score DESC;
```

### React Upload (Key Part)
```jsx
const formData = new FormData();
formData.append('resume', file);
formData.append('jobId', jobId);

const response = await fetch('/api/recruitment/upload-resume', {
  method: 'POST',
  body: formData,
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## File Structure

```
backend/
├── middleware/
│   └── uploadResume.js          (NEW)
├── services/
│   └── resumeTextExtractor.js   (NEW)
├── controllers/
│   └── recruitmentController.js (ADD 3 functions)
└── routers/
    └── recruitmentRoutes.js     (ADD 3 routes)

react-vite-tailwind-daisyui/src/wireframes/admin/
├── ResumeUpload.jsx             (NEW)
└── RankedCandidates.jsx         (NEW)
```

---

## Testing Quick Commands

```bash
# Upload a resume
curl -X POST http://localhost:5001/api/recruitment/upload-resume \
  -F "resume=@resume.pdf" \
  -F "jobId=job-uuid" \
  -H "Authorization: Bearer TOKEN"

# Get ranked candidates
curl http://localhost:5001/api/recruitment/jobs/job-uuid/ranked-applications \
  -H "Authorization: Bearer TOKEN"

# Auto-analyze all
curl -X POST http://localhost:5001/api/recruitment/jobs/job-uuid/auto-analyze \
  -H "Authorization: Bearer TOKEN"
```

---

## Key Features Summary

✅ Upload PDF, DOCX, TXT files (max 10MB)
✅ Auto-extract text from all formats
✅ Store in database for persistence
✅ Call Gemini API for AI analysis
✅ Get match score 0-100% per resume
✅ Auto-rank candidates by score
✅ Batch analyze multiple resumes
✅ Display ranked results in table
✅ Click candidate for full analysis
✅ Show upload/analysis progress

---

## Implementation Time Estimate

**Backend Setup**: 2-3 hours
- Install packages
- Create middleware & service
- Add controller functions
- Add routes
- Test with curl

**Frontend Setup**: 2-3 hours
- Create ResumeUpload component
- Create RankedCandidates component
- Integration with existing UI
- Test in browser

**Total**: 4-6 hours for complete integration

---

## Next Steps

1. ✅ Review complete guide: `RESUME_UPLOAD_ANALYSIS_GUIDE.md`
2. ✅ Check workflow diagram: `RESUME_WORKFLOW_DIAGRAM.md`
3. Install packages: `npm install multer pdfjs-dist mammoth`
4. Create middleware & service files
5. Add controller functions
6. Add React components
7. Test with sample resumes
8. Deploy and start using!

---

All code examples and detailed implementation in `RESUME_UPLOAD_ANALYSIS_GUIDE.md`! 📚
