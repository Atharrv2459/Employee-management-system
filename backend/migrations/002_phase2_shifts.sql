-- Phase 2: Enhanced Shift & Scheduling Migration
-- This migration adds shift templates, employee preferences, scheduling, and swap requests

-- =====================================================
-- 1. SHIFT TEMPLATES TABLE
-- Reusable shift patterns (Morning, Evening, Night, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shift_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INTEGER DEFAULT 60,
    shift_type VARCHAR(50) DEFAULT 'regular' CHECK (shift_type IN ('regular', 'morning', 'evening', 'night', 'split', 'flexible', 'rotational')),
    color VARCHAR(7) DEFAULT '#3B82F6',  -- Hex color for calendar display
    min_hours DECIMAL(4,2) DEFAULT 8.0,
    max_hours DECIMAL(4,2) DEFAULT 12.0,
    is_overnight BOOLEAN DEFAULT false,  -- True if shift spans midnight
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shift_templates_department ON public.shift_templates(department_id);
CREATE INDEX IF NOT EXISTS idx_shift_templates_active ON public.shift_templates(is_active);

-- =====================================================
-- 2. SHIFT PREFERENCES TABLE
-- Employee preferences for shifts and availability
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shift_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    preferred_shift_ids UUID[],  -- Array of preferred shift template IDs
    preferred_days INTEGER[],    -- 0=Sunday, 1=Monday, ..., 6=Saturday
    unavailable_days INTEGER[],  -- Days employee cannot work
    max_hours_per_week INTEGER DEFAULT 40,
    max_hours_per_day INTEGER DEFAULT 10,
    min_hours_per_week INTEGER DEFAULT 20,
    prefer_consecutive_days BOOLEAN DEFAULT true,
    notes TEXT,
    effective_from DATE,
    effective_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_shift_preferences_user ON public.shift_preferences(user_id);

-- =====================================================
-- 3. UNAVAILABLE DATES TABLE
-- Specific dates when employee is unavailable
-- =====================================================

CREATE TABLE IF NOT EXISTS public.unavailable_dates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reason VARCHAR(255),
    is_recurring BOOLEAN DEFAULT false,  -- True for weekly recurring
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_unavailable_dates_user ON public.unavailable_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_unavailable_dates_date ON public.unavailable_dates(date);

-- =====================================================
-- 4. SHIFT SCHEDULE TABLE
-- Actual scheduled shifts for employees
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shift_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    shift_template_id UUID REFERENCES public.shift_templates(id) ON DELETE SET NULL,
    schedule_date DATE NOT NULL,
    start_time TIME,              -- Override template start time if needed
    end_time TIME,                -- Override template end time if needed
    break_duration_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'missed', 'cancelled')),
    assigned_by UUID REFERENCES public.users(user_id),
    notes TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_schedule UNIQUE (user_id, schedule_date)
);

CREATE INDEX IF NOT EXISTS idx_shift_schedule_user ON public.shift_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedule_date ON public.shift_schedule(schedule_date);
CREATE INDEX IF NOT EXISTS idx_shift_schedule_template ON public.shift_schedule(shift_template_id);
CREATE INDEX IF NOT EXISTS idx_shift_schedule_status ON public.shift_schedule(status);

-- =====================================================
-- 5. SHIFT SWAP REQUESTS TABLE
-- Requests to swap shifts between employees
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shift_swap_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    requester_schedule_id UUID NOT NULL REFERENCES public.shift_schedule(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    target_schedule_id UUID REFERENCES public.shift_schedule(id) ON DELETE SET NULL,
    swap_type VARCHAR(20) DEFAULT 'swap' CHECK (swap_type IN ('swap', 'cover', 'giveaway')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'approved', 'completed')),
    requester_reason TEXT,
    target_response TEXT,
    manager_notes TEXT,
    responded_at TIMESTAMP WITHOUT TIME ZONE,
    approved_by UUID REFERENCES public.users(user_id),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_swap_requests_requester ON public.shift_swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_target ON public.shift_swap_requests(target_user_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON public.shift_swap_requests(status);

-- =====================================================
-- 6. SCHEDULE PERIODS TABLE
-- Define schedule periods (weeks) for publishing
-- =====================================================

CREATE TABLE IF NOT EXISTS public.schedule_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'locked')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(user_id),
    published_at TIMESTAMP WITHOUT TIME ZONE,
    locked_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_periods_dates ON public.schedule_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_schedule_periods_department ON public.schedule_periods(department_id);

-- =====================================================
-- 7. SHIFT NOTIFICATIONS TABLE
-- Track shift-related notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS public.shift_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('schedule_published', 'shift_assigned', 'shift_changed', 'swap_request', 'swap_response', 'shift_reminder')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    related_schedule_id UUID REFERENCES public.shift_schedule(id) ON DELETE SET NULL,
    related_swap_id UUID REFERENCES public.shift_swap_requests(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shift_notifications_user ON public.shift_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_shift_notifications_unread ON public.shift_notifications(user_id, is_read) WHERE is_read = false;

-- =====================================================
-- 8. INSERT DEFAULT SHIFT TEMPLATES
-- =====================================================

INSERT INTO public.shift_templates (name, code, start_time, end_time, shift_type, color, description) VALUES
    ('Morning Shift', 'MORNING', '06:00', '14:00', 'morning', '#22C55E', 'Early morning shift'),
    ('Day Shift', 'DAY', '09:00', '17:00', 'regular', '#3B82F6', 'Standard 9-5 shift'),
    ('Evening Shift', 'EVENING', '14:00', '22:00', 'evening', '#F59E0B', 'Afternoon to evening shift'),
    ('Night Shift', 'NIGHT', '22:00', '06:00', 'night', '#8B5CF6', 'Overnight shift'),
    ('Flexible', 'FLEX', '08:00', '18:00', 'flexible', '#EC4899', 'Flexible timing within window')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to check shift conflicts
CREATE OR REPLACE FUNCTION check_shift_conflict(
    p_user_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_schedule_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.shift_schedule ss
        JOIN public.shift_templates st ON ss.shift_template_id = st.id
        WHERE ss.user_id = p_user_id
          AND ss.schedule_date = p_date
          AND ss.status NOT IN ('cancelled')
          AND (p_exclude_schedule_id IS NULL OR ss.id != p_exclude_schedule_id)
          AND (
              (COALESCE(ss.start_time, st.start_time), COALESCE(ss.end_time, st.end_time))
              OVERLAPS
              (p_start_time, p_end_time)
          )
    ) INTO conflict_exists;
    
    RETURN conflict_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to get weekly hours for a user
CREATE OR REPLACE FUNCTION get_weekly_hours(
    p_user_id UUID,
    p_week_start DATE
) RETURNS DECIMAL AS $$
DECLARE
    total_hours DECIMAL := 0;
BEGIN
    SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (
            COALESCE(ss.end_time, st.end_time)::TIME - 
            COALESCE(ss.start_time, st.start_time)::TIME
        )) / 3600.0
    ), 0)
    INTO total_hours
    FROM public.shift_schedule ss
    LEFT JOIN public.shift_templates st ON ss.shift_template_id = st.id
    WHERE ss.user_id = p_user_id
      AND ss.schedule_date >= p_week_start
      AND ss.schedule_date < p_week_start + INTERVAL '7 days'
      AND ss.status NOT IN ('cancelled', 'missed');
    
    RETURN total_hours;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is available on a date
CREATE OR REPLACE FUNCTION is_user_available(
    p_user_id UUID,
    p_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
    is_available BOOLEAN := true;
    day_of_week INTEGER;
    pref RECORD;
BEGIN
    day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;
    
    -- Check unavailable_dates table
    IF EXISTS (
        SELECT 1 FROM public.unavailable_dates
        WHERE user_id = p_user_id AND date = p_date
    ) THEN
        RETURN false;
    END IF;
    
    -- Check shift_preferences for unavailable days
    SELECT * INTO pref FROM public.shift_preferences
    WHERE user_id = p_user_id AND is_active = true;
    
    IF FOUND AND pref.unavailable_days IS NOT NULL THEN
        IF day_of_week = ANY(pref.unavailable_days) THEN
            RETURN false;
        END IF;
    END IF;
    
    -- Check for approved leaves
    IF EXISTS (
        SELECT 1 FROM public.leaves
        WHERE user_id = p_user_id
          AND status = 'approved'
          AND p_date BETWEEN start_date AND end_date
    ) THEN
        RETURN false;
    END IF;
    
    RETURN is_available;
END;
$$ LANGUAGE plpgsql;
