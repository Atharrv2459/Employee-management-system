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
import adminRouter from './routers/adminRoutes.js'
import webauthRoutes from "./routers/webauthRoutes.js";
import departmentRouter from './routers/departmentRoutes.js'
import locationRouter from './routers/locationRoutes.js'
import shiftScheduleRouter from './routers/shiftScheduleRoutes.js'
import payrollRouter from './routers/payrollRoutes.js'
import recruitmentRouter from './routers/recruitmentRoutes.js'
import { GoogleGenAI } from "@google/genai";

import pool, { dbDiagnostics } from "./db.js";
const app = express();
dotenv.config();



const PORT = process.env.PORT || 5001;

// Middleware
const normalizeOrigin = (value) => String(value || "").trim().replace(/\/+$/, "");

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow non-browser requests (no Origin header)
    if (!origin) return callback(null, true);

    const normalized = normalizeOrigin(origin);
    const allowed = !allowedOrigins.length || allowedOrigins.includes(normalized);
    return callback(null, allowed);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};

console.log("[cors] allowed origins:", allowedOrigins.length ? allowedOrigins : "(allow all)");

app.use(cors(corsOptions));
// Express/router path-to-regexp doesn't accept "*" here; use a match-all regex.
app.options(/.*/, cors(corsOptions));

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
app.use('/api/admin', adminRouter);
app.use("/api/webauthn", webauthRoutes);
app.use('/api/departments', departmentRouter);
app.use('/api/locations', locationRouter);
app.use('/api/shift-schedule', shiftScheduleRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/recruitment', recruitmentRouter);



app.get("/health", (req, res) => {
  res.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV || null,
    db: dbDiagnostics,
  });
});

// Common convention for load balancers / platform health checks
app.get("/healthz", (req, res) => {
  res.json({ ok: true });
});

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database()");
    res.json({ ok: true, database: result.rows?.[0]?.current_database });
  } catch (error) {
    console.error("DB check failed:", error);
    // Keep service up even if DB isn't ready/configured yet
    res.status(500).json({ ok: false, error: "Database connection failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
