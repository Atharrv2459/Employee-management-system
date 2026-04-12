import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { 
  FiBriefcase, FiPlus, FiEdit2, FiEye, FiUsers, FiClock, 
  FiMapPin, FiDollarSign, FiTrendingUp, FiSearch
} from "react-icons/fi";

const API_BASE = "http://localhost:5001/api/recruitment";

export default function JobPostings() {
  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', department_id: '' });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [jobForm, setJobForm] = useState({
    title: "",
    department_id: "",
    location: "",
    job_type: "full_time",
    experience_level: "mid",
    experience_min: 0,
    experience_max: 5,
    salary_min: "",
    salary_max: "",
    show_salary: false,
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    positions_available: 1,
    application_deadline: "",
    is_remote: false,
    is_featured: false,
    skills_required: []
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const [jobsRes, deptRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/jobs`, {
          params: filter,
          headers: { Authorization: token }
        }),
        axios.get("http://localhost:5001/api/departments"),
        axios.get(`${API_BASE}/dashboard`, {
          headers: { Authorization: token }
        })
      ]);
      setJobs(jobsRes.data);
      setDepartments(deptRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = (job = null) => {
    if (job) {
      setJobForm({
        ...job,
        skills_required: job.skills_required || [],
        application_deadline: job.application_deadline?.split('T')[0] || ""
      });
      setEditingJob(job);
    } else {
      setJobForm({
        title: "", department_id: "", location: "", job_type: "full_time",
        experience_level: "mid", experience_min: 0, experience_max: 5,
        salary_min: "", salary_max: "", show_salary: false,
        description: "", requirements: "", responsibilities: "", benefits: "",
        positions_available: 1, application_deadline: "",
        is_remote: false, is_featured: false, skills_required: []
      });
      setEditingJob(null);
    }
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await axios.put(`${API_BASE}/jobs/${editingJob.id}`, jobForm, {
          headers: { Authorization: token }
        });
        toast.success("Job updated successfully");
      } else {
        await axios.post(`${API_BASE}/jobs`, jobForm, {
          headers: { Authorization: token }
        });
        toast.success("Job created successfully");
      }
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save job");
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/jobs/${jobId}`, { status: newStatus }, {
        headers: { Authorization: token }
      });
      toast.success(`Job ${newStatus === 'published' ? 'published' : 'updated'}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update job status");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-warning',
      published: 'badge-success',
      paused: 'badge-info',
      closed: 'badge-ghost',
      filled: 'badge-primary'
    };
    return <span className={`badge ${badges[status] || 'badge-ghost'}`}>{status}</span>;
  };

  const getJobTypeBadge = (type) => {
    const labels = {
      full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract',
      internship: 'Internship', temporary: 'Temporary'
    };
    return labels[type] || type;
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="stat bg-white rounded-xl shadow p-4">
            <div className="stat-title text-xs">Active Jobs</div>
            <div className="stat-value text-primary text-2xl">{stats.active_jobs || 0}</div>
          </div>
          <div className="stat bg-white rounded-xl shadow p-4">
            <div className="stat-title text-xs">New Applications</div>
            <div className="stat-value text-warning text-2xl">{stats.new_applications || 0}</div>
          </div>
          <div className="stat bg-white rounded-xl shadow p-4">
            <div className="stat-title text-xs">In Progress</div>
            <div className="stat-value text-info text-2xl">{stats.in_progress || 0}</div>
          </div>
          <div className="stat bg-white rounded-xl shadow p-4">
            <div className="stat-title text-xs">Interviews</div>
            <div className="stat-value text-secondary text-2xl">{stats.upcoming_interviews || 0}</div>
          </div>
          <div className="stat bg-white rounded-xl shadow p-4">
            <div className="stat-title text-xs">Pending Offers</div>
            <div className="stat-value text-accent text-2xl">{stats.pending_offers || 0}</div>
          </div>
          <div className="stat bg-white rounded-xl shadow p-4">
            <div className="stat-title text-xs">Hired (Month)</div>
            <div className="stat-value text-success text-2xl">{stats.hired_this_month || 0}</div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
          <div className="flex gap-2">
            <select
              className="select select-bordered select-sm"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
            <select
              className="select select-bordered select-sm"
              value={filter.department_id}
              onChange={(e) => setFilter({ ...filter, department_id: e.target.value })}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openCreateModal()}>
            <FiPlus className="mr-1" /> Create Job
          </button>
        </div>

        {/* Jobs List */}
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold">{job.title}</h3>
                    {getStatusBadge(job.status)}
                    {job.is_featured && <span className="badge badge-warning badge-sm">Featured</span>}
                    {job.is_remote && <span className="badge badge-outline badge-sm">Remote</span>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FiBriefcase size={14} /> {job.department_name || 'No Department'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiMapPin size={14} /> {job.location || 'Not specified'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock size={14} /> {getJobTypeBadge(job.job_type)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiUsers size={14} /> {job.applications_count} applications
                    </span>
                    <span className="flex items-center gap-1">
                      <FiEye size={14} /> {job.views_count} views
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {job.status === 'draft' && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleStatusChange(job.id, 'published')}
                    >
                      Publish
                    </button>
                  )}
                  {job.status === 'published' && (
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handleStatusChange(job.id, 'paused')}
                    >
                      Pause
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/admin/recruitment/jobs/${job.id}/applications`)}
                  >
                    <FiUsers /> View
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openCreateModal(job)}>
                    <FiEdit2 />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {jobs.length === 0 && (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <FiBriefcase size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-500">No Jobs Found</h3>
              <p className="text-gray-400 mb-4">Create your first job posting</p>
              <button className="btn btn-primary" onClick={() => openCreateModal()}>
                <FiPlus className="mr-1" /> Create Job
              </button>
            </div>
          )}
        </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">
              {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">

                <div className="form-control col-span-2">
                  <label className="label"><span className="label-text">Job Title *</span></label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Department</span></label>
                  <select
                    className="select select-bordered"
                    value={jobForm.department_id}
                    onChange={(e) => setJobForm({ ...jobForm, department_id: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Location</span></label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    placeholder="e.g., Bangalore, India"
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Job Type</span></label>
                  <select
                    className="select select-bordered"
                    value={jobForm.job_type}
                    onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Experience Level</span></label>
                  <select
                    className="select select-bordered"
                    value={jobForm.experience_level}
                    onChange={(e) => setJobForm({ ...jobForm, experience_level: e.target.value })}
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Experience (Years)</span></label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      placeholder="Min"
                      value={jobForm.experience_min}
                      onChange={(e) => setJobForm({ ...jobForm, experience_min: e.target.value })}
                    />
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      placeholder="Max"
                      value={jobForm.experience_max}
                      onChange={(e) => setJobForm({ ...jobForm, experience_max: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Salary Range (Monthly)</span></label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      placeholder="Min"
                      value={jobForm.salary_min}
                      onChange={(e) => setJobForm({ ...jobForm, salary_min: e.target.value })}
                    />
                    <input
                      type="number"
                      className="input input-bordered w-full"
                      placeholder="Max"
                      value={jobForm.salary_max}
                      onChange={(e) => setJobForm({ ...jobForm, salary_max: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-control col-span-2">
                  <label className="label"><span className="label-text">Job Description *</span></label>
                  <textarea
                    className="textarea textarea-bordered h-32"
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    placeholder="Describe the role and responsibilities..."
                    required
                  />
                </div>

                <div className="form-control col-span-2">
                  <label className="label"><span className="label-text">Requirements</span></label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    value={jobForm.requirements}
                    onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                    placeholder="Required skills and qualifications..."
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Positions Available</span></label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={jobForm.positions_available}
                    onChange={(e) => setJobForm({ ...jobForm, positions_available: e.target.value })}
                    min="1"
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Application Deadline</span></label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={jobForm.application_deadline}
                    onChange={(e) => setJobForm({ ...jobForm, application_deadline: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={jobForm.is_remote}
                      onChange={(e) => setJobForm({ ...jobForm, is_remote: e.target.checked })}
                    />
                    <span className="label-text">Remote Position</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={jobForm.is_featured}
                      onChange={(e) => setJobForm({ ...jobForm, is_featured: e.target.checked })}
                    />
                    <span className="label-text">Featured Job</span>
                  </label>
                </div>

              </div>

              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingJob ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}></div>
        </div>
      )}
    </div>
  );
}