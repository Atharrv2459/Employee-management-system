import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiClock, FiRefreshCw, FiCalendar, FiInfo } from "react-icons/fi";
import { API_BASE } from "../api";

const toISODate = (d) => {
  // Use local date parts (NOT toISOString) to avoid UTC date shifting
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatTime = (t) => {
  if (!t) return "—";
  // expected from backend: "HH:MM:SS" or "HH:MM"
  if (typeof t === "string" && t.includes(":")) return t.slice(0, 5);
  try {
    const dt = new Date(t);
    if (!Number.isNaN(dt.getTime())) {
      return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  } catch {
    // ignore
  }
  return String(t);
};

export default function ShiftDetailsPanel({ daysAhead = 7 }) {
  const token = localStorage.getItem("token");

  const [items, setItems] = useState([]);
  const [preference, setPreference] = useState(null);
  const [loading, setLoading] = useState(true);

  const todayISO = useMemo(() => toISODate(new Date()), []);
  const endISO = useMemo(
    () => toISODate(new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)),
    [daysAhead]
  );

  const fetchShiftPreference = async () => {
    if (!token) return null;
    try {
      const res = await axios.get(`${API_BASE}/shift/get`, {
        headers: { Authorization: token },
      });
      return res.data || null;
    } catch (e) {
      if (e.response?.status === 404) return null;
      console.error("Failed to fetch shift preference", e);
      return null;
    }
  };

  const fetchMySchedule = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/shift-schedule/schedule/my`, {
        params: { start_date: todayISO, end_date: endISO },
        headers: { Authorization: token },
      });

      const scheduleItems = Array.isArray(res.data) ? res.data : [];
      setItems(scheduleItems);

      if (scheduleItems.length === 0) {
        const pref = await fetchShiftPreference();
        setPreference(pref);
      } else {
        setPreference(null);
      }
    } catch (e) {
      console.error("Failed to fetch my schedule", e);
      toast.error(e.response?.data?.error || "Failed to load shift schedule");
      setItems([]);
      const pref = await fetchShiftPreference();
      setPreference(pref);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const todayShift = useMemo(
    () => items.find((s) => String(s.schedule_date) === todayISO) || null,
    [items, todayISO]
  );

  const nextShift = useMemo(() => {
    const future = items
      .filter((s) => String(s.schedule_date) > todayISO)
      .sort((a, b) => String(a.schedule_date).localeCompare(String(b.schedule_date)));
    return future[0] || null;
  }, [items, todayISO]);

  const shift = todayShift || nextShift;
  const isToday = !!todayShift;

  const shiftTitle = isToday
    ? "Today’s Shift"
    : shift
      ? "Next Shift"
      : preference
        ? "Shift Preference"
        : "Shift";

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg">
                <FiClock />
              </div>
              <h3 className="text-xl font-bold text-gray-800">{shiftTitle}</h3>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Shows your scheduled shift from the HR shift calendar.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchMySchedule}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Loading…
              </>
            ) : (
              <>
                <FiRefreshCw /> Refresh
              </>
            )}
          </button>
        </div>

        {!token && (
          <div className="text-sm text-gray-500">
            Login token missing — can’t load shift schedule.
          </div>
        )}

        {token && !loading && !shift && !preference && (
          <div className="text-sm text-gray-600">
            No shifts scheduled for the next {daysAhead} days.
          </div>
        )}

        {token && !loading && !shift && preference && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-primary badge-outline">
                Preferred: {preference.shift_time || "—"}
              </span>
              {preference.maximum_hours != null && (
                <span className="badge badge-ghost">Max {preference.maximum_hours}h</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Unavailable Days</div>
                <div className="text-gray-800 text-sm">
                  {Array.isArray(preference.unavailable_days)
                    ? preference.unavailable_days.join(", ")
                    : preference.unavailable_days || "—"}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <FiInfo /> Notes
                </div>
                <div className="text-gray-800 text-sm">
                  {preference.notes ? preference.notes : "—"}
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              No scheduled shift found — showing your saved shift preference.
            </p>
          </div>
        )}

        {token && shift && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-primary badge-outline">
                {shift.shift_name || "Shift"}
              </span>
              {shift.shift_type && <span className="badge badge-ghost">{shift.shift_type}</span>}
              {shift.status && <span className="badge badge-ghost">{shift.status}</span>}
              {shift.is_published === true && <span className="badge badge-success">Published</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <FiCalendar /> Date
                </div>
                <div className="font-semibold text-gray-800">
                  {shift.schedule_date}
                  {isToday ? " (Today)" : ""}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Time</div>
                <div className="font-semibold text-gray-800">
                  {formatTime(shift.actual_start)} - {formatTime(shift.actual_end)}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">Break</div>
                <div className="font-semibold text-gray-800">
                  {shift.break_duration_minutes != null ? `${shift.break_duration_minutes} min` : "—"}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <FiInfo /> Notes
                </div>
                <div className="text-gray-800 text-sm">
                  {shift.notes ? shift.notes : "—"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
