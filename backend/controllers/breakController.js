// controllers/breaksController.jsx
import pool from "../config/db.js";

// Add a new break (usually break_start only at first)
export const createBreak = async (req, res) => {
  const { attendance_id, break_start, break_end } = req.body;

  try {
    let duration = null;
    if (break_start && break_end) {
      duration = Math.floor((new Date(break_end) - new Date(break_start)) / 60000);
    }

    const result = await pool.query(
      `INSERT INTO breaks (id, attendance_id, break_start, break_end, duration_minutes)
       VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *`,
      [attendance_id, break_start, break_end, duration]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all breaks for a specific attendance record
export const getBreaksByAttendance = async (req, res) => {
  const { attendance_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM breaks WHERE attendance_id = $1`,
      [attendance_id]
    );
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a break (set break_end and recalculate duration)
export const updateBreak = async (req, res) => {
  const { id } = req.params;
  const { break_end } = req.body;

  try {
    const existing = await pool.query(`SELECT * FROM breaks WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Break not found" });
    }

    const break_start = new Date(existing.rows[0].break_start);
    const end = new Date(break_end);
    const duration = Math.floor((end - break_start) / 60000);

    const updated = await pool.query(
      `UPDATE breaks SET break_end = $1, duration_minutes = $2 WHERE id = $3 RETURNING *`,
      [break_end, duration, id]
    );

    res.json({ data: updated.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a break
export const deleteBreak = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM breaks WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Break not found" });
    }
    res.json({ msg: "Break deleted", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
