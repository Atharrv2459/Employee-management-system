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
      <div className="navbar bg-white shadow-md px-6 fixed top-0 left-0 w-full z-50 h-16 items-center">
        <div className="navbar-start">
          <button
            className="btn btn-ghost btn-sm text-xl font-bold text-purple-600"
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
              className={`btn btn-ghost btn-sm ${usersActive ? "btn-active" : ""}`}
              type="button"
            >
              Users
            </button>

            <button
              onClick={() => navigate("/admin/departments")}
              className={`btn btn-ghost btn-sm ${deptsActive ? "btn-active" : ""}`}
              type="button"
            >
              Departments
            </button>

            <button
              onClick={() => navigate("/admin/locations")}
              className={`btn btn-ghost btn-sm ${locationsActive ? "btn-active" : ""}`}
              type="button"
            >
              Locations
            </button>

            <div className="dropdown dropdown-hover">
              <button
                tabIndex={0}
                type="button"
                className={`btn btn-ghost btn-sm ${shiftsActive ? "btn-active" : ""}`}
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
              className={`btn btn-ghost btn-sm ${attendanceActive ? "btn-active" : ""}`}
              type="button"
            >
              Attendance
            </button>

            <div className="dropdown dropdown-hover">
              <button
                tabIndex={0}
                type="button"
                className={`btn btn-ghost btn-sm ${payrollActive ? "btn-active" : ""}`}
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
                className={`btn btn-ghost btn-sm ${recruitmentActive ? "btn-active" : ""}`}
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
