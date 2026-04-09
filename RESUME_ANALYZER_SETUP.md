# Resume-Job Match Analyzer Using Google Gemini AI

## Overview
This feature integrates Google Gemini 2.0 Flash API to analyze resumes against job requirements automatically. The analyzer provides detailed matching scores, skill gap analysis, and recommendations.

## Why Google Gemini?
- **Large Free Tier**: 60 requests per minute (generous for most use cases)
- **Cost-Effective**: $0.075 per 1M input tokens / $0.30 per 1M output tokens (after free tier)
- **Fast**: Gemini 2.0 Flash is ultra-fast (2x faster than standard models)
- **Efficient**: Handles complex text analysis efficiently
- **No Additional Training**: Uses out-of-box capabilities

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Click "Create API Key in new Google Cloud project"
3. Copy the API key
4. Add to `.env` file:
   ```
   GEMINI_API_KEY=your_copied_api_key_here
   ```

### 2. Install Dependencies

```bash
cd backend
npm install @google/generative-ai
```

The `@google/generative-ai` package is already added to `package.json` (if not, add it manually):
```json
"@google/generative-ai": "^0.21.0"
```

### 3. Database Changes (Optional)

The system stores AI analysis in the existing `job_applications` table using the `ai_analysis` JSON column.

## API Endpoints

### 1. Analyze Single Resume
**Endpoint**: `POST /api/recruitment/resume-analysis`
**Auth**: Required (Admin only)

**Request Body**:
```json
{
  "applicationId": "app-uuid-here",
  "jobId": "job-uuid-here",
  "resumeText": "Full text of resume...",
  "applicantEmail": "candidate@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "overallScore": 85,
    "skillMatch": {
      "matched": ["Python", "React", "PostgreSQL"],
      "percentage": 85
    },
    "missingSkills": ["Docker", "Kubernetes"],
    "experienceRelevance": {
      "relevantExperience": "5+ years in full-stack development",
      "yearsRelevant": 5,
      "alignment": "High"
    },
    "strengths": [
      "Strong technical foundation",
      "Relevant experience in target domain"
    ],
    "concerns": [
      "Limited DevOps experience"
    ],
    "recommendation": "Strong Match",
    "suggestions": [
      "Consider upskilling in containerization"
    ],
    "summary": "Excellent candidate with most required skills"
  },
  "applicationId": "app-uuid",
  "stored": { "id": "app-uuid" }
}
```

### 2. Batch Analyze Multiple Resumes
**Endpoint**: `POST /api/recruitment/resume-analysis/batch`
**Auth**: Required (Admin only)

**Request Body**:
```json
{
  "jobId": "job-uuid-here",
  "applications": [
    {
      "applicationId": "app-uuid-1",
      "resumeText": "Resume text 1..."
    },
    {
      "applicationId": "app-uuid-2",
      "resumeText": "Resume text 2..."
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "totalAnalyzed": 2,
  "successCount": 2,
  "ranked": [
    {
      "rank": 1,
      "applicationId": "app-uuid-1",
      "score": 88,
      "recommendation": "Strong Match",
      "summary": "..."
    },
    {
      "rank": 2,
      "applicationId": "app-uuid-2",
      "score": 72,
      "recommendation": "Good Match",
      "summary": "..."
    }
  ],
  "all": [...]
}
```

### 3. Get Stored Analysis
**Endpoint**: `GET /api/recruitment/resume-analysis/:applicationId`
**Auth**: Required

**Response**:
```json
{
  "applicationId": "app-uuid",
  "analysis": { /* full analysis object */ },
  "status": "screening",
  "resumeLength": 2500
}
```

## Integration with Recruitment Flow

### In ApplicationsManagement.jsx (Admin):
```jsx
// After fetching applications
const [selectedApp, setSelectedApp] = useState(null);
const [analysis, setAnalysis] = useState(null);

// Analyze single resume
const handleAnalyzeResume = async (app) => {
  try {
    const response = await fetch('/api/recruitment/resume-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: app.id,
        jobId: app.job_id,
        resumeText: app.resume_text,
        applicantEmail: app.applicant_email
      })
    });
    const data = await response.json();
    setAnalysis(data.analysis);
  } catch (error) {
    console.error('Analysis failed:', error);
  }
};

// Bulk analyze for a job
const handleBulkAnalyze = async (jobId, applications) => {
  try {
    const response = await fetch('/api/recruitment/resume-analysis/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        applications: applications.map(a => ({
          applicationId: a.id,
          resumeText: a.resume_text
        }))
      })
    });
    const data = await response.json();
    // data.ranked contains sorted applications by match score
  } catch (error) {
    console.error('Bulk analysis failed:', error);
  }
};
```

## Features

### 1. Comprehensive Analysis
- **Overall Score**: 0-100 percentage match
- **Skill Matching**: Lists matched and missing skills with percentages
- **Experience Relevance**: Analyzes experience alignment
- **Strengths & Concerns**: Key points for hiring team
- **Recommendations**: Specific actions for candidates

### 2. Batch Processing
- Analyze multiple resumes simultaneously
- Automatic ranking by match score
- Efficient API usage (batched requests)

### 3. Performance Optimization
- Uses Gemini 2.0 Flash (ultra-fast model)
- Compact JSON responses
- Results stored in database for future reference
- Suitable for high-volume recruitment

## Rate Limiting & Quotas

**Free Tier**:
- 60 requests per minute
- 1,500 requests per day
- No credit card required

**Paid Tier** (after free tier exhausted):
- $0.075 per 1M input tokens
- $0.30 per 1M output tokens
- Estimated cost per analysis: ~$0.002-0.005

## Configuration

### Environment Variables (`.env`)
```
# Required
GEMINI_API_KEY=your_api_key_here

# Backend config (already set)
PORT=5001
DB_URL=...
JWT_SECRET=...
```

### Model Selection
Current: `gemini-2.0-flash`
Alternative: `gemini-pro` (more capable, slightly slower)

To change:
1. Open `backend/controllers/recruitmentController.js`
2. Find `model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })`
3. Change to preferred model

## Error Handling

The system handles:
- Missing API key (will return 500 error)
- Invalid JSON responses from AI
- Network timeouts (Gemini has ~30s timeout)
- Rate limiting (graceful degradation)

If experiencing issues:
1. Check API key is valid
2. Verify API is enabled in Google Cloud Console
3. Check rate limiting (60 req/min)
4. Review API usage in Google AI Studio

## Future Enhancements

1. **PDF Parsing**: Add pdfjs-dist to extract text from PDF resumes
2. **Skill Database**: Build custom skill taxonomy for better matching
3. **Interview Questions Generation**: Auto-generate questions based on resume gaps
4. **Offer Letter Generation**: Auto-generate offer letters
5. **Employee Data Summarizer**: Create similar analyzer for employee profiles
6. **Fine-tuning**: Train custom model on company's hiring data

## Security Notes

- API key is stored in `.env` (keep secure, never commit)
- Only admins can access analysis endpoints (verified by middleware)
- Resume text is stored in database (handle according to data policies)
- All API calls are server-side (key never exposed to frontend)

## Testing

### Manual Test with cURL

```bash
# Single analysis
curl -X POST http://localhost:5001/api/recruitment/resume-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "applicationId": "app-123",
    "jobId": "job-123",
    "resumeText": "John Doe...",
    "applicantEmail": "john@example.com"
  }'

# Batch analysis
curl -X POST http://localhost:5001/api/recruitment/resume-analysis/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "jobId": "job-123",
    "applications": [
      {"applicationId": "app-1", "resumeText": "..."},
      {"applicationId": "app-2", "resumeText": "..."}
    ]
  }'
```

## Support & Resources

- [Google Generative AI Documentation](https://ai.google.dev/docs)
- [Gemini API Quickstart](https://ai.google.dev/tutorials/quickstart)
- [Node.js SDK GitHub](https://github.com/google/generative-ai-js)
