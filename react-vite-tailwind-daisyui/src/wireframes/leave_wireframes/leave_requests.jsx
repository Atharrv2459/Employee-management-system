import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function LeaveHistory() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [filters, setFilters] = useState({ status: "All Status" });
  const [selectedLeave, setSelectedLeave] = useState(null);
const [modalType, setModalType] = useState(""); 


const openViewModal = (leave) => {
  setSelectedLeave(leave);
  setModalType("view");
  document.getElementById("leave_modal").showModal();
};

const openEditModal = (leave) => {
  setSelectedLeave(leave);
  setModalType("edit");
  document.getElementById("leave_modal").showModal();
};


  const token = localStorage.getItem("token");
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB') : "";

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leaves, filters]);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/leaves/get", {
        headers: { Authorization: token },
      });
      setLeaves(res.data.data);
    } catch (err) {
      toast.error("Failed to load leaves",err);
    }
  };

  const applyFilters = () => {
    let temp = [...leaves];
    if (filters.status !== "All Status") {
      temp = temp.filter((leave) => leave.status.toLowerCase() === filters.status.toLowerCase());
    }
    setFilteredLeaves(temp);
  };

  const handleCancel = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/leaves/cancel/${id}`, {
        headers: { Authorization: token },
      });
      toast.success("Leave cancelled");
      fetchLeaves();
    } catch (err) {
      toast.error("Failed to cancel");
    }
  };

  const stats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
    cancelled: leaves.filter((l) => l.status === "cancelled").length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
     
      <div className="bg-white rounded-b-xl shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="font-bold text-xl">My Leave Request History</div>
          <div className="flex gap-2">
            <button className="btn btn-primary">📝 Apply New Leave</button>
            <button className="btn btn-success">📊 Export History</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Requests" value={stats.total} color="text-blue-600" />
          <StatCard label="Pending Approval" value={stats.pending} color="text-yellow-500" />
          <StatCard label="Approved" value={stats.approved} color="text-green-600" />
          <StatCard label="Rejected" value={stats.rejected} color="text-red-500" />
          <StatCard label="Cancelled" value={stats.cancelled} color="text-gray-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-sm">Status:</label>
            <select
              className="select select-bordered select-sm"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option>All Status</option>
              <option>pending</option>
              <option>approved</option>
              <option>rejected</option>
              <option>cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border mb-6">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
            
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Days</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((leave) => (
                <tr key={leave.id}>
                
                  <td>{formatDate(leave.leave_type)}</td>
                  <td>{formatDate(leave.start_date)}</td>
                  <td>{formatDate(leave.end_date)}</td>
                  <td>{leave.start_date && leave.end_date ? Math.floor((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1
                    : "-"}</td>
                  <td>
                    <span
                      className={`badge ${
                        leave.status === "approved"
                          ? "badge-success"
                          : leave.status === "pending"
                          ? "badge-warning"
                          : leave.status === "rejected"
                          ? "badge-error"
                          : "badge-neutral"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </td>
                  <td>{leave.created_at?.split("T")[0]}</td>
                  <td>{leave.updated_at?.split("T")[0]}</td>
                  <td className="space-x-1">
                    <button className="btn btn-primary btn-xs" onClick={() => openViewModal(leave)}>View</button>
                    {leave.status === "pending" && (
                      <>
                        <button className="btn btn-warning btn-xs" onClick={() => openEditModal(leave)}>Edit</button>
                        <button className="btn btn-error btn-xs" onClick={() => handleCancel(leave.id)}>Cancel</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-4">No leave requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

    
      </div>
     


     <dialog id="leave_modal" className="modal">
  <div className="modal-box max-w-2xl">
    <h3 className="font-bold text-lg mb-4">
      {modalType === "view" ? "Leave Details" : "Update Leave Request"}
    </h3>

    {selectedLeave && (
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {/* Leave Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Leave Type</label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={selectedLeave.leave_type || ""}
            readOnly={modalType === "view"}
            onChange={(e) =>
              setSelectedLeave({ ...selectedLeave, leave_type: e.target.value })
            }
          />
        </div>

        {/* Start and End Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={selectedLeave.start_date?.split("T")[0] || ""}
              readOnly={modalType === "view"}
              onChange={(e) =>
                setSelectedLeave({ ...selectedLeave, start_date: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={selectedLeave.end_date?.split("T")[0] || ""}
              readOnly={modalType === "view"}
              onChange={(e) =>
                setSelectedLeave({ ...selectedLeave, end_date: e.target.value })
              }
            />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium mb-1">Reason</label>
          <textarea
            className="textarea textarea-bordered w-full"
            value={selectedLeave.reason || ""}
            readOnly={modalType === "view"}
            onChange={(e) =>
              setSelectedLeave({ ...selectedLeave, reason: e.target.value })
            }
          ></textarea>
        </div>

        {/* Work Handover */}
        <div>
          <label className="block text-sm font-medium mb-1">Work Handover</label>
          <textarea
            className="textarea textarea-bordered w-full"
            value={selectedLeave.work_handover || ""}
            readOnly={modalType === "view"}
            onChange={(e) =>
              setSelectedLeave({ ...selectedLeave, work_handover: e.target.value })
            }
          ></textarea>
        </div>

        {/* Emergency Contact */}
        <div>
          <label className="block text-sm font-medium mb-1">Emergency Contact</label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={selectedLeave.emergency_contact || ""}
            readOnly={modalType === "view"}
            onChange={(e) =>
              setSelectedLeave({ ...selectedLeave, emergency_contact: e.target.value })
            }
          />
        </div>

        {/* File Upload for Edit Mode */}
        {modalType === "edit" && (
          <div>
            <label className="block text-sm font-medium mb-1">Supporting Document</label>
            <input type="file" className="file-input file-input-bordered w-full" />
          </div>
        )}
      </div>
    )}

    <div className="modal-action mt-4">
      <form method="dialog" className="space-x-2">
        {modalType === "edit" && (
          <button className="btn btn-success" onClick={() => handleUpdateLeave()}>
            Save Changes
          </button>
        )}
        <button className="btn">Close</button>
      </form>
    </div>
  </div>
</dialog>


    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white p-4 rounded-xl border text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-gray-500">{label}</p>
    </div>
  );
}
