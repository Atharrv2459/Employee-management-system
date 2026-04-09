import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiChevronLeft, FiChevronRight, FiPlus, FiUsers } from "react-icons/fi";

const API_BASE = "http://localhost:5001/api";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ShiftCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule, setSchedule] = useState([]);
  const [shiftTemplates, setShiftTemplates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week'); // week or month
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [assignForm, setAssignForm] = useState({
    user_id: "",
    shift_template_id: "",
    schedule_date: "",
    notes: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    Promise.all([
      fetchSchedule(),
      fetchShiftTemplates(),
      fetchEmployees(),
    ]).finally(() => setLoading(false));
  }, [currentDate]);

  const getWeekDates = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const fetchSchedule = async () => {
    const weekDates = getWeekDates();
    const startDate = formatDateForAPI(weekDates[0]);
    const endDate = formatDateForAPI(weekDates[6]);

    try {
      const res = await axios.get(
        `${API_BASE}/shift-schedule/schedule?start_date=${startDate}&end_date=${endDate}`,
        { headers: { Authorization: token } }
      );
      setSchedule(res.data);
    } catch (error) {
      console.error("Fetch schedule error:", error);
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

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/employee/getAll`);
      setEmployees(res.data.data || res.data || []);
    } catch (error) {
      console.error("Fetch employees error:", error);
    }
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const openAssignModal = (date, employee = null) => {
    setSelectedDate(date);
    setSelectedEmployee(employee);
    setAssignForm({
      user_id: employee?.user_id || "",
      shift_template_id: "",
      schedule_date: formatDateForAPI(date),
      notes: "",
    });
    setShowAssignModal(true);
  };

  const handleAssignShift = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/shift-schedule/schedule/assign`, assignForm, {
        headers: { Authorization: token },
      });
      toast.success("Shift assigned successfully");
      setShowAssignModal(false);
      fetchSchedule();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to assign shift");
    }
  };

  const getShiftForEmployeeOnDate = (userId, date) => {
    const dateStr = formatDateForAPI(date);
    return schedule.find(s => s.user_id === userId && s.schedule_date?.split('T')[0] === dateStr);
  };

  const weekDates = getWeekDates();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Shift Schedule</h1>
          <p className="text-gray-500">Manage employee shift assignments</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={goToToday}>
            Today
          </button>
          <div className="btn-group">
            <button className="btn btn-sm" onClick={() => navigateWeek(-1)}>
              <FiChevronLeft />
            </button>
            <button className="btn btn-sm" onClick={() => navigateWeek(1)}>
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* Week Header */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="grid grid-cols-8 bg-base-200">
          <div className="p-3 border-r font-semibold text-gray-600 flex items-center gap-2">
            <FiUsers /> Employees
          </div>
          {weekDates.map((date, i) => {
            const isToday = formatDateForAPI(date) === formatDateForAPI(new Date());
            return (
              <div
                key={i}
                className={`p-3 text-center border-r ${isToday ? 'bg-primary/10' : ''}`}
              >
                <p className="text-sm text-gray-500">{DAYS[date.getDay()]}</p>
                <p className={`font-bold ${isToday ? 'text-primary' : ''}`}>
                  {date.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Employee Rows */}
        {employees.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No employees found
          </div>
        ) : (
          employees.map((emp) => (
            <div key={emp.user_id} className="grid grid-cols-8 border-t">
              <div className="p-3 border-r bg-gray-50">
                <p className="font-medium truncate">
                  {emp.first_name} {emp.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{emp.job_title}</p>
              </div>
              {weekDates.map((date, i) => {
                const shift = getShiftForEmployeeOnDate(emp.user_id, date);
                const isToday = formatDateForAPI(date) === formatDateForAPI(new Date());
                
                return (
                  <div
                    key={i}
                    className={`p-2 border-r min-h-[80px] cursor-pointer hover:bg-gray-50 transition-colors ${
                      isToday ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => openAssignModal(date, emp)}
                  >
                    {shift ? (
                      <div
                        className="rounded-lg p-2 text-white text-xs h-full"
                        style={{ backgroundColor: shift.color || '#3B82F6' }}
                      >
                        <p className="font-medium truncate">{shift.shift_name}</p>
                        <p className="opacity-80">
                          {shift.actual_start?.slice(0, 5)} - {shift.actual_end?.slice(0, 5)}
                        </p>
                        {shift.status !== 'scheduled' && (
                          <span className={`badge badge-xs mt-1 ${
                            shift.status === 'completed' ? 'badge-success' :
                            shift.status === 'missed' ? 'badge-error' :
                            'badge-warning'
                          }`}>
                            {shift.status}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-300 hover:text-gray-400">
                        <FiPlus />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {shiftTemplates.map((template) => (
          <div key={template.id} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: template.color }}
            />
            <span className="text-sm text-gray-600">{template.name}</span>
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              Assign Shift - {selectedDate?.toLocaleDateString()}
            </h3>
            <form onSubmit={handleAssignShift}>
              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">Employee</span>
                </label>
                <select
                  className="select select-bordered"
                  value={assignForm.user_id}
                  onChange={(e) => setAssignForm({ ...assignForm, user_id: e.target.value })}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.user_id} value={emp.user_id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">Shift Template</span>
                </label>
                <select
                  className="select select-bordered"
                  value={assignForm.shift_template_id}
                  onChange={(e) => setAssignForm({ ...assignForm, shift_template_id: e.target.value })}
                  required
                >
                  <option value="">Select Shift</option>
                  {shiftTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.start_time?.slice(0, 5)} - {template.end_time?.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">Notes</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="Optional notes..."
                />
              </div>

              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Shift
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowAssignModal(false)}></div>
        </div>
      )}
    </div>
  );
}
