# Resume-Job Match Analyzer - API Test (PowerShell)
# This script tests the resume analyzer API on Windows

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resume-Job Match Analyzer - API Test" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_BASE = "http://localhost:5001/api/recruitment"
$TOKEN = "your_jwt_token_here"  # Replace with actual token
$JOB_ID = "job-123"  # Replace with actual UUID
$APP_ID = "app-123"  # Replace with actual UUID

$RESUME_TEXT = @"
John Doe
Senior Software Engineer
john@example.com | (123) 456-7890

PROFESSIONAL SUMMARY
Experienced full-stack developer with 5+ years in building scalable web applications.

TECHNICAL SKILLS
- Languages: Python, JavaScript, TypeScript
- Backend: Node.js, Express, Django
- Frontend: React, Vue.js, Tailwind CSS
- Databases: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, Linux
- Cloud: AWS, Google Cloud

EXPERIENCE
Senior Developer | Tech Company (2020-Present)
- Led development of microservices architecture
- Mentored junior developers
- Improved system performance by 40%

Full Stack Developer | Startup (2018-2020)
- Built React-based dashboard
- Implemented PostgreSQL migrations
- Developed REST APIs

EDUCATION
B.S. Computer Science | University (2018)

CERTIFICATIONS
- AWS Certified Solutions Architect
- Professional Scrum Master
"@

Write-Host "Step 1: Prerequisites" -ForegroundColor Yellow
Write-Host "- Backend should be running: npm run dev" -ForegroundColor Gray
Write-Host "- Get JWT token from login" -ForegroundColor Gray
Write-Host "- Update `$TOKEN, `$JOB_ID, `$APP_ID in this script" -ForegroundColor Gray
Write-Host ""

# Test 1: Single Resume Analysis
Write-Host "Step 2: Single Resume Analysis" -ForegroundColor Yellow
Write-Host "Testing: POST /resume-analysis" -ForegroundColor Gray
Write-Host ""

$body = @{
    applicationId = $APP_ID
    jobId = $JOB_ID
    resumeText = $RESUME_TEXT
    applicantEmail = "john@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/resume-analysis" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $TOKEN"
        } `
        -Body $body

    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# Test 2: Batch Resume Analysis
Write-Host "Step 3: Batch Resume Analysis" -ForegroundColor Yellow
Write-Host "Testing: POST /resume-analysis/batch" -ForegroundColor Gray
Write-Host ""

$batchBody = @{
    jobId = $JOB_ID
    applications = @(
        @{
            applicationId = "app-001"
            resumeText = "Jane Doe`nSoftware Engineer`n5 years experience with React and Node.js"
        },
        @{
            applicationId = "app-002"
            resumeText = "Bob Smith`nJunior Developer`n2 years with Python and basic React"
        }
    )
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/resume-analysis/batch" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $TOKEN"
        } `
        -Body $batchBody

    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# Test 3: Get Stored Analysis
Write-Host "Step 4: Get Stored Analysis" -ForegroundColor Yellow
Write-Host "Testing: GET /resume-analysis/:applicationId" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/resume-analysis/$APP_ID" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $TOKEN"
        }

    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

Write-Host "All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Notes:" -ForegroundColor Yellow
Write-Host "- Replace TOKEN with actual JWT from login" -ForegroundColor Gray
Write-Host "- Replace JOB_ID and APP_ID with real UUIDs from database" -ForegroundColor Gray
Write-Host "- Ensure backend is running on http://localhost:5001" -ForegroundColor Gray
Write-Host "- Check .env has valid GEMINI_API_KEY" -ForegroundColor Gray
