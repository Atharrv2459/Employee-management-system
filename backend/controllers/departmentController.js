import pool from "../db.js";

// =====================================================
// DEPARTMENT CRUD OPERATIONS
// =====================================================

// Create department
export const createDepartment = async (req, res) => {
  try {
    const { name, code, description, parent_id, head_user_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Department name is required" });
    }

    const result = await pool.query(
      `INSERT INTO departments (name, code, description, parent_id, head_user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, code || null, description || null, parent_id || null, head_user_id || null]
    );

    res.status(201).json({
      message: "Department created successfully",
      department: result.rows[0],
    });
  } catch (error) {
    console.error("Create department error:", error);
    if (error.code === "23505") {
      return res.status(400).json({ error: "Department code already exists" });
    }
    res.status(500).json({ error: "Failed to create department" });
  }
};

// Get all departments
export const getAllDepartments = async (req, res) => {
  try {
    const { include_inactive } = req.query;

    let query = `
      SELECT d.*, 
             p.name as parent_name,
             u.email as head_email,
             e.first_name as head_first_name,
             e.last_name as head_last_name
      FROM departments d
      LEFT JOIN departments p ON d.parent_id = p.id
      LEFT JOIN users u ON d.head_user_id = u.user_id
      LEFT JOIN employees e ON d.head_user_id = e.user_id
    `;

    if (!include_inactive) {
      query += ` WHERE d.is_active = true`;
    }

    query += ` ORDER BY d.name`;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
};

// Get department by ID
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT d.*, 
              p.name as parent_name,
              u.email as head_email,
              e.first_name as head_first_name,
              e.last_name as head_last_name
       FROM departments d
       LEFT JOIN departments p ON d.parent_id = p.id
       LEFT JOIN users u ON d.head_user_id = u.user_id
       LEFT JOIN employees e ON d.head_user_id = e.user_id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get department error:", error);
    res.status(500).json({ error: "Failed to fetch department" });
  }
};

// Get department hierarchy (org chart)
export const getDepartmentHierarchy = async (req, res) => {
  try {
    const result = await pool.query(`
      WITH RECURSIVE dept_tree AS (
        SELECT id, name, code, parent_id, head_user_id, 0 as level
        FROM departments
        WHERE parent_id IS NULL AND is_active = true
        
        UNION ALL
        
        SELECT d.id, d.name, d.code, d.parent_id, d.head_user_id, dt.level + 1
        FROM departments d
        INNER JOIN dept_tree dt ON d.parent_id = dt.id
        WHERE d.is_active = true
      )
      SELECT dt.*, 
             e.first_name as head_first_name,
             e.last_name as head_last_name,
             (SELECT COUNT(*) FROM employees WHERE department_id = dt.id) as employee_count
      FROM dept_tree dt
      LEFT JOIN employees e ON dt.head_user_id = e.user_id
      ORDER BY level, name
    `);

    // Build tree structure
    const departments = result.rows;
    const tree = buildTree(departments);
    res.json(tree);
  } catch (error) {
    console.error("Get hierarchy error:", error);
    res.status(500).json({ error: "Failed to fetch department hierarchy" });
  }
};

// Helper to build tree structure
function buildTree(departments) {
  const map = new Map();
  const roots = [];

  departments.forEach((dept) => {
    map.set(dept.id, { ...dept, children: [] });
  });

  departments.forEach((dept) => {
    if (dept.parent_id && map.has(dept.parent_id)) {
      map.get(dept.parent_id).children.push(map.get(dept.id));
    } else if (!dept.parent_id) {
      roots.push(map.get(dept.id));
    }
  });

  return roots;
}

// Update department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, parent_id, head_user_id, is_active } = req.body;

    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const normalizeUuid = (v) => {
      if (v === undefined) return { present: false, value: null };
      if (v === null || v === "") return { present: true, value: null };
      const s = String(v).trim();
      if (!s) return { present: true, value: null };
      if (!UUID_RE.test(s)) return { present: true, invalid: true };
      return { present: true, value: s };
    };

    const parent = normalizeUuid(parent_id);
    const head = normalizeUuid(head_user_id);

    if (parent.invalid) return res.status(400).json({ error: "Invalid parent_id" });
    if (head.invalid) return res.status(400).json({ error: "Invalid head_user_id" });

    // Prevent circular reference (only when parent is provided and non-null)
    if (parent.present && parent.value && parent.value === id) {
      return res.status(400).json({ error: "Department cannot be its own parent" });
    }

    const sets = [];
    const values = [];
    let i = 1;

    if (name !== undefined) {
      sets.push(`name = $${i++}`);
      values.push(name);
    }
    if (code !== undefined) {
      sets.push(`code = $${i++}`);
      values.push(code);
    }
    if (description !== undefined) {
      sets.push(`description = $${i++}`);
      values.push(description);
    }
    if (parent.present) {
      sets.push(`parent_id = $${i++}`);
      values.push(parent.value);
    }
    if (head.present) {
      sets.push(`head_user_id = $${i++}`);
      values.push(head.value);
    }
    if (is_active !== undefined) {
      sets.push(`is_active = $${i++}`);
      values.push(is_active);
    }

    if (!sets.length) {
      return res.status(400).json({ error: "No fields provided to update" });
    }

    sets.push("updated_at = CURRENT_TIMESTAMP");

    values.push(id);
    const result = await pool.query(
      `UPDATE departments SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json({
      message: "Department updated successfully",
      department: result.rows[0],
    });
  } catch (error) {
    console.error("Update department error:", error);
    res.status(500).json({ error: "Failed to update department" });
  }
};

// Delete department (soft delete)
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check for child departments
    const children = await pool.query(
      `SELECT id FROM departments WHERE parent_id = $1 AND is_active = true`,
      [id]
    );

    if (children.rows.length > 0) {
      return res.status(400).json({
        error: "Cannot delete department with active sub-departments",
      });
    }

    // Check for assigned employees
    const employees = await pool.query(
      `SELECT employee_id FROM employees WHERE department_id = $1`,
      [id]
    );

    if (employees.rows.length > 0) {
      return res.status(400).json({
        error: "Cannot delete department with assigned employees. Transfer employees first.",
      });
    }

    const result = await pool.query(
      `UPDATE departments SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Department not found" });
    }

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Delete department error:", error);
    res.status(500).json({ error: "Failed to delete department" });
  }
};

// Get employees in department
export const getDepartmentEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    const { include_subdepartments } = req.query;

    let query;
    let params;

    if (include_subdepartments === "true") {
      query = `
        WITH RECURSIVE dept_tree AS (
          SELECT id FROM departments WHERE id = $1
          UNION ALL
          SELECT d.id FROM departments d
          INNER JOIN dept_tree dt ON d.parent_id = dt.id
        )
        SELECT e.*, u.email, d.name as department_name
        FROM employees e
        JOIN users u ON e.user_id = u.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.department_id IN (SELECT id FROM dept_tree)
        ORDER BY e.first_name, e.last_name
      `;
      params = [id];
    } else {
      query = `
        SELECT e.*, u.email, d.name as department_name
        FROM employees e
        JOIN users u ON e.user_id = u.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.department_id = $1
        ORDER BY e.first_name, e.last_name
      `;
      params = [id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get department employees error:", error);
    res.status(500).json({ error: "Failed to fetch department employees" });
  }
};

// Transfer employee to another department
export const transferEmployee = async (req, res) => {
  try {
    const { user_id, to_department_id, reason } = req.body;
    const initiated_by = req.user.user_id;

    // Get current department
    const currentDept = await pool.query(
      `SELECT department_id FROM employees WHERE user_id = $1`,
      [user_id]
    );

    if (currentDept.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const from_department_id = currentDept.rows[0].department_id;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update employee department
      await client.query(
        `UPDATE employees SET department_id = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
        [to_department_id, user_id]
      );

      // Record transfer history
      await client.query(
        `INSERT INTO department_transfers (user_id, from_department_id, to_department_id, transfer_date, reason, initiated_by)
         VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)`,
        [user_id, from_department_id, to_department_id, reason, initiated_by]
      );

      await client.query("COMMIT");

      res.json({ message: "Employee transferred successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Transfer employee error:", error);
    res.status(500).json({ error: "Failed to transfer employee" });
  }
};

// Get transfer history for an employee
export const getTransferHistory = async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `SELECT dt.*,
              fd.name as from_department_name,
              td.name as to_department_name,
              e.first_name as initiated_by_first_name,
              e.last_name as initiated_by_last_name
       FROM department_transfers dt
       LEFT JOIN departments fd ON dt.from_department_id = fd.id
       LEFT JOIN departments td ON dt.to_department_id = td.id
       LEFT JOIN employees e ON dt.initiated_by = e.user_id
       WHERE dt.user_id = $1
       ORDER BY dt.transfer_date DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get transfer history error:", error);
    res.status(500).json({ error: "Failed to fetch transfer history" });
  }
};
