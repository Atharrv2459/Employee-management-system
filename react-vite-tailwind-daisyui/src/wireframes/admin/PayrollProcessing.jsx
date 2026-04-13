import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  FiDollarSign, FiPlus, FiPlay, FiCheck, FiCalendar, 
  FiUsers, FiFileText, FiDownload, FiEye 
} from "react-icons/fi";

import { PAYROLL_API_BASE as API_BASE } from "../../api";

export default function PayrollProcessing() {
  const [periods, setPeriods] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const [periodForm, setPeriodForm] = useState({
    name: "",
    period_start: "",
    period_end: "",
    pay_date: ""
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      const res = await axios.get(`${API_BASE}/periods`, {
        headers: { Authorization: token }
      });
      setPeriods(res.data);
    } catch (error) {
      console.error("Fetch periods error:", error);
      toast.error("Failed to load payroll periods");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayslips = async (periodId) => {
    try {
      const res = await axios.get(`${API_BASE}/payslips/period/${periodId}`, {
        headers: { Authorization: token }
      });
      setPayslips(res.data);
    } catch (error) {
      console.error("Fetch payslips error:", error);
    }
  };

  const fetchPayslipDetails = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/payslips/${id}`, {
        headers: { Authorization: token }
      });
      setSelectedPayslip(res.data);
      setShowPayslipModal(true);
    } catch (error) {
      toast.error("Failed to load payslip details");
    }
  };

  const handleSelectPeriod = (period) => {
    setSelectedPeriod(period);
    if (period.status === 'completed') {
      fetchPayslips(period.id);
    } else {
      setPayslips([]);
    }
  };

  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/periods`, periodForm, {
        headers: { Authorization: token }
      });
      toast.success("Payroll period created");
      setShowCreateModal(false);
      setPeriodForm({ name: "", period_start: "", period_end: "", pay_date: "" });
      fetchPeriods();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create period");
    }
  };

  const handleProcessPayroll = async () => {
    if (!selectedPeriod) return;
    if (!window.confirm(`Process payroll for ${selectedPeriod.name}? This action cannot be undone.`)) return;

    setProcessing(true);
    try {
      const res = await axios.post(
        `${API_BASE}/periods/${selectedPeriod.id}/process`,
        {},
        { headers: { Authorization: token } }
      );
      toast.success(`Payroll processed! ${res.data.summary.employees_processed} payslips generated.`);
      fetchPeriods();
      fetchPayslips(selectedPeriod.id);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to process payroll");
    } finally {
      setProcessing(false);
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
      processing: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-error'
    };
    return <span className={`badge ${badges[status] || 'badge-ghost'}`}>{status}</span>;
  };

  const generateMonthName = () => {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const payDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    setPeriodForm({
      name: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      period_start: start.toISOString().split('T')[0],
      period_end: end.toISOString().split('T')[0],
      pay_date: payDate.toISOString().split('T')[0]
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Periods List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Payroll Periods</h2>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => { generateMonthName(); setShowCreateModal(true); }}
                >
                  <FiPlus className="mr-1" /> New Period
                </button>
              </div>
              <div className="space-y-2">
                {periods.map((period) => (
                  <div
                    key={period.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPeriod?.id === period.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectPeriod(period)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{period.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(period.status)}
                    </div>
                    {period.status === 'completed' && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">{period.total_employees}</span> employees • 
                        Net: <span className="font-medium text-green-600">{formatCurrency(period.total_net_pay)}</span>
                      </div>
                    )}
                  </div>
                ))}
                {periods.length === 0 && (
                  <p className="text-center text-gray-400 py-4">No payroll periods created</p>
                )}
              </div>
            </div>
          </div>

          {/* Period Details & Payslips */}
          <div className="lg:col-span-2">
            {selectedPeriod ? (
              <div className="space-y-4">
                {/* Period Summary */}
                <div className="bg-white rounded-xl shadow p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedPeriod.name}</h2>
                      <p className="text-gray-500">
                        <FiCalendar className="inline mr-1" />
                        {new Date(selectedPeriod.period_start).toLocaleDateString()} - {new Date(selectedPeriod.period_end).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedPeriod.status === 'draft' && (
                      <button
                        className={`btn btn-success ${processing ? 'loading' : ''}`}
                        onClick={handleProcessPayroll}
                        disabled={processing}
                      >
                        <FiPlay className="mr-1" /> Run Payroll
                      </button>
                    )}
                    {selectedPeriod.status === 'completed' && (
                      <div className="badge badge-success badge-lg gap-1">
                        <FiCheck /> Completed
                      </div>
                    )}
                  </div>

                  {selectedPeriod.status === 'completed' && (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="stat bg-base-200 rounded-lg p-3">
                        <div className="stat-title text-xs">Employees</div>
                        <div className="stat-value text-lg">{selectedPeriod.total_employees}</div>
                      </div>
                      <div className="stat bg-green-50 rounded-lg p-3">
                        <div className="stat-title text-xs">Gross Pay</div>
                        <div className="stat-value text-lg text-green-600">{formatCurrency(selectedPeriod.total_gross_pay)}</div>
                      </div>
                      <div className="stat bg-red-50 rounded-lg p-3">
                        <div className="stat-title text-xs">Deductions</div>
                        <div className="stat-value text-lg text-red-600">{formatCurrency(selectedPeriod.total_deductions)}</div>
                      </div>
                      <div className="stat bg-blue-50 rounded-lg p-3">
                        <div className="stat-title text-xs">Net Pay</div>
                        <div className="stat-value text-lg text-blue-600">{formatCurrency(selectedPeriod.total_net_pay)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payslips Table */}
                {selectedPeriod.status === 'completed' && payslips.length > 0 && (
                  <div className="bg-white rounded-xl shadow p-4">
                    <h3 className="text-lg font-bold mb-4">
                      <FiFileText className="inline mr-2" />
                      Payslips ({payslips.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Payslip #</th>
                            <th>Employee</th>
                            <th>Days Worked</th>
                            <th>Gross</th>
                            <th>Deductions</th>
                            <th>Net</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payslips.map((slip) => (
                            <tr key={slip.id} className="hover">
                              <td className="font-mono text-xs">{slip.payslip_number}</td>
                              <td>
                                <div>{slip.first_name} {slip.last_name}</div>
                                <div className="text-xs text-gray-500">{slip.department_name}</div>
                              </td>
                              <td>{slip.days_worked}/{slip.working_days}</td>
                              <td className="text-green-600">{formatCurrency(slip.total_earnings)}</td>
                              <td className="text-red-600">{formatCurrency(slip.total_deductions)}</td>
                              <td className="font-semibold">{formatCurrency(slip.net_salary)}</td>
                              <td>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => fetchPayslipDetails(slip.id)}
                                >
                                  <FiEye />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedPeriod.status === 'draft' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <FiUsers size={48} className="mx-auto text-yellow-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Process</h3>
                    <p className="text-gray-600 mb-4">
                      Click "Run Payroll" to generate payslips for all employees with active salary records.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <FiCalendar size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-500">Select a Payroll Period</h3>
                <p className="text-gray-400">Choose a period from the list or create a new one</p>
              </div>
            )}
          </div>
        </div>

      {/* Create Period Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create Payroll Period</h3>
            <form onSubmit={handleCreatePeriod}>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Period Name</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                  placeholder="e.g., January 2024"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text">Start Date</span></label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={periodForm.period_start}
                    onChange={(e) => setPeriodForm({ ...periodForm, period_start: e.target.value })}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">End Date</span></label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={periodForm.period_end}
                    onChange={(e) => setPeriodForm({ ...periodForm, period_end: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-control mt-3">
                <label className="label"><span className="label-text">Pay Date</span></label>
                <input
                  type="date"
                  className="input input-bordered"
                  value={periodForm.pay_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, pay_date: e.target.value })}
                />
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Period</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}></div>
        </div>
      )}

      {/* Payslip Details Modal */}
      {showPayslipModal && selectedPayslip && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">Payslip</h3>
                <p className="text-sm text-gray-500">{selectedPayslip.payslip_number}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPayslipModal(false)}>✕</button>
            </div>

            {/* Employee Info */}
            <div className="bg-base-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="font-semibold">{selectedPayslip.first_name} {selectedPayslip.last_name}</p>
                  <p className="text-sm">{selectedPayslip.job_title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Period</p>
                  <p className="font-semibold">{selectedPayslip.period_name}</p>
                  <p className="text-sm">
                    {new Date(selectedPayslip.period_start).toLocaleDateString()} - {new Date(selectedPayslip.period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="text-center p-2 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Working Days</p>
                <p className="font-bold">{selectedPayslip.working_days}</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-xs text-gray-500">Days Worked</p>
                <p className="font-bold text-green-600">{selectedPayslip.days_worked}</p>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <p className="text-xs text-gray-500">Leaves</p>
                <p className="font-bold text-yellow-600">{selectedPayslip.leaves_taken}</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <p className="text-xs text-gray-500">Absent</p>
                <p className="font-bold text-red-600">{selectedPayslip.days_absent}</p>
              </div>
            </div>

            {/* Earnings & Deductions */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Earnings</h4>
                <div className="space-y-1">
                  {selectedPayslip.line_items?.filter(i => i.type === 'earning').map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-1 font-semibold flex justify-between">
                    <span>Total Earnings</span>
                    <span className="text-green-600">{formatCurrency(selectedPayslip.total_earnings)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Deductions</h4>
                <div className="space-y-1">
                  {selectedPayslip.line_items?.filter(i => i.type === 'deduction').map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-1 font-semibold flex justify-between">
                    <span>Total Deductions</span>
                    <span className="text-red-600">{formatCurrency(selectedPayslip.total_deductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">Net Salary</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(selectedPayslip.net_salary)}</p>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowPayslipModal(false)}>Close</button>
              <button className="btn btn-primary">
                <FiDownload className="mr-1" /> Download PDF
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowPayslipModal(false)}></div>
        </div>
      )}
    </div>
  );
}
