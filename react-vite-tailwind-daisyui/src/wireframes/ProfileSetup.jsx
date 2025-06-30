export default function ProfileSetup() {
  return (
    <div className="p-6">
      <div className="flex w-full flex-col lg:flex-row gap-12">
        {/* Left: Profile Overview */}
        <div className="card bg-base-100 shadow-md rounded-xl w-full mx-12">
          <div className="bg-blue-600 text-white text-center py-3 rounded-t-xl font-semibold text-lg">
            Employee Dashboard - Profile Management
          </div>
          <div className="p-6">
            <h3 className="text-gray-700 font-bold mb-2">Profile Overview</h3>

            {/* Top profile section */}
            <div className="flex gap-6 items-start">
              <button className="mask mask-circle w-24 h-24 border border-dashed border-gray-400 text-xs text-center flex items-center justify-center">
                Click to Upload Photo
              </button>

              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-black">John Doe</p>
                <p>Software Engineer</p>
                <p>Employee ID: EMP001</p>
                <p>Department: Engineering</p>
                <p>Hire Date: January 15, 2023</p>
              </div>
            </div>

            <button className="btn btn-sm mt-4">Change Photo</button>


            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 font-semibold">Full Name</label>
                <input className="input input-bordered w-full" type="text" placeholder="Full name" />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold">Address</label>
                <input className="input input-bordered w-full" type="text" placeholder="Address" />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold">Email</label>
                <input className="input input-bordered w-full" type="email" placeholder="Email" />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold">Date of Birth</label>
                <input className="input input-bordered w-full" type="date" />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold">Phone</label>
                <input className="input input-bordered w-full" type="text" placeholder="Phone" />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-semibold">Manager</label>
                <select className="select select-bordered w-full">
                  <option selected>Sarah Johnson</option>
                  <option>Other Manager</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button className="btn bg-gray-400 text-white">Reset</button>
              <button className="btn bg-blue-500 text-white">Save Changes</button>
            </div>
          </div>
        </div>

        {/* Right: Emergency Contacts */}
        <div className="card bg-base-100 shadow-md rounded-xl w-full mr-12">
          <div className="bg-blue-600 text-white text-center py-3 rounded-t-xl font-semibold text-lg">
            Profile Management - Emergency Contacts
          </div>
          <div className="p-6">
            <h3 className="text-gray-800 font-semibold mb-4">Emergency Contact Information</h3>
            <button className="btn btn-sm mb-4">+ Add New Contact</button>

            {/* Primary Contact */}
            <div className="mb-6 border p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Primary Emergency Contact</h4>
                <div className="flex gap-2">
                  <button className="btn btn-xs btn-outline">Edit</button>
                  <button className="btn btn-xs btn-outline">Delete</button>
                </div>
              </div>
              <input className="input input-bordered w-full mb-2" placeholder="Full Name" />
              <input className="input input-bordered w-full mb-2" placeholder="Phone" />
              <input className="input input-bordered w-full mb-2" placeholder="Relationship" />
              <input className="input input-bordered w-full" placeholder="Email (Optional)" />
            </div>

            {/* Secondary Contact */}
            <div className="mb-6 border p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Secondary Emergency Contact</h4>
                <div className="flex gap-2">
                  <button className="btn btn-xs btn-outline">Edit</button>
                  <button className="btn btn-xs btn-outline">Delete</button>
                </div>
              </div>
              <input className="input input-bordered w-full mb-2" placeholder="Full Name" />
              <input className="input input-bordered w-full mb-2" placeholder="Phone" />
              <input className="input input-bordered w-full mb-2" placeholder="Relationship" />
              <input className="input input-bordered w-full" placeholder="Email (Optional)" />
            </div>

            <label className="font-semibold text-sm">Medical Information / Allergies (Optional)</label>
            <textarea className="textarea textarea-bordered w-full mt-2 mb-4" rows="3" placeholder="Any relevant medical info..."></textarea>

            <div className="flex justify-end gap-4">
              <button className="btn bg-gray-400 text-white">Cancel</button>
              <button className="btn bg-blue-500 text-white">Save Emergency Contacts</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Shift Preferences */}
      <div className="card bg-base-100 shadow-md rounded-xl max-w-6xl mx-auto mt-16">
        <div className="bg-blue-600 text-white text-center py-3 rounded-t-xl font-semibold text-lg">
          Profile Management - Shift Preferences
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Shift types and constraints */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Preferred Shift Types</h4>
            <div className="flex flex-col gap-2">
              <label><input type="checkbox" className="mr-2" />Morning Shift (6:00 AM - 2:00 PM)</label>
              <label><input type="checkbox" className="mr-2" defaultChecked />Day Shift (9:00 AM - 5:00 PM)</label>
              <label><input type="checkbox" className="mr-2" />Evening Shift (2:00 PM - 10:00 PM)</label>
              <label><input type="checkbox" className="mr-2" />Night Shift (10:00 PM - 6:00 AM)</label>
              <label><input type="checkbox" className="mr-2" />Weekend Shifts</label>
            </div>

            <div className="mt-4">
              <label className="font-semibold text-sm text-gray-700">Work Schedule Constraints</label>
              <input className="input input-bordered w-full mt-1" placeholder="Maximum 40 hours per week" />
            </div>
          </div>

          {/* Right: Unavailability and notes */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Unavailable Days/Times</h4>
            <div className="flex gap-2 flex-wrap">
              <span className="badge badge-neutral">Sundays</span>
              <span className="badge badge-neutral">Major Holidays</span>
            </div>
            <button className="btn btn-sm mt-2">+ Add Unavailable Time</button>

            <div className="mt-6">
              <h4 className="font-semibold text-gray-700">Overtime Availability</h4>
              <label className="block mt-2"><input type="checkbox" className="mr-2" defaultChecked />Available for overtime when needed</label>
              <label className="block"><input type="checkbox" className="mr-2" />Available for emergency calls</label>
            </div>

            <div className="mt-4">
              <label className="font-semibold text-sm text-gray-700">Additional Notes</label>
              <textarea className="textarea textarea-bordered w-full mt-1" rows="3" placeholder="Any additional scheduling preferences..."></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
