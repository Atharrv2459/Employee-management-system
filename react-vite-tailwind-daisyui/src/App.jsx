import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth Pages
import UserLogin from "./wireframes/UserLogin";
import UserRegister from "./wireframes/UserRegister";

// Layouts
import EmployeeLayout from "./EmployeeLayout";
import ManagerLayout from "./ManagerLayout";

// Employee Pages
import Punch_in from "./wireframes/Employee_wireframes/Punch_in";
import ProfileSetup from "./wireframes/Employee_wireframes/ProfileSetup";
import Manual_entry from "./wireframes/Employee_wireframes/Manual_entry";
import Dashboard from "../Dashboard";
import LeaveApplication from "./wireframes/leave_wireframes/apply";
import LeaveBalanceDashboard from "./wireframes/leave_wireframes/Leave_dashboard1";
import ManualEntryDashboard from "./wireframes/Employee_wireframes/manual_dashboard";
import EmployeeDashboard from "./wireframes/Employee_wireframes/Dashboard_employee";
import LeaveHistory from "./wireframes/leave_wireframes/leave_requests";

// Manager Pages
import ManagerProfileSetup from "./wireframes/Manager_wireframes/ManagerProfileSetup";
import Punch_in_Manager from "./wireframes/Manager_wireframes/Punch_in_Manager";
import ManagerDashboard from "./wireframes/Manager_wireframes/Dashboard_manager";
import ManagerReport from "./wireframes/Manager_wireframes/Manager_report";

export default function App() {
  return (

      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<UserLogin />} />
        <Route path="/register" element={<UserRegister />} />

        {/* Employee Routes */}
        <Route element={<EmployeeLayout />}>
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/punch" element={<Punch_in />} />
          <Route path="/employee/profile" element={<ProfileSetup />} />
          <Route path="/employee/manual-entry" element={<Manual_entry />} />
          <Route path="/employee/manual-entry/dashboard" element={<ManualEntryDashboard />} />
          <Route path="/employee/leaves/apply" element={<LeaveApplication />} />
          <Route path="/employee/leaves/balance" element={<LeaveBalanceDashboard />} />
          <Route path="/employee/leave-history" element={<LeaveHistory />} />
         
        </Route>

        {/* Manager Routes */}
        <Route element={<ManagerLayout />}>
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/punch" element={<Punch_in_Manager />} />
          <Route path="/manager/profile" element={<ManagerProfileSetup />} />
          <Route path="/manager/report" element={<ManagerReport />} />
          <Route path="/manager/leaves/apply" element={<LeaveApplication />} />
          <Route path="/manager/leaves/balance" element={<LeaveBalanceDashboard />} />
          <Route path="/manager/leaves/leave-history" element={<LeaveHistory />} />
        </Route>

      </Routes>
  
  );
}
