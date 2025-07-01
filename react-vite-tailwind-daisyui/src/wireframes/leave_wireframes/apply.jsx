// Punch_in.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function Punch_in() {
  const [time, setTime] = useState("");
  const [punchInTime, setPunchInTime] = useState(null);
  const [punchOutTime, setPunchOutTime] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);

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
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5001/api/attendance/get", {
          headers: { Authorization: token },
        });
        setAttendanceList(res.data.data);
      } catch (err) {
        toast.error("Failed to fetch attendance");
      }
    };
    fetchAttendance();
  }, [punchInTime, punchOutTime]);

  const handlePunchIn = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5001/api/attendance/punch-in", {}, {
        headers: { Authorization: token },
      });
      setPunchInTime(new Date(res.data.data.punch_in));
      toast.success("Punched in successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Punch in failed");
    }
  };

  const handlePunchOut = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5001/api/attendance/punch-out", {}, {
        headers: { Authorization: token },
      });
      setPunchOutTime(new Date(res.data.data.punch_out));
      toast.success("Punched out successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Punch out failed");
    }
  };

  return (
    <div className="flex flex-col p-6 space-y-8">
      <div className="bg-green-600 rounded-xl text-white flex flex-col lg:flex-row justify-between items-center p-6 font-bold">
        <p>Currently Clocked in since {punchInTime ? new Date(punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</p>
        <p>Working time: Location: Main office</p>
        <p>{time}</p>
      </div>

      <div className="join my-12 flex gap-4 justify-center">
        <button className="btn join-item bg-green-50">View Full Timesheet</button>
        <button className="btn join-item">Apply for Leave</button>
        <button className="btn join-item">View Schedule</button>
        <button className="btn join-item">Contact Manager</button>
      </div>

      <div className="flex flex-col lg:flex-row justify-center items-start gap-6">
        <div className="card bg-gray-100 rounded-box w-full lg:w-1/2 h-auto place-items-center flex flex-col mx-10 border border-gray-400">
          <p className="text-gray-400 my-10 text-xl font-semibold">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="text-5xl font-semibold p-6 rounded-xl">{time}</div>
          <br />
          <button onClick={handlePunchIn} className="mask mask-circle size-44 bg-gradient-to-br from-red-500 to-red-700 font-bold text-4xl text-white btn flex">
            Punch in
          </button>
          <button onClick={handlePunchOut} className="btn bg-blue-600 text-white my-6 w-48">Punch out</button>
          <button className="btn bg-yellow-500 text-white mb-6 w-48">Start break</button>
          <button className="btn btn-outline btn-info w-48">Manual entry</button>
        </div>

        <div className="flex flex-col items-center gap-4 w-full lg:w-1/2">
          <div className="divider lg:divider-horizontal hidden lg:block" />
          <div className="card bg-base-200 rounded-box h-auto w-full flex flex-col place-items-center ">
            <p className='my-8 font-semibold text-xl self-start ml-6'>📊 Today's work summary</p>
            <div className='grid grid-cols-2 gap-y-4 gap-x-40 mb-20'>
              <p className='text-gray-500 font-semibold'>Punch in time</p>
              <p className='text-xl font-bold'>{punchInTime ? new Date(punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</p>
              <p className='text-gray-500 font-semibold'>Punch out time</p>
              <p className='text-xl font-bold'>{punchOutTime ? new Date(punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</p>
              <p className='text-gray-500 font-semibold'>Break Time</p>
              <p className='text-xl font-bold'>30m</p>
              <p className='text-gray-500 font-semibold'>Expected Punch out</p>
              <p className='text-xl font-bold'>5:00 PM</p>
              <p className='text-gray-500 font-semibold'>Remaining Hours</p>
              <p className='text-xl font-bold'>4h 13m</p>
            </div>
          </div>
          <div className="divider" />
          <div className="card bg-base-200 rounded-box h-20 w-full grid place-items-center">
            Content
          </div>
        </div>
      </div>

      <div className='text-gray-500 font-semibold text-xl mx-7 mt-10'>
        Recent time entries
      </div>

      <div className="card bg-white rounded-box w-full mt-4 shadow-md overflow-x-auto">
        <table className="table text-sm mb-14 w-full">
          <thead className="bg-base-200 text-gray-700">
            <tr>
              <th className='px-10'>Date</th>
              <th>Punch In</th>
              <th>Punch Out</th>
              <th>Break Time</th>
              <th>Total Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceList.map((entry, index) => (
              <tr key={index}>
                <td>{new Date(entry.punch_in).toLocaleDateString()}</td>
                <td>{new Date(entry.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>{entry.punch_out ? new Date(entry.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td>30m</td>
                <td>{entry.attendance_duration ? Math.floor(entry.attendance_duration.hours) + 'h ' + Math.floor(entry.attendance_duration.minutes) + 'm' : '-'}</td>
                <td className="text-green-600 font-semibold">Present</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
