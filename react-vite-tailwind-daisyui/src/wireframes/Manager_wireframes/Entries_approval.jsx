// ManagerManualApproval.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function ManagerManualApproval() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const token = localStorage.getItem("token");

  const fetchEntries = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/manager/manual_entries", {
        headers: { Authorization: token },
      });
      const all = res.data.data || [];
      setEntries(all);
      setSummary({
        total: all.length,
        pending: all.filter(e => e.status === "pending").length,
        approved: all.filter(e => e.status === "approved").length,
        rejected: all.filter(e => e.status === "rejected").length,
      });
    } catch (err) {
      toast.error("Failed to load manual entries");
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5001/api/manual_entry/approve/${id}`, {}, {
        headers: { Authorization: token },
      });
      toast.success("Approved");
      fetchEntries();
    } catch {
      toast.error("Approval failed");
    }
  };

  const handleReject = async () => {
    try {
      await axios.put(`http://localhost:5001/api/manual_entry/reject/${selectedEntry.manual_id}`,
        { rejection_reason: rejectionReason },
        { headers: { Authorization: token } }
      );
      toast.success("Rejected");
      setRejectionReason("");
      setSelectedEntry(null);
      document.getElementById("rejectModal").close();
      fetchEntries();
    } catch {
      toast.error("Rejection failed");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-purple-700">Manual Entry Approvals</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card bg-orange-100 p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold">Total Requests</h3>
          <p className="text-2xl font-bold text-orange-600">{summary.total}</p>
        </div>
        <div className="card bg-yellow-100 p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
        </div>
        <div className="card bg-green-100 p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold">Approved</h3>
          <p className="text-2xl font-bold text-green-600">{summary.approved}</p>
        </div>
        <div className="card bg-red-100 p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold">Rejected</h3>
          <p className="text-2xl font-bold text-red-600">{summary.rejected}</p>
        </div>
      </div>

      {/* Pending List */}
      <div className="grid gap-4">
        {entries.filter(e => e.status === "pending").map(entry => (
          <div key={entry.manual_id} className="border border-yellow-300 rounded-xl p-4 bg-white shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-md text-gray-700">
                  {new Date(entry.date).toDateString()} - {entry.entry_time} - {entry.entry_type}
                </p>
                <p className="text-sm text-gray-500 mt-1">{entry.reason_type} | {entry.explanation}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-success btn-sm" onClick={() => handleApprove(entry.manual_id)}>Approve</button>
                <button className="btn btn-error btn-sm" onClick={() => {
                  setSelectedEntry(entry);
                  document.getElementById("rejectModal").showModal();
                }}>Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Modal */}
      <dialog id="rejectModal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Reject Manual Entry</h3>
          <p className="py-2">Provide a reason for rejection:</p>
          <textarea
            className="textarea textarea-bordered w-full"
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          ></textarea>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn" onClick={() => setRejectionReason("")}>Cancel</button>
              <button className="btn btn-error ml-2" onClick={handleReject}>Reject</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}
