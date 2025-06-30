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
     
  </table>
  </div>

        </div>
    );
}