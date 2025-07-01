import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
export default function Punch_in_Manager() {
  const [time,setTime] = useState('');
  const [punch_in,setPunch_in] = useState('');
  const [punch_out, setPunch_out]= useState('');

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
  return (
    <div className="flex flex-col p-6 space-y-8">

     
      <div className="bg-green-600 rounded-xl text-white flex flex-col lg:flex-row justify-between items-center p-6 font-bold">
        <p>Currently Clocked in since 8:00 AM</p>
        <p>Working time: Location: Main office</p>
        <p>{time}</p>
      </div>
       <div className="join my-48 flex gap-4 justify-center">
  <button className="btn join-item bg-green-50">View Full Timesheet</button>
  <button className="btn join-item">View Schedule</button>
</div>
      <div className="flex flex-col lg:flex-row justify-center items-start gap-6">
        
   


        <div className="card bg-gray-100 rounded-box w-full lg:w-1/2 h-auto place-items-center flex flex-col mx-10 mr-10 border border-gray-400 border">
        <p className="text-gray-400 my-10 text-xl font-semibold">
            Thursday, December 22, 2024
        </p>
        <div className="text-5xl font-semibold p-6 rounded-xl w-xl">{time}</div>
        <br></br>
        <br></br>
        
        <button className="mask mask-circle size-44 bg-gradient-to-br from-green-500 to-green-700 font-bold text-4xl text-white btn flex">
  Punch in
</button>

        <button className="btn bg-yellow-500 text-white my-12 w-48">Start break</button>   
        <button className="btn btn-outline btn-info w-48">Manual entry</button>
        <br></br>
        </div>


        




        <div className="flex flex-col items-center gap-4 w-full lg:w-1/2">
          <div className="divider lg:divider-horizontal hidden lg:block" />
          <div className="card bg-base-200 rounded-box h-auto w-full flex flex-col place-items-center ">
            <p className='my-8 font-semibold mr-72 text-xl'>📊Today's work summary</p>
          <div className='grid grid-cols-2 gap-y-4 gap-x-40 mb-20'>
            <p className='text-gray-500 font-semibold'>Punch in time</p>
            <p className='text-xl font-bold'>8:00 AM</p>

            <p className='text-gray-500 font-semibold'>Hours worked</p>
            <p className='text-xl font-bold'> 3h 47m</p>

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
        <th>Break Time</th>
        <th>Total Hours</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
        
    </tbody>
  </table>
</div>
<br></br>
<br></br>
<br></br>
</div>

  );
}
