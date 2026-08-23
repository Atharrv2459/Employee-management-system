# Employee Management System

A full-stack HR and workforce management application for managing employees, attendance, leave, payroll, departments, recruiting, and candidate applications.

## Overview

This project includes:

- Employee authentication and role-based access
- Employee profiles and manager views
- Attendance tracking and manual entry workflows
- Leave application and approval flows
- Shift scheduling and shift preference management
- Payroll and payslip handling
- Department, office location, and admin management
- Recruitment and job posting workflows
- Resume-to-job analysis using an AI service

## Tech Stack

Frontend
- React
- Vite
- Tailwind CSS
- DaisyUI
- React Router

Backend
- Node.js
- Express.js
- PostgreSQL
- JWT-based authentication
- File upload support for documents and resume processing

AI Integration
- Google Gemini API for resume/job matching and analysis

## Project Structure

```text
Employee-management-system-main/
├── backend/
│   ├── controllers/
│   ├── routers/
│   ├── middleware/
│   ├── migrations/
│   ├── config/
│   ├── uploads/
│   ├── .env
│   ├── db.js
│   ├── index.js
│   └── package.json
├── react-vite-tailwind-daisyui/
│   ├── src/
│   ├── package.json
│   └── vite.config.*
├── employees.sql
├── IMPLEMENTATION_SUMMARY.md
├── README_RESUME_ANALYZER.md
├── RESUME_ANALYZER_SETUP.md
├── RESUME_ANALYZER_INTEGRATION.md
├── LLM_MODEL_SELECTION.md
├── RESUME_ANALYZER_ARCHITECTURE.md
├── test-resume-analyzer.ps1
├── test-resume-analyzer.sh
└── README.md
```

## Features

### Admin
- Department management
- Office locations
- Shift templates
- Shift calendar
- Attendance monitoring
- Payroll processing
- Recruitment and job posting management
- Candidate application review

### Employee
- Punch-in / punch-out
- Profile setup
- Manual attendance entry
- Leave application and balance tracking
- Timesheet views
- Payslips
- Shift preferences

### Manager
- Team dashboard and monitoring
- Timesheet views
- Attendance supervision
- Leave management and approval workflows

### Recruitment
- Create and manage open jobs
- Review submitted applications
- Analyze resume fit against job descriptions
- Rank candidates by match score
