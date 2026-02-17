import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function Manual_entry() {
  const [entryType, setEntryType] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [reason, setReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [entries, setEntries] = useState([]);
  const [editModalEntry, setEditModalEntry] = useState(null);
  const [todayTimes, setTodayTimes] = useState({
    punch_in: "-",
    punch_out: "-",
    break_start: "-",
    break_end: "-",
  });

  const fetchManualEntries = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5001/api/manual_entry/myEntries", {
        headers: { Authorization: token },
      });
      setEntries(res.data.data);

      const today = new Date().toISOString().split("T")[0];
      const todayEntries = res.data.data.filter((e) => e.date === today);
      const times = {
        punch_in: todayEntries.find((e) => e.entry_type === "Clock In")?.entry_time || "-",
        punch_out: todayEntries.find((e) => e.entry_type === "Clock Out")?.entry_time || "-",
        break_start: todayEntries.find((e) => e.entry_type === "Break Start")?.entry_time || "-",
        break_end: todayEntries.find((e) => e.entry_type === "Break End")?.entry_time || "-",
      };
      setTodayTimes(times);
    } catch (error) {
      toast.error("Failed to fetch entries");
      console.error(error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchManualEntries();
  }, []);

  const handleCreate = async () => {
    if (!entryType || !entryDate || !entryTime || !workLocation || !reason || explanation.trim().length < 20) {
      toast.error("Please fill all fields and provide at least 20 characters explanation.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        entry_type: entryType,
        entry_time: entryTime,
        date: entryDate,
        work_location: workLocation,
        project_code: projectCode,
        reason_type: reason,
        explanation,
      };

      await axios.post("http://localhost:5001/api/manual_entry/create", payload, {
        headers: { Authorization: token },
      });

      toast.success("Entry created successfully");
      fetchManualEntries();
      setEntryType("");
      setEntryDate("");
      setEntryTime("");
      setWorkLocation("");
      setProjectCode("");
      setReason("");
      setExplanation("");
    } catch (err) {
      toast.error("Creation failed");
      console.error(err.response?.data || err.message);
    }
  };

  const handleSubmit = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://localhost:5001/api/manual_entry/${id}/submit`, {}, {
        headers: { Authorization: token },
      });
      toast.success("Submitted for approval");
      fetchManualEntries();
    } catch (err) {
      toast.error("Submission failed");
      console.error(err.response?.data || err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5001/api/manual_entry/${id}/delete`, {
        headers: { Authorization: token },
      });
      toast.success("Entry deleted");
      fetchManualEntries();
    } catch (error) {
      toast.error("Delete failed");
      console.error(error.response?.data || error.message);
    }
  };

  const handleUpdate = (entry) => {
    setEditModalEntry(entry);
    document.getElementById("edit_modal").showModal();
  };

  const handleSaveUpdate = async () => {
    if (!editModalEntry || editModalEntry.explanation.trim().length < 20) {
      toast.error("Please provide all fields and at least 20 characters explanation.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5001/api/manual_entry/${editModalEntry.manual_id}/update`,
        {
          entry_type: editModalEntry.entry_type,
          entry_time: editModalEntry.entry_time,
          date: editModalEntry.date,
          work_location: editModalEntry.work_location,
          project_code: editModalEntry.project_code,
          reason_type: editModalEntry.reason_type,
          explanation: editModalEntry.explanation,
        },
        {
          headers: { Authorization: token },
        }
      );

      toast.success("Manual entry updated");
      fetchManualEntries();
      document.getElementById("edit_modal").close();
      setEditModalEntry(null);
    } catch (error) {
      toast.error("Update failed");
      console.error(error.response?.data || error.message);
    }
  };

  return (
    <div className="flex w-full flex-col">
      {/* Header */}
      <div className="card bg-yellow-600 text-white rounded-btn mx-16 h-10 place-items-center my-5 flex flex-row justify-between font-semibold">
        <p className="mx-5">📝 New Manual Entry</p>
        <p className="mr-5">Requires Manager Approval | Auto-save enabled</p>
      </div>

      {/* Guidelines */}
      <div className="card bg-blue-300 rounded-box flex flex-col h-auto p-4 place-items-center mx-6">
        <p className="text-green-800 font-bold">ℹ️ Manual Entry Guidelines</p>
        <p className="text-green-800">
          Manual time entries are for corrections or when automatic punching isn't available.
          All entries require manager approval and must include a valid reason.
        </p>
      </div>

      {/* Main Section */}
      <div className="flex flex-col lg:flex-row gap-8 mt-6 mx-6">
        {/* Left Form */}
        <div className="card bg-base-200 p-6 w-full lg:w-1/2 space-y-4">
          <h2 className="font-semibold text-lg">📝 Manual Entry</h2>

          <select value={entryType} onChange={(e) => setEntryType(e.target.value)} className="select select-bordered w-full">
            <option disabled value="">Select entry type…</option>
            <option>Punch In</option>
            <option>Punch Out</option>
            <option>Break Start</option>
            <option>Break End</option>
          </select>

          <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="input input-bordered w-full" />
          <input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} className="input input-bordered w-full" />

          <select value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} className="select select-bordered w-full">
            <option disabled value="">Select work location…</option>
            <option>Main Office</option>
            <option>Remote work</option>
            <option>Client Site - Downtown Office</option>
            <option>Client Site - Uptown Office</option>
            <option>Other (specify in reason)</option>
          </select>

          <input type="text" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} placeholder="Project Code (Optional)" className="input input-bordered w-full" />

          <select value={reason} onChange={(e) => setReason(e.target.value)} className="select select-bordered w-full">
            <option disabled value="">Select primary reason…</option>
            <option>Forgot to punch in/out</option>
            <option>System was down/unavailable</option>
            <option>Network connectivity issue</option>
            <option>Emergency or urgent situation</option>
            <option>Travel delay or transportation issue</option>
            <option>Power outage</option>
            <option>Urgent meeting</option>
            <option>Other (Please specify in the explanation)</option>
          </select>

          <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Enter detailed explanation (Min. 20 chars)" className="textarea textarea-bordered w-full min-h-[100px]" />

          <div className="flex gap-4 justify-end pt-4">
            <button className="btn btn-secondary" onClick={handleCreate}>🆕 Create Entry</button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="card bg-base-200 p-6 w-full lg:w-1/2 space-y-6">
          <h2 className="font-semibold text-lg">📅 Today's Punch Summary</h2>
          <ul className="grid grid-cols-2 gap-4 text-sm">
            <li><strong>Punch In:</strong> {todayTimes.punch_in}</li>
            <li><strong>Punch Out:</strong> {todayTimes.punch_out}</li>
            <li><strong>Break Start:</strong> {todayTimes.break_start}</li>
            <li><strong>Break End:</strong> {todayTimes.break_end}</li>
          </ul>

          {/* Unsubmitted Entries */}
          <h2 className="font-semibold text-lg mt-6">📝 Unsubmitted Entries</h2>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {entries.filter(e => e.status === "draft").length === 0 && <p className="text-gray-500">No unsubmitted entries.</p>}
            {entries.filter(e => e.status === "draft").map((entry) => (
              <li key={entry.manual_id} className="bg-white shadow rounded-xl p-4 flex flex-col">
                <span className="font-semibold text-sm text-blue-700">{new Date(entry.date).toLocaleDateString()} - {entry.entry_type}</span>
                <span className="text-xs text-gray-500">{entry.status.toUpperCase()}</span>
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-xs btn-primary" onClick={() => handleSubmit(entry.manual_id)}>📤 Submit</button>
                  <button className="btn btn-xs btn-warning" onClick={() => handleUpdate(entry)}>📝 Update</button>
                  <button className="btn btn-xs btn-error" onClick={() => handleDelete(entry.manual_id)}>❌ Delete</button>
                </div>
              </li>
            ))}
          </ul>

          {/* Submitted Entries */}
          <h2 className="font-semibold text-lg mt-6">✅ Submitted Entries</h2>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {entries.filter(e => e.status !== "draft").length === 0 && <p className="text-gray-500">No submitted entries.</p>}
            {entries.filter(e => e.status !== "draft").map((entry) => (
              <li key={entry.manual_id} className="bg-white shadow rounded-xl p-4 flex flex-col">
                <span className="font-semibold text-sm text-blue-700">{new Date(entry.date).toLocaleDateString()} - {entry.entry_type}</span>
                <span className="text-xs text-gray-500">{entry.status.toUpperCase()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Edit Modal */}
      <dialog id="edit_modal" className="modal">
        <div className="modal-box max-w-2xl">
          <h3 className="font-bold text-lg mb-2">📝 Edit Manual Entry</h3>
          {editModalEntry && (
            <div className="space-y-3">
              <select className="select select-bordered w-full" value={editModalEntry.entry_type} onChange={(e) => setEditModalEntry({ ...editModalEntry, entry_type: e.target.value })}>
                <option>Punch In</option>
                <option>Punch Out</option>
                <option>Break Start</option>
                <option>Break End</option>
              </select>
              <input type="date" className="input input-bordered w-full" value={editModalEntry.date} onChange={(e) => setEditModalEntry({ ...editModalEntry, date: e.target.value })} />
              <input type="time" className="input input-bordered w-full" value={editModalEntry.entry_time} onChange={(e) => setEditModalEntry({ ...editModalEntry, entry_time: e.target.value })} />
              <select className="select select-bordered w-full" value={editModalEntry.work_location} onChange={(e) => setEditModalEntry({ ...editModalEntry, work_location: e.target.value })}>
                <option>Main Office</option>
                <option>Remote work</option>
                <option>Client Site - Downtown Office</option>
                <option>Client Site - Uptown Office</option>
                <option>Other (specify in reason)</option>
              </select>
              <input type="text" className="input input-bordered w-full" placeholder="Project Code (Optional)" value={editModalEntry.project_code || ""} onChange={(e) => setEditModalEntry({ ...editModalEntry, project_code: e.target.value })} />
              <select className="select select-bordered w-full" value={editModalEntry.reason_type} onChange={(e) => setEditModalEntry({ ...editModalEntry, reason_type: e.target.value })}>
                <option>Forgot to punch in/out</option>
                <option>System was down/unavailable</option>
                <option>Network connectivity issue</option>
                <option>Emergency or urgent situation</option>
                <option>Travel delay or transportation issue</option>
                <option>Power outage</option>
                <option>Urgent meeting</option>
                <option>Other (Please specify in the explanation)</option>
              </select>
              <textarea className="textarea textarea-bordered w-full min-h-[100px]" value={editModalEntry.explanation} onChange={(e) => setEditModalEntry({ ...editModalEntry, explanation: e.target.value })} />
            </div>
          )}
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Close</button>
            </form>
            <button className="btn btn-primary" onClick={handleSaveUpdate}>💾 Save Changes</button>
          </div>
        </div>
      </dialog>
      <br></br>
      <br></br>    </div>
  );
}
