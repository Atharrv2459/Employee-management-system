import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiSave, FiCalendar, FiClock, FiX, FiPlus } from "react-icons/fi";

import { API_BASE } from "../../api";

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export default function ShiftPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newUnavailableDate, setNewUnavailableDate] = useState({ date: "", reason: "" });

  const [formData, setFormData] = useState({
    preferred_shift_ids: [],
    preferred_days: [1, 2, 3, 4, 5], // Mon-Fri default
    unavailable_days: [0, 6], // Sat-Sun default
    max_hours_per_week: 40,
    max_hours_per_day: 10,
    min_hours_per_week: 20,
    prefer_consecutive_days: true,
    notes: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    Promise.all([
      fetchPreferences(),
      fetchShiftTemplates(),
      fetchUnavailableDates(),
    ]).finally(() => setLoading(false));
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await axios.get(`${API_BASE}/shift-schedule/preferences/my`, {
        headers: { Authorization: token },
      });
      if (res.data) {
        setPreferences(res.data);
        setFormData({
          preferred_shift_ids: res.data.preferred_shift_ids || [],
          preferred_days: res.data.preferred_days || [1, 2, 3, 4, 5],
          unavailable_days: res.data.unavailable_days || [0, 6],
          max_hours_per_week: res.data.max_hours_per_week || 40,
          max_hours_per_day: res.data.max_hours_per_day || 10,
          min_hours_per_week: res.data.min_hours_per_week || 20,
          prefer_consecutive_days: res.data.prefer_consecutive_days !== false,
          notes: res.data.notes || "",
        });
      }
    } catch (error) {
      console.error("Fetch preferences error:", error);
    }
  };

  const fetchShiftTemplates = async () => {
    try {
      const res = await axios.get(`${API_BASE}/shift-schedule/templates`);
      setShiftTemplates(res.data);
    } catch (error) {
      console.error("Fetch templates error:", error);
    }
  };

  const fetchUnavailableDates = async () => {
    try {
      const res = await axios.get(`${API_BASE}/shift-schedule/unavailable`, {
        headers: { Authorization: token },
      });
      setUnavailableDates(res.data);
    } catch (error) {
      console.error("Fetch unavailable dates error:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/shift-schedule/preferences`, formData, {
        headers: { Authorization: token },
      });
      toast.success("Preferences saved successfully");
      fetchPreferences();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day, type) => {
    const field = type === 'preferred' ? 'preferred_days' : 'unavailable_days';
    const otherField = type === 'preferred' ? 'unavailable_days' : 'preferred_days';
    
    setFormData(prev => {
      const current = [...prev[field]];
      const other = [...prev[otherField]];
      
      if (current.includes(day)) {
        return { ...prev, [field]: current.filter(d => d !== day) };
      } else {
        // Remove from other list if present
        return { 
          ...prev, 
          [field]: [...current, day],
          [otherField]: other.filter(d => d !== day)
        };
      }
    });
  };

  const toggleShiftPreference = (templateId) => {
    setFormData(prev => {
      const current = [...prev.preferred_shift_ids];
      if (current.includes(templateId)) {
        return { ...prev, preferred_shift_ids: current.filter(id => id !== templateId) };
      } else {
        return { ...prev, preferred_shift_ids: [...current, templateId] };
      }
    });
  };

  const addUnavailableDate = async () => {
    if (!newUnavailableDate.date) {
      toast.error("Please select a date");
      return;
    }
    try {
      await axios.post(`${API_BASE}/shift-schedule/unavailable`, newUnavailableDate, {
        headers: { Authorization: token },
      });
      toast.success("Unavailable date added");
      setNewUnavailableDate({ date: "", reason: "" });
      fetchUnavailableDates();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add date");
    }
  };

  const removeUnavailableDate = async (date) => {
    try {
      await axios.delete(`${API_BASE}/shift-schedule/unavailable/${date}`, {
        headers: { Authorization: token },
      });
      toast.success("Date removed");
      fetchUnavailableDates();
    } catch (error) {
      toast.error("Failed to remove date");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Shift Preferences</h1>
          <p className="text-gray-500">Set your availability and shift preferences</p>
        </div>
        <button
          className="btn btn-primary gap-2"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <span className="loading loading-spinner loading-sm"></span> : <FiSave />}
          Save Preferences
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preferred Shifts */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FiClock className="text-blue-500" /> Preferred Shifts
          </h2>
          <p className="text-sm text-gray-500 mb-4">Select shifts you prefer to work</p>
          
          <div className="space-y-2">
            {shiftTemplates.map((template) => (
              <label
                key={template.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  formData.preferred_shift_ids.includes(template.id)
                    ? 'bg-blue-50 border-blue-300'
                    : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.preferred_shift_ids.includes(template.id)}
                  onChange={() => toggleShiftPreference(template.id)}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: template.color }}
                />
                <div className="flex-1">
                  <p className="font-medium">{template.name}</p>
                  <p className="text-sm text-gray-500">
                    {template.start_time?.slice(0, 5)} - {template.end_time?.slice(0, 5)}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Day Preferences */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FiCalendar className="text-green-500" /> Weekly Availability
          </h2>
          
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Preferred Days (can work)</p>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  className={`btn btn-sm ${
                    formData.preferred_days.includes(day.value)
                      ? 'btn-success text-white'
                      : 'btn-outline'
                  }`}
                  onClick={() => toggleDay(day.value, 'preferred')}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Unavailable Days (cannot work)</p>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  className={`btn btn-sm ${
                    formData.unavailable_days.includes(day.value)
                      ? 'btn-error text-white'
                      : 'btn-outline'
                  }`}
                  onClick={() => toggleDay(day.value, 'unavailable')}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hours Preferences */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-semibold text-lg mb-4">Hours Preferences</h2>
          
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Maximum hours per week</span>
                <span className="label-text-alt">{formData.max_hours_per_week} hrs</span>
              </label>
              <input
                type="range"
                min="10"
                max="60"
                value={formData.max_hours_per_week}
                onChange={(e) => setFormData({ ...formData, max_hours_per_week: parseInt(e.target.value) })}
                className="range range-primary"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Minimum hours per week</span>
                <span className="label-text-alt">{formData.min_hours_per_week} hrs</span>
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={formData.min_hours_per_week}
                onChange={(e) => setFormData({ ...formData, min_hours_per_week: parseInt(e.target.value) })}
                className="range range-secondary"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Maximum hours per day</span>
                <span className="label-text-alt">{formData.max_hours_per_day} hrs</span>
              </label>
              <input
                type="range"
                min="4"
                max="12"
                value={formData.max_hours_per_day}
                onChange={(e) => setFormData({ ...formData, max_hours_per_day: parseInt(e.target.value) })}
                className="range range-accent"
              />
            </div>

            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="checkbox"
                checked={formData.prefer_consecutive_days}
                onChange={(e) => setFormData({ ...formData, prefer_consecutive_days: e.target.checked })}
              />
              <span className="label-text">Prefer consecutive working days</span>
            </label>
          </div>
        </div>

        {/* Specific Unavailable Dates */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-semibold text-lg mb-4">Specific Unavailable Dates</h2>
          <p className="text-sm text-gray-500 mb-4">Mark specific dates when you cannot work</p>

          <div className="flex gap-2 mb-4">
            <input
              type="date"
              className="input input-bordered flex-1"
              value={newUnavailableDate.date}
              onChange={(e) => setNewUnavailableDate({ ...newUnavailableDate, date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
            <input
              type="text"
              className="input input-bordered flex-1"
              placeholder="Reason (optional)"
              value={newUnavailableDate.reason}
              onChange={(e) => setNewUnavailableDate({ ...newUnavailableDate, reason: e.target.value })}
            />
            <button className="btn btn-primary" onClick={addUnavailableDate}>
              <FiPlus />
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {unavailableDates.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No specific dates marked</p>
            ) : (
              unavailableDates.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-red-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {item.reason && (
                      <p className="text-sm text-gray-500">{item.reason}</p>
                    )}
                  </div>
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={() => removeUnavailableDate(item.date)}
                  >
                    <FiX />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
          <h2 className="font-semibold text-lg mb-4">Additional Notes</h2>
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Any additional notes about your availability or preferences..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
