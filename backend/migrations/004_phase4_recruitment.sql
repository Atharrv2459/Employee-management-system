-- filepath: c:\Users\athar\Dev\Internship\Attendance tracker\backend\migrations\004_phase4_recruitment.sql
-- Phase 4: Recruitment & ATS Migration
-- Job postings, applicant tracking, interview scheduling

-- =====================================================
-- 1. JOB POSTINGS TABLE
-- Active job openings
-- =====================================================

CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) UNIQUE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    location VARCHAR(200),
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship', 'temporary')),
    experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
    experience_min INTEGER DEFAULT 0,
    experience_max INTEGER,
    salary_min DECIMAL(12, 2),
    salary_max DECIMAL(12, 2),
    salary_currency VARCHAR(3) DEFAULT 'INR',
    show_salary BOOLEAN DEFAULT false,
    
    description TEXT NOT NULL,
    responsibilities TEXT,
    requirements TEXT,
    benefits TEXT,
    skills_required JSONB,
    
    positions_available INTEGER DEFAULT 1,
    positions_filled INTEGER DEFAULT 0,
    
    application_deadline DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'closed', 'filled')),
    is_remote BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    posted_by UUID REFERENCES public.users(user_id),
    hiring_manager_id UUID REFERENCES public.users(user_id),
    
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    
    published_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_department ON public.job_postings(department_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_slug ON public.job_postings(slug);

-- =====================================================
-- 2. CANDIDATES TABLE
-- External applicants (not yet employees)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    
    current_company VARCHAR(200),
    current_title VARCHAR(200),
    experience_years DECIMAL(4, 1),
    
    skills JSONB,
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    
    resume_path TEXT,
    resume_filename VARCHAR(255),
    
    source VARCHAR(50) CHECK (source IN ('website', 'linkedin', 'referral', 'job_board', 'agency', 'other')),
    source_details VARCHAR(255),
    referred_by UUID REFERENCES public.users(user_id),
    
    notes TEXT,
    tags JSONB,
    
    is_blacklisted BOOLEAN DEFAULT false,
    blacklist_reason TEXT,
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON public.candidates USING GIN (skills);

-- =====================================================
-- 3. JOB APPLICATIONS TABLE
-- Links candidates to job postings
-- =====================================================

CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    
    cover_letter TEXT,
    expected_salary DECIMAL(12, 2),
    notice_period_days INTEGER,
    available_from DATE,
    
    status VARCHAR(30) DEFAULT 'new' CHECK (status IN (
        'new', 'screening', 'shortlisted', 'interview_scheduled', 
        'interviewed', 'offer_pending', 'offer_sent', 'offer_accepted',
        'offer_declined', 'hired', 'rejected', 'withdrawn'
    )),
    
    rejection_reason VARCHAR(200),
    rejection_notes TEXT,
    
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    assigned_to UUID REFERENCES public.users(user_id),
    
    applied_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (job_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_job ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON public.job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.job_applications(status);

-- =====================================================
-- 4. INTERVIEW STAGES TABLE
-- Define interview stages for hiring pipeline
-- =====================================================

CREATE TABLE IF NOT EXISTS public.interview_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sequence_order INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. INTERVIEWS TABLE
-- Scheduled interviews
-- =====================================================

CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES public.interview_stages(id),
    
    interview_type VARCHAR(50) NOT NULL CHECK (interview_type IN (
        'phone_screening', 'video_call', 'in_person', 'technical', 
        'hr_round', 'panel', 'final'
    )),
    
    scheduled_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location VARCHAR(255),
    meeting_link VARCHAR(500),
    
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'confirmed', 'in_progress', 'completed', 
        'cancelled', 'no_show', 'rescheduled'
    )),
    
    notes TEXT,
    
    created_by UUID REFERENCES public.users(user_id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interviews_application ON public.interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled ON public.interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);

-- =====================================================
-- 6. INTERVIEW PANELISTS TABLE
-- Interviewers for each interview
-- =====================================================

CREATE TABLE IF NOT EXISTS public.interview_panelists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'interviewer' CHECK (role IN ('lead', 'interviewer', 'observer')),
    is_confirmed BOOLEAN DEFAULT false,
    confirmed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (interview_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_panelists_interview ON public.interview_panelists(interview_id);
CREATE INDEX IF NOT EXISTS idx_panelists_user ON public.interview_panelists(user_id);

-- =====================================================
-- 7. INTERVIEW FEEDBACK TABLE
-- Feedback from interviewers
-- =====================================================

CREATE TABLE IF NOT EXISTS public.interview_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
    panelist_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    technical_rating INTEGER CHECK (technical_rating >= 1 AND technical_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    cultural_fit_rating INTEGER CHECK (cultural_fit_rating >= 1 AND cultural_fit_rating <= 5),
    
    recommendation VARCHAR(20) CHECK (recommendation IN ('strong_hire', 'hire', 'no_hire', 'strong_no_hire')),
    
    strengths TEXT,
    weaknesses TEXT,
    notes TEXT,
    
    submitted_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (interview_id, panelist_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_interview ON public.interview_feedback(interview_id);

-- =====================================================
-- 8. OFFER LETTERS TABLE
-- Job offers to candidates
-- =====================================================

CREATE TABLE IF NOT EXISTS public.offer_letters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    
    offer_number VARCHAR(50) UNIQUE,
    
    position_title VARCHAR(200) NOT NULL,
    department_id UUID REFERENCES public.departments(id),
    reporting_to UUID REFERENCES public.users(user_id),
    
    salary_offered DECIMAL(12, 2) NOT NULL,
    salary_currency VARCHAR(3) DEFAULT 'INR',
    salary_structure_id UUID REFERENCES public.salary_structures(id),
    
    joining_bonus DECIMAL(12, 2),
    relocation_allowance DECIMAL(12, 2),
    
    probation_period_months INTEGER DEFAULT 3,
    notice_period_days INTEGER DEFAULT 30,
    
    proposed_joining_date DATE NOT NULL,
    offer_valid_until DATE NOT NULL,
    
    terms_and_conditions TEXT,
    special_clauses TEXT,
    
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_approval', 'approved', 'sent', 
        'accepted', 'declined', 'expired', 'revoked'
    )),
    
    sent_at TIMESTAMP WITHOUT TIME ZONE,
    responded_at TIMESTAMP WITHOUT TIME ZONE,
    candidate_notes TEXT,
    
    approved_by UUID REFERENCES public.users(user_id),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    created_by UUID REFERENCES public.users(user_id),
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offers_application ON public.offer_letters(application_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offer_letters(status);

-- =====================================================
-- 9. APPLICATION ACTIVITIES TABLE
-- Activity log for applications
-- =====================================================

CREATE TABLE IF NOT EXISTS public.application_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    performed_by UUID REFERENCES public.users(user_id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_activities_application ON public.application_activities(application_id);
CREATE INDEX IF NOT EXISTS idx_app_activities_created ON public.application_activities(created_at);

-- =====================================================
-- 10. SCREENING QUESTIONS TABLE
-- Custom questions for job applications
-- =====================================================

CREATE TABLE IF NOT EXISTS public.screening_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('text', 'number', 'yes_no', 'multiple_choice', 'file')),
    options JSONB,
    is_required BOOLEAN DEFAULT true,
    is_knockout BOOLEAN DEFAULT false,
    knockout_answer TEXT,
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_screening_job ON public.screening_questions(job_id);

-- =====================================================
-- 11. SCREENING ANSWERS TABLE
-- Candidate answers to screening questions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.screening_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.screening_questions(id) ON DELETE CASCADE,
    answer TEXT,
    file_path TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (application_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_application ON public.screening_answers(application_id);

-- =====================================================
-- DEFAULT INTERVIEW STAGES
-- =====================================================

INSERT INTO public.interview_stages (name, description, sequence_order, is_default) VALUES
('Phone Screening', 'Initial phone call to assess basic qualifications', 1, true),
('Technical Round', 'Technical assessment or coding interview', 2, true),
('HR Interview', 'HR round for cultural fit and expectations', 3, true),
('Manager Interview', 'Interview with hiring manager', 4, true),
('Final Round', 'Final interview with leadership', 5, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Generate job slug from title
CREATE OR REPLACE FUNCTION generate_job_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL THEN
        NEW.slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || 
                    SUBSTRING(NEW.id::TEXT, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_job_slug
    BEFORE INSERT ON public.job_postings
    FOR EACH ROW
    EXECUTE FUNCTION generate_job_slug();

-- Generate offer number
CREATE OR REPLACE FUNCTION generate_offer_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.offer_number IS NULL THEN
        NEW.offer_number := 'OFR-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' ||
                           LPAD((SELECT COUNT(*) + 1 FROM public.offer_letters 
                                 WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_offer_number
    BEFORE INSERT ON public.offer_letters
    FOR EACH ROW
    EXECUTE FUNCTION generate_offer_number();

-- Update application count on job posting
CREATE OR REPLACE FUNCTION update_application_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.job_postings 
        SET applications_count = applications_count + 1
        WHERE id = NEW.job_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.job_postings 
        SET applications_count = applications_count - 1
        WHERE id = OLD.job_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_application_count
    AFTER INSERT OR DELETE ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_application_count();
