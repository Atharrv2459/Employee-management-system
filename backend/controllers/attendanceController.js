import pool from "../db.js";
import { recordAttendanceLocation } from "../middleware/geolocationMiddleware.js";

// ✅ PUNCH IN (Updated with Geolocation)
export const punchIn = async (req, res) => {
  const user_id = req.user.user_id;
  const geolocationResult = req.geolocationResult;

  try {
    // Check if user already punched in today
    const existing = await pool.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND punch_in::date = CURRENT_DATE`,
      [user_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Already punched in today" });
    }

    // Start transaction for attendance + location recording
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert attendance record with geolocation info
      const attendanceResult = await client.query(
        `INSERT INTO attendance (user_id, punch_in, work_location_type, verified_location) 
         VALUES ($1, NOW(), $2, $3) 
         RETURNING *`,
        [
          user_id,
          geolocationResult?.workLocationType || "unknown",
          geolocationResult?.isValid || false,
        ]
      );

      const attendance = attendanceResult.rows[0];

      // Record location data if geolocation was captured
      let locationRecord = null;
      if (geolocationResult && !geolocationResult.validationSkipped) {
        const attendanceId = attendance.id || attendance.attendance_id;
        locationRecord = await recordAttendanceLocation(
          attendanceId,
          "punch_in",
          geolocationResult,
          client
        );
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: "Punched in successfully",
        data: attendance,
        location: locationRecord ? {
          type: "punch_in",
          office: geolocationResult.matchedOffice?.name || null,
          remote_location: geolocationResult.matchedRemoteLocation?.name || null,
          work_type: geolocationResult.workLocationType,
          distance_to_office: geolocationResult.nearestOffice?.distance || null,
        } : null,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Punch in error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ PUNCH OUT (Updated with Geolocation)
export const punchOut = async (req, res) => {
  const user_id = req.user.user_id;
  const geolocationResult = req.geolocationResult;

  try {
    // Check if user already punched out today
    const existing = await pool.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND punch_out IS NOT NULL AND punch_in::date = CURRENT_DATE`,
      [user_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Already punched out today" });
    }

    // Get today's attendance record
    const todayAttendance = await pool.query(
      `SELECT * FROM attendance WHERE user_id = $1 AND punch_in::date = CURRENT_DATE AND punch_out IS NULL`,
      [user_id]
    );

    if (todayAttendance.rows.length === 0) {
      return res.status(404).json({ message: "No active punch-in found today" });
    }

    // Start transaction for attendance update + location recording
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update attendance with punch out
      const result = await client.query(
        `UPDATE attendance 
         SET punch_out = NOW(), 
             attendance_duration = NOW() - punch_in,
             verified_location = CASE 
               WHEN verified_location = true AND $2 = true THEN true
               WHEN $2 = true THEN true
               ELSE verified_location
             END
         WHERE user_id = $1 AND punch_in::date = CURRENT_DATE AND punch_out IS NULL
         RETURNING *`,
        [user_id, geolocationResult?.isValid || false]
      );

      const attendance = result.rows[0];

      // Record location data for punch out
      let locationRecord = null;
      if (geolocationResult && !geolocationResult.validationSkipped) {
        const attendanceId = attendance.id || attendance.attendance_id;
        locationRecord = await recordAttendanceLocation(
          attendanceId,
          "punch_out",
          geolocationResult,
          client
        );
      }

      await client.query("COMMIT");

      res.status(200).json({
        message: "Punched out successfully",
        data: attendance,
        location: locationRecord ? {
          type: "punch_out",
          office: geolocationResult.matchedOffice?.name || null,
          remote_location: geolocationResult.matchedRemoteLocation?.name || null,
          work_type: geolocationResult.workLocationType,
          distance_to_office: geolocationResult.nearestOffice?.distance || null,
        } : null,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Punch out error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET MY ATTENDANCE HISTORY (Updated with Location Data)
export const getMyAttendance = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT a.*, 
              ol_in.name as punch_in_office,
              ol_out.name as punch_out_office,
              al_in.latitude as punch_in_lat,
              al_in.longitude as punch_in_lng,
              al_in.is_within_geofence as punch_in_valid,
              al_out.latitude as punch_out_lat,
              al_out.longitude as punch_out_lng,
              al_out.is_within_geofence as punch_out_valid
       FROM attendance a
       LEFT JOIN attendance_locations al_in ON a.id = al_in.attendance_id AND al_in.location_type = 'punch_in'
       LEFT JOIN attendance_locations al_out ON a.id = al_out.attendance_id AND al_out.location_type = 'punch_out'
       LEFT JOIN office_locations ol_in ON al_in.office_location_id = ol_in.id
       LEFT JOIN office_locations ol_out ON al_out.office_location_id = ol_out.id
       WHERE a.user_id = $1 
       ORDER BY a.punch_in DESC`,
      [user_id]
    );

    res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error("Get attendance error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ ADMIN: Get any user's attendance with punch in/out locations
export const getUserAttendanceAdmin = async (req, res) => {
  const { userId } = req.params;
  const { start_date, end_date } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const params = [userId];
    let where = `a.user_id = $1`;

    if (start_date) {
      params.push(start_date);
      where += ` AND a.punch_in::date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      where += ` AND a.punch_in::date <= $${params.length}`;
    }

    const result = await pool.query(
      `SELECT a.*, u.email,
              COALESCE(e.first_name, m.first_name) AS first_name,
              COALESCE(e.last_name, m.last_name) AS last_name,

              al_in.office_name as punch_in_office,
              al_in.latitude as punch_in_lat,
              al_in.longitude as punch_in_lng,
              al_in.accuracy as punch_in_accuracy,
              al_in.is_within_geofence as punch_in_valid,
              al_in.distance_from_office as punch_in_distance,
              al_in.captured_at as punch_in_captured_at,

              al_out.office_name as punch_out_office,
              al_out.latitude as punch_out_lat,
              al_out.longitude as punch_out_lng,
              al_out.accuracy as punch_out_accuracy,
              al_out.is_within_geofence as punch_out_valid,
              al_out.distance_from_office as punch_out_distance,
              al_out.captured_at as punch_out_captured_at
       FROM attendance a
       JOIN users u ON a.user_id = u.user_id
       LEFT JOIN employees e ON a.user_id = e.user_id
       LEFT JOIN managers m ON a.user_id = m.user_id
       LEFT JOIN LATERAL (
         SELECT al.latitude, al.longitude, al.accuracy, al.is_within_geofence, al.distance_from_office, al.captured_at,
                ol.name as office_name
         FROM attendance_locations al
         LEFT JOIN office_locations ol ON al.office_location_id = ol.id
         WHERE al.attendance_id = a.id AND al.location_type = 'punch_in'
         ORDER BY al.captured_at DESC
         LIMIT 1
       ) al_in ON true
       LEFT JOIN LATERAL (
         SELECT al.latitude, al.longitude, al.accuracy, al.is_within_geofence, al.distance_from_office, al.captured_at,
                ol.name as office_name
         FROM attendance_locations al
         LEFT JOIN office_locations ol ON al.office_location_id = ol.id
         WHERE al.attendance_id = a.id AND al.location_type = 'punch_out'
         ORDER BY al.captured_at DESC
         LIMIT 1
       ) al_out ON true
       WHERE ${where}
       ORDER BY a.punch_in DESC`,
      params
    );

    res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error("Admin get attendance error:", err);
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
