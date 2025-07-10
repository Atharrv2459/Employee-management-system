import pool from "../db.js";
import { deductLeaveBalance } from "./leaveBalanceController.js";


export const getPendingLeavesForManager = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    // Step 1: Get manager_id
    const managerResult = await pool.query(
      `SELECT manager_id FROM managers WHERE user_id = $1`,
      [user_id]
    );

    if (managerResult.rows.length === 0) {
      return res.status(403).json({ msg: "You are not registered as a manager." });
    }

    const manager_id = managerResult.rows[0].manager_id;

    // Step 2: Get pending leaves along with employee info (if available)
    const leavesResult = await pool.query(
      `SELECT l.*, e.first_name AS emp_first, e.last_name AS emp_last
       FROM leaves l
       LEFT JOIN employees e ON l.user_id = e.user_id
       WHERE l.manager_id = $1 AND l.status = 'pending'
       ORDER BY l.created_at DESC`,
      [manager_id]
    );

    const leavesWithNames = await Promise.all(
      leavesResult.rows.map(async (leave) => {
        let first_name = leave.emp_first;
        let last_name = leave.emp_last;

        // Step 3: If employee name not found, check managers table
        if (!first_name) {
          const mgrRes = await pool.query(
            `SELECT first_name, last_name FROM managers WHERE user_id = $1`,
            [leave.user_id]
          );

          if (mgrRes.rows.length > 0) {
            first_name = mgrRes.rows[0].first_name;
            last_name = mgrRes.rows[0].last_name;
          }
        }

        return {
          ...leave,
          first_name: first_name || "Unknown",
          last_name: last_name || "User"
        };
      })
    );

    res.status(200).json({ data: leavesWithNames });

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
    const manager = await pool.query(`SELECT manager_id FROM managers WHERE user_id = $1`, [user_id]);
    if (manager.rows.length === 0) return res.status(403).json({ message: "Not authorized" });

    const manager_id = manager.rows[0].manager_id;

    const result = await pool.query(
      `UPDATE leaves SET status = $1 WHERE id = $2 AND manager_id = $3 AND status = 'pending' RETURNING *`,
      [status, id, manager_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Leave not found or already processed" });

    const leave = result.rows[0];

    if (status === 'approved') {
      const daysRequested = (new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24) + 1;
      await deductLeaveBalance(leave.user_id, leave.leave_type, daysRequested);  // 👈 using user_id now
    }

    res.status(200).json({ message: `Leave ${status}`, data: leave });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

