import pool from "../db.js";
export const getPendingLeavesForManager = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const manager = await pool.query(
      `select manager_id from managers where user_id = $1`,
      [user_id]
    );

    if (manager.rows.length === 0) {
      return res.status(403).json({ msg: "You are not registered as a manager." });
    }

    const manager_id = manager.rows[0].manager_id;

    const result = await pool.query(
      `SELECT l.*, e.first_name, e.last_name FROM leaves l
       JOIN employees e ON l.employee_id = e.employee_id
       WHERE e.manager_id = $1 AND l.status = 'pending'
       ORDER BY l.created_at DESC`,
      [manager_id]
    );

    res.status(200).json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLeaveStatus = async (req, res) => {
  const user_id = req.user.user_id;
  const { id } = req.params; 
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const manager = await pool.query(
      `SELECT manager_id FROM managers WHERE user_id = $1`,
      [user_id]
    );

    if (manager.rows.length === 0) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const manager_id = manager.rows[0].manager_id;
    const result = await pool.query(
      `UPDATE leaves SET status = $1
       WHERE id = $2
       AND employee_id IN (
         SELECT employee_id FROM employees WHERE manager_id = $3
       )
       AND status = 'pending'
       RETURNING *`,
      [status, id, manager_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Leave not found or already processed" });
    }

    res.status(200).json({ message: `Leave ${status}`, data: result.rows[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
