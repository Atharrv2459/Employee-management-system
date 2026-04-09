# Resume-Job Match Analyzer - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Vite)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────┐  ┌──────────────────────┐   │
│  │   ApplicationsManagement.jsx       │  │  ResumeAnalyzer.jsx  │   │
│  │   - List applications              │  │  ┌────────────────┐  │   │
│  │   - Show details                   │  │  │ Single Resume  │  │   │
│  │   - Select candidate               │  │  └────────────────┘  │   │
│  └────────────────────────────────────┘  │  ┌────────────────┐  │   │
│           ↓ (clicks "Analyze")           │  │ Bulk Analysis  │  │   │
│                                          │  └────────────────┘  │   │
│                                          │  ┌────────────────┐  │   │
│  ┌────────────────────────────────────┐  │  │ Analysis Tabs  │  │   │
│  │   Loading State                    │  │  │ - Overview     │  │   │
│  │   - Show spinner                   │  │  │ - Skills       │  │   │
│  │   - "Analyzing resume..."          │  │  │ - Experience   │  │   │
│  └────────────────────────────────────┘  │  │ - Suggestions  │  │   │
│           ↓ (response arrives)           │  └────────────────┘  │   │
│                                          └──────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │   Display Results                                              │ │
│  │   - Score: 85% [badge: Strong Match]                          │ │
│  │   - Matched Skills: [React] [Node.js] [PostgreSQL]            │ │
│  │   - Missing Skills: [Docker] [Kubernetes]                     │ │
│  │   - Strengths / Concerns / Suggestions                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (API Call with JWT)
                              
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js/Node.js)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Routes (recruitmentRoutes.js)                                  │ │
│  │ POST /resume-analysis                                          │ │
│  │ POST /resume-analysis/batch                                    │ │
│  │ GET  /resume-analysis/:applicationId                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
│              ↓                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Middleware                                                     │ │
│  │ - verifyToken (JWT validation)                                 │ │
│  │ - isAdmin (role check)                                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│              ↓                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Controller (recruitmentController.js)                          │ │
│  │ analyzeResumeJobMatch()                                        │ │
│  │ batchAnalyzeResumes()                                          │ │
│  │ getApplicationAnalysis()                                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│              ↓                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ AI Analysis Engine                                             │ │
│  │ - Get job requirements from DB                                 │ │
│  │ - Prepare prompt for Gemini                                    │ │
│  │ - Format results                                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
│              ↓                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Database (PostgreSQL)                                          │ │
│  │ - SELECT job details FROM job_postings                         │ │
│  │ - UPDATE job_applications SET ai_analysis = {...}              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (LLM Request)
                              
┌─────────────────────────────────────────────────────────────────────┐
│                  GOOGLE GENERATIVE AI (Cloud)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Gemini 2.0 Flash Model                                         │ │
│  │ - Receives structured prompt                                   │ │
│  │ - Analyzes resume vs job requirements                          │ │
│  │ - Generates JSON response                                      │ │
│  │ - Returns analysis                                             │ │
│  │                                                                │ │
│  │ Rate Limit: 60 requests/minute (Free tier)                     │ │
│  │ Latency: ~400ms average                                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↑ (Response with analysis JSON)
                              
                    ┌───────────────────────────┐
                    │ Analysis JSON Response     │
                    ├───────────────────────────┤
                    │ {                         │
                    │   overallScore: 85,       │
                    │   skillMatch: {...},      │
                    │   missingSkills: [...],   │
                    │   recommendation: "...",  │
                    │   ...                     │
                    │ }                         │
                    └───────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA FLOW                                    │
└─────────────────────────────────────────────────────────────────┘

1. USER INITIATION
   ┌──────────────────┐
   │ Admin clicks     │
   │ "Analyze Resume" │
   └─────────┬────────┘
             │
             ↓
   ┌──────────────────────────────────────────┐
   │ Frontend collects data:                  │
   │ - applicationId                          │
   │ - jobId                                  │
   │ - resumeText                             │
   │ - applicantEmail                         │
   └─────────┬────────────────────────────────┘
             │
             ↓
   ┌──────────────────────────────────────────┐
   │ POST /api/recruitment/resume-analysis    │
   │ + JWT Token + Admin Header               │
   └─────────┬────────────────────────────────┘

2. BACKEND PROCESSING
             │
             ↓
   ┌──────────────────────────────────────────┐
   │ Route Handler                            │
   │ - Check JWT valid?                       │
   │ - Check user is admin?                   │
   └─────────┬────────────────────────────────┘
             │
             ↓
   ┌──────────────────────────────────────────┐
   │ Database Query                           │
   │ SELECT job details WHERE id = jobId      │
   │ Get: title, requirements, description    │
   └─────────┬────────────────────────────────┘
             │
             ↓
   ┌──────────────────────────────────────────┐
   │ Prepare Gemini Prompt                    │
   │ - Job details                            │
   │ - Resume text                            │
   │ - Analysis instructions                  │
   └─────────┬────────────────────────────────┘

3. LLM PROCESSING (Gemini 2.0 Flash)
             │
             ↓
   ┌──────────────────────────────────────────┐
   │ Gemini Analysis (~400ms)                 │
   │ - Parse resume                           │
   │ - Extract skills                         │
   │ - Match with requirements                │
   │ - Generate score                         │
   │ - Create recommendations                 │
   └─────────┬────────────────────────────────┘
             │
             ↓
   ┌──────────────────────────────────────────┐
   │ Return JSON Response                     │
   │ {                                        │
   │   overallScore: 85,                      │
   │   skillMatch: {...},                     │
   │   experienceRelevance: {...},            │
   │   strengths: [...],                      │
   │   missingSkills: [...],                  │
   │   recommendation: "Strong Match",        │
   │   suggestions: [...],                    │
   │   summary: "..."                         │
   │ }                                        │
   └─────────┬────────────────────────────────┘

4. DATA STORAGE
             │
             ↓
   ┌──────────────────────────────────────────┐
   │ Save to Database                         │
   │ UPDATE job_applications                  │
   │ SET ai_analysis = <json>                 │
   │ WHERE id = applicationId                 │
   └─────────┬────────────────────────────────┘

5. RESPONSE TO FRONTEND
             │
             ↓
   ┌──────────────────────────────────────────┐
   │ 200 OK Response                          │
   │ {                                        │
   │   success: true,                         │
   │   analysis: {...},                       │
   │   applicationId: "uuid",                 │
   │   stored: {...}                          │
   │ }                                        │
   └─────────┬────────────────────────────────┘
             │
             ↓
   ┌──────────────────────────────────────────┐
   │ Display in UI                            │
   │ - Show score prominently                 │
   │ - Load tabs with details                 │
   │ - Show recommendations                   │
   │ - Enable re-analysis                     │
   └──────────────────────────────────────────┘
```

---

## Database Integration

```
┌─────────────────────────────────────────────────────┐
│         job_applications TABLE                       │
├─────────────────────────────────────────────────────┤
│ id (UUID)              | PK                          │
│ job_id (UUID)          | FK → job_postings          │
│ applicant_email        | VARCHAR                     │
│ resume_text            | TEXT (up to 5000 chars)    │
│ ai_analysis            | JSON ← GEMINI RESULT       │
│ status                 | VARCHAR (screening, etc)    │
│ created_at             | TIMESTAMP                   │
│ updated_at             | TIMESTAMP                   │
└─────────────────────────────────────────────────────┘
                         ↑
                         │
              Analysis stored here after Gemini returns
              
               Sample JSON Structure:
               {
                 "overallScore": 85,
                 "skillMatch": {
                   "matched": ["Python", "React", "PostgreSQL"],
                   "percentage": 85
                 },
                 "missingSkills": ["Docker", "Kubernetes"],
                 "experienceRelevance": {
                   "relevantExperience": "5+ years backend",
                   "yearsRelevant": 5,
                   "alignment": "High"
                 },
                 "strengths": ["Strong technical foundation"],
                 "concerns": ["Limited DevOps experience"],
                 "recommendation": "Strong Match",
                 "suggestions": ["Learn containerization"],
                 "summary": "Excellent backend candidate"
               }
```

---

## API Call Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                   SINGLE RESUME ANALYSIS                         │
└─────────────────────────────────────────────────────────────────┘

Client                          Backend                    Gemini AI
  │                               │                           │
  │  1. POST /resume-analysis     │                           │
  │  (JWT, applicationId,         │                           │
  │   jobId, resumeText)          │                           │
  ├──────────────────────────────→│                           │
  │                               │                           │
  │                               │ 2. Verify JWT & Admin     │
  │                               │    Check token valid?     │
  │                               │    Check role == admin?   │
  │                               │                           │
  │                               │ 3. Query Job Details      │
  │                               │    FROM job_postings      │
  │                               │                           │
  │                               │ 4. Prepare Prompt        │
  │                               │    Build prompt string    │
  │                               │                           │
  │                               │ 5. Call Gemini API       │
  │                               ├──────────────────────────→│
  │                               │                           │
  │                               │    6. Analyze Resume      │
  │                               │       (in Gemini)         │
  │                               │       ~400ms               │
  │                               │                           │
  │                               │ 7. Return JSON Response   │
  │                               │←──────────────────────────┤
  │                               │                           │
  │                               │ 8. Parse & Validate JSON  │
  │                               │    Extract analysis       │
  │                               │                           │
  │                               │ 9. Save to Database       │
  │                               │    UPDATE job_applications│
  │                               │    SET ai_analysis = JSON │
  │                               │                           │
  │  10. Return 200 OK Response   │                           │
  │  { success, analysis,         │                           │
  │    applicationId, stored }    │                           │
  │←──────────────────────────────┤                           │
  │                               │                           │
  │  11. Display in UI            │                           │
  │      Parse analysis JSON      │                           │
  │      Show score, tabs, etc    │                           │
  │                               │                           │
  ↓                               ↓                           ↓

Total Time: ~500ms (mostly from Gemini API)
```

---

## Batch Analysis Sequence

```
┌──────────────────────────────────────────────────────────┐
│             BATCH RESUME ANALYSIS                        │
│            (Multiple Resumes)                            │
└──────────────────────────────────────────────────────────┘

Input:
- jobId: "job-123"
- applications: [
    { applicationId: "app-1", resumeText: "..." },
    { applicationId: "app-2", resumeText: "..." },
    { applicationId: "app-3", resumeText: "..." }
  ]

Process:
┌──────────────────────────────────────────────────────────┐
│ For each application in sequence:                        │
│  1. Call Gemini API (sequential, not parallel)           │
│  2. Get analysis result                                  │
│  3. Store in database                                    │
│  4. Add to results array                                 │
│  5. Next application                                     │
└──────────────────────────────────────────────────────────┘

Result Ranking:
┌──────────────────────────────────────────────────────────┐
│ Sort by overallScore DESC                                │
│ Add rank position (1, 2, 3...)                           │
│                                                          │
│ Output: [                                                │
│   {                                                      │
│     rank: 1,                                             │
│     applicationId: "app-1",                              │
│     score: 88,                                           │
│     recommendation: "Strong Match"                       │
│   },                                                     │
│   {                                                      │
│     rank: 2,                                             │
│     applicationId: "app-2",                              │
│     score: 72,                                           │
│     recommendation: "Good Match"                         │
│   },                                                     │
│   ...                                                    │
│ ]                                                        │
└──────────────────────────────────────────────────────────┘

Timing:
- Per resume: ~500ms (Gemini API)
- 3 resumes: ~1500ms (sequential)
- 10 resumes: ~5000ms (sequential)
- Post-processing: ~100ms
```

---

## Security Flow

```
┌─────────────────────────────────────────────────────────┐
│              SECURITY AUTHENTICATION                    │
└─────────────────────────────────────────────────────────┘

Request comes in:
  │
  ├─ Check 1: JWT Token in Header?
  │  YES → Continue
  │  NO  → 401 Unauthorized
  │
  ├─ Check 2: JWT Token Valid?
  │  YES → Extract user_id, role
  │  NO  → 401 Unauthorized
  │
  ├─ Check 3: User is Admin?
  │  YES → Continue to controller
  │  NO  → 403 Forbidden
  │
  └─ If all checks pass:
     → Proceed with analysis
     → Use user_id for audit log
     → Store analysis securely

API Key Protection:
  │
  ├─ GEMINI_API_KEY stored in .env
  ├─ Never exposed to frontend
  ├─ Never logged in plain text
  ├─ Only used server-side
  └─ Rotated periodically

Resume Data Protection:
  │
  ├─ Sent only over HTTPS
  ├─ Truncated to 5000 chars before storage
  ├─ Stored in secured PostgreSQL database
  ├─ Accessible only to admins
  └─ Can be deleted per GDPR requests
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│              ERROR HANDLING PATHS                       │
└─────────────────────────────────────────────────────────┘

Error Scenario 1: Missing Fields
  ├─ Request missing applicationId/jobId/resumeText?
  ├─ Response: 400 Bad Request
  └─ Message: "Missing required fields: ..."

Error Scenario 2: Not Authenticated
  ├─ JWT token missing or invalid?
  ├─ Response: 401 Unauthorized
  └─ Message: "Authentication required"

Error Scenario 3: Not Authorized
  ├─ User not admin?
  ├─ Response: 403 Forbidden
  └─ Message: "Admin access required"

Error Scenario 4: Job Not Found
  ├─ jobId doesn't exist in database?
  ├─ Response: 404 Not Found
  └─ Message: "Job not found"

Error Scenario 5: Gemini API Error
  ├─ API key invalid/expired?
  ├─ Network timeout?
  ├─ Response: 500 Internal Server Error
  └─ Message: "Failed to analyze resume with AI"

Error Scenario 6: Invalid AI Response
  ├─ Gemini returns non-JSON?
  ├─ Response: 500 Internal Server Error
  └─ Message: "Failed to extract JSON from AI response"

Error Scenario 7: Rate Limited
  ├─ Exceeded 60 req/minute?
  ├─ Response: 429 Too Many Requests
  └─ Message: "Rate limit exceeded, try again later"
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                          │
└─────────────────────────────────────────────────────────────────┘

ResumeAnalyzer Component
├─ State:
│  ├─ loading: boolean
│  ├─ analysis: object | null
│  ├─ error: string | null
│  └─ activeTab: 'overview' | 'skills' | 'experience' | 'recommendations'
│
├─ Handlers:
│  ├─ handleAnalyze() - Call API
│  └─ setActiveTab() - Switch view
│
└─ UI Sections:
   ├─ Initial State (before analysis)
   │  └─ Button: "Analyze Resume with AI"
   │
   ├─ Loading State
   │  ├─ Spinner
   │  └─ "Analyzing..."
   │
   ├─ Results Display
   │  ├─ Score & Recommendation Badge
   │  ├─ Tab Navigation
   │  │  ├─ Overview Tab
   │  │  ├─ Skills Tab
   │  │  ├─ Experience Tab
   │  │  └─ Recommendations Tab
   │  └─ Re-analyze Button
   │
   └─ Error State
      └─ Alert: Error message

BulkResumeAnalyzer Component
├─ State:
│  ├─ loading: boolean
│  ├─ results: object | null
│  └─ error: string | null
│
├─ Methods:
│  ├─ handleBulkAnalyze() - Batch API call
│  └─ resetResults() - Clear and restart
│
└─ UI Sections:
   ├─ Initial State
   │  └─ Button: "Analyze All X Resumes"
   │
   ├─ Loading State
   │  ├─ Spinner
   │  └─ Progress indicator
   │
   ├─ Results Display
   │  ├─ Summary Stats Card
   │  │  ├─ Total Analyzed: X
   │  │  └─ Success Rate: Y%
   │  ├─ Ranked Table
   │  │  ├─ Rank | Score | Recommendation | Summary
   │  │  └─ Sorted by score descending
   │  └─ Reset Button
   │
   └─ Error State
      └─ Alert: Error message
```

This architecture ensures:
✅ Clean separation of concerns
✅ Secure API key handling
✅ Proper authentication & authorization
✅ Graceful error handling
✅ Efficient data flow
✅ Responsive UI/UX
