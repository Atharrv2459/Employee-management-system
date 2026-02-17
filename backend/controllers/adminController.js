import pool from "../db.js";
import bcrypt from 'bcrypt';
import { sendAccountCreatedEmail } from "../config/mailer.js";

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


export const createUserByAdmin = async (req, res) => {
  const { email, password, role_id, roll_no } = req.body;

  if (!email || !password || !role_id) {
    return res.status(400).json({ error: "email, password and role_id are required" });
  }

  try {
    // Check if user exists
    const existing = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `
      INSERT INTO users (email, password, role_id, roll_no)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, email, role_id, roll_no, created_at
      `,
      [email, hashedPassword, role_id, roll_no || null]
    );

    // Send email with credentials
    await sendAccountCreatedEmail(email, password);

    res.status(201).json({
      message: "User created and email sent successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
};