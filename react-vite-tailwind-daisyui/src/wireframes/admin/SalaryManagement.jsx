import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FiDollarSign, FiPlus, FiEdit2, FiUsers, FiTrendingUp, FiPercent } from "react-icons/fi";

const API_BASE = "http://localhost:5001/api/payroll";

export default function SalaryManagement() {
  const [activeTab, setActiveTab] = useState("employees");
  const [components, setComponents] = useState([]);
  const [structures, setStructures] = useState([]);
  const [employeeSalaries, setEmployeeSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [salaryForm, setSalaryForm] = useState({
    user_id: "",
    salary_structure_id: "",
    base_salary: "",
    effective_from: new Date().toISOString().split('T')[0],
    bank_name: "",
    bank_account_number: "",
    bank_ifsc_code: "",
    pan_number: "",
    pf_number: "",
    esi_number: "",
    components: []
  });

  const [componentForm, setComponentForm] = useState({
    name: "",
    code: "",
    type: "earning",
    category: "allowance",
    calculation_type: "fixed",
    is_taxable: true,
    description: ""
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [compRes, structRes, salaryRes, empRes] = await Promise.all([
        axios.get(`${API_BASE}/components`),
        axios.get(`${API_BASE}/structures`),
        axios.get(`${API_BASE}/employee-salaries`, { headers: { Authorization: token } }),
        axios.get("http://localhost:5001/api/employee/getAll")
      ]);
      setComponents(compRes.data);
      setStructures(structRes.data);
      setEmployeeSalaries(salaryRes.data);
      setEmployees(empRes.data.data || empRes.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const openAssignModal = (emp = null) => {
    if (emp) {
      const existing = employeeSalaries.find(s => s.user_id === emp.user_id);
      setSalaryForm({
        user_id: emp.user_id,
        salary_structure_id: existing?.salary_structure_id || "",
        base_salary: existing?.base_salary || "",
        effective_from: new Date().toISOString().split('T')[0],
        bank_name: existing?.bank_name || "",
        bank_account_number: existing?.bank_account_number || "",
        bank_ifsc_code: existing?.bank_ifsc_code || "",
        pan_number: existing?.pan_number || "",
        pf_number: existing?.pf_number || "",
        esi_number: existing?.esi_number || "",
        components: []
      });
      setSelectedEmployee(emp);
    } else {
      setSalaryForm({
        user_id: "",
        salary_structure_id: "",
        base_salary: "",
        effective_from: new Date().toISOString().split('T')[0],
        bank_name: "",
        bank_account_number: "",
        bank_ifsc_code: "",
        pan_number: "",
        pf_number: "",
        esi_number: "",
        components: []
      });
      setSelectedEmployee(null);
    }
    setShowAssignModal(true);
  };

  const handleAssignSalary = async (e) => {
    e.preventDefault();
    try {
      // Build components from base salary
      const basicAmount = parseFloat(salaryForm.base_salary) * 0.5;
      const hra = basicAmount * 0.4;
      const da = basicAmount * 0.1;
      const special = parseFloat(salaryForm.base_salary) - basicAmount - hra - da;

      const basicComp = components.find(c => c.code === 'BASIC');
      const hraComp = components.find(c => c.code === 'HRA');
      const daComp = components.find(c => c.code === 'DA');
      const specialComp = components.find(c => c.code === 'SPECIAL');

      const salaryComponents = [];
      if (basicComp) salaryComponents.push({ component_id: basicComp.id, amount: basicAmount });
      if (hraComp) salaryComponents.push({ component_id: hraComp.id, amount: hra });
      if (daComp) salaryComponents.push({ component_id: daComp.id, amount: da });
      if (specialComp) salaryComponents.push({ component_id: specialComp.id, amount: special });

      await axios.post(`${API_BASE}/employee-salaries`, {
        ...salaryForm,
        components: salaryComponents
      }, {
        headers: { Authorization: token }
      });

      toast.success("Salary assigned successfully");
      setShowAssignModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to assign salary");
    }
  };

  const handleCreateComponent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/components`, componentForm, {
        headers: { Authorization: token }
      });
      toast.success("Component created successfully");
      setShowComponentModal(false);
      setComponentForm({
        name: "",
        code: "",
        type: "earning",
        category: "allowance",
        calculation_type: "fixed",
        is_taxable: true,
        description: ""
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create component");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div>
      {/* Navbar */}
      <div className="navbar bg-white shadow-md px-6 fixed top-0 left-0 w-full z-50">
        <div className="navbar-start">
          <button className="btn btn-ghost text-xl font-bold text-green-600">
            <FiDollarSign className="mr-2" /> Payroll Management
          </button>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li><button onClick={() => navigate('/admin')} className="btn btn-ghost btn-sm">Users</button></li>
            <li><button onClick={() => navigate('/admin/departments')} className="btn btn-ghost btn-sm">Departments</button></li>
            <li><button onClick={() => navigate('/admin/payroll')} className="btn btn-ghost btn-sm btn-active">Payroll</button></li>
            <li><button onClick={() => navigate('/admin/payroll/process')} className="btn btn-ghost btn-sm">Run Payroll</button></li>
          </ul>
        </div>
        <div className="navbar-end">
          <button onClick={handleLogout} className="btn btn-sm btn-error text-white">Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 p-6 bg-gray-50 min-h-screen">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="stat bg-white rounded-xl shadow">
            <div className="stat-figure text-primary"><FiUsers size={24} /></div>
            <div className="stat-title">Employees with Salary</div>
            <div className="stat-value text-primary">{employeeSalaries.length}</div>
          </div>
          <div className="stat bg-white rounded-xl shadow">
            <div className="stat-figure text-secondary"><FiTrendingUp size={24} /></div>
            <div className="stat-title">Total Monthly Payroll</div>
            <div className="stat-value text-secondary text-lg">
              {formatCurrency(employeeSalaries.reduce((sum, s) => sum + parseFloat(s.base_salary || 0), 0))}
            </div>
          </div>
          <div className="stat bg-white rounded-xl shadow">
            <div className="stat-figure text-accent"><FiPercent size={24} /></div>
            <div className="stat-title">Salary Components</div>
            <div className="stat-value text-accent">{components.length}</div>
          </div>
          <div className="stat bg-white rounded-xl shadow">
            <div className="stat-figure text-info"><FiDollarSign size={24} /></div>
            <div className="stat-title">Salary Structures</div>
            <div className="stat-value text-info">{structures.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-4 bg-white p-2 rounded-xl shadow">
          <button
            className={`tab ${activeTab === 'employees' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            Employee Salaries
          </button>
          <button
            className={`tab ${activeTab === 'components' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('components')}
          >
            Salary Components
          </button>
          <button
            className={`tab ${activeTab === 'structures' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('structures')}
          >
            Salary Structures
          </button>
        </div>

        {/* Employee Salaries Tab */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Employee Salaries</h2>
              <button className="btn btn-primary btn-sm" onClick={() => openAssignModal()}>
                <FiPlus className="mr-1" /> Assign Salary
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Base Salary</th>
                    <th>Structure</th>
                    <th>Effective From</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeSalaries.map((sal) => (
                    <tr key={sal.id} className="hover">
                      <td>
                        <div className="font-medium">{sal.first_name} {sal.last_name}</div>
                        <div className="text-xs text-gray-500">{sal.email}</div>
                      </td>
                      <td>{sal.department_name || '-'}</td>
                      <td className="font-semibold text-green-600">{formatCurrency(sal.base_salary)}</td>
                      <td>{sal.structure_name || '-'}</td>
                      <td>{new Date(sal.effective_from).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => openAssignModal({ user_id: sal.user_id, ...sal })}
                        >
                          <FiEdit2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {employeeSalaries.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-400">
                        No salary records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Components Tab */}
        {activeTab === 'components' && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Salary Components</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowComponentModal(true)}>
                <FiPlus className="mr-1" /> Add Component
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Earnings */}
              <div>
                <h3 className="font-semibold text-green-600 mb-2">Earnings</h3>
                <div className="space-y-2">
                  {components.filter(c => c.type === 'earning').map((comp) => (
                    <div key={comp.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between">
                        <span className="font-medium">{comp.name}</span>
                        <span className="badge badge-success badge-sm">{comp.code}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {comp.category} • {comp.calculation_type}
                        {comp.is_taxable && ' • Taxable'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Deductions */}
              <div>
                <h3 className="font-semibold text-red-600 mb-2">Deductions</h3>
                <div className="space-y-2">
                  {components.filter(c => c.type === 'deduction').map((comp) => (
                    <div key={comp.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between">
                        <span className="font-medium">{comp.name}</span>
                        <span className="badge badge-error badge-sm">{comp.code}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {comp.category} • {comp.calculation_type}
                        {comp.is_statutory && ' • Statutory'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Structures Tab */}
        {activeTab === 'structures' && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Salary Structures</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {structures.map((struct) => (
                <div key={struct.id} className="card border">
                  <div className="card-body">
                    <h3 className="card-title">
                      {struct.name}
                      {struct.is_default && <span className="badge badge-primary badge-sm">Default</span>}
                    </h3>
                    <p className="text-sm text-gray-500">{struct.description}</p>
                    <div className="text-xs">
                      <span className="badge badge-outline">{struct.grade_level}</span>
                      <span className="ml-2">{struct.component_count} components</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assign Salary Modal */}
      {showAssignModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {selectedEmployee ? `Update Salary - ${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'Assign Employee Salary'}
            </h3>
            <form onSubmit={handleAssignSalary}>
              {!selectedEmployee && (
                <div className="form-control mb-3">
                  <label className="label"><span className="label-text">Employee</span></label>
                  <select
                    className="select select-bordered"
                    value={salaryForm.user_id}
                    onChange={(e) => setSalaryForm({ ...salaryForm, user_id: e.target.value })}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.user_id} value={emp.user_id}>
                        {emp.first_name} {emp.last_name} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text">Base Salary (CTC)</span></label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={salaryForm.base_salary}
                    onChange={(e) => setSalaryForm({ ...salaryForm, base_salary: e.target.value })}
                    placeholder="Monthly CTC"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Effective From</span></label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={salaryForm.effective_from}
                    onChange={(e) => setSalaryForm({ ...salaryForm, effective_from: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="divider">Bank Details</div>

              <div className="grid grid-cols-3 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text">Bank Name</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={salaryForm.bank_name}
                    onChange={(e) => setSalaryForm({ ...salaryForm, bank_name: e.target.value })}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Account Number</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={salaryForm.bank_account_number}
                    onChange={(e) => setSalaryForm({ ...salaryForm, bank_account_number: e.target.value })}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">IFSC Code</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={salaryForm.bank_ifsc_code}
                    onChange={(e) => setSalaryForm({ ...salaryForm, bank_ifsc_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="divider">Statutory Details</div>

              <div className="grid grid-cols-3 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text">PAN Number</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={salaryForm.pan_number}
                    onChange={(e) => setSalaryForm({ ...salaryForm, pan_number: e.target.value })}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">PF Number</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={salaryForm.pf_number}
                    onChange={(e) => setSalaryForm({ ...salaryForm, pf_number: e.target.value })}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">ESI Number</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={salaryForm.esi_number}
                    onChange={(e) => setSalaryForm({ ...salaryForm, esi_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowAssignModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Salary</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowAssignModal(false)}></div>
        </div>
      )}

      {/* Add Component Modal */}
      {showComponentModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add Salary Component</h3>
            <form onSubmit={handleCreateComponent}>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Name</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={componentForm.name}
                  onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Code</span></label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={componentForm.code}
                  onChange={(e) => setComponentForm({ ...componentForm, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text">Type</span></label>
                  <select
                    className="select select-bordered"
                    value={componentForm.type}
                    onChange={(e) => setComponentForm({ ...componentForm, type: e.target.value })}
                  >
                    <option value="earning">Earning</option>
                    <option value="deduction">Deduction</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Category</span></label>
                  <select
                    className="select select-bordered"
                    value={componentForm.category}
                    onChange={(e) => setComponentForm({ ...componentForm, category: e.target.value })}
                  >
                    <option value="basic">Basic</option>
                    <option value="allowance">Allowance</option>
                    <option value="bonus">Bonus</option>
                    <option value="reimbursement">Reimbursement</option>
                    <option value="statutory_deduction">Statutory Deduction</option>
                    <option value="voluntary_deduction">Voluntary Deduction</option>
                  </select>
                </div>
              </div>
              <div className="form-control mt-3">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={componentForm.is_taxable}
                    onChange={(e) => setComponentForm({ ...componentForm, is_taxable: e.target.checked })}
                  />
                  <span className="label-text">Is Taxable</span>
                </label>
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowComponentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowComponentModal(false)}></div>
        </div>
      )}
    </div>
  );
}
