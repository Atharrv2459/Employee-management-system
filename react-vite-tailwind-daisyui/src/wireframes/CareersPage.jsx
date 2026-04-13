import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiBriefcase, FiMapPin, FiClock } from "react-icons/fi";
import { RECRUITMENT_API_BASE as API_BASE } from "../api";

const JOB_TYPE_LABEL = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary"
};

const formatSalary = (job) => {
  if (!job?.show_salary) return "Competitive";
  const min = job.salary_min;
  const max = job.salary_max;
  if (min == null && max == null) return "Competitive";

  const fmt = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });

  if (min != null && max != null) return `${fmt.format(min)} – ${fmt.format(max)}`;
  if (min != null) return `From ${fmt.format(min)}`;
  return `Up to ${fmt.format(max)}`;
};

export default function CareersPage() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    department: "",
    type: "",
    location: ""
  });

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/careers`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.jobs || []);
      setJobs(list);
    } catch {
      toast.error("Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const departmentOptions = useMemo(() => {
    const set = new Set(jobs.map((j) => j.department_name).filter(Boolean));
    return Array.from(set).sort();
  }, [jobs]);

  const typeOptions = useMemo(() => {
    const set = new Set(jobs.map((j) => j.job_type).filter(Boolean));
    return Array.from(set).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const deptOk = !filters.department || j.department_name === filters.department;
      const typeOk = !filters.type || j.job_type === filters.type;
      const locationOk = !filters.location || (j.location || "").toLowerCase().includes(filters.location.toLowerCase());
      return deptOk && typeOk && locationOk;
    });
  }, [jobs, filters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300">
      <header className="bg-primary text-primary-content py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Browse open roles and apply using a unique shareable link for each job.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="card bg-base-100 shadow-lg mb-8">
          <div className="card-body">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="form-control flex-1 min-w-48">
                <label className="label"><span className="label-text">Department</span></label>
                <select
                  className="select select-bordered"
                  value={filters.department}
                  onChange={(e) => setFilters((p) => ({ ...p, department: e.target.value }))}
                >
                  <option value="">All</option>
                  {departmentOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-control flex-1 min-w-48">
                <label className="label"><span className="label-text">Job Type</span></label>
                <select
                  className="select select-bordered"
                  value={filters.type}
                  onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="">All</option>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>{JOB_TYPE_LABEL[t] || t}</option>
                  ))}
                </select>
              </div>

              <div className="form-control flex-1 min-w-48">
                <label className="label"><span className="label-text">Location</span></label>
                <input
                  className="input input-bordered"
                  value={filters.location}
                  onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
                  placeholder="Search by city"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredJobs.length === 0 ? (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body text-center py-12">
                <h3 className="text-xl font-semibold">No positions available</h3>
                <p className="text-base-content/70">Try changing filters.</p>
              </div>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.id} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="card-title text-xl md:text-2xl text-primary">{job.title}</h2>
                      <p className="text-base-content/70 mt-1">{job.department_name || ""}</p>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-base-content/70">
                        {job.location && (
                          <span className="flex items-center gap-1"><FiMapPin size={14} /> {job.location}</span>
                        )}
                        {job.job_type && (
                          <span className="flex items-center gap-1"><FiClock size={14} /> {JOB_TYPE_LABEL[job.job_type] || job.job_type}</span>
                        )}
                        {(job.experience_min != null || job.experience_max != null) && (
                          <span className="flex items-center gap-1"><FiBriefcase size={14} /> {job.experience_min ?? 0}–{job.experience_max ?? ""} yrs</span>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-base-content/80 mt-4 line-clamp-2">
                          {job.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2">
                      <div className="text-lg font-semibold text-success">{formatSalary(job)}</div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/careers/${job.slug}/apply`)}
                      >
                        Apply
                      </button>
                      <div className="text-xs text-base-content/60">Shareable link: /careers/{job.slug}/apply</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="footer footer-center p-10 bg-base-200 text-base-content">
        <div>
          <p className="font-bold text-lg">HR Management System</p>
          <p className="text-sm opacity-70">Building amazing teams, one hire at a time.</p>
        </div>
      </footer>
    </div>
  );
}
