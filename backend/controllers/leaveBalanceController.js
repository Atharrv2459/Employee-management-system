import pool from "../db.js";

// GET Leave Balances
export const getLeaveBalances = async (req, res) => {
    console.log("User from token:", req.user); 
  const user_id = req.user.user_id;

  try {
  
    const emp = await pool.query(`SELECT employee_id FROM employees WHERE user_id = $1`, [user_id]);
    if (emp.rows.length === 0) return res.status(404).json({ message: "Employee not found" });

    const employee_id = emp.rows[0].employee_id;

    const result = await pool.query(`SELECT * FROM leave_balance WHERE employee_id = $1`, [employee_id]);
    res.status(200).json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Deduct leaves on approval
export const deductLeaveBalance = async (employee_id, leave_type, days) => {
  await pool.query(
    `UPDATE leave_balance SET used_leaves = used_leaves + $1 WHERE employee_id = $2 AND leave_type = $3`,
    [days, employee_id, leave_type]
  );
};

// Seed default leave balance (optional)
export const createDefaultLeaveBalance = async (employee_id) => {
  const leaveTypes = [
    { type: "annual", total: 25 },
    { type: "sick", total: 10 },
    { type: "personal", total: 5 },
    { type: "maternity", total: 90 },
  ];

  const promises = leaveTypes.map((leave) =>
    pool.query(
      `INSERT INTO leave_balance (employee_id, leave_type, total_leaves, used_leaves, next_accrual, expiry_date)
       VALUES ($1, $2, $3, 0, NOW() + interval '1 year', NOW() + interval '1 year')`,
      [employee_id, leave.type, leave.total]
    )
  );

  await Promise.all(promises);
};
