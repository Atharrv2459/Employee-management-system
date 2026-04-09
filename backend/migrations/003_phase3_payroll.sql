-- filepath: c:\Users\athar\Dev\Internship\Attendance tracker\backend\migrations\003_phase3_payroll.sql
-- Phase 3: Payroll Management Migration
-- Salary structures, payroll processing, payslips, tax calculations

-- =====================================================
-- 1. SALARY COMPONENTS TABLE
-- Defines various salary components (basic, HRA, DA, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.salary_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earning', 'deduction')),
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'basic', 'allowance', 'bonus', 'reimbursement', 'overtime',
        'statutory_deduction', 'voluntary_deduction', 'loan', 'tax'
    )),
    calculation_type VARCHAR(20) NOT NULL CHECK (calculation_type IN ('fixed', 'percentage', 'formula')),
    percentage_of UUID REFERENCES public.salary_components(id),
    percentage_value DECIMAL(5, 2),
    is_taxable BOOLEAN DEFAULT true,
    is_statutory BOOLEAN DEFAULT false,
    affects_pf BOOLEAN DEFAULT false,
    affects_esi BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salary_components_type ON public.salary_components(type);
CREATE INDEX IF NOT EXISTS idx_salary_components_active ON public.salary_components(is_active);

-- =====================================================
-- 2. SALARY STRUCTURE TABLE
-- Template salary structures for different grades/levels
-- =====================================================

CREATE TABLE IF NOT EXISTS public.salary_structures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    grade_level VARCHAR(50),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salary_structures_active ON public.salary_structures(is_active);

-- =====================================================
-- 3. SALARY STRUCTURE COMPONENTS
-- Links components to salary structures with amounts
-- =====================================================

CREATE TABLE IF NOT EXISTS public.salary_structure_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salary_structure_id UUID NOT NULL REFERENCES public.salary_structures(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES public.salary_components(id) ON DELETE CASCADE,
    default_amount DECIMAL(12, 2),
    percentage_value DECIMAL(5, 2),
    is_mandatory BOOLEAN DEFAULT true,
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (salary_structure_id, component_id)
);

CREATE INDEX IF NOT EXISTS idx_struct_comp_structure ON public.salary_structure_components(salary_structure_id);

-- =====================================================
-- 4. EMPLOYEE SALARY TABLE
-- Individual employee salary assignments
-- =====================================================

CREATE TABLE IF NOT EXISTS public.employee_salaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    salary_structure_id UUID REFERENCES public.salary_structures(id) ON DELETE SET NULL,
    base_salary DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    pay_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (pay_frequency IN ('weekly', 'bi-weekly', 'monthly')),
    effective_from DATE NOT NULL,
    effective_to DATE,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    pan_number VARCHAR(20),
    pf_number VARCHAR(50),
    esi_number VARCHAR(50),
    uan_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(user_id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emp_salary_user ON public.employee_salaries(user_id);
CREATE INDEX IF NOT EXISTS idx_emp_salary_active ON public.employee_salaries(is_active, effective_from);

-- =====================================================
-- 5. EMPLOYEE SALARY COMPONENTS
-- Individual component amounts for each employee
-- =====================================================

CREATE TABLE IF NOT EXISTS public.employee_salary_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_salary_id UUID NOT NULL REFERENCES public.employee_salaries(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES public.salary_components(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    percentage_value DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_salary_id, component_id)
);

CREATE INDEX IF NOT EXISTS idx_emp_salary_comp ON public.employee_salary_components(employee_salary_id);

-- =====================================================
-- 6. PAYROLL PERIODS TABLE
-- Defines payroll periods (months)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    pay_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'cancelled')),
    total_employees INTEGER DEFAULT 0,
    total_gross_pay DECIMAL(14, 2) DEFAULT 0,
    total_deductions DECIMAL(14, 2) DEFAULT 0,
    total_net_pay DECIMAL(14, 2) DEFAULT 0,
    processed_by UUID REFERENCES public.users(user_id),
    processed_at TIMESTAMP WITHOUT TIME ZONE,
    approved_by UUID REFERENCES public.users(user_id),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON public.payroll_periods(status);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_dates ON public.payroll_periods(period_start, period_end);

-- =====================================================
-- 7. PAYSLIPS TABLE
-- Individual employee payslips
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payslips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    employee_salary_id UUID REFERENCES public.employee_salaries(id),
    payslip_number VARCHAR(50) UNIQUE,
    
    -- Attendance data
    working_days INTEGER DEFAULT 0,
    days_worked DECIMAL(5, 2) DEFAULT 0,
    days_absent DECIMAL(5, 2) DEFAULT 0,
    leaves_taken DECIMAL(5, 2) DEFAULT 0,
    overtime_hours DECIMAL(6, 2) DEFAULT 0,
    
    -- Salary breakdown
    gross_salary DECIMAL(12, 2) NOT NULL,
    total_earnings DECIMAL(12, 2) NOT NULL,
    total_deductions DECIMAL(12, 2) NOT NULL,
    net_salary DECIMAL(12, 2) NOT NULL,
    
    -- Tax details
    taxable_income DECIMAL(12, 2) DEFAULT 0,
    income_tax DECIMAL(12, 2) DEFAULT 0,
    professional_tax DECIMAL(12, 2) DEFAULT 0,
    
    -- PF/ESI
    employee_pf DECIMAL(12, 2) DEFAULT 0,
    employer_pf DECIMAL(12, 2) DEFAULT 0,
    employee_esi DECIMAL(12, 2) DEFAULT 0,
    employer_esi DECIMAL(12, 2) DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'approved', 'paid', 'cancelled')),
    payment_mode VARCHAR(20) CHECK (payment_mode IN ('bank_transfer', 'cheque', 'cash')),
    payment_reference VARCHAR(100),
    paid_at TIMESTAMP WITHOUT TIME ZONE,
    
    remarks TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (payroll_period_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_payslips_period ON public.payslips(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payslips_user ON public.payslips(user_id);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON public.payslips(status);

-- =====================================================
-- 8. PAYSLIP LINE ITEMS
-- Detailed breakdown of each payslip
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payslip_line_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payslip_id UUID NOT NULL REFERENCES public.payslips(id) ON DELETE CASCADE,
    component_id UUID REFERENCES public.salary_components(id) ON DELETE SET NULL,
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earning', 'deduction')),
    amount DECIMAL(12, 2) NOT NULL,
    is_taxable BOOLEAN DEFAULT true,
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payslip_items_payslip ON public.payslip_line_items(payslip_id);

-- =====================================================
-- 9. SALARY REVISIONS TABLE
-- Track salary changes history
-- =====================================================

CREATE TABLE IF NOT EXISTS public.salary_revisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    previous_salary DECIMAL(12, 2),
    new_salary DECIMAL(12, 2) NOT NULL,
    revision_type VARCHAR(50) CHECK (revision_type IN ('increment', 'promotion', 'adjustment', 'correction', 'initial')),
    percentage_change DECIMAL(5, 2),
    effective_date DATE NOT NULL,
    reason TEXT,
    approved_by UUID REFERENCES public.users(user_id),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salary_rev_user ON public.salary_revisions(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_rev_date ON public.salary_revisions(effective_date);

-- =====================================================
-- 10. LOAN/ADVANCE TABLE
-- Employee loans and salary advances
-- =====================================================

CREATE TABLE IF NOT EXISTS public.employee_loans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    loan_type VARCHAR(50) NOT NULL CHECK (loan_type IN ('salary_advance', 'personal_loan', 'emergency_loan', 'travel_advance')),
    principal_amount DECIMAL(12, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    emi_amount DECIMAL(12, 2) NOT NULL,
    tenure_months INTEGER NOT NULL,
    disbursement_date DATE,
    start_deduction_date DATE,
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    amount_remaining DECIMAL(12, 2),
    installments_paid INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'cancelled')),
    approved_by UUID REFERENCES public.users(user_id),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    reason TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emp_loans_user ON public.employee_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_emp_loans_status ON public.employee_loans(status);

-- =====================================================
-- 11. LOAN REPAYMENTS TABLE
-- Track individual loan repayments
-- =====================================================

CREATE TABLE IF NOT EXISTS public.loan_repayments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_id UUID NOT NULL REFERENCES public.employee_loans(id) ON DELETE CASCADE,
    payslip_id UUID REFERENCES public.payslips(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    installment_number INTEGER NOT NULL,
    principal_component DECIMAL(12, 2),
    interest_component DECIMAL(12, 2),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_repay_loan ON public.loan_repayments(loan_id);

-- =====================================================
-- 12. TAX DECLARATIONS TABLE
-- Employee tax saving declarations
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tax_declarations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    financial_year VARCHAR(10) NOT NULL,
    declaration_type VARCHAR(50) NOT NULL CHECK (declaration_type IN (
        '80C', '80D', '80E', '80G', '80TTA', 'HRA', 'LTA', 'standard_deduction', 'other'
    )),
    declared_amount DECIMAL(12, 2) NOT NULL,
    proof_submitted BOOLEAN DEFAULT false,
    verified_amount DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'declared' CHECK (status IN ('declared', 'proof_pending', 'verified', 'rejected')),
    remarks TEXT,
    verified_by UUID REFERENCES public.users(user_id),
    verified_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tax_decl_user ON public.tax_declarations(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_decl_fy ON public.tax_declarations(financial_year);

-- =====================================================
-- 13. REIMBURSEMENTS TABLE
-- Expense reimbursements
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reimbursements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'travel', 'food', 'medical', 'mobile', 'internet', 'books', 'equipment', 'other'
    )),
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    expense_date DATE NOT NULL,
    receipt_path TEXT,
    payslip_id UUID REFERENCES public.payslips(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    approved_by UUID REFERENCES public.users(user_id),
    approved_at TIMESTAMP WITHOUT TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reimbursements_user ON public.reimbursements(user_id);
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON public.reimbursements(status);

-- =====================================================
-- DEFAULT SALARY COMPONENTS (India Standard)
-- =====================================================

INSERT INTO public.salary_components (name, code, type, category, calculation_type, is_taxable, is_statutory, affects_pf, description) VALUES
-- Earnings
('Basic Salary', 'BASIC', 'earning', 'basic', 'fixed', true, false, true, 'Base salary component'),
('House Rent Allowance', 'HRA', 'earning', 'allowance', 'percentage', true, false, false, 'Housing allowance, usually 40-50% of basic'),
('Dearness Allowance', 'DA', 'earning', 'allowance', 'percentage', true, false, true, 'Cost of living adjustment'),
('Conveyance Allowance', 'CONV', 'earning', 'allowance', 'fixed', false, false, false, 'Transport allowance'),
('Medical Allowance', 'MED', 'earning', 'allowance', 'fixed', false, false, false, 'Medical expense allowance'),
('Special Allowance', 'SPECIAL', 'earning', 'allowance', 'fixed', true, false, false, 'Additional allowance'),
('Overtime Pay', 'OT', 'earning', 'overtime', 'formula', true, false, false, 'Overtime compensation'),
('Performance Bonus', 'BONUS', 'earning', 'bonus', 'fixed', true, false, false, 'Performance-based bonus'),

-- Deductions
('Provident Fund', 'PF', 'deduction', 'statutory_deduction', 'percentage', false, true, false, 'Employee PF contribution (12% of basic)'),
('Employee State Insurance', 'ESI', 'deduction', 'statutory_deduction', 'percentage', false, true, false, 'ESI contribution (0.75% of gross)'),
('Professional Tax', 'PT', 'deduction', 'statutory_deduction', 'fixed', false, true, false, 'State professional tax'),
('Income Tax (TDS)', 'TDS', 'deduction', 'tax', 'formula', false, true, false, 'Tax deducted at source'),
('Loan Deduction', 'LOAN', 'deduction', 'loan', 'fixed', false, false, false, 'Loan EMI deduction')
ON CONFLICT (code) DO NOTHING;

-- Update HRA to be percentage of Basic
UPDATE public.salary_components 
SET percentage_of = (SELECT id FROM public.salary_components WHERE code = 'BASIC'),
    percentage_value = 40.00
WHERE code = 'HRA';

-- Update DA to be percentage of Basic
UPDATE public.salary_components 
SET percentage_of = (SELECT id FROM public.salary_components WHERE code = 'BASIC'),
    percentage_value = 10.00
WHERE code = 'DA';

-- =====================================================
-- DEFAULT SALARY STRUCTURE
-- =====================================================

INSERT INTO public.salary_structures (name, code, description, grade_level, is_default) VALUES
('Standard Employee', 'STD-EMP', 'Standard salary structure for regular employees', 'L1-L3', true),
('Senior Employee', 'SNR-EMP', 'Salary structure for senior employees', 'L4-L6', false),
('Manager Level', 'MGR', 'Salary structure for managers', 'M1-M3', false)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Generate payslip number
CREATE OR REPLACE FUNCTION generate_payslip_number(period_id UUID, emp_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    period_name VARCHAR;
    seq_num INTEGER;
BEGIN
    SELECT name INTO period_name FROM public.payroll_periods WHERE id = period_id;
    SELECT COUNT(*) + 1 INTO seq_num FROM public.payslips WHERE payroll_period_id = period_id;
    RETURN 'PS-' || REPLACE(period_name, ' ', '-') || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Calculate working days in a period
CREATE OR REPLACE FUNCTION calculate_working_days(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
    total_days INTEGER := 0;
    curr_date DATE := start_date;
BEGIN
    WHILE curr_date <= end_date LOOP
        IF EXTRACT(DOW FROM curr_date) NOT IN (0, 6) THEN
            total_days := total_days + 1;
        END IF;
        curr_date := curr_date + 1;
    END LOOP;
    RETURN total_days;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate PF amount (12% of basic, capped at 15000 basic)
CREATE OR REPLACE FUNCTION calculate_pf(basic_salary DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN LEAST(basic_salary, 15000) * 0.12;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate ESI (0.75% of gross if gross <= 21000)
CREATE OR REPLACE FUNCTION calculate_esi(gross_salary DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF gross_salary <= 21000 THEN
        RETURN gross_salary * 0.0075;
    END IF;
    RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Professional tax slab (Karnataka example)
CREATE OR REPLACE FUNCTION calculate_professional_tax(monthly_salary DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF monthly_salary <= 15000 THEN
        RETURN 0;
    ELSIF monthly_salary <= 20000 THEN
        RETURN 150;
    ELSE
        RETURN 200;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
