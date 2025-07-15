import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function EmployeeTimesheet() {
  const [timesheetData, setTimesheetData] = useState([]);
  const [summary, setSummary] = useState({ totalHours: '0h 0m', overtime: '0h 0m', attendance: '0%' });
  const token = localStorage.getItem('token');

  // ✅ Helper function to format minutes into "0h 0m"
  const formatToHoursMinutes = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h}h ${m}m`;
  };

  useEffect(() => {
    fetchTimesheetData();
  }, []);

  const fetchTimesheetData = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/attendance/get', {
        headers: { Authorization: token },
      });

      const raw = res.data.data || [];
      const now = new Date();
      const currentPeriod = raw.filter(
        (entry) =>
          entry.punch_in && new Date(entry.punch_in).getMonth() === now.getMonth()
      );

      let totalMinutes = 0;
      let overtimeMinutes = 0;
      const presentDays = new Set();

      const records = currentPeriod.map((entry) => {
        const punchIn = new Date(entry.punch_in);
        const punchOut = entry.punch_out ? new Date(entry.punch_out) : null;
        const workDuration = punchOut ? (punchOut - punchIn) / (1000 * 60) : 0;
        const overtime = entry.overtime_minutes || 0;

        if (punchOut) {
          totalMinutes += workDuration;
          overtimeMinutes += overtime;
          presentDays.add(punchIn.toDateString());
        }

        return {
          date: punchIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          day: punchIn.toLocaleDateString('en-US', { weekday: 'long' }),
          clockIn: punchIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          clockOut: punchOut
            ? punchOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--',
          workHours: formatToHoursMinutes(workDuration),
          overtime: formatToHoursMinutes(overtime),
        };
      });

      const workingDays = Array.from({ length: now.getDate() }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
        return d.getDay() !== 0 && d.getDay() !== 6;
      }).filter(Boolean).length;

      const attendancePercent = Math.round(
        (presentDays.size / workingDays) * 100
      );

      setSummary({
        totalHours: formatToHoursMinutes(totalMinutes),
        overtime: formatToHoursMinutes(overtimeMinutes),
        attendance: attendancePercent + '%',
      });

      setTimesheetData(records);
    } catch (err) {
      console.error('Failed to fetch timesheet data', err);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Timesheet</h2>
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr className="text-sm text-gray-600">
            <th className="py-2 px-4">Date</th>
            <th className="py-2 px-4">Day</th>
            <th className="py-2 px-4">Clock In</th>
            <th className="py-2 px-4">Clock Out</th>
            <th className="py-2 px-4">Work Hours</th>
            <th className="py-2 px-4">Overtime</th>
          </tr>
        </thead>
        <tbody>
          {timesheetData.length > 0 ? (
            timesheetData.map((entry, idx) => (
              <tr key={idx} className="border-t text-sm text-gray-700">
                <td className="py-2 px-4 font-semibold">{entry.date}</td>
                <td className="py-2 px-4">{entry.day}</td>
                <td className="py-2 px-4">{entry.clockIn}</td>
                <td className="py-2 px-4">{entry.clockOut}</td>
                <td className="py-2 px-4 font-bold text-gray-800">{entry.workHours}</td>
                <td className="py-2 px-4">{entry.overtime}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-4 text-gray-500">
                No records available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
        <div className="bg-blue-50 rounded-lg py-4">
          <p className="text-gray-500">Total Hours</p>
          <p className="text-xl font-bold text-blue-700">{summary.totalHours}</p>
        </div>
        <div className="bg-green-50 rounded-lg py-4">
          <p className="text-gray-500">Overtime</p>
          <p className="text-xl font-bold text-green-700">{summary.overtime}</p>
        </div>
        <div className="bg-indigo-50 rounded-lg py-4">
          <p className="text-gray-500">Attendance</p>
          <p className="text-xl font-bold text-indigo-700">{summary.attendance}</p>
        </div>
      </div>
    </div>
  );
}
