import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Manager_report from "./Manager_report";

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

    const fetchTeam = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/manager/myTeam", {
          headers: { Authorization: token },
        });
        const team = res.data.data;
        setMyTeam(team);

        const present = team.filter(emp => emp.status === "Present").length;
        const onLeave = team.filter(emp => emp.status === "On Leave").length;

        setPresentCount(present);
        setOnLeaveCount(onLeave);
      } catch (err) {
        console.error("Error fetching team:", err);
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

    const fetchRealTimeStatus = () => {
      setRealTimeStatus([
        { name: "Mike Chen", status: "On Break", time: "2:15 PM - Back 2:30 PM" },
        { name: "Emily Rodriguez", status: "Late", time: "Arrived 9:30 AM" },
      ]);
    };

    fetchManagerDetails();
    fetchTeam();
    fetchPendingApprovals();
    fetchPendingLeaves();
    fetchRealTimeStatus();
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

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-blue-700 mb-4">Welcome, {managerName || "Manager"}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-blue-800 mb-4">Team Overview</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-blue-600">{myTeam.length}</p>
              <p className="text-gray-500">Total Team</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-green-600">{presentCount}</p>
              <p className="text-gray-500">Present Today</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-yellow-600">{onLeaveCount}</p>
              <p className="text-gray-500">On Leave</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-purple-600">-</p>
              <p className="text-gray-500">Remote Work</p>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
            Attendance Rate: {myTeam.length > 0 ? Math.round((presentCount / myTeam.length) * 100) : 0}%
          </div>
        </div>

   <div className="bg-white p-4 rounded-xl shadow">
  <h2 className="text-lg font-semibold mb-2">Team Members</h2>
  <ul className="space-y-2 max-h-40 overflow-y-auto">
    {myTeam.map((emp, idx) => (
      <li key={idx} className="flex flex-col p-2 border rounded-lg bg-blue-50">
        <span className="font-semibold">{emp.first_name} {emp.last_name}</span>
        <span className="text-sm text-gray-600">{emp.email}</span>
      </li>
    ))}
    {myTeam.length === 0 && <p className="text-sm text-gray-500">No team members found.</p>}
  </ul>
</div>

      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold">Pending Approvals Queue ({pendingLeaves.length + pendingApprovals.length})</h2>
          <button className="btn btn-success btn-sm">✔ Batch Approve</button>
        </div>

        <div className="space-y-4 max-h-72 overflow-y-auto">
          {pendingLeaves.map(leave => (
            <div key={leave.id} className="border rounded-lg p-4 bg-red-50">
              <h3 className="font-bold mb-1">Emergency Leave Request</h3>
              <p className="text-sm mb-2">{leave.first_name} {leave.last_name} - {leave.reason}</p>
              <div className="flex space-x-2">
                <button onClick={() => handleLeaveAction(leave.id, 'approved')} className="btn btn-success btn-sm">✔ Approve</button>
                <button onClick={() => handleLeaveAction(leave.id, 'rejected')} className="btn btn-error btn-sm">✖ Deny</button>
              </div>
            </div>
          ))}

          {pendingApprovals.map(entry => (
            <div key={entry.id} className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-bold mb-1">Timesheet Correction</h3>
              <p className="text-sm mb-2">{entry.employee_name} - {entry.reason}</p>
              <div className="flex space-x-2">
                <button className="btn btn-success btn-sm">✔ Approve</button>
                <button className="btn btn-error btn-sm">✖ Deny</button>
              </div>
            </div>
          ))}

          {pendingLeaves.length === 0 && pendingApprovals.length === 0 && (
            <p className="text-sm text-gray-500">No pending approvals.</p>
          )}
        </div>

        <button className="btn btn-primary mt-4" onClick={() => navigate('/manager/report')}>View Detailed Reports</button>
      </div>
      <Manager_report />
    </div>
  );
}
