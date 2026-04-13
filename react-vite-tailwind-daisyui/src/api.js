const normalizeOrigin = (v) => {
  if (!v) return "";
  return String(v).trim().replace(/\/+$/, "");
};

// Render Static Site env var:
//   VITE_API_ORIGIN=https://<your-backend-service>.onrender.com
const envOrigin = normalizeOrigin(import.meta.env.VITE_API_ORIGIN);
const defaultOrigin = "http://localhost:5001";

export const API_ORIGIN = envOrigin || defaultOrigin;
export const API_BASE = `${API_ORIGIN}/api`;
export const RECRUITMENT_API_BASE = `${API_BASE}/recruitment`;
export const PAYROLL_API_BASE = `${API_BASE}/payroll`;
