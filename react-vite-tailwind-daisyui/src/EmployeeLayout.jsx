import { Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

export default function EmployeeLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div>
      <div className="navbar bg-white shadow-md px-6 fixed top-0 left-0 w-full">
        <div className="navbar-start">
          <button className="btn btn-ghost text-xl font-bold text-blue-600">Employee Panel</button>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li><a className="font-semibold"  onClick={() => navigate('/employee/dashboard')}>Dashboard</a></li>
            <li><a className="font-semibold" onClick={() => navigate('/employee/leaves/apply')}>Apply Leave</a></li>
            <li><a className="font-semibold" onClick={() => navigate('/employee/profile')}>Profile</a></li>
            <li><a className="font-semibold" onClick={() => navigate('/employee/punch')}>Punch In/Out</a></li>
             <li><a className="font-semibold" onClick={() => navigate('/employee/manual-entry')}>Manual entry</a></li>
          </ul>
        </div>

        <div className="navbar-end gap-4">
          <button onClick={handleLogout} className="btn btn-sm btn-error text-white">Logout</button>
        </div>
      </div>
<div className="pt-20 px-4">
      <Outlet />
      <Toaster />
      </div>
    </div>
  );
}
