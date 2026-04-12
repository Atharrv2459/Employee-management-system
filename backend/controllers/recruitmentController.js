import pool from "../db.js";
import { GoogleGenAI } from "@google/genai";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

console.log("✅ Using NEW Gemini SDK");
// =====================================================
// JOB POSTINGS
// =====================================================

// Get all jobs (admin)
export const getAllJobs = async (req, res) => {
  const { status, department_id } = req.query;
  try {
    let query = `
      SELECT jp.*, d.name as department_name,
             u.email as posted_by_email,
             hm.email as hiring_manager_email
      FROM job_postings jp
      LEFT JOIN departments d ON jp.department_id = d.id
      LEFT JOIN users u ON jp.posted_by = u.user_id
      LEFT JOIN users hm ON jp.hiring_manager_id = hm.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND jp.status = $${paramCount}`;
      params.push(status);
    }
    if (department_id) {
      paramCount++;
      query += ` AND jp.department_id = $${paramCount}`;
      params.push(department_id);
    }

    query += ` ORDER BY jp.created_at DESC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get jobs error:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

// Get published jobs (public)
export const getPublishedJobs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT jp.id, jp.title, jp.slug, jp.location, jp.job_type, jp.experience_level,
             jp.experience_min, jp.experience_max, jp.description, jp.requirements,
             jp.is_remote, jp.is_featured, jp.application_deadline,
             jp.salary_min, jp.salary_max, jp.show_salary,
             d.name as department_name, jp.published_at
      FROM job_postings jp
      LEFT JOIN departments d ON jp.department_id = d.id
      WHERE jp.status = 'published'
        AND (jp.application_deadline IS NULL OR jp.application_deadline >= CURRENT_DATE)
      ORDER BY jp.is_featured DESC, jp.published_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get published jobs error:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

// Get job by slug (public)
export const getJobBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(`
      SELECT jp.*, d.name as department_name
      FROM job_postings jp
      LEFT JOIN departments d ON jp.department_id = d.id
      WHERE jp.slug = $1
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Increment view count
    await pool.query(`UPDATE job_postings SET views_count = views_count + 1 WHERE slug = $1`, [slug]);

    // Get screening questions
    const questions = await pool.query(`
      SELECT * FROM screening_questions WHERE job_id = $1 ORDER BY sequence_order
    `, [result.rows[0].id]);

    res.json({
      ...result.rows[0],
      screening_questions: questions.rows
    });
  } catch (error) {
    console.error("Get job error:", error);
    res.status(500).json({ error: "Failed to fetch job" });
  }
};

// Create job posting
export const createJob = async (req, res) => {
  const {
    title, department_id, location, job_type, experience_level,
    experience_min, experience_max, salary_min, salary_max, show_salary,
    description, responsibilities, requirements, benefits, skills_required,
    positions_available, application_deadline, is_remote, is_featured,
    hiring_manager_id, screening_questions
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(`
      INSERT INTO job_postings 
      (title, department_id, location, job_type, experience_level,
       experience_min, experience_max, salary_min, salary_max, show_salary,
       description, responsibilities, requirements, benefits, skills_required,
       positions_available, application_deadline, is_remote, is_featured,
       hiring_manager_id, posted_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `, [title, department_id, location, job_type, experience_level,
        experience_min, experience_max, salary_min, salary_max, show_salary,
        description, responsibilities, requirements, benefits, 
        skills_required ? JSON.stringify(skills_required) : null,
        positions_available || 1, application_deadline, is_remote || false, 
        is_featured || false, hiring_manager_id, req.user?.userId]);

    const jobId = result.rows[0].id;

    // Add screening questions
    if (screening_questions && screening_questions.length > 0) {
      for (let i = 0; i < screening_questions.length; i++) {
        const q = screening_questions[i];
        await client.query(`
          INSERT INTO screening_questions 
          (job_id, question, question_type, options, is_required, is_knockout, knockout_answer, sequence_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [jobId, q.question, q.question_type, q.options ? JSON.stringify(q.options) : null,
            q.is_required !== false, q.is_knockout || false, q.knockout_answer, i]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Create job error:", error);
    res.status(500).json({ error: "Failed to create job" });
  } finally {
    client.release();
  }
};

// Update job posting
export const updateJob = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const fields = [];
    const values = [];
    let paramCount = 0;

    const allowedFields = [
      'title', 'department_id', 'location', 'job_type', 'experience_level',
      'experience_min', 'experience_max', 'salary_min', 'salary_max', 'show_salary',
      'description', 'responsibilities', 'requirements', 'benefits', 'skills_required',
      'positions_available', 'application_deadline', 'is_remote', 'is_featured',
      'hiring_manager_id', 'status'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(key === 'skills_required' && value ? JSON.stringify(value) : value);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Handle publish
    if (updates.status === 'published') {
      fields.push(`published_at = COALESCE(published_at, CURRENT_TIMESTAMP)`);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add id as the last parameter
    paramCount++;
    values.push(id);

    const result = await pool.query(`
      UPDATE job_postings SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
};

// =====================================================
// CANDIDATES & APPLICATIONS
// =====================================================

const emptyToNull = (v) => {
  if (v == null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
};

const parseNumberOrNull = (v) => {
  v = emptyToNull(v);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const parseIntOrNull = (v) => {
  v = emptyToNull(v);
  if (v == null) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

const parseSkillsInput = (skills) => {
  skills = emptyToNull(skills);
  if (!skills) return null;

  if (Array.isArray(skills)) {
    const list = skills.map((s) => String(s).trim()).filter(Boolean);
    return list.length ? list : null;
  }

  if (typeof skills === "string") {
    const s = skills.trim();
    // If client sent JSON array as string
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          const list = parsed.map((x) => String(x).trim()).filter(Boolean);
          return list.length ? list : null;
        }
      } catch {
        // fall through
      }
    }

    const list = s.split(",").map((x) => x.trim()).filter(Boolean);
    return list.length ? list : null;
  }

  return null;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESUMES_DIR = path.join(__dirname, "..", "uploads", "resumes");

const guessResumeExt = (file) => {
  const name = file?.originalname || "";
  const ext = name ? path.extname(name).toLowerCase() : "";
  const mime = (file?.mimetype || "").toLowerCase();

  if (ext === ".pdf" || mime === "application/pdf") return ".pdf";
  if (ext === ".docx" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return ".docx";
  if (ext === ".txt" || mime.startsWith("text/")) return ".txt";

  return ext || "";
};

const extractResumeTextFromFile = async (file) => {
  const name = file?.originalname || "";
  const ext = name ? path.extname(name).toLowerCase().replace(".", "") : "";
  const mime = (file?.mimetype || "").toLowerCase();
  const buffer = file?.buffer;

  if (!buffer) throw new Error("Missing resume file buffer");

  const isPdf = mime === "application/pdf" || ext === "pdf";
  const isDocx =
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx";
  const isTxt = mime.startsWith("text/") || ext === "txt";

  if (isPdf) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result?.text || "";
    } finally {
      await parser.destroy().catch(() => {});
    }
  }

  if (isDocx) {
    const result = await mammoth.extractRawText({ buffer });
    return result?.value || "";
  }

  if (isTxt) {
    return buffer.toString("utf8");
  }

  throw new Error(`Unsupported resume file type: ${ext || mime || "unknown"}`);
};

const saveResumeFileToDisk = async (file, candidateId) => {
  const buffer = file?.buffer;
  if (!buffer) throw new Error("Missing resume file buffer");

  const ext = guessResumeExt(file);
  if (![".pdf", ".docx", ".txt"].includes(ext)) {
    throw new Error(`Unsupported resume file type: ${ext || file?.mimetype || "unknown"}`);
  }

  await fs.mkdir(RESUMES_DIR, { recursive: true });

  const safeName = `candidate-${candidateId}-${Date.now()}${ext}`;
  const absPath = path.join(RESUMES_DIR, safeName);
  await fs.writeFile(absPath, buffer);

  return {
    resume_path: `uploads/resumes/${safeName}`,
    resume_filename: file?.originalname || safeName
  };
};

// Submit application (public)
export const submitApplication = async (req, res) => {
  const {
    job_id,
    email,
    first_name,
    last_name,
    phone,
    current_company,
    current_title,
    experience_years,
    skills,
    linkedin_url,
    portfolio_url,
    cover_letter,
    expected_salary,
    notice_period_days,
    available_from,
    source,
    source_details,
    screening_answers,
    resume_text
  } = req.body;

  const client = await pool.connect();
  let savedResumeAbsPath = null;

  try {
    await client.query("BEGIN");

    const experienceYearsNum = parseNumberOrNull(experience_years);
    const expectedSalaryNum = parseNumberOrNull(expected_salary);
    const noticePeriodDaysInt = parseIntOrNull(notice_period_days);
    const availableFromDate = emptyToNull(available_from);
    const skillsArr = parseSkillsInput(skills);

    let finalResumeText = emptyToNull(resume_text);
    if (req.file) {
      try {
        finalResumeText = await extractResumeTextFromFile(req.file);
      } catch (e) {
        return res.status(400).json({ error: e?.message || "Failed to read resume file" });
      }
    }
    finalResumeText = emptyToNull(finalResumeText);

    if (!job_id || !email || !first_name || !last_name || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!finalResumeText) {
      return res.status(400).json({ error: "Resume is required" });
    }

    // Check if job exists and is published
    const job = await client.query(
      `SELECT id FROM job_postings WHERE id = $1 AND status = 'published'`,
      [job_id]
    );
    if (job.rows.length === 0) {
      return res.status(404).json({ error: "Job not found or not accepting applications" });
    }

    // Create or get candidate
    let candidate = await client.query(`SELECT * FROM candidates WHERE email = $1`, [email]);

    if (candidate.rows.length === 0) {
      candidate = await client.query(
        `
        INSERT INTO candidates 
        (email, first_name, last_name, phone, current_company, current_title,
         experience_years, skills, linkedin_url, portfolio_url, source, source_details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `,
        [
          email,
          first_name,
          last_name,
          phone,
          emptyToNull(current_company),
          emptyToNull(current_title),
          experienceYearsNum,
          skillsArr ? JSON.stringify(skillsArr) : null,
          emptyToNull(linkedin_url),
          emptyToNull(portfolio_url),
          source || "website",
          emptyToNull(source_details)
        ]
      );
    } else {
      candidate = await client.query(
        `
        UPDATE candidates SET
          first_name = $1,
          last_name = $2,
          phone = COALESCE($3, phone),
          current_company = COALESCE($4, current_company),
          current_title = COALESCE($5, current_title),
          experience_years = COALESCE($6, experience_years),
          linkedin_url = COALESCE($7, linkedin_url),
          portfolio_url = COALESCE($8, portfolio_url),
          skills = COALESCE($9, skills),
          updated_at = CURRENT_TIMESTAMP
        WHERE email = $10
        RETURNING *
      `,
        [
          first_name,
          last_name,
          emptyToNull(phone),
          emptyToNull(current_company),
          emptyToNull(current_title),
          experienceYearsNum,
          emptyToNull(linkedin_url),
          emptyToNull(portfolio_url),
          skillsArr ? JSON.stringify(skillsArr) : null,
          email
        ]
      );
    }

    const candidateId = candidate.rows[0].id;

    // Check if already applied
    const existingApp = await client.query(
      `SELECT 1 FROM job_applications WHERE job_id = $1 AND candidate_id = $2`,
      [job_id, candidateId]
    );

    if (existingApp.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "You have already applied for this position" });
    }

    // Save uploaded resume file (so HR can open/download the original PDF)
    if (req.file) {
      try {
        const saved = await saveResumeFileToDisk(req.file, candidateId);
        const baseName = path.basename(saved.resume_path || "");
        savedResumeAbsPath = baseName ? path.join(RESUMES_DIR, baseName) : null;

        await client.query(
          `UPDATE candidates SET resume_path = $1, resume_filename = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
          [saved.resume_path, saved.resume_filename, candidateId]
        );
      } catch (e) {
        await client.query("ROLLBACK");
        if (savedResumeAbsPath) await fs.unlink(savedResumeAbsPath).catch(() => {});
        return res.status(400).json({ error: e?.message || "Failed to save resume file" });
      }
    }

    // Create application
    const application = await client.query(
      `
      INSERT INTO job_applications 
      (job_id, candidate_id, cover_letter, expected_salary, notice_period_days, available_from, resume_text)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        job_id,
        candidateId,
        emptyToNull(cover_letter),
        expectedSalaryNum,
        noticePeriodDaysInt,
        availableFromDate,
        finalResumeText
      ]
    );

    const applicationId = application.rows[0].id;

    // Save screening answers
    if (Array.isArray(screening_answers) && screening_answers.length > 0) {
      for (const answer of screening_answers) {
        await client.query(
          `
          INSERT INTO screening_answers (application_id, question_id, answer)
          VALUES ($1, $2, $3)
        `,
          [applicationId, answer.question_id, answer.answer]
        );
      }
    }

    // Log activity
    await client.query(
      `
      INSERT INTO application_activities (application_id, activity_type, description)
      VALUES ($1, 'application_submitted', 'Application submitted')
    `,
      [applicationId]
    );

    await client.query("COMMIT");
    res.status(201).json({
      message: "Application submitted successfully",
      application_id: applicationId
    });
  } catch (error) {
    await client.query("ROLLBACK");
    if (savedResumeAbsPath) await fs.unlink(savedResumeAbsPath).catch(() => {});
    console.error("Submit application error:", error);

    if (error?.message?.startsWith("Unsupported resume file type")) {
      return res.status(400).json({ error: error.message });
    }

    if (error.code === "23505") {
      return res.status(400).json({ error: "You have already applied for this position" });
    }

    res.status(500).json({ error: "Failed to submit application" });
  } finally {
    client.release();
  }
};

// Get applications for a job
export const getApplicationsByJob = async (req, res) => {
  const { jobId } = req.params;
  const { status } = req.query;

  try {
    let query = `
      SELECT ja.*, c.email, c.first_name, c.last_name, c.phone,
             c.current_company, c.current_title, c.experience_years,
             c.linkedin_url, c.resume_path, c.resume_filename
      FROM job_applications ja
      JOIN candidates c ON ja.candidate_id = c.id
      WHERE ja.job_id = $1
    `;
    const params = [jobId];

    if (status) {
      query += ` AND ja.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY ja.applied_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

// Get application details
export const getApplicationDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const application = await pool.query(`
      SELECT ja.*, c.*, jp.title as job_title, jp.department_id,
             d.name as department_name,
             ja.id as application_id,
             ja.id as id
      FROM job_applications ja
      JOIN candidates c ON ja.candidate_id = c.id
      JOIN job_postings jp ON ja.job_id = jp.id
      LEFT JOIN departments d ON jp.department_id = d.id
      WHERE ja.id = $1
    `, [id]);

    if (application.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Get screening answers
    const answers = await pool.query(`
      SELECT sa.*, sq.question, sq.question_type
      FROM screening_answers sa
      JOIN screening_questions sq ON sa.question_id = sq.id
      WHERE sa.application_id = $1
      ORDER BY sq.sequence_order
    `, [id]);

    // Get interviews
    const interviews = await pool.query(`
      SELECT i.*, ist.name as stage_name
      FROM interviews i
      LEFT JOIN interview_stages ist ON i.stage_id = ist.id
      WHERE i.application_id = $1
      ORDER BY i.scheduled_at DESC
    `, [id]);

    // Get activities
    const activities = await pool.query(`
      SELECT aa.*, u.email as performed_by_email
      FROM application_activities aa
      LEFT JOIN users u ON aa.performed_by = u.user_id
      WHERE aa.application_id = $1
      ORDER BY aa.created_at DESC
      LIMIT 20
    `, [id]);

    res.json({
      ...application.rows[0],
      screening_answers: answers.rows,
      interviews: interviews.rows,
      activities: activities.rows
    });
  } catch (error) {
    console.error("Get application details error:", error);
    res.status(500).json({ error: "Failed to fetch application details" });
  }
};

// Download application resume (admin/HR)
export const downloadApplicationResume = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT c.resume_path, c.resume_filename
      FROM job_applications ja
      JOIN candidates c ON ja.candidate_id = c.id
      WHERE ja.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const { resume_path, resume_filename } = result.rows[0];
    if (!resume_path) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const baseName = path.basename(resume_path);
    const absPath = path.join(RESUMES_DIR, baseName);
    const resolvedBase = path.resolve(RESUMES_DIR) + path.sep;
    const resolvedFile = path.resolve(absPath);

    if (!resolvedFile.startsWith(resolvedBase)) {
      return res.status(400).json({ error: "Invalid resume path" });
    }

    await fs.access(resolvedFile);

    const rawName = resume_filename || baseName;
    const safeName = String(rawName).replace(/"/g, "");
    const ext = path.extname(resolvedFile).toLowerCase();
    const disposition = ext === ".pdf" || ext === ".txt" ? "inline" : "attachment";

    res.setHeader("Content-Disposition", `${disposition}; filename="${safeName}"`);
    return res.sendFile(resolvedFile);
  } catch (error) {
    console.error("Download resume error:", error);
    return res.status(500).json({ error: "Failed to download resume" });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rejection_reason, rejection_notes, rating, notes } = req.body;

  try {
    const oldApp = await pool.query(`SELECT status FROM job_applications WHERE id = $1`, [id]);
    if (oldApp.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const result = await pool.query(`
      UPDATE job_applications SET
        status = COALESCE($1, status),
        rejection_reason = $2,
        rejection_notes = $3,
        rating = COALESCE($4, rating),
        last_activity_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [status, rejection_reason, rejection_notes, rating, id]);

    // Log activity
    if (status && status !== oldApp.rows[0].status) {
      await pool.query(`
        INSERT INTO application_activities 
        (application_id, activity_type, description, old_value, new_value, performed_by)
        VALUES ($1, 'status_changed', $2, $3, $4, $5)
      `, [id, `Status changed from ${oldApp.rows[0].status} to ${status}`,
          oldApp.rows[0].status, status, req.user?.userId]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({ error: "Failed to update application" });
  }
};

// =====================================================
// INTERVIEWS
// =====================================================

// Schedule interview
export const scheduleInterview = async (req, res) => {
  const {
    application_id, stage_id, interview_type, scheduled_at,
    duration_minutes, location, meeting_link, panelists, notes
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const interview = await client.query(`
      INSERT INTO interviews 
      (application_id, stage_id, interview_type, scheduled_at, 
       duration_minutes, location, meeting_link, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [application_id, stage_id, interview_type, scheduled_at,
        duration_minutes || 60, location, meeting_link, notes, req.user?.userId]);

    const interviewId = interview.rows[0].id;

    // Add panelists
    if (panelists && panelists.length > 0) {
      for (const p of panelists) {
        await client.query(`
          INSERT INTO interview_panelists (interview_id, user_id, role)
          VALUES ($1, $2, $3)
        `, [interviewId, p.user_id, p.role || 'interviewer']);
      }
    }

    // Update application status
    await client.query(`
      UPDATE job_applications SET 
        status = 'interview_scheduled', 
        last_activity_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [application_id]);

    // Log activity
    await client.query(`
      INSERT INTO application_activities 
      (application_id, activity_type, description, performed_by)
      VALUES ($1, 'interview_scheduled', $2, $3)
    `, [application_id, `${interview_type} interview scheduled for ${new Date(scheduled_at).toLocaleString()}`,
        req.user?.userId]);

    await client.query('COMMIT');
    res.status(201).json(interview.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Schedule interview error:", error);
    res.status(500).json({ error: "Failed to schedule interview" });
  } finally {
    client.release();
  }
};

// Get upcoming interviews (for interviewer)
export const getMyInterviews = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(`
      SELECT i.*, ip.role as my_role,
             ja.id as application_id, ja.status as application_status,
             c.first_name, c.last_name, c.email as candidate_email,
             jp.title as job_title, ist.name as stage_name
      FROM interviews i
      JOIN interview_panelists ip ON i.id = ip.interview_id
      JOIN job_applications ja ON i.application_id = ja.id
      JOIN candidates c ON ja.candidate_id = c.id
      JOIN job_postings jp ON ja.job_id = jp.id
      LEFT JOIN interview_stages ist ON i.stage_id = ist.id
      WHERE ip.user_id = $1 AND i.status IN ('scheduled', 'confirmed')
      ORDER BY i.scheduled_at ASC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Get my interviews error:", error);
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
};

// Submit interview feedback
export const submitFeedback = async (req, res) => {
  const { interviewId } = req.params;
  const {
    overall_rating, technical_rating, communication_rating,
    cultural_fit_rating, recommendation, strengths, weaknesses, notes
  } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO interview_feedback 
      (interview_id, panelist_id, overall_rating, technical_rating,
       communication_rating, cultural_fit_rating, recommendation,
       strengths, weaknesses, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (interview_id, panelist_id) DO UPDATE SET
        overall_rating = EXCLUDED.overall_rating,
        technical_rating = EXCLUDED.technical_rating,
        communication_rating = EXCLUDED.communication_rating,
        cultural_fit_rating = EXCLUDED.cultural_fit_rating,
        recommendation = EXCLUDED.recommendation,
        strengths = EXCLUDED.strengths,
        weaknesses = EXCLUDED.weaknesses,
        notes = EXCLUDED.notes,
        submitted_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [interviewId, req.user.userId, overall_rating, technical_rating,
        communication_rating, cultural_fit_rating, recommendation,
        strengths, weaknesses, notes]);

    // Update interview status
    await pool.query(`
      UPDATE interviews SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [interviewId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
};

// =====================================================
// OFFER LETTERS
// =====================================================

// Create offer letter
export const createOffer = async (req, res) => {
  const {
    application_id, position_title, department_id, reporting_to,
    salary_offered, joining_bonus, relocation_allowance,
    probation_period_months, notice_period_days,
    proposed_joining_date, offer_valid_until,
    terms_and_conditions, special_clauses
  } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO offer_letters 
      (application_id, position_title, department_id, reporting_to,
       salary_offered, joining_bonus, relocation_allowance,
       probation_period_months, notice_period_days,
       proposed_joining_date, offer_valid_until,
       terms_and_conditions, special_clauses, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [application_id, position_title, department_id, reporting_to,
        salary_offered, joining_bonus, relocation_allowance,
        probation_period_months || 3, notice_period_days || 30,
        proposed_joining_date, offer_valid_until,
        terms_and_conditions, special_clauses, req.user?.userId]);

    // Update application status
    await pool.query(`
      UPDATE job_applications SET status = 'offer_pending', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [application_id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create offer error:", error);
    res.status(500).json({ error: "Failed to create offer" });
  }
};

// Update offer status
export const updateOfferStatus = async (req, res) => {
  const { id } = req.params;
  const { status, candidate_notes } = req.body;

  try {
    const result = await pool.query(`
      UPDATE offer_letters SET
        status = $1,
        candidate_notes = COALESCE($2, candidate_notes),
        responded_at = CASE WHEN $1 IN ('accepted', 'declined') THEN CURRENT_TIMESTAMP ELSE responded_at END,
        sent_at = CASE WHEN $1 = 'sent' THEN CURRENT_TIMESTAMP ELSE sent_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status, candidate_notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Update application status based on offer status
    const appStatus = status === 'accepted' ? 'offer_accepted' :
                      status === 'declined' ? 'offer_declined' :
                      status === 'sent' ? 'offer_sent' : null;
    
    if (appStatus) {
      await pool.query(`
        UPDATE job_applications SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [appStatus, result.rows[0].application_id]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update offer status error:", error);
    res.status(500).json({ error: "Failed to update offer" });
  }
};

// Get interview stages
export const getInterviewStages = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM interview_stages WHERE is_active = true ORDER BY sequence_order`);
    res.json(result.rows);
  } catch (error) {
    console.error("Get stages error:", error);
    res.status(500).json({ error: "Failed to fetch interview stages" });
  }
};

// Get recruitment dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM job_postings WHERE status = 'published') as active_jobs,
        (SELECT COUNT(*) FROM job_applications WHERE status = 'new') as new_applications,
        (SELECT COUNT(*) FROM job_applications WHERE status IN ('screening', 'shortlisted')) as in_progress,
        (SELECT COUNT(*) FROM interviews WHERE status = 'scheduled' AND scheduled_at > NOW()) as upcoming_interviews,
        (SELECT COUNT(*) FROM offer_letters WHERE status = 'sent') as pending_offers,
        (SELECT COUNT(*) FROM job_applications WHERE status = 'hired' AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', NOW())) as hired_this_month
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// =====================================================
// RESUME ANALYSIS WITH AI
// =====================================================

/**
 * Analyze resume against job requirements using Gemini AI
 */
export const analyzerResumeJobMatch = async (req, res) => {
  const { applicationId, jobId, resumeText } = req.body;
  console.log("🚀 Resume analysis API called");

  if (!applicationId || !jobId || !resumeText) {
    return res.status(400).json({
      error: "Missing required fields: applicationId, jobId, resumeText"
    });
  }

  try {

    
    // 🔹 Fetch job details
    const jobResult = await pool.query(`
      SELECT jp.*, d.name as department_name
      FROM job_postings jp
      LEFT JOIN departments d ON jp.department_id = d.id
      WHERE jp.id = $1
    `, [jobId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const jobData = jobResult.rows[0];

    // 🔥 Initialize NEW Gemini SDK
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
   


    console.log("✅ AI initialized");

    // 🔥 Prompt
    const prompt = `You are an expert HR recruiter. Analyze the following resume against the job requirements and provide a detailed match analysis.

JOB DETAILS:
Title: ${jobData.title}
Department: ${jobData.department_name || "N/A"}
Description: ${jobData.description}
Requirements: ${jobData.requirements}
Experience Level: ${jobData.experience_level}
Experience Range: ${jobData.experience_min}-${jobData.experience_max} years
Location: ${jobData.location}
Job Type: ${jobData.job_type}

RESUME:
${resumeText}

Return ONLY valid JSON (no extra text):

{
  "overallScore": <number>,
  "skillMatch": {
    "matched": [],
    "percentage": <number>
  },
  "missingSkills": [],
  "experienceRelevance": {
    "relevantExperience": "",
    "yearsRelevant": <number>,
    "alignment": ""
  },
  "strengths": [],
  "concerns": [],
  "recommendation": "",
  "suggestions": [],
  "summary": ""
}`;

    // 🔥 Call Gemini (NEW SYNTAX)
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });
    console.log("🔥 Gemini raw response:", result);

    const text = result.text;

    // 🔥 Safe JSON parsing
    let analysis;

    try {
      analysis = JSON.parse(text);
    } catch (err) {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid JSON from AI");
      analysis = JSON.parse(match[0]);
    }

    // 🔹 Store in DB
    const analysisStored = await pool.query(`
      INSERT INTO job_applications (
        id, job_id, applicant_email, status, resume_text, ai_analysis, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        ai_analysis = $6,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, ai_analysis
    `, [
      applicationId,
      jobId,
      req.body.applicantEmail || 'unknown@example.com',
      'screening',
      resumeText.substring(0, 5000),
      JSON.stringify(analysis)
    ]);

    return res.json({
      success: true,
      analysis,
      applicationId,
      stored: analysisStored.rows[0]
    });

  } catch (error) {
    console.error("Resume analysis error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze resume with AI"
    });
  }
};

export const analyzeResumeJobMatch = async (req, res) => {
  const { applicationId, jobId, resumeText } = req.body;
  console.log("🚀 Resume analysis API called");

  if (!applicationId || !jobId || !resumeText) {
    return res.status(400).json({
      error: "Missing required fields: applicationId, jobId, resumeText"
    });
  }

  try {
    const jobResult = await pool.query(`
      SELECT jp.*, d.name as department_name
      FROM job_postings jp
      LEFT JOIN departments d ON jp.department_id = d.id
      WHERE jp.id = $1
    `, [jobId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const jobData = jobResult.rows[0];

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are an expert HR recruiter. Analyze the following resume against the job requirements and provide a detailed match analysis.

JOB DETAILS:
Title: ${jobData.title}
Department: ${jobData.department_name || "N/A"}
Description: ${jobData.description}
Requirements: ${jobData.requirements}
Experience Level: ${jobData.experience_level}
Experience Range: ${jobData.experience_min}-${jobData.experience_max} years
Location: ${jobData.location}
Job Type: ${jobData.job_type}

RESUME:
${resumeText}

Return ONLY valid JSON (no extra text, no markdown):

{
  "overallScore": <number 0-100>,
  "skillMatch": { "matched": [], "percentage": <number> },
  "missingSkills": [],
  "experienceRelevance": { "relevantExperience": "", "yearsRelevant": <number>, "alignment": "" },
  "strengths": [],
  "concerns": [],
  "recommendation": "",
  "suggestions": [],
  "summary": ""
}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const text = result.text;

    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch (err) {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid JSON from AI");
      analysis = JSON.parse(match[0]);
    }

    // ✅ FIXED: UPDATE the existing row instead of INSERT with wrong columns
    const updated = await pool.query(`
      UPDATE job_applications
      SET
        ai_analysis = $1,
        resume_text = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, ai_analysis, status
    `, [JSON.stringify(analysis), resumeText.substring(0, 5000), applicationId]);

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    return res.json({
      success: true,
      analysis,
      applicationId,
      stored: updated.rows[0]
    });

  } catch (error) {
    console.error("Resume analysis error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze resume with AI"
    });
  }
};
/**
 * Batch analyze multiple resumes for a job
 */
export const batchesAnalyzeResumes = async (req, res) => {
  const { jobId, applications } = req.body;

  if (!jobId || !applications || !Array.isArray(applications)) {
    return res.status(400).json({ error: "Missing required fields: jobId, applications (array)" });
  }

  try {
    // Get job details
    const jobResult = await pool.query(`
      SELECT jp.*, d.name as department_name
      FROM job_postings jp
      LEFT JOIN departments d ON jp.department_id = d.id
      WHERE jp.id = $1
    `, [jobId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const jobData = jobResult.rows[0];
    const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const results = [];

    for (const app of applications) {
      try {
        const prompt = `You are an expert HR recruiter. Analyze the following resume against the job requirements and provide a detailed match analysis.

JOB DETAILS:
Title: ${jobData.title}
Department: ${jobData.department_name || "N/A"}
Requirements: ${jobData.requirements}
Experience Level: ${jobData.experience_level}
Experience Range: ${jobData.experience_min}-${jobData.experience_max} years

RESUME:
${app.resumeText}

Return only a JSON object with: overallScore (0-100), recommendation (Strong/Good/Fair/Poor Match), summary (brief text), and missingSkills (array).`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          results.push({
            applicationId: app.applicationId,
            success: true,
            score: analysis.overallScore,
            recommendation: analysis.recommendation,
            summary: analysis.summary
          });

          // Update database
          await pool.query(`
            UPDATE job_applications
            SET ai_analysis = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [JSON.stringify(analysis), app.applicationId]);
        }
      } catch (error) {
        results.push({
          applicationId: app.applicationId,
          success: false,
          error: error.message
        });
      }
    }

    // Sort by score descending
    const ranked = results
      .filter(r => r.success)
      .sort((a, b) => b.score - a.score)
      .map((r, idx) => ({ ...r, rank: idx + 1 }));

    res.json({
      success: true,
      totalAnalyzed: results.length,
      successCount: ranked.length,
      ranked,
      all: results
    });
  } catch (error) {
    console.error("Batch analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to batch analyze resumes"
    });
  }
};

export const batchAnalyzeResumes = async (req, res) => {
  const { jobId, applications } = req.body;

  if (!jobId || !applications || !Array.isArray(applications)) {
    return res.status(400).json({ error: "Missing required fields: jobId, applications (array)" });
  }

  try {
    const jobResult = await pool.query(`
      SELECT jp.*, d.name as department_name
      FROM job_postings jp
      LEFT JOIN departments d ON jp.department_id = d.id
      WHERE jp.id = $1
    `, [jobId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const jobData = jobResult.rows[0];

    // ✅ FIXED: use new GoogleGenAI SDK (same as analyzeResumeJobMatch)
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const results = [];

    for (const app of applications) {
      try {
        const prompt = `You are an expert HR recruiter. Analyze the following resume against the job requirements.

JOB DETAILS:
Title: ${jobData.title}
Department: ${jobData.department_name || "N/A"}
Requirements: ${jobData.requirements}
Experience Level: ${jobData.experience_level}
Experience Range: ${jobData.experience_min}-${jobData.experience_max} years

RESUME:
${app.resumeText}

Return ONLY valid JSON (no extra text, no markdown):
{ "overallScore": <number 0-100>, "recommendation": "<Strong|Good|Fair|Poor Match>", "summary": "<brief text>", "missingSkills": [] }`;

        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });

        const responseText = result.text;
        let analysis;
        try {
          analysis = JSON.parse(responseText);
        } catch {
          const match = responseText.match(/\{[\s\S]*\}/);
          if (!match) throw new Error("Invalid JSON from AI");
          analysis = JSON.parse(match[0]);
        }

        results.push({
          applicationId: app.applicationId,
          success: true,
          score: analysis.overallScore,
          recommendation: analysis.recommendation,
          summary: analysis.summary
        });

        await pool.query(`
          UPDATE job_applications
          SET ai_analysis = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [JSON.stringify(analysis), app.applicationId]);

      } catch (error) {
        results.push({
          applicationId: app.applicationId,
          success: false,
          error: error.message
        });
      }
    }

    const ranked = results
      .filter(r => r.success)
      .sort((a, b) => b.score - a.score)
      .map((r, idx) => ({ ...r, rank: idx + 1 }));

    res.json({
      success: true,
      totalAnalyzed: results.length,
      successCount: ranked.length,
      ranked,
      all: results
    });

  } catch (error) {
    console.error("Batch analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to batch analyze resumes"
    });
  }
};

/**
 * Get AI analysis for an application
 */
export const getApplicationAnalysis = async (req, res) => {
  const { applicationId } = req.params;

  try {
    const result = await pool.query(`
      SELECT id, ai_analysis, status, resume_text
      FROM job_applications
      WHERE id = $1
    `, [applicationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    const app = result.rows[0];

    let analysis = null;
    if (app.ai_analysis) {
      if (typeof app.ai_analysis === "string") {
        try {
          analysis = JSON.parse(app.ai_analysis);
        } catch {
          analysis = null;
        }
      } else {
        analysis = app.ai_analysis;
      }
    }

    const aiAnalysisRaw =
      app.ai_analysis == null
        ? null
        : typeof app.ai_analysis === "string"
          ? app.ai_analysis
          : JSON.stringify(app.ai_analysis);

    res.json({
      applicationId: app.id,
      analysis,
      ai_analysis_raw: aiAnalysisRaw,
      status: app.status,
      resumeLength: app.resume_text?.length || 0
    });
  } catch (error) {
    console.error("Get analysis error:", error);
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
};



// =====================================================
// GOOGLE FORM INTEGRATION
// =====================================================

export const generateGoogleForm = async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await pool.query(`SELECT * FROM job_postings WHERE id = $1`, [jobId]);
    if (job.rows.length === 0) return res.status(404).json({ error: "Job not found" });

    // Placeholder: integrate with Google Forms API here
    // For now, return a mock form link so the route doesn't crash
    const mockFormUrl = `https://forms.google.com/placeholder-for-job-${jobId}`;

    await pool.query(`
      UPDATE job_postings SET updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [jobId]);

    res.json({
      success: true,
      jobId,
      formUrl: mockFormUrl,
      message: "Google Form generation — connect your Google Forms API credentials to activate"
    });
  } catch (error) {
    console.error("Generate form error:", error);
    res.status(500).json({ error: "Failed to generate form" });
  }
};

export const getFormLink = async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await pool.query(
      `SELECT id, title FROM job_postings WHERE id = $1 AND status = 'published'`,
      [jobId]
    );
    if (job.rows.length === 0) return res.status(404).json({ error: "Job not found" });

    // Return whatever form URL you've stored, or a placeholder
    res.json({
      jobId,
      jobTitle: job.rows[0].title,
      formUrl: `https://forms.google.com/placeholder-for-job-${jobId}`
    });
  } catch (error) {
    console.error("Get form link error:", error);
    res.status(500).json({ error: "Failed to get form link" });
  }
};

// =====================================================
// RANKED CANDIDATES
// =====================================================

export const getRankedApplications = async (req, res) => {
  const { jobId } = req.params;
  try {
    const result = await pool.query(`
      SELECT ja.id, ja.status, ja.applied_at,
             ja.ai_analysis,
             c.first_name, c.last_name, c.email,
             c.current_company, c.current_title, c.experience_years
      FROM job_applications ja
      JOIN candidates c ON ja.candidate_id = c.id
      WHERE ja.job_id = $1
        AND ja.ai_analysis IS NOT NULL
      ORDER BY (ja.ai_analysis->>'overallScore')::numeric DESC NULLS LAST
    `, [jobId]);

    const ranked = result.rows.map((row, idx) => ({
      rank: idx + 1,
      applicationId: row.id,
      candidate: {
        name: `${row.first_name} ${row.last_name}`,
        email: row.email,
        currentCompany: row.current_company,
        currentTitle: row.current_title,
        experienceYears: row.experience_years
      },
      score: row.ai_analysis?.overallScore ?? null,
      recommendation: row.ai_analysis?.recommendation ?? null,
      summary: row.ai_analysis?.summary ?? null,
      status: row.status,
      appliedAt: row.applied_at
    }));

    res.json({ jobId, totalRanked: ranked.length, ranked });
  } catch (error) {
    console.error("Get ranked applications error:", error);
    res.status(500).json({ error: "Failed to fetch ranked applications" });
  }
};

export const autoAnalyzeAllResumes = async (req, res) => {
  const { jobId } = req.params;
  try {
    // Fetch all applications for this job that have resume_text but no ai_analysis yet
    const apps = await pool.query(`
      SELECT ja.id as "applicationId", ja.resume_text as "resumeText"
      FROM job_applications ja
      WHERE ja.job_id = $1
        AND ja.resume_text IS NOT NULL
        AND ja.ai_analysis IS NULL
    `, [jobId]);

    if (apps.rows.length === 0) {
      return res.json({ success: true, message: "No unanalyzed applications found", analyzed: 0 });
    }

    // Reuse the batch analyze logic by calling it internally
    req.body = { jobId, applications: apps.rows };
    return batchAnalyzeResumes(req, res);

  } catch (error) {
    console.error("Auto-analyze error:", error);
    res.status(500).json({ error: "Failed to auto-analyze resumes" });
  }
};