import React from "react";

export default function ManualEntryDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="card bg-base-100 shadow mb-8">
        <div className="card-body items-center text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">📋 Manual Entry Management</h1>
          <p className="text-sm text-gray-500">Submissions & Approvals Dashboard</p>
        </div>
      </div>

      <div className="bg-yellow-500 text-white rounded-lg p-4 flex justify-between items-center mb-8">
        <span className="font-semibold">📊 Entry Overview</span>
        <span className="text-sm">8 Total | 5 Pending | 2 Approved | 1 Rejected</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 text-center">
          <h2 className="text-3xl font-bold text-yellow-500">5</h2>
          <p className="text-sm text-gray-600">Pending Approval</p>
          <p className="text-xs text-gray-400">Avg wait: 4 hours</p>
        </div>

        <div className="card p-6 text-center">
          <h2 className="text-3xl font-bold text-green-500">2</h2>
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-xs text-gray-400">This week</p>
        </div>

        <div className="card p-6 text-center">
          <h2 className="text-3xl font-bold text-blue-500">3</h2>
          <p className="text-sm text-gray-600">Saved Drafts</p>
          <p className="text-xs text-gray-400">Ready to submit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="card mb-6">
            <div className="card-body">
              <h3 className="font-semibold border-b pb-2 mb-4">⏳ Pending Approval</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="border-l-4 border-yellow-500 bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-800 mb-1">Dec 22, 5:15 PM - Clock Out</div>
                        <div className="text-xs text-gray-500 mb-1">Submitted: 2 hours ago | Reason: Forgot to punch out</div>
                        <div className="text-xs italic text-gray-400">"Was in a rush to catch train, forgot to punch out"</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="badge badge-warning text-white">Pending</div>
                        <button className="btn btn-outline btn-sm">Edit</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="font-semibold border-b pb-2 mb-4">✅ Approval History</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-800 mb-1">Dec 19, 8:00 AM - Clock In</div>
                      <div className="text-xs text-gray-500 mb-1">Approved: Yesterday | Reason: Technical issue</div>
                      <div className="text-xs text-green-500">✓ Manager comment: System issues confirmed by IT department</div>
                    </div>
                    <div className="badge badge-success text-white">Approved</div>
                  </div>
                </div>

                <div className="border-l-4 border-red-500 bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-800 mb-1">Dec 18, 7:00 PM - Clock Out</div>
                      <div className="text-xs text-gray-500 mb-1">Rejected: 2 days ago | Reason: Forgot to punch</div>
                      <div className="text-xs text-red-500">✗ Manager comment: Need more specific reason for late departure</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="badge badge-error text-white">Rejected</div>
                      <button className="btn btn-sm">Resubmit</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-body">
              <h3 className="font-semibold border-b pb-2 mb-4">💾 Saved Drafts</h3>
              {[1, 2].map((item) => (
                <div key={item} className="relative border bg-white p-4 rounded-lg shadow mb-4">
                  <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">DRAFT</span>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-800 mb-1">Dec 22, 12:30 PM - Lunch End</div>
                      <div className="text-xs text-gray-500 mb-1">Last saved: 30 minutes ago | Auto-saved</div>
                      <div className="text-xs italic text-gray-400">Partial entry: Meeting ran over lunch time...</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-sm">Submit</button>
                      <button className="btn btn-outline btn-sm">Edit</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="font-semibold border-b pb-2 mb-4">👤 Approval Manager</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">SJ</div>
                <div>
                  <div className="font-semibold text-gray-800">Sarah Johnson</div>
                  <div className="text-xs text-gray-500">Engineering Manager</div>
                  <div className="text-xs text-gray-500">sarah.johnson@company.com</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between"><span>Typical Response Time</span><span className="font-semibold">4-6 hours</span></div>
                <div className="flex justify-between"><span>Approval Rate</span><span className="font-semibold">95%</span></div>
                <div className="flex justify-between"><span>Last Review</span><span className="font-semibold">2 hours ago</span></div>
              </div>
              <button className="btn btn-outline w-full mt-4">Contact Manager</button>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="font-semibold border-b pb-2 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-2">
                <button className="btn w-full">+ New Manual Entry</button>
                <button className="btn btn-outline w-full">📤 Submit All Drafts</button>
                <button className="btn btn-secondary w-full">📊 View Analytics</button>
                <button className="btn btn-secondary w-full">📋 Export History</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button className="btn btn-primary fixed bottom-4 right-4 rounded-full px-6 py-3 shadow-lg">💾 Auto-saved</button>
    </div>
  );
}
