import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import roleRouter from './routers/roleRoutes.js'
import userRouter from './routers/userRoutes.js'
import employeeRouter from './routers/employeeRoutes.js'
import managerRouter from './routers/managerRoutes.js'
import attendanceRouter from './routers/attendanceRoutes.js'
import leaveRouter from './routers/leaveRoutes.js'
import leaveManagerRouter from './routers/leaveManagerRoutes.js'
import manualEntryRouter from './routers/manualEntryRoutes.js'
import emergencyContactRouter from './routers/emergencyContactRoutes.js'
import shiftRouter from './routers/shiftRoutes.js'

import pool from "./db.js";
const app = express();
dotenv.config();



const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api',roleRouter);
app.use('/api/users', userRouter);
app.use('/api/employee', employeeRouter);
app.use('/api/manager',managerRouter);
app.use('/api/attendance',attendanceRouter);
app.use('/api/leaves',leaveRouter)
app.use('/api/leave-management',leaveManagerRouter);
app.use('/api/manual_entry',manualEntryRouter);
app.use('/api/emergency', emergencyContactRouter);
app.use('/api/shift', shiftRouter);



app.get("/" , async(req,res)=>{
    const result = await pool.query("SELECT current_database()");
    res.send(`The database name is : ${result.rows[0].current_database}`)
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
