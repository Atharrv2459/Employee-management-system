import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

const isPathActive = (pathname, base) => pathname === base || pathname.startsWith(base + "/");

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    toast.success("Logged out");
    navigate("/");
  };

  const path = location.pathname;
  const usersActive = path === "/admin";
  const deptsActive = isPathActive(path, "/admin/departments");
  const locationsActive = isPathActive(path, "/admin/locations");
  const attendanceActive = isPathActive(path, "/admin/attendance");
  const shiftsActive = isPathActive(path, "/admin/shift-calendar") || isPathActive(path, "/admin/shift-templates");
  const payrollActive = isPathActive(path, "/admin/payroll");
  const recruitmentActive = isPathActive(path, "/admin/recruitment");


  return (
    <div>
      <div className="navbar bg-blue-900 shadow-md px-6 fixed top-0 left-0 w-full z-50 h-16 items-center border-b border-blue-800/40">
        <div className="navbar-start">
          <button
            className="btn btn-ghost btn-sm text-xl font-bold text-white hover:bg-white/10"
            onClick={() => navigate("/admin")}
            type="button"
          >
            HR Panel
          </button>
        </div>

        <div className="navbar-center hidden lg:flex items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin")}
              className={`btn btn-ghost btn-sm text-white hover:bg-white/10 ${usersActive ? "bg-white/15" : ""}`}
              type="button"
            >
              Users
            </button>

            <button
              onClick={() => navigate("/admin/departments")}
              className={`btn btn-ghost btn-sm text-white hover:bg-white/10 ${deptsActive ? "bg-white/15" : ""}`}
              type="button"
            >
              Departments
            </button>

            <button
              onClick={() => navigate("/admin/locations")}
              className={`btn btn-ghost btn-sm text-white hover:bg-white/10 ${locationsActive ? "bg-white/15" : ""}`}
              type="button"
            >
              Locations
            </button>

            <div className="dropdown dropdown-hover">
              <button
                tabIndex={0}
                type="button"
                className={`btn btn-ghost btn-sm text-white hover:bg-white/10 ${shiftsActive ? "bg-white/15" : ""}`}
              >
                Shifts
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-56 mt-2 z-[60]"
              >
                <li>
                  <button type="button" onClick={() => navigate("/admin/shift-calendar")}> 
                    Shift Calendar
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate("/admin/shift-templates")}> 
                    Shift Templates
                  </button>
                </li>
              </ul>
            </div>

            <button
              onClick={() => navigate("/admin/attendance")}
              className={`btn btn-ghost btn-sm text-white hover:bg-white/10 ${attendanceActive ? "bg-white/15" : ""}`}
              type="button"
            >
              Attendance
            </button>

            <div className="dropdown dropdown-hover">
              <button
                tabIndex={0}
                type="button"
                className={`btn btn-ghost btn-sm text-white hover:bg-white/10 ${payrollActive ? "bg-white/15" : ""}`}
              >
                Payroll
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-56 mt-2 z-[60]"
              >
                <li>
                  <button type="button" onClick={() => navigate("/admin/payroll")}> 
                    Salary Management
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate("/admin/payroll/process")}> 
                    Payroll Processing
                  </button>
                </li>
              </ul>
            </div>

            <div className="dropdown dropdown-hover">
              <button
                tabIndex={0}
                type="button"
                className={`btn btn-ghost btn-sm text-white hover:bg-white/10 ${recruitmentActive ? "bg-white/15" : ""}`}
              >
                Recruitment
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-56 mt-2 z-[60]"
              >
                <li>
                  <button type="button" onClick={() => navigate("/admin/recruitment")}> 
                    Jobs
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate("/admin/recruitment/applications")}> 
                    Applications
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="navbar-end gap-4">
          <button onClick={onLogout} className="btn btn-sm btn-error text-white" type="button">
            Logout
          </button>
        </div>
      </div>

      <div className="pt-20">
        <Outlet />
      </div>

      <Toaster />
    </div>
  );
}
