import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiUser, FiMail, FiPhone, FiLinkedin, FiBriefcase,
  FiCalendar, FiStar, FiCheck, FiX, FiClock, FiMessageSquare
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
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const [interviewForm, setInterviewForm] = useState({
    interview_type: 'video_call',
    stage_id: '',
    scheduled_at: '',
    duration_minutes: 60,
    meeting_link: '',
    notes: ''
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [jobId, filterStatus]);

  const fetchData = async () => {
    try {
      const [appsRes, stagesRes] = await Promise.all([
        axios.get(`${API_BASE}/jobs/${jobId}/applications`, {
          params: { status: filterStatus },
          headers: { Authorization: token }
        }),
        axios.get(`${API_BASE}/stages`)
      ]);
      setApplications(appsRes.data);
      setStages(stagesRes.data);

      // Get job details
      const jobsRes = await axios.get(`${API_BASE}/jobs`, { headers: { Authorization: token } });
      setJob(jobsRes.data.find(j => j.id === jobId));
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
      await axios.put(`${API_BASE}/applications/${appId}/status`,
        { status: newStatus },
        { headers: { Authorization: token } }
      );
      toast.success(`Application ${newStatus}`);
      fetchData();
      if (selectedApp?.id === appId) {
        openApplicationDetail(appId);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/interviews`, {
        ...interviewForm,
        application_id: selectedApp.id
      }, { headers: { Authorization: token } });

      toast.success("Interview scheduled!");
      setShowInterviewModal(false);
      openApplicationDetail(selectedApp.id);
    } catch (error) {
      toast.error("Failed to schedule interview");
    }
  };

  const getStatusBadge = (status) => (
    <span className={`badge ${STATUS_COLORS[status] || 'badge-ghost'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );

  const getRatingStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <FiStar key={i} className={i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
    ));
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/admin/recruitment')}>
            ← Back to Jobs
          </button>
          <h1 className="text-2xl font-bold">{job?.title || 'Applications'}</h1>
          <p className="text-gray-500">{applications.length} applications</p>
        </div>
        <select
          className="select select-bordered"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="screening">Screening</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview_scheduled">Interview Scheduled</option>
          <option value="interviewed">Interviewed</option>
          <option value="offer_sent">Offer Sent</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Applications Grid */}
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
                    <span className="text-xl">{app.first_name?.[0]}{app.last_name?.[0]}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {app.first_name} {app.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{app.current_title} at {app.current_company}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><FiMail size={14} /> {app.email}</span>
                    {app.phone && <span className="flex items-center gap-1"><FiPhone size={14} /> {app.phone}</span>}
                    {app.experience_years && (
                      <span className="flex items-center gap-1">
                        <FiBriefcase size={14} /> {app.experience_years} years exp.
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(app.status)}
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
            <h3 className="text-xl font-semibold text-gray-500">No Applications</h3>
            <p className="text-gray-400">No applications found for this filter</p>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {showDetailModal && selectedApp && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
            <button className="btn btn-sm btn-ghost absolute right-2 top-2" onClick={() => setShowDetailModal(false)}>✕</button>

            {/* Candidate Header */}
            <div className="flex gap-4 mb-6">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-16">
                  <span className="text-2xl">{selectedApp.first_name?.[0]}{selectedApp.last_name?.[0]}</span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedApp.first_name} {selectedApp.last_name}</h2>
                <p className="text-gray-600">{selectedApp.current_title} at {selectedApp.current_company}</p>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(selectedApp.status)}
                  {selectedApp.experience_years && (
                    <span className="badge badge-outline">{selectedApp.experience_years} years</span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-base-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FiMail className="text-gray-500" />
                <a href={`mailto:${selectedApp.email}`} className="link link-primary text-sm">{selectedApp.email}</a>
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
                  <a href={selectedApp.linkedin_url} target="_blank" className="link link-primary text-sm">LinkedIn</a>
                </div>
              )}
            </div>

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

            {/* Interviews */}
            {selectedApp.interviews?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Interviews</h3>
                <div className="space-y-2">
                  {selectedApp.interviews.map((interview) => (
                    <div key={interview.id} className="flex justify-between items-center p-3 bg-base-100 rounded-lg border">
                      <div>
                        <p className="font-medium">{interview.interview_type.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-500">
                          <FiCalendar className="inline mr-1" />
                          {new Date(interview.scheduled_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`badge ${interview.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                        {interview.status}
                      </span>
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
                      <FiClock className="text-gray-400 mt-1" />
                      <div>
                        <p>{act.description}</p>
                        <p className="text-xs text-gray-400">{new Date(act.created_at).toLocaleString()}</p>
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
                {selectedApp.status === 'new' && (
                  <>
                    <button className="btn btn-info btn-sm" onClick={() => updateStatus(selectedApp.id, 'screening')}>
                      Move to Screening
                    </button>
                    <button className="btn btn-error btn-sm" onClick={() => updateStatus(selectedApp.id, 'rejected')}>
                      <FiX /> Reject
                    </button>
                  </>
                )}
                {selectedApp.status === 'screening' && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => updateStatus(selectedApp.id, 'shortlisted')}>
                      <FiCheck /> Shortlist
                    </button>
                    <button className="btn btn-error btn-sm" onClick={() => updateStatus(selectedApp.id, 'rejected')}>
                      <FiX /> Reject
                    </button>
                  </>
                )}
                {['shortlisted', 'interviewed'].includes(selectedApp.status) && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setInterviewForm({
                        interview_type: 'video_call',
                        stage_id: stages[0]?.id || '',
                        scheduled_at: '',
                        duration_minutes: 60,
                        meeting_link: '',
                        notes: ''
                      });
                      setShowInterviewModal(true);
                    }}
                  >
                    <FiCalendar /> Schedule Interview
                  </button>
                )}
                {selectedApp.status === 'interviewed' && (
                  <button className="btn btn-success btn-sm" onClick={() => updateStatus(selectedApp.id, 'offer_pending')}>
                    Proceed to Offer
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}></div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showInterviewModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Schedule Interview</h3>
            <form onSubmit={handleScheduleInterview}>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Interview Type</span></label>
                <select
                  className="select select-bordered"
                  value={interviewForm.interview_type}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interview_type: e.target.value })}
                >
                  <option value="phone_screening">Phone Screening</option>
                  <option value="video_call">Video Call</option>
                  <option value="in_person">In Person</option>
                  <option value="technical">Technical</option>
                  <option value="hr_round">HR Round</option>
                  <option value="final">Final Round</option>
                </select>
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Stage</span></label>
                <select
                  className="select select-bordered"
                  value={interviewForm.stage_id}
                  onChange={(e) => setInterviewForm({ ...interviewForm, stage_id: e.target.value })}
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Date & Time</span></label>
                <input
                  type="datetime-local"
                  className="input input-bordered"
                  value={interviewForm.scheduled_at}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_at: e.target.value })}
                  required
                />
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Duration (minutes)</span></label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={interviewForm.duration_minutes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, duration_minutes: e.target.value })}
                />
              </div>
              <div className="form-control mb-3">
                <label className="label"><span className="label-text">Meeting Link</span></label>
                <input
                  type="url"
                  className="input input-bordered"
                  value={interviewForm.meeting_link}
                  onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })}
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowInterviewModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule</button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowInterviewModal(false)}></div>
        </div>
      )}
    </div>
  );
}
