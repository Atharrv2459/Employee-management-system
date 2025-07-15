import pool from "../db.js";

// ✅ Create Emergency Contact
export const createEmergencyContact = async (req, res) => {
  const { primary_contact_name, primary_contact_relationship, primary_contact_phone,
          secondary_contact_name, secondary_contact_relationship, secondary_contact_phone,
          medical_info } = req.body;

  const user_id = req.user.user_id; // assuming JWT middleware sets this

  try {
    const result = await pool.query(
      `INSERT INTO emergency_contacts
      (user_id, primary_contact_name, primary_contact_relationship, primary_contact_phone,
      secondary_contact_name, secondary_contact_relationship, secondary_contact_phone, medical_info)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user_id, primary_contact_name, primary_contact_relationship, primary_contact_phone,
       secondary_contact_name, secondary_contact_relationship, secondary_contact_phone, medical_info]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create emergency contact" });
  }
};

// ✅ Get Emergency Contact by User ID
export const getEmergencyContact = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT * FROM emergency_contacts WHERE user_id = $1`,
      [user_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve emergency contacts" });
  }
};

// ✅ Update Emergency Contact
export const updateEmergencyContact = async (req, res) => {
  const user_id = req.user.user_id;
  const {
    primary_contact_name,
    primary_contact_relationship,
    primary_contact_phone,
    secondary_contact_name,
    secondary_contact_relationship,
    secondary_contact_phone,
    medical_info
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE emergency_contacts SET
        primary_contact_name = $1,
        primary_contact_relationship = $2,
        primary_contact_phone = $3,
        secondary_contact_name = $4,
        secondary_contact_relationship = $5,
        secondary_contact_phone = $6,
        medical_info = $7
       WHERE user_id = $8
       RETURNING *`,
      [
        primary_contact_name,
        primary_contact_relationship,
        primary_contact_phone,
        secondary_contact_name,
        secondary_contact_relationship,
        secondary_contact_phone,
        medical_info,
        user_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Emergency contact not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update emergency contact" });
  }
};


export const deleteEmergencyContact = async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const result = await pool.query(
      `DELETE FROM emergency_contacts WHERE user_id = $1 RETURNING *`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Emergency contact not found" });
    }

    res.status(200).json({ message: "Emergency contact deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete emergency contact" });
  }
};
