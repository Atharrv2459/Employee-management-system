import { Routes } from "react-router-dom";
import UserLogin from "./wireframes/UserLogin";
import ReactDOM from 'react-dom/client'
import { Link, Route,BrowserRouter } from "react-router-dom";
import Punch_in from "./wireframes/Punch_in";
import Leave_dashboard from "./wireframes/leave_wireframes/leave_dashboard";
import { Toaster } from "react-hot-toast";
import ProfileSetup from "./wireframes/ProfileSetup";
export default function App() {
  return (
    <div>
    <Routes>
      <Route path="/" element={<UserLogin />} />
      <Route path="/punch" element={<Punch_in />}/>
      <Route path="/leaves/dashboard" element={<Leave_dashboard />} />
      <Route path="/employee/profile" element ={<ProfileSetup />} />

    </Routes>
    <Toaster />
    </div>

  );
}
