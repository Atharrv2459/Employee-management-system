import pool from "../db.js";

// ✅ Create Shift Preference
export const createShift = async (req, res) => {
  const { shift_time, maximum_hours, unavailable_days, notes } = req.body;
  const user_id = req.user.user_id;

  try {
    const existing = await pool.query(`SELECT * FROM shifts WHERE user_id = $1`, [user_id]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Shift preference already exists. Use update instead." });
    }

    const result = await pool.query(
      `INSERT INTO shifts (user_id, shift_time, maximum_hours, unavailable_days, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, shift_time, maximum_hours, unavailable_days, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create shift preference" });
  }
};

// ✅ Get Shift Preference
export const getShift = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const result = await pool.query(`SELECT * FROM shifts WHERE user_id = $1`, [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No shift preferences found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve shift preference" });
  }
};

// ✅ Update Shift Preference
export const updateShift = async (req, res) => {
  const { shift_time, maximum_hours, unavailable_days, notes } = req.body;
  const user_id = req.user.user_id;

  try {
    const result = await pool.query(
      `UPDATE shifts SET
        shift_time = $1,
        maximum_hours = $2,
        unavailable_days = $3,
        notes = $4
       WHERE user_id = $5 RETURNING *`,
      [shift_time, maximum_hours, unavailable_days, notes, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Shift preference not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update shift preference" });
  }
};

// ✅ Delete Shift Preference
export const deleteShift = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const result = await pool.query(`DELETE FROM shifts WHERE user_id = $1 RETURNING *`, [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Shift preference not found" });
    }

    res.status(200).json({ message: "Shift preference deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete shift preference" });
  }
};
