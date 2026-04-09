import { useState, useEffect } from 'react';

export default function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    department: '',
    type: '',
    location: ''
  });
  const [showApplication, setShowApplication] = useState(false);
  const [application, setApplication] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    cover_letter: '',
    linkedin_url: '',
    portfolio_url: '',
    resume: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.type) params.append('type', filters.type);
      if (filters.location) params.append('location', filters.location);
      
      const response = await fetch(`/api/recruitment/careers?${params}`);
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetails = async (jobId) => {
    try {
      const response = await fetch(`/api/recruitment/careers/${jobId}`);
      const data = await response.json();
      setSelectedJob(data);
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('job_id', selectedJob.id);
      formData.append('first_name', application.first_name);
      formData.append('last_name', application.last_name);
      formData.append('email', application.email);
      formData.append('phone', application.phone);
      formData.append('cover_letter', application.cover_letter);
      formData.append('linkedin_url', application.linkedin_url);
      formData.append('portfolio_url', application.portfolio_url);
      if (application.resume) {
        formData.append('resume', application.resume);
      }

      const response = await fetch('/api/recruitment/careers/apply', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setSubmitted(true);
        setShowApplication(false);
        setApplication({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          cover_letter: '',
          linkedin_url: '',
          portfolio_url: '',
          resume: null
        });
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (min, max, currency = 'INR') => {
    if (!min && !max) return 'Competitive';
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    });
    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    return min ? `From ${formatter.format(min)}` : `Up to ${formatter.format(max)}`;
  };

  const getEmploymentTypeBadge = (type) => {
    const styles = {
      'full-time': 'badge-primary',
      'part-time': 'badge-secondary',
      'contract': 'badge-accent',
      'internship': 'badge-info'
    };
    return styles[type] || 'badge-ghost';
  };

  const getWorkModeBadge = (mode) => {
    const styles = {
      'on-site': 'badge-warning',
      'remote': 'badge-success',
      'hybrid': 'badge-info'
    };
    return styles[mode] || 'badge-ghost';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="card-title justify-center text-2xl">Application Submitted!</h2>
            <p className="text-base-content/70 mt-2">
              Thank you for your interest. We've received your application and will review it shortly.
              You'll receive an email confirmation at the address you provided.
            </p>
            <div className="card-actions justify-center mt-6">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setSubmitted(false);
                  setSelectedJob(null);
                }}
              >
                View More Positions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300">
      {/* Header */}
      <header className="bg-primary text-primary-content py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Discover exciting career opportunities and be part of something amazing.
            We're always looking for talented individuals to join our growing team.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!selectedJob ? (
          <>
            {/* Filters */}
            <div className="card bg-base-100 shadow-lg mb-8">
              <div className="card-body">
                <div className="flex flex-wrap gap-4">
                  <select 
                    className="select select-bordered flex-1 min-w-48"
                    value={filters.department}
                    onChange={(e) => {
                      setFilters({...filters, department: e.target.value});
                      fetchJobs();
                    }}
                  >
                    <option value="">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                  
                  <select 
                    className="select select-bordered flex-1 min-w-48"
                    value={filters.type}
                    onChange={(e) => {
                      setFilters({...filters, type: e.target.value});
                      fetchJobs();
                    }}
                  >
                    <option value="">All Types</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                  
                  <select 
                    className="select select-bordered flex-1 min-w-48"
                    value={filters.location}
                    onChange={(e) => {
                      setFilters({...filters, location: e.target.value});
                      fetchJobs();
                    }}
                  >
                    <option value="">All Locations</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on-site">On-site</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Job Listings */}
            <div className="grid gap-6">
              {jobs.length === 0 ? (
                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold">No positions available</h3>
                    <p className="text-base-content/70">
                      Check back later for new opportunities or adjust your filters.
                    </p>
                  </div>
                </div>
              ) : (
                jobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => fetchJobDetails(job.id)}
                  >
                    <div className="card-body">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <h2 className="card-title text-xl md:text-2xl text-primary">{job.title}</h2>
                          <p className="text-base-content/70 mt-1">{job.department_name || 'Department'}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className={`badge ${getEmploymentTypeBadge(job.employment_type)}`}>
                              {job.employment_type?.replace('-', ' ').toUpperCase()}
                            </span>
                            <span className={`badge ${getWorkModeBadge(job.work_mode)}`}>
                              {job.work_mode?.replace('-', ' ').toUpperCase()}
                            </span>
                            {job.location && (
                              <span className="badge badge-outline">📍 {job.location}</span>
                            )}
                          </div>
                          
                          <p className="text-base-content/80 mt-4 line-clamp-2">
                            {job.description}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-lg font-semibold text-success">
                            {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                          </div>
                          <span className="text-sm text-base-content/60">
                            Posted {new Date(job.posted_date || job.created_at).toLocaleDateString()}
                          </span>
                          <button className="btn btn-primary btn-sm mt-2">
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Job Details View */
          <div className="max-w-4xl mx-auto">
            <button 
              className="btn btn-ghost mb-4"
              onClick={() => setSelectedJob(null)}
            >
              ← Back to Listings
            </button>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-primary">{selectedJob.title}</h1>
                    <p className="text-lg text-base-content/70 mt-1">
                      {selectedJob.department_name || 'Department'}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className={`badge badge-lg ${getEmploymentTypeBadge(selectedJob.employment_type)}`}>
                        {selectedJob.employment_type?.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className={`badge badge-lg ${getWorkModeBadge(selectedJob.work_mode)}`}>
                        {selectedJob.work_mode?.replace('-', ' ').toUpperCase()}
                      </span>
                      {selectedJob.experience_level && (
                        <span className="badge badge-lg badge-outline">
                          {selectedJob.experience_level}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-success">
                      {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency)}
                    </div>
                    {selectedJob.location && (
                      <p className="text-base-content/70 mt-1">📍 {selectedJob.location}</p>
                    )}
                  </div>
                </div>

                <div className="divider"></div>

                {/* Job Description */}
                <section className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">About the Role</h2>
                  <p className="text-base-content/80 whitespace-pre-line">
                    {selectedJob.description}
                  </p>
                </section>

                {/* Requirements */}
                {selectedJob.requirements && (
                  <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">Requirements</h2>
                    <div className="text-base-content/80 whitespace-pre-line">
                      {selectedJob.requirements}
                    </div>
                  </section>
                )}

                {/* Responsibilities */}
                {selectedJob.responsibilities && (
                  <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">Responsibilities</h2>
                    <div className="text-base-content/80 whitespace-pre-line">
                      {selectedJob.responsibilities}
                    </div>
                  </section>
                )}

                {/* Benefits */}
                {selectedJob.benefits && (
                  <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">Benefits</h2>
                    <div className="text-base-content/80 whitespace-pre-line">
                      {selectedJob.benefits}
                    </div>
                  </section>
                )}

                {/* Skills */}
                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <section className="mb-6">
                    <h2 className="text-xl font-semibold mb-3">Required Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skills.map((skill, index) => (
                        <span key={index} className="badge badge-lg badge-outline">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <div className="divider"></div>

                {/* Apply Section */}
                <div className="flex justify-center">
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={() => setShowApplication(true)}
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Application Modal */}
      {showApplication && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              Apply for {selectedJob?.title}
            </h3>
            
            <form onSubmit={handleApply}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">First Name *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={application.first_name}
                    onChange={(e) => setApplication({...application, first_name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Last Name *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={application.last_name}
                    onChange={(e) => setApplication({...application, last_name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email *</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={application.email}
                    onChange={(e) => setApplication({...application, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Phone *</span>
                  </label>
                  <input
                    type="tel"
                    className="input input-bordered"
                    value={application.phone}
                    onChange={(e) => setApplication({...application, phone: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Resume *</span>
                  </label>
                  <input
                    type="file"
                    className="file-input file-input-bordered w-full"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setApplication({...application, resume: e.target.files[0]})}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">PDF, DOC, or DOCX (Max 5MB)</span>
                  </label>
                </div>
                
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Cover Letter</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-32"
                    placeholder="Tell us why you're interested in this position..."
                    value={application.cover_letter}
                    onChange={(e) => setApplication({...application, cover_letter: e.target.value})}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">LinkedIn Profile</span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered"
                    placeholder="https://linkedin.com/in/..."
                    value={application.linkedin_url}
                    onChange={(e) => setApplication({...application, linkedin_url: e.target.value})}
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Portfolio/Website</span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered"
                    placeholder="https://..."
                    value={application.portfolio_url}
                    onChange={(e) => setApplication({...application, portfolio_url: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-action">
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => setShowApplication(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowApplication(false)}></div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-200 text-base-content">
        <div>
          <p className="font-bold text-lg">HR Management System</p>
          <p className="text-sm opacity-70">
            Building amazing teams, one hire at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
