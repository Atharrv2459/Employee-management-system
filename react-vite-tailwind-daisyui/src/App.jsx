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
import ManagerTimesheet from "./wireframes/Manager_wireframes/Timesheet_manager";
import EmployeeTimesheet from "./wireframes/Employee_wireframes/Timesheet_employee";
import AdminDashboard from "./adminDashboard";
import AdminLayout from "./AdminLayout";
import DepartmentManagement from "./wireframes/admin/DepartmentManagement";
import OfficeLocationManagement from "./wireframes/admin/OfficeLocationManagement";
import ShiftTemplateManagement from "./wireframes/admin/ShiftTemplateManagement";
import ShiftCalendar from "./wireframes/admin/ShiftCalendar";
import ShiftPreferences from "./wireframes/Employee_wireframes/ShiftPreferences";
import SalaryManagement from "./wireframes/admin/SalaryManagement";
import PayrollProcessing from "./wireframes/admin/PayrollProcessing";
import MyPayslips from "./wireframes/Employee_wireframes/MyPayslips";
import JobPostings from "./wireframes/admin/JobPostings";
import ApplicationsManagement from "./wireframes/admin/ApplicationsManagement";
import AttendanceManagement from "./wireframes/admin/AttendanceManagement";
import CareersPage from "./wireframes/CareersPage";
import CareersApplyPage from "./wireframes/CareersApplyPage";


export default function App() {
  return (

      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<UserLogin />} />
        <Route path="/register" element={<UserRegister />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/careers/:slug/apply" element={<CareersApplyPage />} />

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
          <Route path="/employee/timesheet" element={<EmployeeTimesheet />} />
         
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
          <Route path="/manager/timesheet" element={<ManagerTimesheet />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="departments" element={<DepartmentManagement />} />
          <Route path="locations" element={<OfficeLocationManagement />} />
          <Route path="shift-templates" element={<ShiftTemplateManagement />} />
          <Route path="shift-calendar" element={<ShiftCalendar />} />
          <Route path="attendance" element={<AttendanceManagement />} />
          <Route path="payroll" element={<SalaryManagement />} />
          <Route path="payroll/process" element={<PayrollProcessing />} />
          <Route path="recruitment" element={<JobPostings />} />
          <Route path="recruitment/applications" element={<ApplicationsManagement />} />
          <Route path="recruitment/jobs/:jobId/applications" element={<ApplicationsManagement />} />
        </Route>

        {/* Employee Shift Preferences & Payslips */}
        <Route element={<EmployeeLayout />}>
          <Route path="/employee/shift-preferences" element={<ShiftPreferences />} />
          <Route path="/employee/payslips" element={<MyPayslips />} />
        </Route>

      </Routes>
  
  );
}
