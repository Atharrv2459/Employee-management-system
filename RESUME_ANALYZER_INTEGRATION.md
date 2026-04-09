# Resume-Job Match Analyzer - Integration Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install @google/generative-ai
```

### 2. Get Gemini API Key
1. Visit: https://aistudio.google.com/app/apikeys
2. Click "Create API Key"
3. Add to `.env`:
```
GEMINI_API_KEY=your_api_key_here
```

### 3. Test API Endpoints

**Single Resume Analysis**:
```bash
curl -X POST http://localhost:5001/api/recruitment/resume-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "applicationId": "uuid",
    "jobId": "uuid",
    "resumeText": "John Doe...",
    "applicantEmail": "john@example.com"
  }'
```

**Batch Analysis**:
```bash
curl -X POST http://localhost:5001/api/recruitment/resume-analysis/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jobId": "uuid",
    "applications": [
      {"applicationId": "uuid1", "resumeText": "..."},
      {"applicationId": "uuid2", "resumeText": "..."}
    ]
  }'
```

## Frontend Integration

### Use ResumeAnalyzer Component
```jsx
import ResumeAnalyzer from './wireframes/admin/ResumeAnalyzer';

function ApplicationDetail() {
  return (
    <ResumeAnalyzer
      applicationId={app.id}
      jobId={app.job_id}
      resumeText={app.resume_text}
      jobTitle={app.job_title}
      onAnalysisComplete={(analysis) => {
        console.log('Analysis:', analysis);
      }}
    />
  );
}
```

### Use BulkResumeAnalyzer Component
```jsx
import { BulkResumeAnalyzer } from './wireframes/admin/ResumeAnalyzer';

function JobApplications() {
  return (
    <BulkResumeAnalyzer
      jobId={jobId}
      applications={applications}
      onComplete={(results) => {
        console.log('Ranked results:', results.ranked);
      }}
    />
  );
}
```

## Files Modified/Created

### Backend
- `controllers/recruitmentController.js` - Added 3 new functions:
  - `analyzeResumeJobMatch()` - Single resume analysis
  - `batchAnalyzeResumes()` - Multiple resume analysis
  - `getApplicationAnalysis()` - Retrieve stored analysis
- `routers/recruitmentRoutes.js` - Added 3 new endpoints
- `.env` - Added `GEMINI_API_KEY` variable

### Frontend
- `wireframes/admin/ResumeAnalyzer.jsx` - New component with:
  - `ResumeAnalyzer` - Single analysis component
  - `BulkResumeAnalyzer` - Batch analysis component

## Analysis Output Example

```json
{
  "overallScore": 85,
  "skillMatch": {
    "matched": ["Python", "React", "PostgreSQL", "Docker"],
    "percentage": 85
  },
  "missingSkills": ["Kubernetes", "AWS"],
  "experienceRelevance": {
    "relevantExperience": "5+ years in full-stack development",
    "yearsRelevant": 5,
    "alignment": "High"
  },
  "strengths": [
    "Strong technical foundation",
    "Relevant industry experience",
    "Good problem-solving skills"
  ],
  "concerns": [
    "Limited cloud infrastructure experience",
    "No Kubernetes background"
  ],
  "recommendation": "Strong Match",
  "suggestions": [
    "Consider taking Kubernetes certification",
    "AWS experience would be valuable"
  ],
  "summary": "Excellent candidate with most required skills and proven track record in similar roles"
}
```

## Features

✅ **Single Resume Analysis** - Analyze one resume against job requirements
✅ **Batch Processing** - Analyze multiple resumes simultaneously  
✅ **Ranking** - Auto-ranked by match score
✅ **Skill Matching** - Matched and missing skills analysis
✅ **Experience Relevance** - Evaluates experience alignment
✅ **Recommendations** - Specific suggestions for improvement
✅ **Database Storage** - Results stored for reference
✅ **Admin Only** - Secured with admin authentication

## Pricing & Free Tier

- **Free Tier**: 60 requests/minute (essentially unlimited for most HR teams)
- **Paid**: $0.075 per 1M input tokens / $0.30 per 1M output tokens
- **Estimated Cost**: ~$0.002-0.005 per analysis after free tier

## Troubleshooting

### "GEMINI_API_KEY not found"
- Check `.env` file has `GEMINI_API_KEY=...`
- Restart backend server: `npm run dev`

### "Failed to extract JSON from AI response"
- Model may be returning malformed JSON
- Check if resumeText is valid
- Try with different resume text format

### Rate Limiting (429 error)
- You've exceeded 60 requests/minute
- Wait a minute before retrying
- Consider implementing request queuing for bulk operations

### Invalid API Key
- Verify key at: https://aistudio.google.com/app/apikeys
- Ensure API is enabled in Google Cloud Console

## Next Steps

1. ✅ Resume-Job Match Analyzer implemented
2. 📋 Optional: Employee Data Summarizer (similar implementation)
3. 🎯 Phases 5-8: Performance Management, Compliance, Training, Analytics

## Files Reference

- Setup Details: `RESUME_ANALYZER_SETUP.md`
- Frontend Component: `react-vite-tailwind-daisyui/src/wireframes/admin/ResumeAnalyzer.jsx`
- Backend Controller: `backend/controllers/recruitmentController.js`
- API Routes: `backend/routers/recruitmentRoutes.js`
- Environment: `backend/.env`
