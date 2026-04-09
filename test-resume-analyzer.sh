#!/bin/bash

# Resume-Job Match Analyzer - Test Script
# This script demonstrates how to test the resume analyzer API

echo "========================================="
echo "Resume-Job Match Analyzer - API Test"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:5001/api/recruitment"
TOKEN="your_jwt_token_here"  # Replace with actual token

# Sample data
JOB_ID="job-123"  # Replace with actual UUID
APP_ID="app-123"  # Replace with actual UUID
RESUME_TEXT="John Doe
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
- Professional Scrum Master"

echo -e "${YELLOW}Step 1: Setting up prerequisites${NC}"
echo "- Make sure backend is running: npm run dev"
echo "- Get your JWT token from login response"
echo "- Update TOKEN, JOB_ID, APP_ID in this script"
echo ""

echo -e "${YELLOW}Step 2: Single Resume Analysis${NC}"
echo "Testing: POST /resume-analysis"
echo ""

curl -X POST "$API_BASE/resume-analysis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"applicationId\": \"$APP_ID\",
    \"jobId\": \"$JOB_ID\",
    \"resumeText\": \"$RESUME_TEXT\",
    \"applicantEmail\": \"john@example.com\"
  }" \
  -s | python3 -m json.tool

echo ""
echo ""

echo -e "${YELLOW}Step 3: Batch Resume Analysis${NC}"
echo "Testing: POST /resume-analysis/batch"
echo ""

curl -X POST "$API_BASE/resume-analysis/batch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"jobId\": \"$JOB_ID\",
    \"applications\": [
      {
        \"applicationId\": \"app-001\",
        \"resumeText\": \"Jane Doe\\nSoftware Engineer\\n5 years experience with React and Node.js\"
      },
      {
        \"applicationId\": \"app-002\",
        \"resumeText\": \"Bob Smith\\nJunior Developer\\n2 years with Python and basic React\"
      }
    ]
  }" \
  -s | python3 -m json.tool

echo ""
echo ""

echo -e "${YELLOW}Step 4: Get Stored Analysis${NC}"
echo "Testing: GET /resume-analysis/:applicationId"
echo ""

curl -X GET "$API_BASE/resume-analysis/$APP_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -s | python3 -m json.tool

echo ""
echo ""

echo -e "${GREEN}✓ All tests completed!${NC}"
echo ""
echo -e "${YELLOW}Notes:${NC}"
echo "- Replace TOKEN with actual JWT from login"
echo "- Replace JOB_ID and APP_ID with real UUIDs from database"
echo "- Ensure backend is running on http://localhost:5001"
echo "- Check .env has valid GEMINI_API_KEY"
