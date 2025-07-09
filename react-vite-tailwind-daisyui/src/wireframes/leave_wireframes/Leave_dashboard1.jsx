import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function LeaveBalanceDashboard() {
  const [leaveBalances, setLeaveBalances] = useState([]);

  const token = localStorage.getItem("token");

  const leaveTypes = [
    { type: "annual", label: "Annual Leave", color: "green", badge: "Healthy" },
    { type: "sick", label: "Sick Leave", color: "yellow", badge: "Expiring Soon" },
    { type: "personal", label: "Personal Leave", color: "red", badge: "Low Balance" },
    { type: "maternity", label: "Maternity Leave", color: "purple", badge: "Special" }
  ];

  useEffect(() => {
    fetchLeaveBalances();
  }, []);

  const fetchLeaveBalances = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/leaves/balance", {
        headers: { Authorization: token },
      });
      setLeaveBalances(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leave balances",err);
    }
  };

 const getLeaveData = (type) => {
  const data = leaveBalances.find((l) => l.leave_type === type);
  const total = data?.total_leaves || 0;
  const used = data?.used_leaves || 0;
  const remaining = total - used;  // ✅ Simple calculation

  return {
    total,
    used,
    remaining,
    accrual: data?.next_accrual ? new Date(data.next_accrual).toDateString() : "--",
    expiry: data?.expiry_date ? new Date(data.expiry_date).toDateString() : "--",
  };
};

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">My Leave Balance Summary</h1>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button className="btn-primary">📝 Apply Leave</button>
          <button className="btn-success">📊 Export Report</button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {leaveTypes.map((leave) => {
          const data = getLeaveData(leave.type);
          const percentage = data.total > 0 ? Math.floor((data.remaining / data.total) * 100) : 0;

          return (
            <div key={leave.type} className={`card border-l-4 border-${leave.color}-500 bg-white shadow rounded-xl p-4`}>
              <div className="flex justify-between mb-3">
                <div className="font-bold text-lg">{leave.label}</div>
                <div className={`badge badge-${leave.color}`}>{leave.badge}</div>
              </div>
              <div className="text-center mb-3">
                <div className="text-4xl font-bold text-blue-600">{data.remaining}</div>
                <div className="text-sm text-gray-500">days available</div>
              </div>
              <progress
                className={`progress progress-${leave.color} w-full`}
                value={percentage}
                max="100"
              ></progress>
              <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                <div className="flex justify-between"><span>Total Entitled:</span><span className="font-bold">{data.total} days</span></div>
                <div className="flex justify-between"><span>Used:</span><span className="font-bold">{data.used} days</span></div>
                <div className="flex justify-between"><span>Next Accrual:</span><span className="font-bold">{data.accrual}</span></div>
                <div className="flex justify-between"><span>Expires:</span><span className="font-bold">{data.expiry}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
