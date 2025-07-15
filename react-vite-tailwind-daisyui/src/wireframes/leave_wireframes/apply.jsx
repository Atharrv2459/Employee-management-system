import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function LeaveApplication() {
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [handover, setHandover] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [supportingDocs, setSupportingDocs] = useState(null);
  const [managerId, setManagerId] = useState("");

  const [managers, setManagers] = useState([]);
  const [daysRequested, setDaysRequested] = useState(0);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/manager/getAll");
        setManagers(res.data.data || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load managers.");
      }
    };
    fetchManagers();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const diffTime = new Date(endDate) - new Date(startDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDaysRequested(diffDays > 0 ? diffDays : 0);
    } else {
      setDaysRequested(0);
    }
  }, [startDate, endDate]);

  const handleFileChange = (e) => {
    setSupportingDocs(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!leaveType || !startDate || !endDate || !reason || !managerId) {
      toast.error("Please fill all required fields.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in.");
      return;
    }

    try {
      const payload = {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason,
        work_handover: handover,
        emergency_contact: emergencyContact,
        manager_id: managerId,
      };

      const res = await axios.post("http://localhost:5001/api/leaves/apply", payload, {
        headers: { Authorization: token },
      });

      toast.success(res.data.message || "Leave applied successfully.");

      setLeaveType("");
      setStartDate("");
      setEndDate("");
      setReason("");
      setHandover("");
      setEmergencyContact("");
      setSupportingDocs(null);
      setManagerId("");
      setDaysRequested(0);

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Something went wrong.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-200 rounded-xl shadow-md my-10">
      <h2 className="text-lg font-semibold mb-4">Apply for Leave</h2>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Leave Type *</label>
        <select
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
          className="w-full rounded border px-3 py-2 outline-none "
        >
          <option value="">Select leave type</option>
          <option value="sick">Sick Leave</option>
          <option value="personal">Personal Leave</option>
          <option value="maternity">Maternity Leave</option>
          
          <option value="annual">Annual Leave</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 font-medium">Start Date *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">End Date *</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Reason for Leave *</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full rounded border outline-none px-3 py-2"
          placeholder="Provide a brief explanation..."
        ></textarea>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Work Handover Instructions</label>
        <textarea
          value={handover}
          onChange={(e) => setHandover(e.target.value)}
          rows={3}
          className="w-full rounded border outline-none px-3 py-2"
          placeholder="Describe how your work will be handled..."
        ></textarea>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Emergency Contact</label>
        <input
          type="text"
          value={emergencyContact}
          onChange={(e) => setEmergencyContact(e.target.value)}
          placeholder="Name and phone number"
          className="w-full rounded border px-3 py-2 outline-none "
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Select Manager *</label>
        <select
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
          className="w-full rounded border px-3 py-2 outline-none"
        >
          <option value="">Select manager</option>
          {managers.map((manager) => (
            <option key={manager.manager_id} value={manager.manager_id}>
              {manager.first_name} {manager.last_name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 border-2 border-dashed border-gray-300 rounded p-4 text-center">
        <label className="block mb-2 font-medium">Supporting Documents</label>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileChange} />
        <p className="text-sm text-gray-500 mt-2">Supported formats: PDF, JPG, PNG, DOC</p>
      </div>

      <div className="bg-blue-50 p-4 rounded mt-6">
        <h3 className="font-semibold mb-2">📊 Leave Summary</h3>
        <p>Total Days Requested: {daysRequested}</p>
        <p>Remaining Balance: --</p>
        <p>Return Date: --</p>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-6 w-full bg-blue-600 text-white font-semibold rounded py-2 hover:bg-blue-700"
      >
        Apply for Leave
      </button>
    </div>
  );
}
