import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiBriefcase, FiMapPin, FiClock, FiUser, FiMail,
  FiPhone, FiLinkedin, FiGlobe, FiFileText, FiDollarSign,
  FiCheckCircle
} from "react-icons/fi";

const API_BASE = "http://localhost:5001/api/recruitment";

export default function CareersApplyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [resumeFile, setResumeFile] = useState(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    linkedin_url: "",
    portfolio_url: "",
    current_company: "",
    current_title: "",
    experience_years: "",
    skills: "",
    cover_letter: "",
    expected_salary: "",
    notice_period_days: "",
    available_from: "",
    source: "website",
    resume_text: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`${API_BASE}/careers/${slug}`);
      if (!res.ok) throw new Error("Job not found");
      const data = await res.json();
      setJob(data);
    } catch {
      toast.error("Job not found or no longer available");
      navigate("/careers");
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    if (!form.experience_years) newErrors.experience_years = "Experience is required";

    const hasResumeText = Boolean(form.resume_text?.trim());
    const hasResumeFile = Boolean(resumeFile);
    if (!hasResumeText && !hasResumeFile) {
      newErrors.resume = "Upload a resume file OR paste resume text";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();

      fd.append("job_id", job.id);
      fd.append("first_name", form.first_name);
      fd.append("last_name", form.last_name);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      fd.append("linkedin_url", form.linkedin_url || "");
      fd.append("portfolio_url", form.portfolio_url || "");
      fd.append("current_company", form.current_company || "");
      fd.append("current_title", form.current_title || "");
      fd.append("experience_years", form.experience_years);
      fd.append("skills", form.skills || "");
      fd.append("cover_letter", form.cover_letter || "");
      fd.append("expected_salary", form.expected_salary || "");
      fd.append("notice_period_days", form.notice_period_days || "");
      fd.append("available_from", form.available_from || "");
      fd.append("source", form.source || "website");
      fd.append("resume_text", form.resume_text || "");

      if (resumeFile) fd.append("resume", resumeFile);

      const res = await fetch(`${API_BASE}/apply`, {
        method: "POST",
        body: fd
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSubmitted(true);
    } catch (error) {
      toast.error(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-2">
            Thank you for applying for <strong>{job?.title}</strong>.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            We\'ll review your application and get back to you soon.
          </p>
          <button className="btn btn-primary w-full" onClick={() => navigate("/careers")}
          >
            Browse More Jobs
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const inputClass = (field) => `input input-bordered w-full ${errors[field] ? "input-error" : ""}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm py-4 px-6 flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/careers")}
        >
          ← Back to Jobs
        </button>
        <span className="text-gray-400">|</span>
        <span className="font-semibold text-gray-700">Apply for {job?.title}</span>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <h1 className="text-2xl font-bold mb-2">{job?.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {job?.department_name && (
              <span className="flex items-center gap-1">
                <FiBriefcase size={14} /> {job.department_name}
              </span>
            )}
            {job?.location && (
              <span className="flex items-center gap-1">
                <FiMapPin size={14} /> {job.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <FiClock size={14} /> {job?.job_type?.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiUser className="text-primary" /> Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">First Name *</span></label>
                <input name="first_name" className={inputClass("first_name")} value={form.first_name} onChange={handleChange} />
                {errors.first_name && <span className="text-error text-xs mt-1">{errors.first_name}</span>}
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Last Name *</span></label>
                <input name="last_name" className={inputClass("last_name")} value={form.last_name} onChange={handleChange} />
                {errors.last_name && <span className="text-error text-xs mt-1">{errors.last_name}</span>}
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Email *</span></label>
                <div className={`input input-bordered flex items-center gap-2 w-full ${errors.email ? "input-error" : ""}`}>
                  <FiMail size={14} className="text-gray-400 shrink-0" />
                  <input name="email" type="email" className="grow bg-transparent outline-none" value={form.email} onChange={handleChange} />
                </div>
                {errors.email && <span className="text-error text-xs mt-1">{errors.email}</span>}
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Phone *</span></label>
                <div className={`input input-bordered flex items-center gap-2 w-full ${errors.phone ? "input-error" : ""}`}>
                  <FiPhone size={14} className="text-gray-400 shrink-0" />
                  <input name="phone" type="tel" className="grow bg-transparent outline-none" value={form.phone} onChange={handleChange} />
                </div>
                {errors.phone && <span className="text-error text-xs mt-1">{errors.phone}</span>}
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">LinkedIn URL</span></label>
                <div className="input input-bordered flex items-center gap-2 w-full">
                  <FiLinkedin size={14} className="text-gray-400 shrink-0" />
                  <input name="linkedin_url" type="url" className="grow bg-transparent outline-none" value={form.linkedin_url} onChange={handleChange} />
                </div>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Portfolio / GitHub URL</span></label>
                <div className="input input-bordered flex items-center gap-2 w-full">
                  <FiGlobe size={14} className="text-gray-400 shrink-0" />
                  <input name="portfolio_url" type="url" className="grow bg-transparent outline-none" value={form.portfolio_url} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiBriefcase className="text-primary" /> Professional Background
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Current Company</span></label>
                <input name="current_company" className="input input-bordered w-full" value={form.current_company} onChange={handleChange} />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Current Job Title</span></label>
                <input name="current_title" className="input input-bordered w-full" value={form.current_title} onChange={handleChange} />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Years of Experience *</span></label>
                <input name="experience_years" type="number" min="0" max="50" step="0.5" className={inputClass("experience_years")} value={form.experience_years} onChange={handleChange} />
                {errors.experience_years && <span className="text-error text-xs mt-1">{errors.experience_years}</span>}
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">How did you hear about us?</span></label>
                <select name="source" className="select select-bordered w-full" value={form.source} onChange={handleChange}>
                  <option value="website">Company Website</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="referral">Referral</option>
                  <option value="job_board">Job Board</option>
                  <option value="agency">Agency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-control col-span-2">
                <label className="label">
                  <span className="label-text">Key Skills</span>
                  <span className="label-text-alt text-gray-400">Comma separated</span>
                </label>
                <input name="skills" className="input input-bordered w-full" value={form.skills} onChange={handleChange} placeholder="React, Node.js, PostgreSQL" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiDollarSign className="text-primary" /> Application Details
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Expected Salary (₹/month)</span></label>
                <input name="expected_salary" type="number" className="input input-bordered w-full" value={form.expected_salary} onChange={handleChange} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Notice Period (days)</span></label>
                <input name="notice_period_days" type="number" min="0" className="input input-bordered w-full" value={form.notice_period_days} onChange={handleChange} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Available From</span></label>
                <input name="available_from" type="date" className="input input-bordered w-full" value={form.available_from} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiFileText className="text-primary" /> Cover Letter
            </h2>
            <textarea name="cover_letter" className="textarea textarea-bordered h-32 w-full" value={form.cover_letter} onChange={handleChange} placeholder="Optional" />
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
              <FiFileText className="text-primary" /> Resume
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload a PDF/DOCX resume (recommended). We\'ll extract text for AI matching. If upload is not available, paste your resume text.
            </p>

            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Upload Resume (PDF/DOCX)</span></label>
              <input
                type="file"
                className={`file-input file-input-bordered w-full ${errors.resume ? "file-input-error" : ""}`}
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setResumeFile(f);
                  if (errors.resume) setErrors((prev) => ({ ...prev, resume: null }));
                }}
              />
              {errors.resume && <span className="text-error text-xs mt-1">{errors.resume}</span>}
              {resumeFile && <span className="text-xs text-gray-500 mt-1">Selected: {resumeFile.name}</span>}
            </div>

            <div className="divider">OR</div>

            <div className="form-control">
              <label className="label"><span className="label-text">Paste Resume Text</span></label>
              <textarea
                name="resume_text"
                className="textarea textarea-bordered w-full h-64 font-mono text-sm"
                value={form.resume_text}
                onChange={handleChange}
                placeholder="Paste your full resume here..."
              />
              <label className="label">
                <span className="label-text-alt text-gray-400">{form.resume_text.length} characters</span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Submitting Application...
              </>
            ) : (
              "Submit Application"
            )}
          </button>

          <p className="text-center text-xs text-gray-400 pb-6">
            By submitting, you agree that your information will be used for recruitment purposes.
          </p>
        </form>
      </div>
    </div>
  );
}
