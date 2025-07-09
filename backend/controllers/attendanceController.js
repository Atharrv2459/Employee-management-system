import pool from "../db.js";

// ✅ PUNCH IN
export const punchIn = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    // Check if user already punched in today
    const existing = await pool.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND punch_in::date = CURRENT_DATE`,
      [user_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Already punched in today" });
    }

    const result = await pool.query(
      `INSERT INTO attendance (user_id, punch_in) VALUES ($1, NOW()) RETURNING *`,
      [user_id]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ PUNCH OUT
export const punchOut = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    // Check if user already punched out today
    const existing = await pool.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND punch_out::date = CURRENT_DATE`,
      [user_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Already punched out today" });
    }

    // Update punch_out and duration
    const result = await pool.query(
      `UPDATE attendance 
       SET punch_out = NOW(), 
           attendance_duration = NOW() - punch_in 
       WHERE user_id = $1 AND punch_in::date = CURRENT_DATE 
       RETURNING *`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No punch-in found today" });
    }

    res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET MY ATTENDANCE HISTORY
export const getMyAttendance = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT * FROM attendance WHERE user_id = $1 ORDER BY punch_in DESC`,
      [user_id]
    );

    res.status(200).json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeamAttendanceForManager = async (req, res) => {
  const managerUserId = req.user.user_id;  // From token

  try {
    // 1. Get Manager's employee_id
    const managerEmp = await pool.query(
      `SELECT employee_id FROM employees WHERE user_id = $1`,
      [managerUserId]
    );

    if (managerEmp.rows.length === 0) {
      return res.status(404).json({ message: "Manager profile not found" });
    }

    const managerEmployeeId = managerEmp.rows[0].employee_id;

    // 2. Get all employees under this manager
    const teamResult = await pool.query(
      `SELECT e.employee_id, u.email, u.roll_no, u.user_id
       FROM employees e
       JOIN users u ON e.user_id = u.user_id
       WHERE e.manager_id = $1`,
      [managerEmployeeId]
    );

    if (teamResult.rows.length === 0) {
      return res.status(200).json({ message: "No team members found", data: [] });
    }

    const userIds = teamResult.rows.map(emp => emp.user_id);

    // 3. Get latest attendance per team member
    const attendanceResult = await pool.query(
      `SELECT a.*, u.email, u.roll_no
       FROM attendance a
       JOIN users u ON a.user_id = u.user_id
       WHERE a.user_id = ANY($1::uuid[])
       ORDER BY a.punch_in DESC`,
      [userIds]
    );

    const latestAttendance = {};
    attendanceResult.rows.forEach(record => {
      if (!latestAttendance[record.user_id]) {
        latestAttendance[record.user_id] = record;
      }
    });

    const attendanceArray = Object.values(latestAttendance);

    res.status(200).json({ data: attendanceArray });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
