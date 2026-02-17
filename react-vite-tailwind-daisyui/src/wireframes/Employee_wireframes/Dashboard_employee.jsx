import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import OfficeMap from "./OfficeMap";

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});





export default function WebDashboard() {
 const navigate = useNavigate();
  const [time, setTime] = useState("");
  const [punchInTime, setPunchInTime] = useState(null);
  const [punchOutTime, setPunchOutTime] = useState(null);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [isPunchedOut, setIsPunchedOut] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [monthlyHours, setMonthlyHours] = useState(0);
  const [workedHoursToday, setWorkedHoursToday] = useState(0);
  const [employeeName, setEmployeeName] = useState("");
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [attendancePercent, setAttendancePercent] = useState(0);
const [peakDay, setPeakDay] = useState("N/A");
const [averageHours, setAverageHours] = useState("0.0");
const [teamStatus, setTeamStatus] = useState([]);



  const token = localStorage.getItem("token");


  useEffect(() => {
    fetchLeaveBalances();
    fetchEmployeeDetails();
  }, []);

  const fetchLeaveBalances = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/leaves/balance", {
        headers: { Authorization: token },
      });
      setLeaveBalances(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leave balances");
    }
  };

  const getLeaveRemaining = (type) => {
    const data = leaveBalances.find((l) => l.leave_type === type);
    const total = data?.total_leaves || 0;
    const used = data?.used_leaves || 0;
    return (total - used).toFixed(1);
  };

  const fetchEmployeeDetails = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/employee/get", {
        headers: { Authorization: token },
      });
      const emp = res.data.data;
      setEmployeeName(`${emp.first_name} ${emp.last_name}`);
    } catch (err) {
      console.log("Failed to fetch employee details", err);
    }
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setTime(formatted);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
 const formatDurationToHHMM = (minutes) => {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const fetchAttendanceStatus = async () => {
  try {
    const res = await axios.get("http://localhost:5001/api/attendance/get", {
      headers: { Authorization: token },
    });

    const data = res.data.data;
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const todayRecord = data.find(
      (item) => item.punch_in && item.punch_in.startsWith(today)
    );

    let workedMinutesToday = 0;

    if (todayRecord) {
      const punchIn = todayRecord.punch_in ? new Date(todayRecord.punch_in) : null;
      const punchOut = todayRecord.punch_out ? new Date(todayRecord.punch_out) : null;

      if (punchIn) {
        setPunchInTime(punchIn);
        setIsPunchedIn(true);
      }

      if (punchOut) {
        setPunchOutTime(punchOut);
        setIsPunchedOut(true);
        setIsPunchedIn(false);

        workedMinutesToday = (punchOut - punchIn) / (1000 * 60);
      } else if (punchIn) {
        workedMinutesToday = (new Date() - punchIn) / (1000 * 60);
      }

      setWorkedHoursToday(formatDurationToHHMM(workedMinutesToday));
    } else {
      setWorkedHoursToday("00:00");
    }

    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let weeklyTotalMinutes = 0;
    let monthlyTotalMinutes = 0;
    const monthlyDayMap = {};
    const monthlyPresentDays = new Set();

    data.forEach((entry) => {
      if (entry.punch_in && entry.punch_out) {
        const punchIn = new Date(entry.punch_in);
        const punchOut = new Date(entry.punch_out);
        const durationMinutes = Math.floor((punchOut - punchIn) / (1000 * 60));

        if (punchIn >= currentWeekStart) {
          weeklyTotalMinutes += durationMinutes;
        }

        if (punchIn >= currentMonthStart) {
          monthlyTotalMinutes += durationMinutes;
          monthlyPresentDays.add(punchIn.getDate());

          const weekday = punchIn.toLocaleDateString("en-US", { weekday: "long" });
          monthlyDayMap[weekday] = (monthlyDayMap[weekday] || 0) + durationMinutes;
        }
      }
    });

    const totalMonthlyWorkedHours = monthlyTotalMinutes / 60;

    const totalWorkingDays = Array.from({ length: now.getDate() }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
      return d.getDay() !== 0 && d.getDay() !== 6;
    }).filter(Boolean).length;

    const attendancePercent = Math.round(
      (monthlyPresentDays.size / totalWorkingDays) * 100
    );

    let peakDay = "N/A";
    let peakMinutes = 0;
    for (const [day, mins] of Object.entries(monthlyDayMap)) {
      if (mins > peakMinutes) {
        peakMinutes = mins;
        peakDay = `${day} (${formatDurationToHHMM(mins)})`;
      }
    }

    const averageHours = totalWorkingDays
      ? (totalMonthlyWorkedHours / totalWorkingDays).toFixed(1)
      : "0.0";

    setWeeklyHours(formatDurationToHHMM(weeklyTotalMinutes));
    setMonthlyHours(formatDurationToHHMM(monthlyTotalMinutes));
    setPeakDay(peakDay);
    setAverageHours(averageHours);
    setAttendancePercent(attendancePercent);

  } catch (error) {
    console.log("Attendance fetch failed", error);
  }
};

  fetchAttendanceStatus();
}, [token, punchInTime, punchOutTime]);


  const handlePunchIn = async () => {
    try {
      const res = await axios.post("http://localhost:5001/api/attendance/punch-in", {}, {
        headers: { Authorization: token },
      });
      const punchIn = new Date(res.data.data.punch_in);
      setPunchInTime(punchIn);
      setIsPunchedIn(true);
      setIsPunchedOut(false);

      const durationHours = ((new Date() - punchIn) / (1000 * 60 * 60));
      setWorkedHoursToday(formatDurationToHHMM(Math.floor(workedMinutesToday)));

      toast.success("Punched in successfully");
    } catch (error) {
      toast.error("Punch in failed");
    }
  };

  const handlePunchOut = async () => {
    try {
      const res = await axios.post("http://localhost:5001/api/attendance/punch-out", {}, {
        headers: { Authorization: token },
      });
      const punchOut = new Date(res.data.data.punch_out);
      setPunchOutTime(punchOut);
      setIsPunchedOut(true);
      setIsPunchedIn(false);
      setOnBreak(false);

      const durationHours = ((punchOut - punchInTime) / (1000 * 60 * 60));
      setWorkedHoursToday(Math.floor(durationHours * 100) / 100);

      toast.success("Punched out successfully");
    } catch (error) {
      toast.error("Punch out failed");
    }
  };

  const handleStartBreak = () => {
    setOnBreak(true);
    toast.success("Break started");
  };

  const handleEndBreak = () => {
    setOnBreak(false);
    toast.success("Break ended");
  };

  const fetchTeamStatus = async () => {
  try {
    const res = await axios.get("http://localhost:5001/api/attendance/employee-team-status", {
      headers: { Authorization: token },
    });
    setTeamStatus(res.data.data || []);
  } catch (err) {
    console.error("Failed to fetch team status:", err);
  }
};
fetchTeamStatus();


  return (
    <div className="min-h-screen  p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
  Welcome back, <span className="text-blue-700">{employeeName || 'Employee'}</span> 👋
</h1>

        
  
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white p-6 rounded-2xl shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${isPunchedOut ? 'bg-red-400' : isPunchedIn ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'} shadow-lg`}></div>
              <span className="text-lg font-medium">
                {isPunchedOut ? "Punched Out" : isPunchedIn ? "Currently Punched In" : "Not Punched In"}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{workedHoursToday}h</div>
                <div className="text-sm opacity-90">worked today</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold tracking-wider">{time}</div>
                <div className="text-sm opacity-90">Current Time</div>
              </div>
            </div>
          </div>
        </div>

      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          

        
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-lg">
                  ⏰
                </div>
                <h3 className="text-xl font-bold text-gray-800">Quick Punch</h3>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 rounded-xl text-center mb-6 shadow-lg">
                <div className="text-4xl font-bold mb-2">{workedHoursToday}h</div>
                <div className="text-emerald-100">
                  Started: {punchInTime ? punchInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                </div>
              </div>
              
              <div className="space-y-3">
                {!isPunchedIn && !isPunchedOut && (
                  <button 
                    onClick={handlePunchIn} 
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Punch In
                  </button>
                )}
                {isPunchedIn && !isPunchedOut && (
                  <button 
                    onClick={handlePunchOut} 
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Punch Out
                  </button>
                )}
                {isPunchedOut && (
                  <button 
                    disabled 
                    className="w-full bg-gray-200 text-gray-500 py-3 px-6 rounded-xl font-semibold cursor-not-allowed"
                  >
                    Shift Complete
                  </button>
                )}
                <button 
                  onClick={() => { navigate('/employee/punch') }} 
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>

       
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-lg">
                  📊
                </div>
                <h3 className="text-xl font-bold text-gray-800">Weekly Progress</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">This Week</span>
                  <span className="text-2xl font-bold text-gray-800">{weeklyHours}h <span className="text-sm font-normal text-gray-500">/ 40h</span></span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${Math.min((weeklyHours / 40) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Attendance</span>
                    <span className="text-xl font-bold text-green-600">{attendancePercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-lg">
                  🗓️
                </div>
                <h3 className="text-xl font-bold text-gray-800">Leave Balance</h3>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Annual</span>
                  <span className="font-bold text-gray-800">{getLeaveRemaining("annual")} days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Sick</span>
                  <span className="font-bold text-gray-800">{getLeaveRemaining("sick")} days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Personal</span>
                  <span className="font-bold text-gray-800">{getLeaveRemaining("personal")} days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Maternity</span>
                  <span className="font-bold text-gray-800">{getLeaveRemaining("maternity")} days</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/employee/leaves/apply')} 
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Apply for Leave
                </button>
                <button 
                  onClick={() => navigate('/employee/leaves/balance')} 
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Leave Balance
                </button>
                <button 
                  onClick={() => navigate('/employee/leave-history')} 
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-indigo-600 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Leave History
                </button>
              </div>
            </div>
          </div>

        </div>


        
<div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 mb-10">
  <div className="p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-lg">
        👥
      </div>
      <h3 className="text-xl font-bold text-gray-800">Team Status</h3>
    </div>
    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
      {teamStatus.length === 0 ? (
        <p className="text-sm text-gray-500">No team data available</p>
      ) : (
        teamStatus.map((emp, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 mr-3">
                {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">{emp.first_name} {emp.last_name}</p>
                <p className="text-xs text-gray-500">{emp.email} — {emp.role}</p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              emp.status === 'Present'
                ? 'bg-green-100 text-green-800'
                : emp.status === 'On Leave'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              {emp.status}
            </span>
          </div>
        ))
      )}
    </div>
  </div>
</div>


<div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 mb-10">
  <div className="p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-lg">
        🗺️
      </div>
      <h3 className="text-xl font-bold text-gray-800">Office Location</h3>
    </div>

    <OfficeMap />
  </div>
</div>


       
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

         
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white text-lg">
                  📊
                </div>
                <h3 className="text-xl font-bold text-gray-800">Time Analysis</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-100">
                  <span className="text-gray-600 font-medium">Peak Day</span>
                  <span className="text-xl font-bold text-cyan-700">{peakDay}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <span className="text-gray-600 font-medium">Average</span>
                  <span className="text-xl font-bold text-blue-700">{averageHours}h per day</span>
                </div>
              </div>
            </div>
          </div>

         
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white text-lg">
                  🎯
                </div>
                <h3 className="text-xl font-bold text-gray-800">Goal Progress</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 font-medium">Monthly Hours Goal</span>
                    <span className="text-lg font-bold text-gray-800">{monthlyHours}h <span className="text-sm font-normal text-gray-500">/ 176h</span></span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${Math.min((monthlyHours / 176) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 font-medium">Attendance Goal</span>
                    <span className="text-lg font-bold text-green-600">100% (22/22 days)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `100%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}