import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Manager_report from "./Manager_report";
import {
  FiUser, FiBarChart2, FiCheckSquare, FiClock,
  FiChevronRight, FiAlertTriangle, FiCalendar, FiArrowRight
} from 'react-icons/fi';

export default function ManagerDashboard() {
  const [myTeam, setMyTeam] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [realTimeStatus, setRealTimeStatus] = useState([]);
  const [managerName, setManagerName] = useState("");
  const [presentCount, setPresentCount] = useState(0);
  const [onLeaveCount, setOnLeaveCount] = useState(0);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchManagerDetails = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/manager/get", {
          headers: { Authorization: token },
        });
        const manager = res.data.data;
        setManagerName(`${manager.first_name} ${manager.last_name}`);
      } catch (err) {
        console.log("Failed to fetch manager details", err);
      }
    };

    const fetchTeamStatus = async () => {
  try {
    const res = await axios.get("http://localhost:5001/api/attendance/manager-team-status", {
      headers: { Authorization: token },
    });

    const data = res.data.data;
    setMyTeam(data);

    const present = data.filter(emp => emp.status === "Present");
    const onLeave = data.filter(emp => emp.status === "On Leave");

    setPresentCount(present.length);
    setOnLeaveCount(onLeave.length);

    const realTimeData = data.map(emp => ({
      name: `${emp.first_name} ${emp.last_name}`,
      status: emp.status,
      time: emp.status === "Present"
        ? "Working currently"
        : emp.status === "On Leave"
          ? "On approved leave"
          : "Not available"
    }));

    setRealTimeStatus(realTimeData);

  } catch (err) {
    console.error("Error fetching team status:", err);
    toast.error("Unable to fetch team status");
  }
};

    const fetchPendingApprovals = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/manual_entry/pending", {
          headers: { Authorization: token },
        });
        setPendingApprovals(res.data.data);
      } catch (err) {
        console.error("Error fetching approvals:", err);
      }
    };

    const fetchPendingLeaves = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/leave-management/get", {
          headers: { Authorization: token },
        });
        setPendingLeaves(res.data.data);
      } catch (err) {
        console.error("Error fetching leaves:", err);
      }
    };

    fetchManagerDetails();
    fetchTeamStatus();
    fetchPendingApprovals();
    fetchPendingLeaves();
  }, [token]);

  const handleLeaveAction = async (leaveId, action) => {
    try {
      const res = await axios.patch(
        `http://localhost:5001/api/leave-management/status/${leaveId}`,
        { status: action },
        { headers: { Authorization: token } }
      );
      toast.success(res.data.message);
      setPendingLeaves(prev => prev.filter(leave => leave.id !== leaveId));
    } catch (err) {
      toast.error("Failed to update leave status.");
    }
  };

  const StatCard = ({ icon, title, value, color }) => (
    <div className={`bg-white p-4 rounded-xl shadow-md flex items-center space-x-4`}>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {managerName || "Manager"}!</h1>
          <p className="text-gray-500">Here's a snapshot of your team's activities today.</p>
        </header>

    
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<FiUser size={24} className="text-blue-500" />} title="Total Team" value={myTeam.length} color="bg-blue-100" />
          <StatCard icon={<FiCheckSquare size={24} className="text-green-500" />} title="Present Today" value={presentCount} color="bg-green-100" />
          <StatCard icon={<FiCalendar size={24} className="text-yellow-500" />} title="On Leave" value={onLeaveCount} color="bg-yellow-100" />
          <StatCard icon={<FiAlertTriangle size={24} className="text-red-500" />} title="Pending Approvals" value={pendingLeaves.length + pendingApprovals.length} color="bg-red-100" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Pending Approvals Queue</h2>
                <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center">
                  <FiCheckSquare className="mr-2" /> Batch Approve
                </button>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pendingLeaves.map(leave => (
                  <div key={leave.id} className="border rounded-xl p-4 bg-red-50 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-red-800">Emergency Leave Request</h3>
                        <p className="text-sm text-gray-600 mt-1">{leave.first_name} {leave.last_name} - {leave.reason}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleLeaveAction(leave.id, 'approved')} className="bg-green-200 text-green-800 px-3 py-1 rounded-md hover:bg-green-300">Approve</button>
                        <button onClick={() => handleLeaveAction(leave.id, 'rejected')} className="bg-red-200 text-red-800 px-3 py-1 rounded-md hover:bg-red-300">Deny</button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingApprovals.map(entry => (
                  <div key={entry.id} className="border rounded-xl p-4 bg-blue-50 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-blue-800">Timesheet Correction</h3>
                        <p className="text-sm text-gray-600 mt-1">{entry.employee_name} - {entry.reason}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="bg-green-200 text-green-800 px-3 py-1 rounded-md hover:bg-green-300">Approve</button>
                        <button className="bg-red-200 text-red-800 px-3 py-1 rounded-md hover:bg-red-300">Deny</button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingLeaves.length === 0 && pendingApprovals.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No pending approvals. Great job!</p>
                )}
              </div>
              <button className="w-full mt-6 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center" onClick={() => navigate('/manager/report')}>
                View Detailed Reports <FiArrowRight className="ml-2" />
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Team Members */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Team Members ({myTeam.length})</h2>
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {myTeam.map((emp, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center mr-3">
                        <span className="font-bold text-blue-600">{emp.first_name.charAt(0)}{emp.last_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-gray-500">{emp.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      emp.status === 'Present'
                        ? 'bg-green-100 text-green-800'
                        : emp.status === 'On Leave'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>{emp.status}</span>
                  </li>
                ))}
                {myTeam.length === 0 && <p className="text-sm text-gray-500">No team members found.</p>}
              </ul>
            </div>

            {/* Real-time Status */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Real-Time Status</h2>
              <div className="space-y-4">
                {realTimeStatus.map((item, idx) => (
                  <div key={idx} className="flex items-center">
                    <FiClock className="text-purple-500 mr-3" size={20} />
                    <div>
                      <p className="font-semibold text-gray-700">
                        {item.name} - <span className={
                          item.status === 'Present' ? 'text-green-600' :
                          item.status === 'On Leave' ? 'text-yellow-600' :
                          'text-red-600'
                        }>
                          {item.status}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Manager_report />
        </div>
      </div>
    </div>
  );
}
