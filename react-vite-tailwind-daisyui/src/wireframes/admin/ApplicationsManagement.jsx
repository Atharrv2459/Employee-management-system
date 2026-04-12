import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiUser, FiMail, FiPhone, FiLinkedin, FiBriefcase,
  FiStar, FiCheck, FiX, FiClock
} from "react-icons/fi";

const API_BASE = "http://localhost:5001/api/recruitment";

const STATUS_COLORS = {
  new: 'badge-warning',
  screening: 'badge-info',
  shortlisted: 'badge-primary',
  interview_scheduled: 'badge-secondary',
  interviewed: 'badge-accent',
  offer_pending: 'badge-info',
  offer_sent: 'badge-success',
  offer_accepted: 'badge-success',
  hired: 'badge-success',
  rejected: 'badge-error',
  withdrawn: 'badge-ghost',
  offer_declined: 'badge-error'
};

export default function ApplicationsManagement() {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  // Ranking workflow
  const [rankedData, setRankedData] = useState(null); // { totalRanked, ranked: [] }
  const [rankedLoading, setRankedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('submissions'); // submissions | ranked

  // Helps when visiting /admin/recruitment/applications without a jobId
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const openResumeInNewTab = async (applicationId, fallbackFileName = "resume.pdf") => {
    if (!token) {
      toast.error("Missing token");
      return;
    }

    // Important: open the tab synchronously (user gesture) to avoid popup blockers.
    const win = window.open("about:blank", "_blank", "noopener,noreferrer");

    try {
      const res = await axios.get(`${API_BASE}/applications/${applicationId}/resume`, {
        headers: { Authorization: token },
        responseType: "blob"
      });

      const headerType = res.headers?.["content-type"] || "application/octet-stream";
      const fileName = fallbackFileName || "resume";
      const ext = (fileName.split(".").pop() || "").toLowerCase();

      let blobType = headerType;
      if (!blobType || blobType.includes("octet-stream")) {
        if (ext === "pdf") blobType = "application/pdf";
        else if (ext === "txt") blobType = "text/plain";
        else if (ext === "docx") blobType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }

      const blob = new Blob([res.data], { type: blobType || "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      const canInline = (blobType || "").includes("pdf") || (blobType || "").startsWith("text/");

      if (win && canInline) {
        win.location.href = url;
      } else {
        // For non-previewable types (e.g., DOCX) prefer download to avoid blank tabs.
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        if (win) win.close();
      }

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      if (win) win.close();
      console.error("Failed to open resume:", error);

      let msg = "Failed to open resume";
      try {
        const data = error?.response?.data;
        if (data instanceof Blob) {
          const text = await data.text();
          try {
            msg = JSON.parse(text)?.error || msg;
          } catch {
            msg = text || msg;
          }
        } else {
          msg = data?.error || msg;
        }
      } catch {
        // ignore
      }

      toast.error(msg);
    }
  };

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [jobId, filterStatus]);


  useEffect(() => {
    if (jobId) return;
    fetchJobsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const fetchJobsList = async () => {
    if (!token) return;
    setJobsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/jobs`, {
        headers: { Authorization: token }
      });
      setJobs(res.data);
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setJobsLoading(false);
    }
  };

  const publicApplyUrl = job?.slug
    ? `${window.location.origin}/careers/${job.slug}/apply`
    : '';

  const handleCopyPublicApplyLink = async () => {
    if (!publicApplyUrl) return;
    try {
      await navigator.clipboard.writeText(publicApplyUrl);
      toast.success("Apply link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const fetchRankedApplications = async () => {
    if (!jobId) return;
    if (!token) {
      toast.error("Missing token");
      return;
    }

    setRankedLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/jobs/${jobId}/ranked-applications`, {
        headers: { Authorization: token }
      });
      setRankedData(res.data);
      setActiveTab('ranked');
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load ranked candidates");
    } finally {
      setRankedLoading(false);
    }
  };

  const handleAnalyzeAndRank = async () => {
    if (!jobId) return;
    if (!token) {
      toast.error("Missing token");
      return;
    }

    setRankedLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/jobs/${jobId}/auto-analyze`, {}, {
        headers: { Authorization: token }
      });
      if (res.data?.message) toast.success(res.data.message);
      await fetchRankedApplications();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to analyze resumes");
    } finally {
      setRankedLoading(false);
    }

    // Refresh submissions so ai_analysis (score/summary) shows up immediately.
    await fetchData();
    if (selectedApp?.id) {
      await openApplicationDetail(selectedApp.id);
    }
  };

  const fetchData = async () => {
    try {
      const [appsRes, jobsRes] = await Promise.all([
        axios.get(`${API_BASE}/jobs/${jobId}/applications`, {
          params: { status: filterStatus },
          headers: { Authorization: token }
        }),
        axios.get(`${API_BASE}/jobs`, {
          headers: { Authorization: token }
        })
      ]);
      setApplications(appsRes.data);
      setJobs(jobsRes.data);
      setJob(jobsRes.data.find(j => String(j.id) === String(jobId)));
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const openApplicationDetail = async (appId) => {
    try {
      const res = await axios.get(`${API_BASE}/applications/${appId}`, {
        headers: { Authorization: token }
      });
      setSelectedApp(res.data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error("Failed to load application details");
    }
  };

  const updateStatus = async (appId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE}/applications/${appId}/status`,
        { status: newStatus },
        { headers: { Authorization: token } }
      );
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
      fetchData();
      if (activeTab === 'ranked') {
        fetchRankedApplications();
      }
      if (selectedApp?.id === appId) {
        openApplicationDetail(appId);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status) => (
    <span className={`badge ${STATUS_COLORS[status] || 'badge-ghost'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );

  const getRatingStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FiStar
        key={i}
        className={i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!jobId) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
          <h1 className="text-xl font-bold mb-2">Applications</h1>
          <p className="text-gray-600 mb-4">Select a job to view its candidate submissions.</p>

          {jobsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="loading loading-spinner loading-sm"></span>
              Loading jobs...
            </div>
          ) : (
            <select
              className="select select-bordered w-full"
              defaultValue=""
              onChange={(e) => {
                const id = e.target.value;
                if (id) navigate(`/admin/recruitment/jobs/${id}/applications`);
              }}
            >
              <option value="" disabled>Choose a job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header + Workflow Actions */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <button
              className="btn btn-ghost btn-sm mb-2"
              onClick={() => navigate('/admin/recruitment')}
            >
              ← Back to Jobs
            </button>
            <h1 className="text-2xl font-bold">{job?.title || 'Applications'}</h1>
            <p className="text-gray-500">{applications.length} submissions</p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                className="btn btn-outline btn-sm"
                onClick={handleCopyPublicApplyLink}
                disabled={!publicApplyUrl}
              >
                Copy Apply Link
              </button>

              <a
                className={`btn btn-outline btn-sm ${!publicApplyUrl ? 'btn-disabled' : ''}`}
                href={publicApplyUrl || undefined}
                target="_blank"
                rel="noreferrer"
              >
                Open Apply Page
              </a>

              <button
                className="btn btn-success btn-sm"
                onClick={handleAnalyzeAndRank}
                disabled={rankedLoading}
              >
                {rankedLoading ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Analyzing...
                  </>
                ) : (
                  'Analyze & Rank'
                )}
              </button>

              <button
                className="btn btn-ghost btn-sm"
                onClick={fetchRankedApplications}
                disabled={rankedLoading}
              >
                View Ranked
              </button>
            </div>

            {activeTab === 'submissions' && (
              <select
                className="select select-bordered select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="screening">Screening</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="hired">Selected/Hired</option>
              </select>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Public Apply Link</p>
              {publicApplyUrl ? (
                <a
                  href={publicApplyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="link link-primary break-all text-sm"
                >
                  {publicApplyUrl}
                </a>
              ) : (
                <p className="text-sm text-gray-500">This job needs a slug to generate the apply link.</p>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Share this link with candidates. Their submissions will appear here.
            </p>
          </div>
        </div>

        <div className="tabs tabs-boxed">
          <button
            className={`tab ${activeTab === 'submissions' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('submissions')}
            type="button"
          >
            Submissions
          </button>
          <button
            className={`tab ${activeTab === 'ranked' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('ranked')}
            type="button"
          >
            Ranked
          </button>
        </div>
      </div>

      {/* Submissions */}
      {activeTab === 'submissions' && (
        <div className="grid gap-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openApplicationDetail(app.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="avatar placeholder">
                    <div className="bg-neutral-focus text-neutral-content rounded-full w-12">
                      <span className="text-xl">
                        {app.first_name?.[0]}{app.last_name?.[0]}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {app.first_name} {app.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {app.current_title}{app.current_company ? ` at ${app.current_company}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiMail size={14} /> {app.email}
                      </span>
                      {app.phone && (
                        <span className="flex items-center gap-1">
                          <FiPhone size={14} /> {app.phone}
                        </span>
                      )}
                      {app.experience_years && (
                        <span className="flex items-center gap-1">
                          <FiBriefcase size={14} /> {app.experience_years} yrs exp.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(app.status)}
                  {app.ai_analysis?.overallScore != null && (
                    <p className="text-sm font-semibold text-primary mt-1">
                      {app.ai_analysis.overallScore}% match
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Applied {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                  {app.rating && (
                    <div className="flex gap-0.5 mt-1 justify-end">
                      {getRatingStars(app.rating)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {applications.length === 0 && (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <FiUser size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-500">No Submissions</h3>
              <p className="text-gray-400">No submissions found for this filter</p>
            </div>
          )}
        </div>
      )}

      {/* Ranked */}
      {activeTab === 'ranked' && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-semibold">Ranked Candidates</h2>
            <button
              className="btn btn-outline btn-sm"
              onClick={fetchRankedApplications}
              disabled={rankedLoading}
            >
              Refresh
            </button>
          </div>

          {rankedLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="loading loading-spinner loading-sm"></span>
              Loading ranked candidates...
            </div>
          )}

          {!rankedLoading && (!rankedData?.ranked || rankedData.ranked.length === 0) && (
            <div className="text-sm text-gray-600">
              No ranked results yet. Click <strong>Analyze & Rank</strong> to generate scores.
            </div>
          )}

          {!rankedLoading && rankedData?.ranked?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Candidate</th>
                    <th>Score</th>
                    <th>Recommendation</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rankedData.ranked.map((r) => (
                    <tr key={r.applicationId} className="hover">
                      <td className="font-bold">#{r.rank}</td>
                      <td>
                        <div className="font-medium">{r.candidate?.name}</div>
                        <div className="text-xs text-gray-500">{r.candidate?.email}</div>
                      </td>
                      <td className="font-semibold">{r.score != null ? `${r.score}%` : '—'}</td>
                      <td className="text-sm">{r.recommendation || '—'}</td>
                      <td>{getStatusBadge(r.status)}</td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => updateStatus(r.applicationId, 'hired')}
                          >
                            <FiCheck /> Select
                          </button>
                          <button
                            className="btn btn-error btn-xs"
                            onClick={() => updateStatus(r.applicationId, 'rejected')}
                          >
                            <FiX /> Reject
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
      )}

      {/* Application Detail Modal */}
      {showDetailModal && selectedApp && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
            <button
              className="btn btn-sm btn-ghost absolute right-2 top-2"
              onClick={() => setShowDetailModal(false)}
            >
              ✕
            </button>

            {/* Candidate Header */}
            <div className="flex gap-4 mb-6">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-16">
                  <span className="text-2xl">
                    {selectedApp.first_name?.[0]}{selectedApp.last_name?.[0]}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedApp.first_name} {selectedApp.last_name}
                </h2>
                <p className="text-gray-600">
                  {selectedApp.current_title}
                  {selectedApp.current_company ? ` at ${selectedApp.current_company}` : ''}
                </p>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(selectedApp.status)}
                  {selectedApp.experience_years && (
                    <span className="badge badge-outline">
                      {selectedApp.experience_years} years exp.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-base-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FiMail className="text-gray-500" />
                <a
                  href={`mailto:${selectedApp.email}`}
                  className="link link-primary text-sm"
                >
                  {selectedApp.email}
                </a>
              </div>
              {selectedApp.phone && (
                <div className="flex items-center gap-2">
                  <FiPhone className="text-gray-500" />
                  <span className="text-sm">{selectedApp.phone}</span>
                </div>
              )}
              {selectedApp.linkedin_url && (
                <div className="flex items-center gap-2">
                  <FiLinkedin className="text-gray-500" />
                  <a
                    href={selectedApp.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="link link-primary text-sm"
                  >
                    LinkedIn
                  </a>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Resume</h3>
              {selectedApp.resume_path ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => openResumeInNewTab(selectedApp.id, selectedApp.resume_filename || "resume.pdf")}
                  >
                    Open Resume (PDF)
                  </button>
                  {selectedApp.resume_filename && (
                    <p className="text-xs text-gray-500 mt-2 break-all">{selectedApp.resume_filename}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No resume file uploaded for this submission. The “Open Resume” button appears only when the candidate uploads a PDF/DOCX/TXT file on the apply page.
                </p>
              )}
            </div>

            {/* AI Analysis (stored in job_applications.ai_analysis) */}
            {selectedApp.ai_analysis ? (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                {(() => {
                  let obj = selectedApp.ai_analysis;
                  try {
                    if (typeof obj === "string") obj = JSON.parse(obj);
                  } catch {
                    // ignore parse errors; we'll still show raw
                  }
                  const raw =
                    typeof selectedApp.ai_analysis === "string"
                      ? selectedApp.ai_analysis
                      : JSON.stringify(selectedApp.ai_analysis, null, 2);

                  return (
                    <>
                      {(obj?.overallScore != null || obj?.recommendation || obj?.summary) && (
                        <div className="mb-2">
                          <div className="flex flex-wrap gap-2">
                            {obj?.overallScore != null && (
                              <span className="badge badge-primary">{obj.overallScore}% match</span>
                            )}
                            {obj?.recommendation && (
                              <span className="badge badge-outline">{obj.recommendation}</span>
                            )}
                          </div>
                          {obj?.summary && <p className="text-sm text-gray-700 mt-2">{obj.summary}</p>}
                        </div>
                      )}

                      <details className="collapse collapse-arrow bg-base-100 border">
                        <summary className="collapse-title text-sm font-medium">
                          View ai_analysis JSON (from DB)
                        </summary>
                        <div className="collapse-content">
                          <pre className="text-xs whitespace-pre-wrap break-words">{raw}</pre>
                        </div>
                      </details>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="mb-6">
                <h3 className="font-semibold mb-1">AI Analysis</h3>
                <p className="text-sm text-gray-500">No AI analysis yet for this application.</p>
              </div>
            )}

            {/* Expected Salary / Notice Period */}
            {(selectedApp.expected_salary || selectedApp.notice_period_days) && (
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-base-100 rounded-lg border">
                {selectedApp.expected_salary && (
                  <div>
                    <p className="text-xs text-gray-500">Expected Salary</p>
                    <p className="font-semibold">
                      ₹{Number(selectedApp.expected_salary).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedApp.notice_period_days != null && (
                  <div>
                    <p className="text-xs text-gray-500">Notice Period</p>
                    <p className="font-semibold">{selectedApp.notice_period_days} days</p>
                  </div>
                )}
              </div>
            )}

            {/* Cover Letter */}
            {selectedApp.cover_letter && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Cover Letter</h3>
                <p className="text-gray-600 whitespace-pre-wrap bg-base-100 p-4 rounded-lg border">
                  {selectedApp.cover_letter}
                </p>
              </div>
            )}

            {/* Screening Answers */}
            {selectedApp.screening_answers?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Screening Responses</h3>
                <div className="space-y-3">
                  {selectedApp.screening_answers.map((ans, i) => (
                    <div key={i} className="bg-base-100 p-3 rounded-lg border">
                      <p className="text-sm font-medium text-gray-700">{ans.question}</p>
                      <p className="text-gray-600">{ans.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Log */}
            {selectedApp.activities?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Activity</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedApp.activities.map((act) => (
                    <div key={act.id} className="flex gap-2 text-sm">
                      <FiClock className="text-gray-400 mt-1 shrink-0" />
                      <div>
                        <p>{act.description}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(act.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Actions</h3>
              <div className="flex flex-wrap gap-2">
                {selectedApp.status !== 'hired' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => updateStatus(selectedApp.id, 'hired')}
                  >
                    <FiCheck /> Select Candidate
                  </button>
                )}

                {selectedApp.status !== 'rejected' && (
                  <button
                    className="btn btn-error btn-sm"
                    onClick={() => updateStatus(selectedApp.id, 'rejected')}
                  >
                    <FiX /> Reject
                  </button>
                )}

                {selectedApp.status !== 'new' && selectedApp.status !== 'hired' && selectedApp.status !== 'rejected' && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => updateStatus(selectedApp.id, 'new')}
                  >
                    Reset to New
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This simplified workflow ends after selection — no interviews or offers.
              </p>
            </div>

          </div>
          <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}></div>
        </div>
      )}
    </div>
  );
}