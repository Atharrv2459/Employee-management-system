import pool from "../db.js";

// Get all users with their roles
// Get all users with their roles and basic info from employee or manager tables
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id, 
        u.email, 
        u.role_id, 
        u.created_at,
        COALESCE(e.first_name, m.first_name) AS first_name,
        COALESCE(e.last_name, m.last_name) AS last_name,
        COALESCE(e.phone, m.phone) AS phone
      FROM users u
      LEFT JOIN employees e ON u.user_id = e.user_id
      LEFT JOIN managers m ON u.user_id = m.user_id
    `);

    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Update user role or info
export const updateUser = async (req, res) => {
  const { user_id } = req.params;
  const { first_name, last_name, phone, role_id } = req.body;

  try {
    await pool.query(
      `UPDATE users SET role_id = $1 WHERE id = $2`,
      [role_id, user_id]
    );

    await pool.query(
      `UPDATE employee SET first_name = $1, last_name = $2, phone = $3 WHERE user_id = $4`,
      [first_name, last_name, phone, user_id]
    );

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
};
