import { Routes } from "react-router-dom";
import UserLogin from "./wireframes/UserLogin";
import ReactDOM from 'react-dom/client'
import { Link, Route,BrowserRouter } from "react-router-dom";
import Punch_in from "./wireframes/Employee_wireframes/Punch_in";
import Leave_dashboard from "./wireframes/leave_wireframes/leave_dashboard";
import { Toaster } from "react-hot-toast";
import ProfileSetup from "./wireframes/Employee_wireframes/ProfileSetup";
import UserRegister from "./wireframes/UserRegister";
import ManagerProfileSetup from "./wireframes/Manager_wireframes/ManagerProfileSetup";
import Punch_in_Manager from "./wireframes/Manager_wireframes/Punch_in_Manager";
export default function App() {
  return (
    <div>
    <Routes>
      <Route path="/" element={<UserLogin />} />
      <Route path="/employee/punch" element={<Punch_in />}/>
      <Route path="/leaves/dashboard" element={<Leave_dashboard />} />
      <Route path="/employee/profile" element ={<ProfileSetup />} />
      <Route path = "/register" element = {<UserRegister />} />
      <Route path = "/manager/profile" element = {<ManagerProfileSetup />} />
      <Route path = "/manager/punch" element = {<Punch_in_Manager />} />
    </Routes>
    <Toaster />
    </div>

  );
}
