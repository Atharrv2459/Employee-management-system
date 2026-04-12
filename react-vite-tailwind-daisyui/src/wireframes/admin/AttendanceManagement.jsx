import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiMapPin, FiUsers, FiCalendar } from "react-icons/fi";

const API_BASE = "http://localhost:5001/api";

const toLocalISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fmtTime = (dt) => {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(dt);
  }
};

const fmtDate = (dt) => {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleDateString();
  } catch {
    return String(dt);
  }
};

const mapUrl = (lat, lng) => {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

export default function AttendanceManagement() {
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [startDate, setStartDate] = useState(() => toLocalISODate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const [endDate, setEndDate] = useState(() => toLocalISODate(new Date()));

  const [rows, setRows] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);

  const selectedUser = useMemo(
    () => users.find((u) => u.user_id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const fetchUsers = async () => {
    if (!token) {
      setLoadingUsers(false);
      return;
    }

    setLoadingUsers(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: token },
      });
      const list = res.data?.data || [];
      setUsers(list);
      if (!selectedUserId && list.length > 0) setSelectedUserId(list[0].user_id);
    } catch (e) {
      console.error("Failed to load users", e);
      toast.error(e.response?.data?.error || "Failed to load users");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAttendance = async () => {
    if (!token) {
      toast.error("Missing token");
      return;
    }
    if (!selectedUserId) {
      toast.error("Select a user");
      return;
    }

    setLoadingRows(true);
    try {
      const res = await axios.get(`${API_BASE}/attendance/admin/user/${selectedUserId}`, {
        params: { start_date: startDate, end_date: endDate },
        headers: { Authorization: token },
      });
      setRows(res.data?.data || []);
    } catch (e) {
      console.error("Failed to load attendance", e);
      toast.error(e.response?.data?.error || "Failed to load attendance");
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (selectedUserId) fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Attendance & Locations</h1>
              <p className="text-gray-500">View a user’s punch in/out times and locations.</p>
            </div>

            <button className="btn btn-primary" onClick={fetchAttendance} disabled={loadingRows}>
              {loadingRows ? <span className="loading loading-spinner loading-sm"></span> : "Refresh"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FiUsers /> User
              </div>
              <select
                className="select select-bordered w-full"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loadingUsers}
              >
                {loadingUsers && <option>Loading…</option>}
                {!loadingUsers && users.length === 0 && <option value="">No users</option>}
                {!loadingUsers && users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {(u.first_name || "") + " " + (u.last_name || "")}{u.email ? ` (${u.email})` : ""}
                  </option>
                ))}
              </select>
              {selectedUser && (
                <div className="mt-2 text-xs text-gray-500">
                  Role ID: {selectedUser.role_id}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FiCalendar /> Date range
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="label"><span className="label-text text-xs">Start</span></label>
                  <input className="input input-bordered w-full" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="label"><span className="label-text text-xs">End</span></label>
                  <input className="input input-bordered w-full" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Filters by punch-in date.</p>
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-gray-700 font-semibold mb-2">Quick info</div>
              <div className="text-sm text-gray-600">Records: <span className="font-semibold">{rows.length}</span></div>
              <div className="text-sm text-gray-600">Showing: <span className="font-semibold">{startDate}</span> → <span className="font-semibold">{endDate}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>In Location</th>
                  <th>Punch Out</th>
                  <th>Out Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingRows ? (
                  <tr><td colSpan={6} className="text-center py-10"><span className="loading loading-spinner loading-md"></span></td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No attendance found for this range.</td></tr>
                ) : (
                  rows.map((r) => {
                    const inMap = mapUrl(r.punch_in_lat, r.punch_in_lng);
                    const outMap = mapUrl(r.punch_out_lat, r.punch_out_lng);
                    return (
                      <tr key={r.id}>
                        <td className="font-medium">{fmtDate(r.punch_in)}</td>
                        <td>{fmtTime(r.punch_in)}</td>
                        <td>
                          <div className="space-y-1">
                            <div className="text-sm">{r.punch_in_office || "—"}</div>
                            <div className="flex items-center gap-2">
                              {r.punch_in_valid != null && (
                                <span className={`badge badge-sm ${r.punch_in_valid ? 'badge-success' : 'badge-error'}`}>
                                  {r.punch_in_valid ? 'Inside' : 'Outside'}
                                </span>
                              )}
                              {inMap ? (
                                <a className="link link-primary text-xs inline-flex items-center gap-1" href={inMap} target="_blank" rel="noreferrer">
                                  <FiMapPin /> Map
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400">No coords</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{r.punch_out ? fmtTime(r.punch_out) : "—"}</td>
                        <td>
                          <div className="space-y-1">
                            <div className="text-sm">{r.punch_out_office || "—"}</div>
                            <div className="flex items-center gap-2">
                              {r.punch_out_valid != null && (
                                <span className={`badge badge-sm ${r.punch_out_valid ? 'badge-success' : 'badge-error'}`}>
                                  {r.punch_out_valid ? 'Inside' : 'Outside'}
                                </span>
                              )}
                              {outMap ? (
                                <a className="link link-primary text-xs inline-flex items-center gap-1" href={outMap} target="_blank" rel="noreferrer">
                                  <FiMapPin /> Map
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400">No coords</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-ghost badge-sm">{r.status || "—"}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
