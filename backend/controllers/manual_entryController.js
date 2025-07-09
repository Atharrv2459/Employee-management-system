import pool from "../db.js";

export const createManualEntry = async (req, res) => {
  const user_id = req.user.user_id;
  const {
    entry_type,
    entry_time,
    date,
    work_location,
    project_code,
    reason_type,
    explanation,
  } = req.body;

  try {
    const emp = await pool.query(
      `SELECT employee_id FROM employees WHERE user_id = $1`,
      [user_id]
    );

    if (emp.rows.length === 0)
      return res.status(404).json({ message: "Employee not found" });

    const employee_id = emp.rows[0].employee_id;

    const result = await pool.query(
      `INSERT INTO manual_entries 
        (employee_id, entry_type, entry_time, date, work_location, project_code, reason_type, explanation) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
      [employee_id, entry_type, entry_time, date, work_location, project_code, reason_type, explanation]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getManualEntries = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const emp = await pool.query(
      `SELECT employee_id FROM employees WHERE user_id = $1`,
      [user_id]
    );

    if (emp.rows.length === 0)
      return res.status(404).json({ message: "Employee not found" });

    const result = await pool.query(
      `SELECT * FROM manual_entries WHERE employee_id = $1 ORDER BY created_at DESC`,
      [emp.rows[0].employee_id]
    );

    res.status(200).json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitManualEntry = async (req, res) => {
  const user_id = req.user.user_id;
  const { id } = req.params;

  try {
    // Get employee record
    const empResult = await pool.query(
      `SELECT employee_id, manager_id FROM employees WHERE user_id = $1`,
      [user_id]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee_id = empResult.rows[0].employee_id;
    const approval_manager_id = empResult.rows[0].manager_id;  // This is the actual manager_id (which is in managers table)

    // Submit manual entry
    const result = await pool.query(
      `UPDATE manual_entries 
       SET status = 'pending', approval_manager_id = $1, updated_at = NOW()
       WHERE manual_id = $2 AND employee_id = $3
       RETURNING *`,
      [approval_manager_id, id, employee_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Manual entry not found or unauthorized" });
    }

    res.json({ message: "Submitted for approval", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const approveManualEntry = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.user_id;

  try {
    const manager = await pool.query(
      `SELECT employee_id FROM employees WHERE user_id = $1`,
      [user_id]
    );

    if (manager.rows.length === 0)
      return res.status(403).json({ message: "Not a valid manager" });

    const manager_id = manager.rows[0].employee_id;

    const result = await pool.query(
      `UPDATE manual_entries 
       SET status = 'approved', updated_at = NOW() 
       WHERE manual_id = $1 AND approval_manager_id = $2 
       RETURNING *`,
      [id, manager_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Entry not found or unauthorized" });
    }

    res.json({ message: "Entry approved", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectManualEntry = async (req, res) => {
  const user_id = req.user.user_id;
  const { id } = req.params;
  const { rejection_reason } = req.body;

  try {
    const manager = await pool.query(
      `SELECT employee_id FROM employees WHERE user_id = $1`,
      [user_id]
    );

    if (manager.rows.length === 0)
      return res.status(403).json({ message: "Not a valid manager" });

    const manager_id = manager.rows[0].employee_id;

    const result = await pool.query(
      `UPDATE manual_entries 
       SET status = 'rejected', rejection_reason = $1, updated_at = NOW() 
       WHERE manual_id = $2 AND approval_manager_id = $3 AND status = 'pending' 
       RETURNING *`,
      [rejection_reason, id, manager_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Entry not found or unauthorized" });
    }

    res.json({ message: "Entry rejected", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateManualEntry = async (req, res) => {
  const user_id = req.user.user_id;
  const { id } = req.params;
  const {
    entry_type,
    entry_time,
    date,
    work_location,
    project_code,
    reason_type,
    explanation,
  } = req.body;

  try {
    const emp = await pool.query(
      `SELECT employee_id FROM employees WHERE user_id = $1`,
      [user_id]
    );

    if (emp.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee_id = emp.rows[0].employee_id;

    const result = await pool.query(
      `UPDATE manual_entries 
       SET entry_type = $1, entry_time = $2, date = $3, work_location = $4, 
           project_code = $5, reason_type = $6, explanation = $7, updated_at = NOW()
       WHERE manual_id = $8 AND employee_id = $9 AND status = 'draft'
       RETURNING *`,
      [
        entry_type,
        entry_time,
        date,
        work_location,
        project_code,
        reason_type,
        explanation,
        id,
        employee_id,
      ]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Manual entry not found or cannot be updated" });
    }

    res.json({ message: "Manual entry updated", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const deleteManualEntry = async (req, res) => {
  const user_id = req.user.user_id;
  const { id } = req.params;

  try {
    const emp = await pool.query(
      `SELECT employee_id FROM employees WHERE user_id = $1`,
      [user_id]
    );

    if (emp.rows.length === 0)
      return res.status(404).json({ message: "Employee not found" });

    const employee_id = emp.rows[0].employee_id;

    const result = await pool.query(
      `DELETE FROM manual_entries 
       WHERE manual_id = $1 AND employee_id = $2 AND status = 'draft'
       RETURNING *`,
      [id, employee_id]
    );

    if (result.rows.length === 0)
      return res
        .status(404)
        .json({ message: "Entry not found or already submitted" });

    res.json({ message: "Manual entry deleted", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


