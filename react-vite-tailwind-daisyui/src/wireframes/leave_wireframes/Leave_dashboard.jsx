export default function Leave_dashboard(){
    return(
        <div className="flex flex-col">
         
            <p>
                Leave Balance overview
            </p>
        
                <div className=" flex flex-row justify-between gap-10">
                    <div className="flex flex-col border rounded-2xl">
                        <p>Annual Leave</p>
                        <p>15</p>
                        <p>Used: 5 / Total:20</p>
                    </div>
                     <div className="flex flex-col border rounded-2xl">
                        <p>Sick Leave</p>
                        <p>8</p>
                        <p>Used: 2 / Total:5</p>
                    </div>
                     <div className="flex flex-col border rounded-2xl">
                        <p>Personal Leave</p>
                        <p>15</p>
                        <p>Used: 5 / Total:20</p>
                    </div>
                     <div className="flex flex-col border rounded-2xl">
                        <p>Annual Leave</p>
                        <p>15</p>
                        <p>Used: 5 / Total:20</p>
                    </div>
            

            </div>
<p>Recent Leave Requests</p>
<div className="flex flex-row justify-between m-28">
     <div className="flex flex-col border rounded-2xl">
                        <p>Annual Leave</p>
                        <p>15</p>
                        <p>Used: 5 / Total:20</p>
                    </div>
                     <div className="flex flex-col border rounded-2xl">
                        <p>Sick Leave</p>
                        <p>8</p>
                        <p>Used: 2 / Total:5</p>
                    </div>
                     <div className="flex flex-col border rounded-2xl">
                        <p>Personal Leave</p>
                        <p>15</p>
                        <p>Used: 5 / Total:20</p>
                    </div>
</div>
<div className="overflow-x-auto">
  <table className="table table-4xl">
    <thead>
      <tr>
        <th>Leave Type</th>
        <th>Dates</th>
        <th>Days</th>
        <th>Status</th>
        <th>Applied On</th>
        <th>Actions</th>

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