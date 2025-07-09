import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
export default function Punch_in() {
  const navigate = useNavigate();
  const [time,setTime] = useState('');
  const [punch_in,setPunch_in] = useState('');
  const [punch_out, setPunch_out]= useState('');
  const [attendance_list,setAttendance_list]= useState([]);
  const [workedDuration, setWorkedDuration] = useState('');
  const [remainingHours, setRemainingHours] = useState('');


  


  const expectedPunchOut = punch_in
  ? new Date(new Date(punch_in).getTime() + 8 * 60 * 60 * 1000)
  : null;


  const calculateRemainingHours = () => {
  if (expectedPunchOut) {
    const now = new Date();
    const remainingMs = expectedPunchOut - now;

    if (remainingMs <= 0) {
      setRemainingHours('0h 0m');
    } else {
      const totalMinutes = Math.floor(remainingMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setRemainingHours(`${hours}h ${minutes}m`);
    }
  } else {
    setRemainingHours('-');
  }
};


useEffect(() => {
  calculateRemainingHours(); // Run immediately

  const interval = setInterval(() => {
    calculateRemainingHours();
  }, 60000); // Update every 1 minute

  return () => clearInterval(interval);
}, [expectedPunchOut]);



  useEffect(()=>{
    const updateClock = ()=>{
      const now = new Date();
      const formatted = now.toLocaleTimeString([],{hour: '2-digit',minute: '2-digit'});
      setTime(formatted);
    
    }
    updateClock();
    const interval = setInterval(updateClock, 1000); 

    return () => clearInterval(interval);
  },[]);

useEffect(() => {
  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get("http://localhost:5001/api/attendance/get", {
        headers: { Authorization: token },
      });
      setAttendance_list(res.data.data);

      // 👇 Get today's record:
      const today = new Date().toISOString().split("T")[0];
      const todayRecord = res.data.data.find(item => item.punch_in && item.punch_in.startsWith(today));

      if (todayRecord) {
        if (todayRecord.punch_in) setPunch_in(new Date(todayRecord.punch_in));
        if (todayRecord.punch_out) setPunch_out(new Date(todayRecord.punch_out));
      }

    } catch (error) {
      toast.error('Failed to fetch your attendance');
    }
  };

  fetchAttendance();
}, []);  // Empty dependency: Runs once on component mount


const handlePunchIn= async()=>{
  try{
    const token = localStorage.getItem('token');
    const res = await axios.post("http://localhost:5001/api/attendance/punch-in", {}, {
        headers: { Authorization: token },
      });
      setPunch_in(new Date(res.data.data.punch_in));
      toast.success("Punched in successfully");
      fetchAttendance();
  }
  catch(error){
     toast.error(error.response?.data?.message || "Punch in failed");

  }
}

const handlePunchOut = async()=>{
  try{
    const token = localStorage.getItem('token');
    const res = await axios.post("http://localhost:5001/api/attendance/punch-out", {}, {
        headers: { Authorization: token },
      });
    setPunch_out(new Date(res.data.data.punch_out));
      toast.success("Punched out successfully");
      fetchAttendance();
  }
  catch(error){
    toast.error(error.response?.data?.message || "Punch out failed");
  }
  }
useEffect(() => {
  if (punch_in && punch_out) {
    const durationMs = punch_out - punch_in;  // difference in milliseconds
    const totalMinutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    setWorkedDuration(`${hours}h ${minutes}m`);
  } else {
    setWorkedDuration('-');
  }
}, [punch_in, punch_out]);

  return (
    <div className="flex flex-col p-6 space-y-8">
      <div className="bg-green-600 rounded-xl text-white flex flex-col lg:flex-row justify-between items-center p-6 font-bold">
        <p>Currently Clocked in since 8:00 AM</p>
        <p>Working time: Location: Main office</p>
        <p>{time}</p>
      </div>
      
      <div className="flex flex-col lg:flex-row justify-center items-start gap-6">
        
   


        <div className="card bg-gray-100 rounded-box w-full lg:w-1/2 h-auto place-items-center flex flex-col mx-10 mr-10 border border-gray-400 border">
        <p className="text-gray-400 my-10 text-xl font-semibold">
            Thursday, December 22, 2024
        </p>
        <div className="text-5xl font-semibold p-6 rounded-xl w-xl">{time}</div>
        <br></br>
        <br></br>
        
        <button onClick={handlePunchIn} className="mask mask-circle size-44 bg-gradient-to-br from-red-500 to-red-700 font-bold text-4xl text-white btn flex">
  Punch in
</button>
 <button onClick={handlePunchOut} className="btn bg-blue-600 text-white my-6 w-48">Punch out</button>

      
        <button onClick={()=>{navigate('/employee/manual-entry')}} className="btn btn-outline btn-info w-48">Manual entry</button>
        <br></br>
        </div>


        




        <div className="flex flex-col items-center gap-4 w-full lg:w-1/2">
          <div className="divider lg:divider-horizontal hidden lg:block" />
          <div className="card bg-base-200 rounded-box h-auto w-full flex flex-col place-items-center ">
            <p className='my-8 font-semibold mr-72 text-xl'>📊Today's work summary</p>
          <div className='grid grid-cols-2 gap-y-4 gap-x-40 mb-20'>
            <p className='text-gray-500 font-semibold'>Punch in time</p>
            <p className='text-xl font-bold'>{punch_in ? new Date(punch_in).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}): '-'}</p>

            <p className='text-gray-500 font-semibold'>Hours worked</p>
            <p className='text-xl font-bold'>{workedDuration}</p>
            

            <p className='text-gray-500 font-semibold'>Expected Punch out</p>
            <p className='text-xl font-bold'>{expectedPunchOut
    ? expectedPunchOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '-'}</p>

            <p className='text-gray-500 font-semibold'>Punch out time</p>
              <p className='text-xl font-bold'>{punch_out ? new Date(punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</p>

            <p className='text-gray-500 font-semibold'>Remaining Hours</p>
             <p className='text-xl font-bold'>{remainingHours}</p>
          </div>
          </div>
          </div>
      </div>
      <br></br>
<br></br>
      <div className='text-gray-500 font-semibold text-xl mx-7 '>
        Recent time entries

      </div>
      <div className="card bg-white rounded-box w-full mt-12 shadow-md overflow-x-auto">
  <table className="table text-sm mb-14">
    <thead className="bg-base-200 text-gray-700">
      <tr>
        <th className='px-10'>Date</th>
        <th>Punch In</th>
        <th>Punch Out</th>
        <th>Total Time</th>
        <th>Status</th>

      </tr>
    </thead>
    <tbody>

      {attendance_list.map((entry, index) => (
              <tr key={index}>
                <td>{new Date(entry.punch_in).toLocaleDateString()}</td>
                <td>{new Date(entry.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>{entry.punch_out ? new Date(entry.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                <td>{entry.attendance_duration ? Math.floor(entry.attendance_duration.hours) + 'h ' + Math.floor(entry.attendance_duration.minutes) + 'm' : '-'}</td>
                <td className="text-green-600 font-semibold">Present</td>
              </tr>
            ))}

    </tbody>
  </table>
</div>
<br></br>
<br></br>
<br></br>
</div>

  );
}
