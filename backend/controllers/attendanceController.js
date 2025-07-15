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


export const getRealTimeStatusForTeam = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const empRes = await pool.query(`SELECT employee_id FROM employees WHERE user_id = $1`, [user_id]);
    if (empRes.rows.length === 0) return res.status(404).json({ message: "Manager not found" });

    const manager_employee_id = empRes.rows[0].employee_id;

    const teamRes = await pool.query(`
      SELECT e.user_id, e.first_name, e.last_name, u.email
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      WHERE e.manager_id = $1
    `, [manager_employee_id]);

    const team = teamRes.rows;
    const userIds = team.map(emp => emp.user_id);

    const attendanceRes = await pool.query(`
      SELECT * FROM attendance 
      WHERE user_id = ANY($1::uuid[]) 
      AND punch_in::date = CURRENT_DATE
    `, [userIds]);

    const leaveRes = await pool.query(`
      SELECT * FROM leaves
      WHERE user_id = ANY($1::uuid[])
      AND status = 'approved'
      AND CURRENT_DATE BETWEEN start_date AND end_date
    `, [userIds]);

    const attendanceMap = {};
    attendanceRes.rows.forEach(row => {
      attendanceMap[row.user_id] = row;
    });

    const leaveMap = {};
    leaveRes.rows.forEach(row => {
      leaveMap[row.user_id] = row;
    });

    const result = team.map(emp => {
      const att = attendanceMap[emp.user_id];
      const leave = leaveMap[emp.user_id];

      let status = "Absent";
      let time = "Not punched in";

      if (leave) {
        status = "On Leave";
        time = "On approved leave";
      } else if (att) {
        status = "Present";
        time = "Working currently";
      }

      return {
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        status,
        time
      };
    });

    res.status(200).json({ data: result });

  } catch (err) {
    console.error("Error fetching real-time status:", err.message);
    res.status(500).json({ error: err.message });
  }
};


export const getTeamAttendanceForManagerNew = async (req, res) => {
  const managerUserId = req.user.user_id;  // From token

  try {
    // 🔁 Use manager_id from MANAGERS table
    const managerRes = await pool.query(
      `SELECT manager_id FROM managers WHERE user_id = $1`,
      [managerUserId]
    );

    if (managerRes.rows.length === 0) {
      return res.status(404).json({ message: "Manager profile not found" });
    }

    const manager_id = managerRes.rows[0].manager_id;

    // 🔁 Get employees under this manager
    const teamRes = await pool.query(
      `SELECT e.employee_id, e.first_name, e.last_name, e.user_id, u.email
       FROM employees e
       JOIN users u ON e.user_id = u.user_id
       WHERE e.manager_id = $1`,
      [manager_id]
    );

    if (teamRes.rows.length === 0) {
      return res.status(200).json({ message: "No team members found", data: [] });
    }

    const userIds = teamRes.rows.map(emp => emp.user_id);

    // 🟢 Fetch today's attendance
    const attendanceRes = await pool.query(
      `SELECT a.*, u.email
       FROM attendance a
       JOIN users u ON a.user_id = u.user_id
       WHERE a.user_id = ANY($1::uuid[]) AND a.punch_in::date = CURRENT_DATE
       ORDER BY a.punch_in DESC`,
      [userIds]
    );

    const attendanceMap = {};
    attendanceRes.rows.forEach(record => {
      attendanceMap[record.user_id] = {
        ...record,
        status: 'Present',
      };
    });

    // 🟡 Fetch approved leave today
    const leaveRes = await pool.query(
      `SELECT * FROM leaves 
       WHERE user_id = ANY($1::uuid[]) 
       AND status = 'approved' 
       AND CURRENT_DATE BETWEEN start_date AND end_date`,
      [userIds]
    );

    leaveRes.rows.forEach(record => {
      if (!attendanceMap[record.user_id]) {
        attendanceMap[record.user_id] = {
          ...record,
          status: 'On Leave',
        };
      }
    });

    // Final status for each employee
    const result = teamRes.rows.map(emp => {
      const record = attendanceMap[emp.user_id];
      return {
        ...emp,
        status: record?.status || 'Absent',
      };
    });

    res.status(200).json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getTeamAttendanceForEmployee = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    // Step 1: Find manager_id for current employee
    const managerResult = await pool.query(
      `SELECT manager_id FROM employees WHERE user_id = $1`,
      [user_id]
    );

    if (managerResult.rows.length === 0) {
      return res.status(404).json({ error: "Manager not assigned to employee" });
    }

    const manager_id = managerResult.rows[0].manager_id;

    // Step 2: Fetch team data with roles
    const teamResult = await pool.query(`
      SELECT 
        e.user_id, 
        e.first_name, 
        e.last_name, 
        u.email,
        r.name AS role,
        COALESCE(
          CASE 
            WHEN a.punch_in IS NOT NULL AND a.punch_out IS NULL THEN 'Present'
            WHEN l.status = 'approved' THEN 'On Leave'
            ELSE 'Absent'
          END, 'Absent'
        ) AS status
      FROM employees e
      JOIN users u ON e.user_id = u.user_id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN attendance a 
        ON a.user_id = e.user_id AND DATE(a.punch_in) = CURRENT_DATE
      LEFT JOIN leaves l 
        ON l.user_id = e.user_id 
        AND CURRENT_DATE BETWEEN l.start_date AND l.end_date 
        AND l.status = 'approved'
      WHERE e.manager_id = $1
    `, [manager_id]);

    return res.status(200).json({ data: teamResult.rows });

  } catch (err) {
    console.error("Error in getTeamAttendanceForEmployee:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
