const normalizeOrigin = (v) => {
  if (!v) return "";
  return String(v).trim().replace(/\/+$/, "");
};

const runtimeOrigin =
  typeof window !== "undefined" && window.location?.origin
    ? normalizeOrigin(window.location.origin)
    : "";

// Render Static Site env var:
//   VITE_API_ORIGIN=https://<your-backend-service>.onrender.com
const envApiOrigin = normalizeOrigin(import.meta.env.VITE_API_ORIGIN);
const defaultApiOrigin = "http://localhost:5001";

export const API_ORIGIN = envApiOrigin || defaultApiOrigin;
export const API_BASE = `${API_ORIGIN}/api`;
export const RECRUITMENT_API_BASE = `${API_BASE}/recruitment`;
export const PAYROLL_API_BASE = `${API_BASE}/payroll`;

// Public site origin used for shareable links (careers apply, etc.)
// Set this in Render (recommended) so links are correct even when HR panel runs on localhost.
//   VITE_SITE_ORIGIN=https://employee-management-system-tqdn.onrender.com
const envSiteOrigin = normalizeOrigin(import.meta.env.VITE_SITE_ORIGIN);
const defaultSiteOrigin = "http://localhost:5173";

export const SITE_ORIGIN = envSiteOrigin || runtimeOrigin || defaultSiteOrigin;
