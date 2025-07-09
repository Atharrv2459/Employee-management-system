
import pool from "../db.js";

export const createRole = async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      "insert into roles (name) values ($1) returning *",
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const result = await pool.query("select * FROM roles");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRoleById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('select * from roles where id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: 'Role not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await pool.query(
      'update roles set name = $1 WHERE id = $2 returning *',
      [name, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Role not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('delete from roles where id = $1 returning*', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
