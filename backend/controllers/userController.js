import pool from '../db.js';
import bcrypt from 'bcrypt';
import generateToken from '../config/jwtGenerator.js';

// REGISTER USER
export const createUser = async (req, res) => {
  const { email, roll_no, password, role_id } = req.body;
  try {
    const existing = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR roll_no = $2',
      [email, roll_no]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email or Roll Number already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (user_id, email, roll_no, password, role_id) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *',
      [email, roll_no, hash, role_id]
    );

    const user = result.rows[0];
    const token = generateToken({ user_id: user.user_id, role_id: user.role_id });
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  const { identifier, password } = req.body; // identifier = email or roll_no
  try {
    const user = await pool.query(
      `SELECT * FROM users WHERE email = $1 OR roll_no = $1`,
      [identifier]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.rows[0].password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({
      user_id: user.rows[0].user_id,
      role_id: user.rows[0].role_id
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM users`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM users WHERE user_id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  const user_id = req.user.user_id;
  const { email, roll_no, role_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET email = $1, roll_no = $2, role_id = $3, updated_at = NOW()
       WHERE user_id = $4 RETURNING *`,
      [email, roll_no, role_id, user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ msg: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM users WHERE user_id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  const user_id = req.user.user_id;
  const { oldPassword, newPassword } = req.body;

  try {
    const result = await pool.query(`SELECT password FROM users WHERE user_id = $1`, [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(oldPassword, result.rows[0].password);
    if (!valid) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await pool.query(`UPDATE users SET password = $1, updated_at = NOW() WHERE user_id = $2`, [hash, user_id]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
