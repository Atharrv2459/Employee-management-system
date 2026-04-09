-- Phase 1: Foundation & Geolocation Migration
-- This migration adds departments, office locations, and attendance geolocation tracking

-- =====================================================
-- 1. DEPARTMENTS TABLE
-- Hierarchical department structure with parent-child relationships
-- =====================================================

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    head_user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON public.departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_head_user_id ON public.departments(head_user_id);

-- =====================================================
-- 2. OFFICE LOCATIONS TABLE
-- Stores office locations with geofencing coordinates
-- =====================================================

CREATE TABLE IF NOT EXISTS public.office_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 100,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_office_locations_active ON public.office_locations(is_active);

-- =====================================================
-- 3. ATTENDANCE LOCATIONS TABLE
-- Captures GPS coordinates for each punch in/out
-- =====================================================

CREATE TABLE IF NOT EXISTS public.attendance_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendance_id UUID NOT NULL REFERENCES public.attendance(id) ON DELETE CASCADE,
    location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('punch_in', 'punch_out')),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    altitude DECIMAL(10, 2),
    office_location_id UUID REFERENCES public.office_locations(id) ON DELETE SET NULL,
    is_within_geofence BOOLEAN DEFAULT false,
    distance_from_office DECIMAL(10, 2),
    captured_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_info JSONB,
    ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_attendance_locations_attendance_id ON public.attendance_locations(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_locations_office_id ON public.attendance_locations(office_location_id);
CREATE INDEX IF NOT EXISTS idx_attendance_locations_geofence ON public.attendance_locations(is_within_geofence);

-- =====================================================
-- 4. ADD DEPARTMENT_ID TO EMPLOYEES TABLE
-- =====================================================

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_department_id ON public.employees(department_id);

-- =====================================================
-- 5. ADD DEPARTMENT_ID TO MANAGERS TABLE
-- =====================================================

ALTER TABLE public.managers
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_managers_department_id ON public.managers(department_id);

-- =====================================================
-- 6. REMOTE WORK LOCATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.remote_work_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    radius_meters INTEGER DEFAULT 50,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES public.users(user_id),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    valid_from DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_remote_work_user_id ON public.remote_work_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_remote_work_active ON public.remote_work_locations(is_active, is_approved);

-- =====================================================
-- 7. GEOLOCATION SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.geolocation_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    require_geolocation BOOLEAN DEFAULT true,
    allow_remote_work BOOLEAN DEFAULT false,
    max_distance_meters INTEGER DEFAULT 200,
    require_photo_verification BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_settings UNIQUE (user_id)
);

-- =====================================================
-- 8. ADD HR_MANAGER ROLE
-- =====================================================

INSERT INTO public.roles (id, name) 
VALUES (3, 'HR Manager')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. UPDATE ATTENDANCE TABLE
-- =====================================================

ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS work_location_type VARCHAR(20) DEFAULT 'office' 
CHECK (work_location_type IN ('office', 'remote', 'field', 'unknown'));

ALTER TABLE public.attendance
ADD COLUMN IF NOT EXISTS verified_location BOOLEAN DEFAULT false;

-- =====================================================
-- 10. DEPARTMENT TRANSFER HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS public.department_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    from_department_id UUID REFERENCES public.departments(id),
    to_department_id UUID REFERENCES public.departments(id),
    transfer_date DATE NOT NULL,
    reason TEXT,
    initiated_by UUID REFERENCES public.users(user_id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dept_transfers_user ON public.department_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_dept_transfers_date ON public.department_transfers(transfer_date);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Haversine formula for distance calculation
CREATE OR REPLACE FUNCTION calculate_distance_meters(
    lat1 DECIMAL,
    lon1 DECIMAL,
    lat2 DECIMAL,
    lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 6371000;
    phi1 DECIMAL;
    phi2 DECIMAL;
    delta_phi DECIMAL;
    delta_lambda DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    phi1 := RADIANS(lat1);
    phi2 := RADIANS(lat2);
    delta_phi := RADIANS(lat2 - lat1);
    delta_lambda := RADIANS(lon2 - lon1);
    
    a := SIN(delta_phi / 2) * SIN(delta_phi / 2) +
         COS(phi1) * COS(phi2) *
         SIN(delta_lambda / 2) * SIN(delta_lambda / 2);
    c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check geofence function
CREATE OR REPLACE FUNCTION is_within_any_geofence(
    check_lat DECIMAL,
    check_lon DECIMAL
) RETURNS TABLE (
    office_id UUID,
    office_name VARCHAR,
    distance_meters DECIMAL,
    is_within BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ol.id,
        ol.name,
        calculate_distance_meters(check_lat, check_lon, ol.latitude, ol.longitude),
        calculate_distance_meters(check_lat, check_lon, ol.latitude, ol.longitude) <= ol.radius_meters
    FROM public.office_locations ol
    WHERE ol.is_active = true
    ORDER BY calculate_distance_meters(check_lat, check_lon, ol.latitude, ol.longitude);
END;
$$ LANGUAGE plpgsql;

-- Global settings default
INSERT INTO public.geolocation_settings (user_id, require_geolocation, allow_remote_work, max_distance_meters)
VALUES (NULL, true, true, 200)
ON CONFLICT DO NOTHING;
