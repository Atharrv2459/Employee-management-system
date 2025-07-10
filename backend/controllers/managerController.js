import pool from "../db.js";
export const getAllManagers = async (req, res) => {
  try {
    const result = await pool.query(`select * from managers`);
    res.status(200).json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createManager = async (req, res) => {
  const user_id = req.user?.user_id;

  const {
    first_name, last_name, phone, address, city,
    dob, department, job_title, profile_picture, joining_date, reporting_manager
  } = req.body;

  try {
    const userQuery = await pool.query(`SELECT role_id FROM users WHERE user_id = $1`, [user_id]);
    if (userQuery.rows.length === 0) return res.status(404).json({ message: "User not found" });

    const userRole = userQuery.rows[0].role_id;
    if (userRole !== 2) return res.status(403).json({ message: "Only users with role_id = 2 (manager) can create a manager profile." });

    const exists = await pool.query(`SELECT * FROM managers WHERE user_id = $1`, [user_id]);
    if (exists.rows.length > 0) return res.status(400).json({ message: "Manager profile already exists." });

    const result = await pool.query(`
      INSERT INTO managers (
        manager_id, user_id, first_name, last_name, phone, address, city, dob,
        department, job_title, profile_picture, joining_date, role_id, reporting_manager
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 2, $12)
      RETURNING *`,
      [
        user_id, first_name, last_name, phone, address, city, dob,
        department, job_title, profile_picture, joining_date, reporting_manager || null
      ]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


export const getOwnManager = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const result = await pool.query(`select * from managers where user_id = $1`, [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Manager profile not found" });
    }
    res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateManager = async (req, res) => {
  const user_id = req.user.user_id;
  const {
    first_name, last_name, phone, address, city,
    dob, department, job_title, profile_picture, joining_date, reporting_manager
  } = req.body;

  try {
    const exists = await pool.query(`SELECT * FROM managers WHERE user_id = $1`, [user_id]);
    if (exists.rows.length === 0) return res.status(404).json({ message: "Manager profile not found" });

    const result = await pool.query(`
      UPDATE managers SET
        first_name = $1, last_name = $2, phone = $3, address = $4, city = $5,
        dob = $6, department = $7, job_title = $8, profile_picture = $9, joining_date = $10,
        reporting_manager = $11
      WHERE user_id = $12
      RETURNING *`,
      [
        first_name, last_name, phone, address, city,
        dob, department, job_title, profile_picture, joining_date,
        reporting_manager || null, user_id
      ]
    );

    res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const deleteManager = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const result = await pool.query(`DELETE FROM managers WHERE user_id = $1 RETURNING *`, [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Manager profile not found" });
    }
    res.status(200).json({ message: "Manager profile deleted", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getEmployeesUnderManager = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const managerResult = await pool.query(`SELECT manager_id FROM managers WHERE user_id = $1`, [user_id]);
    if (managerResult.rows.length === 0) {
      return res.status(404).json({ message: "Manager not found" });
    }

    const manager_id = managerResult.rows[0].manager_id;
    const employeesResult = await pool.query(`SELECT * FROM employees WHERE manager_id = $1`, [manager_id]);
    res.status(200).json({ data: employeesResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};