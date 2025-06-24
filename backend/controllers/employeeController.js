import pool from "../db.js";


export const createEmployee = async (req, res) => {
  const user_id = req.user.user_id;
  const {first_name, last_name, phone, address, city, dob, job_title, profile_picture, joining_date, manager_id
  } = req.body;

  try {
    const exists = await pool.query(`SELECT * FROM employees WHERE user_id = $1`, [user_id]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "You already have an employee profile." });
    }

    const result = await pool.query(`
      insert into employees (
        employee_id, user_id, first_name, last_name, phone, address, city,
        dob, job_title, profile_picture, joining_date, manager_id) values ( gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *`,
      [user_id, first_name, last_name, phone, address, city,
        dob, job_title, profile_picture, joining_date, manager_id]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getOwnEmployee = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const result = await pool.query(`select * from employees where user_id = $1`, [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee profile not found" });
    }
    res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEmployee = async (req, res) => {
  const user_id = req.user.user_id;
  const {
    first_name, last_name, phone, address, city,
    dob, job_title, profile_picture, joining_date, manager_id
  } = req.body;

  try {
    const exists = await pool.query(`select * from employees where user_id = $1`, [user_id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    const result = await pool.query(`
      update employees set first_name = $1, last_name = $2, phone = $3, address = $4,
        city = $5, dob = $6, job_title = $7, profile_picture = $8,
        joining_date = $9, manager_id = $10
      where user_id = $11
      returning *`,
      [
        first_name, last_name, phone, address, city,
        dob, job_title, profile_picture, joining_date, manager_id, user_id
      ]
    );

    res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteEmployee = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const result = await pool.query(`delete from employees where user_id = $1 returning *`, [user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Employee profile not found" });
    }
    res.status(200).json({ message: "Employee profile deleted", data: result.rows[0] });
  } 
  catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllEmployees = async (req,res)=>{
    try{
        const result= await pool.query('select * from employees');
        res.status(200).json({message:"Employees retrieved",data: result.rows})
    }
    catch(err){
        res.status(500).json({error : err.message})
    }
}