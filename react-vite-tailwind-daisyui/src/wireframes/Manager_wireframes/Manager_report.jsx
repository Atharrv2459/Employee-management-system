import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function Manager_report() {
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

  const token = localStorage.getItem("token");

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
    const fetchAttendanceStatus = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/attendance/get", {
          headers: { Authorization: token },
        });

        const data = res.data.data;
        const today = new Date().toISOString().split("T")[0];
        const todayRecord = data.find(item => item.punch_in && item.punch_in.startsWith(today));

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

            const durationHours = ((punchOut - punchIn) / (1000 * 60 * 60));
            setWorkedHoursToday(Math.floor(durationHours * 100) / 100);
          } else if (punchIn) {
            const durationHours = ((new Date() - punchIn) / (1000 * 60 * 60));
            setWorkedHoursToday(Math.floor(durationHours * 100) / 100);
          }
        } else {
          setWorkedHoursToday(0);
        }

        const now = new Date();
        const currentWeekStart = new Date(now);
        currentWeekStart.setDate(now.getDate() - now.getDay());
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let weeklyTotalMinutes = 0;
        let monthlyTotalMinutes = 0;

        data.forEach(entry => {
          if (entry.punch_in && entry.punch_out) {
            const punchIn = new Date(entry.punch_in);
            const punchOut = new Date(entry.punch_out);
            const durationMinutes = Math.floor((punchOut - punchIn) / (1000 * 60));

            if (punchIn >= currentWeekStart) {
              weeklyTotalMinutes += durationMinutes;
            }
            if (punchIn >= currentMonthStart) {
              monthlyTotalMinutes += durationMinutes;
            }
          }
        });

        setWeeklyHours((weeklyTotalMinutes / 60).toFixed(1));
        setMonthlyHours((monthlyTotalMinutes / 60).toFixed(1));

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
      setWorkedHoursToday(Math.floor(durationHours * 100) / 100);

      toast.success("Punched in successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Punch in failed");
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
      toast.error(error.response?.data?.message || "Punch out failed");
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

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6">

       
        <div className="bg-green-500 text-white p-4 rounded-lg flex justify-between items-center">
          <span className="flex items-center">
            <span className="inline-block w-3 h-3 bg-green-300 rounded-full mr-2"></span>
            {isPunchedOut ? "Clocked Out" : isPunchedIn ? "Currently Clocked In" : "Not Punched In"}
          </span>
          <span>{workedHoursToday}h worked today</span>
          <span className="font-bold text-lg">{time}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">⏰ Quick Punch</h3>
            <div className="bg-gradient-to-r from-green-500 to-green-400 text-white p-4 rounded-lg text-center">
              <div className="text-2xl font-bold">
                {workedHoursToday}h
              </div>
              <div className="text-sm mt-2">
                Started: {punchInTime ? punchInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {!isPunchedIn && !isPunchedOut && (
                <button onClick={handlePunchIn} className="bg-blue-500 text-white px-4 py-2 rounded w-full">Clock In</button>
              )}
              {isPunchedIn && !isPunchedOut && (
                <>
                  <button onClick={handlePunchOut} className="bg-red-500 text-white px-4 py-2 rounded w-full">Clock Out</button>
                  <button onClick={onBreak ? handleEndBreak : handleStartBreak} className="bg-gray-400 text-white px-4 py-2 rounded w-full">
                    {onBreak ? "End Break" : "Start Break"}
                  </button>
                </>
              )}
              {isPunchedOut && (
                <button disabled className="bg-gray-300 text-white px-4 py-2 rounded w-full">Shift Complete</button>
              )}
            </div>
            <button onClick={() => { navigate('/manager/punch') }} className="bg-red-500 text-white px-4 py-2 rounded w-full my-5">More</button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">📊 Weekly Progress</h3>
            <div className="flex justify-between mb-2">
              <span>This Week</span>
              <span className="font-bold">{weeklyHours}h / 40h</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min((weeklyHours / 40) * 100, 100)}%` }}></div>
            </div>
            
            <div className="flex justify-between">
              <span>Attendance</span>
              <span className="font-bold">100%</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-4">🗓️ Leave Balance</h3>
            <div className="flex justify-between mb-2">
              <span>Vacation</span>
              <span className="font-bold">12.5 days</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Sick</span>
              <span className="font-bold">8.0 days</span>
            </div>
            <div className="flex justify-between mb-4">
              <span>Personal</span>
              <span className="font-bold">3.0 days</span>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={() => navigate('/employee/leaves/apply')} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
                Apply for Leave
              </button>
              <button onClick={() => navigate('/employee/leaves/balance')} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
                Leave Balance
              </button>
              <button onClick={() => navigate('/employee/leaves/apply')} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
                Leave History
              </button>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold mb-4">📊 Time Analysis</h3>
        
            <div className="flex justify-between">
              <span>Peak Day</span>
              <span className="font-bold">Thursday (9.0h)</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Average</span>
              <span className="font-bold">8.4h per day</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold mb-4">🎯 Goal Progress</h3>
            <div className="flex justify-between mb-2">
              <span>Monthly Hours Goal</span>
              <span className="font-bold">{monthlyHours}h / 176h</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min((monthlyHours / 176) * 100, 100)}%` }}></div>
            </div>
            <div className="flex justify-between mb-2">
              <span>Attendance Goal</span>
              <span className="font-bold">100% (22/22 days)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `100%` }}></div>
            </div>
           
          </div>

        </div>

      </div>
    </div>
  );
}
