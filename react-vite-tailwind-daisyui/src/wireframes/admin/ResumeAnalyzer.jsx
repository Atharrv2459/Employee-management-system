import React, { useState } from 'react';

import { RECRUITMENT_API_BASE as API_BASE } from "../../api";

const ResumeAnalyzer = ({
  applicationId,
  jobId,
  resumeText,
  jobTitle,
  onAnalysisComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [storedAiAnalysis, setStoredAiAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleAnalyze = async () => {
    if (!resumeText) {
      setError("No resume text available for this application.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/resume-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({ applicationId, jobId, resumeText })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setAnalysis(data.analysis);
      setStoredAiAnalysis(data?.stored?.ai_analysis ?? null);
      onAnalysisComplete?.(data.analysis);
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationBadge = (rec) => {
    const map = {
      'Strong Match': 'badge-success',
      'Good Match': 'badge-info',
      'Fair Match': 'badge-warning',
      'Poor Match': 'badge-error'
    };
    return map[rec] || 'badge-ghost';
  };

  const TABS = ['overview', 'skills', 'experience', 'recommendations'];

  if (!analysis && !loading) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h3 className="card-title text-lg">AI Resume Analysis</h3>
          <p className="text-sm text-gray-600 mb-4">
            Get AI-powered insights on how well this resume matches the job requirements.
          </p>

          {!resumeText && (
            <div className="alert alert-warning mb-3">
              <span>No resume text found for this application. The candidate needs to submit resume content before analysis can run.</span>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            className="btn btn-primary w-full"
            disabled={!resumeText || loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Analyzing...
              </>
            ) : (
              'Analyze Resume with AI'
            )}
          </button>

          {error && (
            <div className="alert alert-error mt-4">
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="card-title text-lg">AI Resume Analysis</h3>
            {jobTitle && <p className="text-sm text-gray-500">{jobTitle}</p>}
          </div>
          {analysis && (
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}%
              </div>
              <div className={`badge mt-1 ${getRecommendationBadge(analysis.recommendation)}`}>
                {analysis.recommendation}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analysis && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-sm text-gray-700">{analysis.summary}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-semibold text-green-600 mb-2">Strengths</h5>
                {analysis.strengths?.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {analysis.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">None identified</p>
                )}
              </div>
              <div>
                <h5 className="text-sm font-semibold text-orange-600 mb-2">Concerns</h5>
                {analysis.concerns?.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {analysis.concerns.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">None identified</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && analysis && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <h5 className="font-semibold">Skill Match</h5>
                <span className="text-sm font-bold text-green-600">
                  {analysis.skillMatch?.percentage ?? 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${analysis.skillMatch?.percentage ?? 0}%` }}
                />
              </div>
            </div>

            <div>
              <h5 className="text-sm font-semibold text-green-600 mb-2">Matched Skills</h5>
              {analysis.skillMatch?.matched?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.skillMatch.matched.map((skill, i) => (
                    <span key={i} className="badge badge-success badge-outline">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No matched skills found</p>
              )}
            </div>

            {analysis.missingSkills?.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-red-600 mb-2">Missing Skills</h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingSkills.map((skill, i) => (
                    <span key={i} className="badge badge-error badge-outline">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Experience Tab */}
        {activeTab === 'experience' && analysis?.experienceRelevance && (
          <div className="space-y-3">
            <div>
              <h5 className="font-semibold mb-1">Relevant Experience</h5>
              <p className="text-sm text-gray-700">
                {analysis.experienceRelevance.relevantExperience || 'N/A'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Years Relevant</p>
                <p className="text-2xl font-bold">
                  {analysis.experienceRelevance.yearsRelevant ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Alignment</p>
                <div className={`badge mt-1 ${
                  analysis.experienceRelevance.alignment === 'High' ? 'badge-success' :
                  analysis.experienceRelevance.alignment === 'Medium' ? 'badge-warning' :
                  'badge-error'
                }`}>
                  {analysis.experienceRelevance.alignment || 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && analysis && (
          <div className="space-y-2">
            <h5 className="font-semibold mb-3">Suggestions for Improvement</h5>
            {analysis.suggestions?.length > 0 ? (
              <ul className="space-y-2">
                {analysis.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-blue-600 font-bold shrink-0">•</span>
                    <span className="text-gray-700">{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No suggestions available</p>
            )}
          </div>
        )}

        {storedAiAnalysis && (
          <details className="collapse collapse-arrow bg-base-100 border mt-4">
            <summary className="collapse-title text-sm font-medium">
              View stored ai_analysis (job_applications)
            </summary>
            <div className="collapse-content">
              <pre className="text-xs whitespace-pre-wrap break-words">
                {typeof storedAiAnalysis === 'string'
                  ? storedAiAnalysis
                  : JSON.stringify(storedAiAnalysis, null, 2)}
              </pre>
            </div>
          </details>
        )}

        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          className="btn btn-sm btn-outline mt-4 w-full"
          disabled={loading || !resumeText}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Re-analyzing...
            </>
          ) : (
            'Re-analyze'
          )}
        </button>
      </div>
    </div>
  );
};

// =====================================================
// BulkResumeAnalyzer
// =====================================================

export const BulkResumeAnalyzer = ({ jobId, applications, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const applicationsWithResume = applications?.filter(a => a.resume_text) || [];

  const handleBulkAnalyze = async () => {
    if (applicationsWithResume.length === 0) {
      setError("No applications have resume text to analyze.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/resume-analysis/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({
          jobId,
          applications: applicationsWithResume.map(a => ({
            applicationId: a.id,
            resumeText: a.resume_text
          }))
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setResults(data);
      onComplete?.(data);
    } catch (err) {
      setError(err.message || "Bulk analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (results) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h3 className="card-title">Bulk Analysis Results</h3>

          <div className="stats shadow w-full mb-4">
            <div className="stat">
              <div className="stat-title">Total Analyzed</div>
              <div className="stat-value text-primary">{results.totalAnalyzed}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Successful</div>
              <div className="stat-value text-success">{results.successCount}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Success Rate</div>
              <div className="stat-value text-info">
                {results.totalAnalyzed > 0
                  ? `${((results.successCount / results.totalAnalyzed) * 100).toFixed(0)}%`
                  : '0%'
                }
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Score</th>
                  <th>Recommendation</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {results.ranked?.map((r) => (
                  <tr key={r.applicationId} className="hover">
                    <td className="font-bold">#{r.rank}</td>
                    <td>
                      <span className={`font-bold ${
                        r.score >= 80 ? 'text-green-600' :
                        r.score >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {r.score}%
                      </span>
                    </td>
                    <td>
                      <div className={`badge ${
                        r.recommendation === 'Strong Match' ? 'badge-success' :
                        r.recommendation === 'Good Match' ? 'badge-info' :
                        r.recommendation === 'Fair Match' ? 'badge-warning' :
                        'badge-error'
                      }`}>
                        {r.recommendation}
                      </div>
                    </td>
                    <td className="text-xs text-gray-600">
                      {r.summary ? `${r.summary.substring(0, 80)}...` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {results.all?.filter(r => !r.success).length > 0 && (
            <div className="alert alert-warning mt-4">
              <span>
                {results.all.filter(r => !r.success).length} application(s) failed to analyze.
                They may be missing resume text.
              </span>
            </div>
          )}

          <button
            onClick={() => setResults(null)}
            className="btn btn-outline mt-4"
          >
            Analyze Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h3 className="card-title">Bulk Resume Analysis</h3>
        <p className="text-sm text-gray-600 mb-2">
          Analyze all resumes at once and get ranked results
        </p>

        <div className="flex gap-4 mb-4 text-sm">
          <span className="text-gray-500">
            Total applications: <strong>{applications?.length || 0}</strong>
          </span>
          <span className="text-gray-500">
            With resume: <strong>{applicationsWithResume.length}</strong>
          </span>
        </div>

        {applicationsWithResume.length === 0 && (
          <div className="alert alert-warning mb-4">
            <span>
              No applications have resume text yet. Candidates need to submit
              resume content before batch analysis can run.
            </span>
          </div>
        )}

        <button
          onClick={handleBulkAnalyze}
          className="btn btn-primary w-full"
          disabled={applicationsWithResume.length === 0 || loading}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Analyzing {applicationsWithResume.length} resumes...
            </>
          ) : (
            `Analyze ${applicationsWithResume.length} Resume${applicationsWithResume.length !== 1 ? 's' : ''}`
          )}
        </button>

        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;