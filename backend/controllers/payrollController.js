import pool from "../db.js";

// =====================================================
// SALARY COMPONENTS
// =====================================================

// Get all salary components
export const getAllComponents = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sc.*, 
             ref.name as percentage_of_name,
             ref.code as percentage_of_code
      FROM salary_components sc
      LEFT JOIN salary_components ref ON sc.percentage_of = ref.id
      WHERE sc.is_active = true
      ORDER BY sc.type, sc.category, sc.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get components error:", error);
    res.status(500).json({ error: "Failed to fetch salary components" });
  }
};

// Create salary component
export const createComponent = async (req, res) => {
  const {
    name, code, type, category, calculation_type,
    percentage_of, percentage_value, is_taxable,
    is_statutory, affects_pf, affects_esi, description
  } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO salary_components 
      (name, code, type, category, calculation_type, percentage_of, 
       percentage_value, is_taxable, is_statutory, affects_pf, affects_esi, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [name, code, type, category, calculation_type, percentage_of,
        percentage_value, is_taxable, is_statutory, affects_pf, affects_esi, description]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create component error:", error);
    if (error.code === '23505') {
      return res.status(400).json({ error: "Component code already exists" });
    }
    res.status(500).json({ error: "Failed to create salary component" });
  }
};

// Update salary component
export const updateComponent = async (req, res) => {
  const { id } = req.params;
  const {
    name, type, category, calculation_type,
    percentage_of, percentage_value, is_taxable,
    is_statutory, affects_pf, affects_esi, description, is_active
  } = req.body;

  try {
    const result = await pool.query(`
      UPDATE salary_components SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        category = COALESCE($3, category),
        calculation_type = COALESCE($4, calculation_type),
        percentage_of = $5,
        percentage_value = $6,
        is_taxable = COALESCE($7, is_taxable),
        is_statutory = COALESCE($8, is_statutory),
        affects_pf = COALESCE($9, affects_pf),
        affects_esi = COALESCE($10, affects_esi),
        description = $11,
        is_active = COALESCE($12, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [name, type, category, calculation_type, percentage_of, percentage_value,
        is_taxable, is_statutory, affects_pf, affects_esi, description, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Component not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update component error:", error);
    res.status(500).json({ error: "Failed to update salary component" });
  }
};

// =====================================================
// SALARY STRUCTURES
// =====================================================

// Get all salary structures
export const getAllStructures = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ss.*,
             COUNT(ssc.id) as component_count
      FROM salary_structures ss
      LEFT JOIN salary_structure_components ssc ON ss.id = ssc.salary_structure_id
      WHERE ss.is_active = true
      GROUP BY ss.id
      ORDER BY ss.is_default DESC, ss.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get structures error:", error);
    res.status(500).json({ error: "Failed to fetch salary structures" });
  }
};

// Get structure with components
export const getStructureById = async (req, res) => {
  const { id } = req.params;
  try {
    const structure = await pool.query(`SELECT * FROM salary_structures WHERE id = $1`, [id]);
    if (structure.rows.length === 0) {
      return res.status(404).json({ error: "Structure not found" });
    }

    const components = await pool.query(`
      SELECT ssc.*, sc.name, sc.code, sc.type, sc.category, 
             sc.calculation_type, sc.is_taxable, sc.is_statutory
      FROM salary_structure_components ssc
      JOIN salary_components sc ON ssc.component_id = sc.id
      WHERE ssc.salary_structure_id = $1
      ORDER BY ssc.sequence_order
    `, [id]);

    res.json({
      ...structure.rows[0],
      components: components.rows
    });
  } catch (error) {
    console.error("Get structure error:", error);
    res.status(500).json({ error: "Failed to fetch salary structure" });
  }
};

// Create salary structure
export const createStructure = async (req, res) => {
  const { name, code, description, grade_level, is_default, components } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // If setting as default, unset other defaults
    if (is_default) {
      await client.query(`UPDATE salary_structures SET is_default = false`);
    }

    const result = await client.query(`
      INSERT INTO salary_structures (name, code, description, grade_level, is_default)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, code, description, grade_level, is_default || false]);

    const structureId = result.rows[0].id;

    // Add components if provided
    if (components && components.length > 0) {
      for (let i = 0; i < components.length; i++) {
        const comp = components[i];
        await client.query(`
          INSERT INTO salary_structure_components 
          (salary_structure_id, component_id, default_amount, percentage_value, is_mandatory, sequence_order)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [structureId, comp.component_id, comp.default_amount, comp.percentage_value, 
            comp.is_mandatory !== false, i]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Create structure error:", error);
    if (error.code === '23505') {
      return res.status(400).json({ error: "Structure code already exists" });
    }
    res.status(500).json({ error: "Failed to create salary structure" });
  } finally {
    client.release();
  }
};

// Update structure components
export const updateStructureComponents = async (req, res) => {
  const { id } = req.params;
  const { components } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Remove existing components
    await client.query(`DELETE FROM salary_structure_components WHERE salary_structure_id = $1`, [id]);

    // Add new components
    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      await client.query(`
        INSERT INTO salary_structure_components 
        (salary_structure_id, component_id, default_amount, percentage_value, is_mandatory, sequence_order)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, comp.component_id, comp.default_amount, comp.percentage_value,
          comp.is_mandatory !== false, i]);
    }

    await client.query('COMMIT');
    res.json({ message: "Structure components updated successfully" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Update structure components error:", error);
    res.status(500).json({ error: "Failed to update structure components" });
  } finally {
    client.release();
  }
};

// =====================================================
// EMPLOYEE SALARY
// =====================================================

// Get all employee salaries
export const getAllEmployeeSalaries = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT es.*,
             u.email,
             COALESCE(e.first_name, m.first_name) as first_name,
             COALESCE(e.last_name, m.last_name) as last_name,
             COALESCE(e.job_title, m.job_title) as job_title,
             ss.name as structure_name,
             d.name as department_name
      FROM employee_salaries es
      JOIN users u ON es.user_id = u.user_id
      LEFT JOIN employees e ON u.user_id = e.user_id
      LEFT JOIN managers m ON u.user_id = m.user_id
      LEFT JOIN salary_structures ss ON es.salary_structure_id = ss.id
      LEFT JOIN departments d ON COALESCE(e.department_id, m.department_id) = d.id
      WHERE es.is_active = true
      ORDER BY u.email
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get employee salaries error:", error);
    res.status(500).json({ error: "Failed to fetch employee salaries" });
  }
};

// Get employee salary by user ID
export const getEmployeeSalary = async (req, res) => {
  const { userId } = req.params;
  try {
    const salary = await pool.query(`
      SELECT es.*, ss.name as structure_name
      FROM employee_salaries es
      LEFT JOIN salary_structures ss ON es.salary_structure_id = ss.id
      WHERE es.user_id = $1 AND es.is_active = true
      ORDER BY es.effective_from DESC
      LIMIT 1
    `, [userId]);

    if (salary.rows.length === 0) {
      return res.status(404).json({ error: "No salary record found for this employee" });
    }

    const components = await pool.query(`
      SELECT esc.*, sc.name, sc.code, sc.type, sc.category, sc.is_taxable
      FROM employee_salary_components esc
      JOIN salary_components sc ON esc.component_id = sc.id
      WHERE esc.employee_salary_id = $1 AND esc.is_active = true
      ORDER BY sc.type, sc.category
    `, [salary.rows[0].id]);

    res.json({
      ...salary.rows[0],
      components: components.rows
    });
  } catch (error) {
    console.error("Get employee salary error:", error);
    res.status(500).json({ error: "Failed to fetch employee salary" });
  }
};

// Assign/Update employee salary
export const assignEmployeeSalary = async (req, res) => {
  const {
    user_id, salary_structure_id, base_salary, currency, pay_frequency,
    effective_from, bank_name, bank_account_number, bank_ifsc_code,
    pan_number, pf_number, esi_number, uan_number, components
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Deactivate existing salary record
    await client.query(`
      UPDATE employee_salaries 
      SET is_active = false, effective_to = $2, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_active = true
    `, [user_id, effective_from]);

    // Create new salary record
    const result = await client.query(`
      INSERT INTO employee_salaries 
      (user_id, salary_structure_id, base_salary, currency, pay_frequency,
       effective_from, bank_name, bank_account_number, bank_ifsc_code,
       pan_number, pf_number, esi_number, uan_number, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [user_id, salary_structure_id, base_salary, currency || 'INR', 
        pay_frequency || 'monthly', effective_from, bank_name, bank_account_number,
        bank_ifsc_code, pan_number, pf_number, esi_number, uan_number, req.user?.userId]);

    const salaryId = result.rows[0].id;

    // Add salary components
    if (components && components.length > 0) {
      for (const comp of components) {
        await client.query(`
          INSERT INTO employee_salary_components 
          (employee_salary_id, component_id, amount, percentage_value)
          VALUES ($1, $2, $3, $4)
        `, [salaryId, comp.component_id, comp.amount, comp.percentage_value]);
      }
    }

    // Create salary revision record
    const prevSalary = await client.query(`
      SELECT base_salary FROM employee_salaries 
      WHERE user_id = $1 AND id != $2
      ORDER BY effective_from DESC LIMIT 1
    `, [user_id, salaryId]);

    const prevAmount = prevSalary.rows[0]?.base_salary || 0;
    const percentChange = prevAmount > 0 ? ((base_salary - prevAmount) / prevAmount * 100) : null;

    await client.query(`
      INSERT INTO salary_revisions 
      (user_id, previous_salary, new_salary, revision_type, percentage_change, effective_date, status, approved_by, approved_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'applied', $7, CURRENT_TIMESTAMP)
    `, [user_id, prevAmount || null, base_salary, prevAmount ? 'increment' : 'initial', 
        percentChange, effective_from, req.user?.userId]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Assign salary error:", error);
    res.status(500).json({ error: "Failed to assign employee salary" });
  } finally {
    client.release();
  }
};

// =====================================================
// PAYROLL PERIODS
// =====================================================

// Get all payroll periods
export const getAllPayrollPeriods = async (req, res) => {
  const { year } = req.query;
  try {
    let query = `
      SELECT * FROM payroll_periods 
      ORDER BY period_start DESC
    `;
    let params = [];

    if (year) {
      query = `
        SELECT * FROM payroll_periods 
        WHERE EXTRACT(YEAR FROM period_start) = $1
        ORDER BY period_start DESC
      `;
      params = [year];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get payroll periods error:", error);
    res.status(500).json({ error: "Failed to fetch payroll periods" });
  }
};

// Create payroll period
export const createPayrollPeriod = async (req, res) => {
  const { name, period_start, period_end, pay_date } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO payroll_periods (name, period_start, period_end, pay_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, period_start, period_end, pay_date]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create payroll period error:", error);
    if (error.code === '23505') {
      return res.status(400).json({ error: "Payroll period already exists for these dates" });
    }
    res.status(500).json({ error: "Failed to create payroll period" });
  }
};

// =====================================================
// PAYROLL PROCESSING
// =====================================================

// Process payroll for a period
export const processPayroll = async (req, res) => {
  const { periodId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get period info
    const period = await client.query(`SELECT * FROM payroll_periods WHERE id = $1`, [periodId]);
    if (period.rows.length === 0) {
      return res.status(404).json({ error: "Payroll period not found" });
    }

    if (period.rows[0].status === 'completed') {
      return res.status(400).json({ error: "Payroll already processed for this period" });
    }

    // Update period status
    await client.query(`
      UPDATE payroll_periods SET status = 'processing', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [periodId]);

    // Get all active employee salaries
    const employees = await client.query(`
      SELECT es.*, u.email,
             COALESCE(e.first_name, m.first_name) as first_name,
             COALESCE(e.last_name, m.last_name) as last_name
      FROM employee_salaries es
      JOIN users u ON es.user_id = u.user_id
      LEFT JOIN employees e ON u.user_id = e.user_id
      LEFT JOIN managers m ON u.user_id = m.user_id
      WHERE es.is_active = true
        AND es.effective_from <= $1
    `, [period.rows[0].period_end]);

    let totalGross = 0, totalDeductions = 0, totalNet = 0;
    const payslips = [];

    for (const emp of employees.rows) {
      // Get employee salary components
      const components = await client.query(`
        SELECT esc.*, sc.name, sc.code, sc.type, sc.category, sc.is_taxable
        FROM employee_salary_components esc
        JOIN salary_components sc ON esc.component_id = sc.id
        WHERE esc.employee_salary_id = $1 AND esc.is_active = true
      `, [emp.id]);

      // Calculate attendance
      const attendance = await client.query(`
        SELECT COUNT(*) as days_worked
        FROM attendance
        WHERE user_id = $1 
          AND date BETWEEN $2 AND $3
          AND status = 'present'
      `, [emp.user_id, period.rows[0].period_start, period.rows[0].period_end]);

      const leaves = await client.query(`
        SELECT COALESCE(SUM(
          CASE WHEN end_date > $3 THEN $3 ELSE end_date END -
          CASE WHEN start_date < $2 THEN $2 ELSE start_date END + 1
        ), 0) as leave_days
        FROM leaves
        WHERE employee_id = $1 
          AND status = 'approved'
          AND start_date <= $3
          AND end_date >= $2
      `, [emp.user_id, period.rows[0].period_start, period.rows[0].period_end]);

      const workingDays = calculateWorkingDays(
        new Date(period.rows[0].period_start), 
        new Date(period.rows[0].period_end)
      );

      const daysWorked = parseInt(attendance.rows[0].days_worked) || 0;
      const leavesTaken = parseFloat(leaves.rows[0].leave_days) || 0;
      const daysAbsent = Math.max(0, workingDays - daysWorked - leavesTaken);

      // Calculate earnings and deductions
      let totalEarnings = 0;
      let deductions = 0;
      const lineItems = [];

      // Process earnings
      for (const comp of components.rows.filter(c => c.type === 'earning')) {
        const amount = parseFloat(comp.amount) || 0;
        totalEarnings += amount;
        lineItems.push({
          component_id: comp.component_id,
          description: comp.name,
          type: 'earning',
          amount: amount,
          is_taxable: comp.is_taxable
        });
      }

      // Pro-rate based on attendance
      const attendanceRatio = workingDays > 0 ? (daysWorked + leavesTaken) / workingDays : 1;
      const proRatedEarnings = totalEarnings * attendanceRatio;

      // Calculate statutory deductions
      const basicSalary = components.rows.find(c => c.code === 'BASIC')?.amount || emp.base_salary * 0.5;
      
      // PF (12% of basic, capped at 15000)
      const pfAmount = Math.min(basicSalary, 15000) * 0.12;
      if (pfAmount > 0) {
        deductions += pfAmount;
        lineItems.push({
          component_id: components.rows.find(c => c.code === 'PF')?.component_id,
          description: 'Provident Fund',
          type: 'deduction',
          amount: pfAmount,
          is_taxable: false
        });
      }

      // ESI (0.75% if gross <= 21000)
      if (proRatedEarnings <= 21000) {
        const esiAmount = proRatedEarnings * 0.0075;
        deductions += esiAmount;
        lineItems.push({
          component_id: components.rows.find(c => c.code === 'ESI')?.component_id,
          description: 'Employee State Insurance',
          type: 'deduction',
          amount: esiAmount,
          is_taxable: false
        });
      }

      // Professional Tax
      const ptAmount = calculateProfessionalTax(proRatedEarnings);
      if (ptAmount > 0) {
        deductions += ptAmount;
        lineItems.push({
          component_id: components.rows.find(c => c.code === 'PT')?.component_id,
          description: 'Professional Tax',
          type: 'deduction',
          amount: ptAmount,
          is_taxable: false
        });
      }

      // Process other deductions
      for (const comp of components.rows.filter(c => c.type === 'deduction' && !['PF', 'ESI', 'PT'].includes(c.code))) {
        const amount = parseFloat(comp.amount) || 0;
        deductions += amount;
        lineItems.push({
          component_id: comp.component_id,
          description: comp.name,
          type: 'deduction',
          amount: amount,
          is_taxable: false
        });
      }

      // Check for loan deductions
      const activeLoans = await client.query(`
        SELECT * FROM employee_loans
        WHERE user_id = $1 AND status = 'active'
      `, [emp.user_id]);

      for (const loan of activeLoans.rows) {
        deductions += parseFloat(loan.emi_amount);
        lineItems.push({
          component_id: null,
          description: `${loan.loan_type} EMI`,
          type: 'deduction',
          amount: loan.emi_amount,
          is_taxable: false
        });
      }

      const netSalary = proRatedEarnings - deductions;

      // Generate payslip number
      const payslipNumber = `PS-${period.rows[0].name.replace(/\s/g, '-')}-${String(payslips.length + 1).padStart(4, '0')}`;

      // Insert payslip
      const payslip = await client.query(`
        INSERT INTO payslips 
        (payroll_period_id, user_id, employee_salary_id, payslip_number,
         working_days, days_worked, days_absent, leaves_taken,
         gross_salary, total_earnings, total_deductions, net_salary,
         employee_pf, professional_tax, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'generated')
        RETURNING *
      `, [periodId, emp.user_id, emp.id, payslipNumber,
          workingDays, daysWorked, daysAbsent, leavesTaken,
          totalEarnings, proRatedEarnings, deductions, netSalary,
          pfAmount, ptAmount]);

      // Insert line items
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        await client.query(`
          INSERT INTO payslip_line_items 
          (payslip_id, component_id, description, type, amount, is_taxable, sequence_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [payslip.rows[0].id, item.component_id, item.description, 
            item.type, item.amount, item.is_taxable, i]);
      }

      // Update loan repayments
      for (const loan of activeLoans.rows) {
        const newPaid = parseFloat(loan.amount_paid) + parseFloat(loan.emi_amount);
        const newRemaining = parseFloat(loan.total_amount) - newPaid;
        const newInstallments = loan.installments_paid + 1;

        await client.query(`
          INSERT INTO loan_repayments 
          (loan_id, payslip_id, amount, payment_date, installment_number)
          VALUES ($1, $2, $3, $4, $5)
        `, [loan.id, payslip.rows[0].id, loan.emi_amount, 
            period.rows[0].pay_date || period.rows[0].period_end, newInstallments]);

        const newStatus = newRemaining <= 0 ? 'completed' : 'active';
        await client.query(`
          UPDATE employee_loans SET 
            amount_paid = $1, amount_remaining = $2, 
            installments_paid = $3, status = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [newPaid, Math.max(0, newRemaining), newInstallments, newStatus, loan.id]);
      }

      payslips.push(payslip.rows[0]);
      totalGross += proRatedEarnings;
      totalDeductions += deductions;
      totalNet += netSalary;
    }

    // Update period totals
    await client.query(`
      UPDATE payroll_periods SET 
        status = 'completed',
        total_employees = $1,
        total_gross_pay = $2,
        total_deductions = $3,
        total_net_pay = $4,
        processed_by = $5,
        processed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [payslips.length, totalGross, totalDeductions, totalNet, req.user?.userId, periodId]);

    await client.query('COMMIT');

    res.json({
      message: "Payroll processed successfully",
      summary: {
        employees_processed: payslips.length,
        total_gross: totalGross,
        total_deductions: totalDeductions,
        total_net: totalNet
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Process payroll error:", error);
    res.status(500).json({ error: "Failed to process payroll" });
  } finally {
    client.release();
  }
};

// =====================================================
// PAYSLIPS
// =====================================================

// Get payslips for a period
export const getPayslipsByPeriod = async (req, res) => {
  const { periodId } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.*,
             u.email,
             COALESCE(e.first_name, m.first_name) as first_name,
             COALESCE(e.last_name, m.last_name) as last_name,
             d.name as department_name
      FROM payslips p
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN employees e ON u.user_id = e.user_id
      LEFT JOIN managers m ON u.user_id = m.user_id
      LEFT JOIN departments d ON COALESCE(e.department_id, m.department_id) = d.id
      WHERE p.payroll_period_id = $1
      ORDER BY u.email
    `, [periodId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Get payslips error:", error);
    res.status(500).json({ error: "Failed to fetch payslips" });
  }
};

// Get payslip details
export const getPayslipDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const payslip = await pool.query(`
      SELECT p.*,
             pp.name as period_name, pp.period_start, pp.period_end, pp.pay_date,
             u.email,
             COALESCE(e.first_name, m.first_name) as first_name,
             COALESCE(e.last_name, m.last_name) as last_name,
             COALESCE(e.job_title, m.job_title) as job_title,
             d.name as department_name,
             es.bank_name, es.bank_account_number, es.pan_number, es.pf_number
      FROM payslips p
      JOIN payroll_periods pp ON p.payroll_period_id = pp.id
      JOIN users u ON p.user_id = u.user_id
      LEFT JOIN employees e ON u.user_id = e.user_id
      LEFT JOIN managers m ON u.user_id = m.user_id
      LEFT JOIN departments d ON COALESCE(e.department_id, m.department_id) = d.id
      LEFT JOIN employee_salaries es ON p.employee_salary_id = es.id
      WHERE p.id = $1
    `, [id]);

    if (payslip.rows.length === 0) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    const lineItems = await pool.query(`
      SELECT * FROM payslip_line_items
      WHERE payslip_id = $1
      ORDER BY type DESC, sequence_order
    `, [id]);

    res.json({
      ...payslip.rows[0],
      line_items: lineItems.rows
    });
  } catch (error) {
    console.error("Get payslip details error:", error);
    res.status(500).json({ error: "Failed to fetch payslip details" });
  }
};

// Get my payslips (employee view)
export const getMyPayslips = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(`
      SELECT p.*, pp.name as period_name, pp.period_start, pp.period_end
      FROM payslips p
      JOIN payroll_periods pp ON p.payroll_period_id = pp.id
      WHERE p.user_id = $1
      ORDER BY pp.period_start DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Get my payslips error:", error);
    res.status(500).json({ error: "Failed to fetch payslips" });
  }
};

// =====================================================
// LOANS
// =====================================================

// Get all loans (admin)
export const getAllLoans = async (req, res) => {
  const { status } = req.query;
  try {
    let query = `
      SELECT el.*,
             u.email,
             COALESCE(e.first_name, m.first_name) as first_name,
             COALESCE(e.last_name, m.last_name) as last_name
      FROM employee_loans el
      JOIN users u ON el.user_id = u.user_id
      LEFT JOIN employees e ON u.user_id = e.user_id
      LEFT JOIN managers m ON u.user_id = m.user_id
    `;
    let params = [];

    if (status) {
      query += ` WHERE el.status = $1`;
      params = [status];
    }

    query += ` ORDER BY el.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get loans error:", error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
};

// Apply for loan
export const applyForLoan = async (req, res) => {
  const userId = req.user.userId;
  const { loan_type, principal_amount, tenure_months, reason } = req.body;

  try {
    const total = parseFloat(principal_amount); // No interest for salary advance
    const emi = total / tenure_months;

    const result = await pool.query(`
      INSERT INTO employee_loans 
      (user_id, loan_type, principal_amount, total_amount, emi_amount, 
       tenure_months, amount_remaining, reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [userId, loan_type, principal_amount, total, emi, tenure_months, total, reason]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Apply loan error:", error);
    res.status(500).json({ error: "Failed to apply for loan" });
  }
};

// Approve/Reject loan
export const updateLoanStatus = async (req, res) => {
  const { id } = req.params;
  const { status, disbursement_date, start_deduction_date } = req.body;

  try {
    const result = await pool.query(`
      UPDATE employee_loans SET
        status = $1,
        disbursement_date = $2,
        start_deduction_date = $3,
        approved_by = $4,
        approved_at = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [status, disbursement_date, start_deduction_date, req.user?.userId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update loan status error:", error);
    res.status(500).json({ error: "Failed to update loan status" });
  }
};

// =====================================================
// REIMBURSEMENTS
// =====================================================

// Get reimbursements
export const getReimbursements = async (req, res) => {
  const { status, userId } = req.query;
  try {
    let query = `
      SELECT r.*,
             u.email,
             COALESCE(e.first_name, m.first_name) as first_name,
             COALESCE(e.last_name, m.last_name) as last_name
      FROM reimbursements r
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN employees e ON u.user_id = e.user_id
      LEFT JOIN managers m ON u.user_id = m.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
    }

    if (userId) {
      paramCount++;
      query += ` AND r.user_id = $${paramCount}`;
      params.push(userId);
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get reimbursements error:", error);
    res.status(500).json({ error: "Failed to fetch reimbursements" });
  }
};

// Submit reimbursement
export const submitReimbursement = async (req, res) => {
  const userId = req.user.userId;
  const { category, description, amount, expense_date, receipt_path } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO reimbursements 
      (user_id, category, description, amount, expense_date, receipt_path)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, category, description, amount, expense_date, receipt_path]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Submit reimbursement error:", error);
    res.status(500).json({ error: "Failed to submit reimbursement" });
  }
};

// Approve/Reject reimbursement
export const updateReimbursementStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rejection_reason } = req.body;

  try {
    const result = await pool.query(`
      UPDATE reimbursements SET
        status = $1,
        rejection_reason = $2,
        approved_by = CASE WHEN $1 = 'approved' THEN $3 ELSE approved_by END,
        approved_at = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [status, rejection_reason, req.user?.userId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Reimbursement not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update reimbursement status error:", error);
    res.status(500).json({ error: "Failed to update reimbursement status" });
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function calculateWorkingDays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function calculateProfessionalTax(monthlySalary) {
  if (monthlySalary <= 15000) return 0;
  if (monthlySalary <= 20000) return 150;
  return 200;
}
