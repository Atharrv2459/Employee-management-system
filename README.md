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

### Frontend
- React
- Vite
- Tailwind CSS
- DaisyUI
- React Router

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT-based authentication
- File upload support for documents and resume processing

### AI Integration
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
