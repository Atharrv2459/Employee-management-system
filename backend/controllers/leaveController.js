import pool from "../db.js";
export const applyLeave = async (req, res) => {
  const user_id = req.user.user_id;
  const { leave_type, start_date, end_date, reason, work_handover, emergency_contact } = req.body;

  try {
    // Check if user is employee
    const employeeResult = await pool.query(
      `SELECT manager_id FROM employees WHERE user_id = $1`, [user_id]
    );

    // Check if user is manager
    const managerResult = await pool.query(
      `SELECT reporting_manager FROM managers WHERE user_id = $1`, [user_id]
    );

    let manager_id = null;

    if (employeeResult.rows.length > 0) {
      // ✅ User is an employee → use their manager_id from employees table
      manager_id = employeeResult.rows[0].manager_id;

    } else if (managerResult.rows.length > 0) {
      // ✅ User is a manager → use their reporting_manager from managers table
      manager_id = managerResult.rows[0].reporting_manager;

    } else {
      return res.status(404).json({ message: "No valid employee or manager profile found." });
    }

    // Check if manager_id is present
    if (!manager_id) {
      return res.status(400).json({ message: "No reporting manager assigned. Cannot apply for leave." });
    }

    // ✅ Insert using only user_id + manager_id (no employee_id)
    const result = await pool.query(`
      INSERT INTO leaves (user_id, manager_id, leave_type, start_date, end_date, reason, work_handover, emergency_contact)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user_id, manager_id, leave_type, start_date, end_date, reason, work_handover, emergency_contact]
    );

    res.status(201).json({ message: "Leave applied successfully", data: result.rows[0] });

  } catch (err) {
    console.error("Error applying leave:", err);
    res.status(500).json({ error: err.message });
  }
};




export const getOwnLeaves = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    

    const result = await pool.query(
      `select * from leaves where user_id = $1 ORDER BY created_at DESC`,
      [user_id]
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
    

    const result = await pool.query(
      `delete from leaves where id = $1 and user_id = $2 and status = 'pending' returning *`,
      [id, user_id]
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
  const { leave_type, start_date, end_date, reason, work_handover, emergency_contact } = req.body;

  try {

    const empResult = await pool.query(`SELECT manager_id FROM employees WHERE user_id = $1`, [user_id]);
    const mgrResult = await pool.query(`SELECT reporting_manager FROM managers WHERE user_id = $1`, [user_id]);

    let manager_id = null;

    if (empResult.rows.length > 0) {
      manager_id = empResult.rows[0].manager_id;
    } else if (mgrResult.rows.length > 0) {
      manager_id = mgrResult.rows[0].reporting_manager;
    } else {
      return res.status(404).json({ message: "No valid employee or manager profile found." });
    }

    if (!manager_id) {
      return res.status(400).json({ message: "No reporting manager assigned. Cannot update leave." });
    }

    const leaveCheck = await pool.query(
      `select * from leaves where id = $1 and user_id = $2 and status = 'pending'`,
      [id, user_id]
    );

    if (leaveCheck.rows.length === 0) {
      return res.status(404).json({ message: "Leave not found or already processed" });
    }

    const result = await pool.query(`
      update leaves set leave_type = $1, start_date = $2, end_date = $3, reason = $4, work_handover = $5, emergency_contact = $6, manager_id = $7, created_at = CURRENT_TIMESTAMP WHERE id = $ 
       returning *;
    `, [leave_type, start_date, end_date, reason, work_handover, emergency_contact, manager_id, id]);

    res.status(200).json({ message: "Leave request updated successfully", data: result.rows[0] });

  } catch (err) {
    console.error("Error updating leave:", err);
    res.status(500).json({ error: err.message });
  }
};




