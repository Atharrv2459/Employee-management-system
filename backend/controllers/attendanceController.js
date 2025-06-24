import pool from "../db.js";

export const punchIn = async (req, res) => {
  const user_id = req.user.user_id;

  try {

    const employee = await pool.query(`select employee_id from employees where user_id = $1`, [user_id]);
    console.log("Employee result:", employee.rows);

    if (employee.rows.length === 0) { res.status(404).json({ message: "Employee not found" });
  }
    const employee_id = employee.rows[0].employee_id;
    const existing = await pool.query(
      `select * from attendance where employee_id = $1 and punch_in::date = CURRENT_DATE`,
      [employee_id]
    );
    if (existing.rows.length > 0) return res.status(400).json({ message: "Already punched in today" });

    const result = await pool.query(
      `INSERT INTO attendance (employee_id, punch_in) VALUES ($1, NOW()) RETURNING *`,
      [employee_id]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const punchOut = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const employee = await pool.query(`select employee_id from employees where user_id = $1`, [user_id]);
    if (employee.rows.length === 0) return res.status(404).json({ message: "Employee not found" });

    const employee_id = employee.rows[0].employee_id;

    const result = await pool.query(
      `update attendance set punch_out = NOW(), attendance_duration = NOW() - punch_in where employee_id = $1 and punch_in::date = CURRENT_DATE 
       returning *`,
      [employee_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "No punch-in found today" });

    res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getMyAttendance = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const employee = await pool.query(`SELECT employee_id FROM employees WHERE user_id = $1`, [user_id]);
    if (employee.rows.length === 0) return res.status(404).json({ message: "Employee not found" });

    const result = await pool.query(
      `select * from attendance WHERE employee_id = $1 ORDER BY punch_in DESC`,
      [employee.rows[0].employee_id]
    );

    res.status(200).json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
