import pool from "../db.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Submit application (public)
export const submitApplication = async (req, res) => {
  const {
    job_id, email, first_name, last_name, phone,
    current_company, current_title, experience_years,
    skills, linkedin_url, portfolio_url,
    cover_letter, expected_salary, notice_period_days, available_from,
    source, source_details, screening_answers
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if job exists and is published
    const job = await client.query(`SELECT * FROM job_postings WHERE id = $1 AND status = 'published'`, [job_id]);
    if (job.rows.length === 0) {
      return res.status(404).json({ error: "Job not found or not accepting applications" });
    }

    // Create or get candidate
    let candidate = await client.query(`SELECT * FROM candidates WHERE email = $1`, [email]);
    
    if (candidate.rows.length === 0) {
      candidate = await client.query(`
        INSERT INTO candidates 
        (email, first_name, last_name, phone, current_company, current_title,
         experience_years, skills, linkedin_url, portfolio_url, source, source_details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [email, first_name, last_name, phone, current_company, current_title,
          experience_years, skills ? JSON.stringify(skills) : null, 
          linkedin_url, portfolio_url, source || 'website', source_details]);
    } else {
      // Update candidate info
      candidate = await client.query(`
        UPDATE candidates SET
          first_name = $1, last_name = $2, phone = COALESCE($3, phone),
          current_company = COALESCE($4, current_company),
          current_title = COALESCE($5, current_title),
          experience_years = COALESCE($6, experience_years),
          updated_at = CURRENT_TIMESTAMP
        WHERE email = $7
        RETURNING *
      `, [first_name, last_name, phone, current_company, current_title, experience_years, email]);
    }

    const candidateId = candidate.rows[0].id;

    // Check if already applied
    const existingApp = await client.query(`
      SELECT * FROM job_applications WHERE job_id = $1 AND candidate_id = $2
    `, [job_id, candidateId]);

    if (existingApp.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "You have already applied for this position" });
    }

    // Create application
    const application = await client.query(`
      INSERT INTO job_applications 
      (job_id, candidate_id, cover_letter, expected_salary, notice_period_days, available_from)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [job_id, candidateId, cover_letter, expected_salary, notice_period_days, available_from]);

    const applicationId = application.rows[0].id;

    // Save screening answers
    if (screening_answers && screening_answers.length > 0) {
      for (const answer of screening_answers) {
        await client.query(`
          INSERT INTO screening_answers (application_id, question_id, answer)
          VALUES ($1, $2, $3)
        `, [applicationId, answer.question_id, answer.answer]);
      }
    }

    // Log activity
    await client.query(`
      INSERT INTO application_activities (application_id, activity_type, description)
      VALUES ($1, 'application_submitted', 'Application submitted')
    `, [applicationId]);

    await client.query('COMMIT');
    res.status(201).json({ 
      message: "Application submitted successfully",
      application_id: applicationId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Submit application error:", error);
    if (error.code === '23505') {
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
             c.linkedin_url, c.resume_path
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
             d.name as department_name
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
export const analyzeResumeJobMatch = async (req, res) => {
  const { applicationId, jobId, resumeText } = req.body;

  if (!applicationId || !jobId || !resumeText) {
    return res.status(400).json({ error: "Missing required fields: applicationId, jobId, resumeText" });
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

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

Please analyze and provide:
1. Overall Match Score (0-100)
2. Skill Match Analysis (which required skills does the candidate have)
3. Missing Skills (required skills the candidate lacks)
4. Experience Relevance (how relevant is their experience)
5. Key Strengths for this role
6. Potential concerns or gaps
7. Recommendation (Strong Match/Good Match/Fair Match/Poor Match)
8. Specific suggestions for the candidate to improve fit

Format your response as a JSON object with these exact keys:
{
  "overallScore": <number>,
  "skillMatch": {
    "matched": [<list of matched skills>],
    "percentage": <number>
  },
  "missingSkills": [<list of missing skills>],
  "experienceRelevance": {
    "relevantExperience": "<description>",
    "yearsRelevant": <number>,
    "alignment": "<High/Medium/Low>"
  },
  "strengths": [<list of key strengths>],
  "concerns": [<list of concerns or gaps>],
  "recommendation": "<Strong Match/Good Match/Fair Match/Poor Match>",
  "suggestions": [<list of suggestions>],
  "summary": "<brief summary of the analysis>"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Store analysis in database
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

    res.json({
      success: true,
      analysis,
      applicationId,
      stored: analysisStored.rows[0]
    });
  } catch (error) {
    console.error("Resume analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze resume with AI"
    });
  }
};

/**
 * Batch analyze multiple resumes for a job
 */
export const batchAnalyzeResumes = async (req, res) => {
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
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    res.json({
      applicationId: app.id,
      analysis: app.ai_analysis ? JSON.parse(app.ai_analysis) : null,
      status: app.status,
      resumeLength: app.resume_text?.length || 0
    });
  } catch (error) {
    console.error("Get analysis error:", error);
    res.status(500).json({ error: "Failed to fetch analysis" });
  }
};
