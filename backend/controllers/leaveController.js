import pool from "../db.js";
export const applyLeave = async (req, res) => {
  const user_id = req.user.user_id;
  const { leave_type, start_date, end_date, reason } = req.body;

  try {
    const employee = await pool.query(`select employee_id from employees where user_id = $1`, [user_id]);
    if (employee.rows.length === 0) { res.status(404).json({ message: "Employee not found" });
  }
    const employee_id = employee.rows[0].employee_id;

    const result = await pool.query(`insert into leaves (employee_id, leave_type, start_date, end_date, reason)
      values ($1, $2, $3, $4, $5) returning *`,
      [employee_id, leave_type, start_date, end_date, reason]
    );

    res.status(201).json({ message: "Leave applied", data: result.rows[0] });
  } 
  catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getOwnLeaves = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const employee = await pool.query(`SELECT employee_id FROM employees WHERE user_id = $1`, [user_id]);
    if (employee.rows.length === 0) return res.status(404).json({ message: "Employee not found" });

    const result = await pool.query(
      `SELECT * FROM leaves WHERE employee_id = $1 ORDER BY created_at DESC`,
      [employee.rows[0].employee_id]
    );

    res.status(200).json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const cancelLeave = async (req, res) => {
  const user_id = req.user.user_id;
  const { id } = req.params;

  try {
    const employee = await pool.query(`SELECT employee_id FROM employees WHERE user_id = $1`, [user_id]);
    if (employee.rows.length === 0) return res.status(404).json({ message: "Employee not found" });

    const result = await pool.query(
      `delete from leaves where id = $1 and employee_id = $2 and status = 'pending' returning *`,
      [id, employee.rows[0].employee_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Leave not found or already processed" });
    }

    res.status(200).json({ message: "Leave request cancelled", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLeaveRequest = async (req, res) => {
  const user_id = req.user.user_id;
  const { id } = req.params;
  const { leave_type, start_date, end_date, reason } = req.body;

  try {
    // Get employee_id from user_id
    const employee = await pool.query(`SELECT employee_id FROM employees WHERE user_id = $1`, [user_id]);
    if (employee.rows.length === 0) return res.status(404).json({ msg: "Employee not found" });

    const employee_id = employee.rows[0].employee_id;

    // Check if leave exists and is pending
    const leave = await pool.query(
      `SELECT * FROM leaves WHERE id = $1 AND employee_id = $2 AND status = 'pending'`,
      [id, employee_id]
    );

    if (leave.rows.length === 0) {
      return res.status(400).json({ message: "Leave not found or already processed" });
    }

    const result = await pool.query(`
      UPDATE leaves SET
        leave_type = $1,
        start_date = $2,
        end_date = $3,
        reason = $4,
        created_at = CURRENT_TIMESTAMP
      WHERE id = $5 RETURNING *;
    `, [leave_type, start_date, end_date, reason, id]);

    res.status(200).json({ message: "Leave request updated", data: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

