import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiDollarSign, FiDownload, FiCalendar, FiFileText, FiEye } from "react-icons/fi";

import { PAYROLL_API_BASE as API_BASE } from "../../api";

export default function MyPayslips() {
  const [payslips, setPayslips] = useState([]);
  const [mySalary, setMySalary] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [payslipRes] = await Promise.all([
        axios.get(`${API_BASE}/payslips/my`, { headers: { Authorization: token } })
      ]);
      setPayslips(payslipRes.data);
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.response?.status !== 404) {
        toast.error("Failed to load payslips");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPayslipDetails = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/payslips/${id}`, {
        headers: { Authorization: token }
      });
      setSelectedPayslip(res.data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error("Failed to load payslip details");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-warning',
      generated: 'badge-info',
      approved: 'badge-success',
      paid: 'badge-success',
      cancelled: 'badge-error'
    };
    return <span className={`badge ${badges[status] || 'badge-ghost'}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiDollarSign className="text-green-600" /> My Payslips
        </h1>
        <p className="text-gray-500">View and download your salary slips</p>
      </div>

      {/* Summary Card */}
      {payslips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat bg-white rounded-xl shadow">
            <div className="stat-title">Total Payslips</div>
            <div className="stat-value text-primary">{payslips.length}</div>
          </div>
          <div className="stat bg-white rounded-xl shadow">
            <div className="stat-title">Latest Net Salary</div>
            <div className="stat-value text-green-600">
              {formatCurrency(payslips[0]?.net_salary)}
            </div>
          </div>
          <div className="stat bg-white rounded-xl shadow">
            <div className="stat-title">Latest Period</div>
            <div className="stat-value text-lg">{payslips[0]?.period_name}</div>
          </div>
        </div>
      )}

      {/* Payslips List */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FiFileText /> Payslip History
          </h2>
        </div>

        {payslips.length === 0 ? (
          <div className="p-12 text-center">
            <FiFileText size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-500">No Payslips Yet</h3>
            <p className="text-gray-400">Your payslips will appear here once processed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Payslip #</th>
                  <th>Period</th>
                  <th>Days Worked</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((slip) => (
                  <tr key={slip.id} className="hover">
                    <td className="font-mono text-sm">{slip.payslip_number}</td>
                    <td>
                      <div className="font-medium">{slip.period_name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(slip.period_start).toLocaleDateString()} - {new Date(slip.period_end).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className="font-medium">{slip.days_worked}</span>
                      <span className="text-gray-400">/{slip.working_days}</span>
                    </td>
                    <td className="text-green-600 font-medium">
                      {formatCurrency(slip.total_earnings)}
                    </td>
                    <td className="text-red-600">
                      {formatCurrency(slip.total_deductions)}
                    </td>
                    <td className="font-bold text-lg">
                      {formatCurrency(slip.net_salary)}
                    </td>
                    <td>{getStatusBadge(slip.status)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => fetchPayslipDetails(slip.id)}
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Download PDF"
                        >
                          <FiDownload />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payslip Detail Modal */}
      {showDetailModal && selectedPayslip && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 pb-4 border-b">
              <div>
                <h3 className="font-bold text-xl">Payslip</h3>
                <p className="text-sm text-gray-500 font-mono">{selectedPayslip.payslip_number}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>

            {/* Employee & Period Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-base-200 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 uppercase">Employee</p>
                <p className="font-semibold text-lg">{selectedPayslip.first_name} {selectedPayslip.last_name}</p>
                <p className="text-sm text-gray-600">{selectedPayslip.job_title}</p>
                <p className="text-sm text-gray-600">{selectedPayslip.department_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase">Pay Period</p>
                <p className="font-semibold text-lg">{selectedPayslip.period_name}</p>
                <p className="text-sm text-gray-600">
                  <FiCalendar className="inline mr-1" />
                  {new Date(selectedPayslip.period_start).toLocaleDateString()} - {new Date(selectedPayslip.period_end).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{selectedPayslip.working_days}</p>
                <p className="text-xs text-gray-500">Working Days</p>
              </div>
              <div className="text-center p-3 border rounded-lg bg-green-50">
                <p className="text-2xl font-bold text-green-600">{selectedPayslip.days_worked}</p>
                <p className="text-xs text-gray-500">Days Worked</p>
              </div>
              <div className="text-center p-3 border rounded-lg bg-yellow-50">
                <p className="text-2xl font-bold text-yellow-600">{selectedPayslip.leaves_taken}</p>
                <p className="text-xs text-gray-500">Leaves</p>
              </div>
              <div className="text-center p-3 border rounded-lg bg-red-50">
                <p className="text-2xl font-bold text-red-600">{selectedPayslip.days_absent}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
            </div>

            {/* Earnings & Deductions */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Earnings */}
              <div>
                <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Earnings
                </h4>
                <div className="space-y-2">
                  {selectedPayslip.line_items?.filter(i => i.type === 'earning').map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-dashed">
                      <span className="text-gray-700">{item.description}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-2 mt-2 font-bold text-green-700 border-t-2 border-green-200">
                  <span>Gross Earnings</span>
                  <span>{formatCurrency(selectedPayslip.total_earnings)}</span>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  Deductions
                </h4>
                <div className="space-y-2">
                  {selectedPayslip.line_items?.filter(i => i.type === 'deduction').map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-dashed">
                      <span className="text-gray-700">{item.description}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {selectedPayslip.line_items?.filter(i => i.type === 'deduction').length === 0 && (
                    <p className="text-gray-400 text-sm">No deductions</p>
                  )}
                </div>
                <div className="flex justify-between py-2 mt-2 font-bold text-red-700 border-t-2 border-red-200">
                  <span>Total Deductions</span>
                  <span>{formatCurrency(selectedPayslip.total_deductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl p-6 text-center">
              <p className="text-sm opacity-80">Net Salary Payable</p>
              <p className="text-4xl font-bold">{formatCurrency(selectedPayslip.net_salary)}</p>
              {selectedPayslip.bank_account_number && (
                <p className="text-sm mt-2 opacity-80">
                  To be credited to A/C ending with ...{selectedPayslip.bank_account_number.slice(-4)}
                </p>
              )}
            </div>

            {/* Bank Details */}
            {selectedPayslip.bank_name && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Payment Details</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Bank</p>
                    <p className="font-medium">{selectedPayslip.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Account</p>
                    <p className="font-medium">{selectedPayslip.bank_account_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">PAN</p>
                    <p className="font-medium">{selectedPayslip.pan_number || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              <button className="btn btn-primary">
                <FiDownload className="mr-1" /> Download PDF
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}></div>
        </div>
      )}
    </div>
  );
}
