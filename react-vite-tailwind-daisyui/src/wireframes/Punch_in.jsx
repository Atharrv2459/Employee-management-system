import { useState } from 'react';
import axios from 'axios';
export default function Punch_in() {
  return (
    <div className="flex flex-col p-6 space-y-8">
     
      <div className="bg-green-600 rounded-xl text-white flex flex-col lg:flex-row justify-between items-center p-6">
        <p>Currently Clocked in since 8:00 AM</p>
        <p>Working time: Location: Main office</p>
        <p>11:47 AM</p>
      </div>

      <div className="flex flex-col lg:flex-row justify-center items-start gap-6">
   
        <div className="card bg-base-200 rounded-box w-full lg:w-1/2 h-auto place-items-center flex flex-col">
        <p className="text-gray-400 my-10">
            Thursday, December 22, 2024
        </p>
        <div className="bg-base-300 text-5xl font-semibold p-6 rounded-xl">11:47 AM</div>
        <br></br>
        <br></br>
        <button className="mask mask-circle size-48 bg-red-500 font-bold text-4xl text-white ">Punch in</button>       
        <button className="btn btn-accent my-12 w-48">Start break</button>   
        <button className="btn btn-outline btn-info w-48">Manual entry</button>
        <br></br>
        </div>

        <div className="flex flex-col items-center gap-4 w-full lg:w-1/2">
          <div className="divider lg:divider-horizontal hidden lg:block" />
          <div className="card bg-base-200 rounded-box h-20 w-full grid place-items-center">
            Content
          </div>
          <div className="divider" />
          <div className="card bg-base-200 rounded-box h-20 w-full grid place-items-center">
            Content
          </div>
        </div>
      </div>
      <div className="card bg-base-200 rounded-box grid h-20 place-items-center m-24">
      <div className="overflow-x-auto">
  <table className="table table-4xl">
    <thead>
      <tr>
        <th></th>
        <th>Date</th>
        <th>Punch in</th>
        <th>Punch out</th>
        <th>Break time</th>
        <th>Total hours</th>
        <th>Status</th>
      </tr>
    </thead>
     
  </table>
</div>


            <div className="join my-48 gap-4">
  <button className="btn join-item bg-green-50">View Full Timesheet</button>
  <button className="btn join-item">Apply for Leave</button>
  <button className="btn join-item">View Schedule</button>
  <button className="btn join-item">Contact Manager</button>
</div>
         </div>
</div>

  );
}
