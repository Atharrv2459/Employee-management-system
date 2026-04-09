import React, { useState } from 'react';

/**
 * ResumeAnalyzer Component
 * Displays AI resume analysis with match scores and recommendations
 */
const ResumeAnalyzer = ({ 
  applicationId, 
  jobId, 
  resumeText, 
  jobTitle,
  onAnalysisComplete 
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/recruitment/resume-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          applicationId,
          jobId,
          resumeText
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setAnalysis(data.analysis);
      onAnalysisComplete?.(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'Strong Match':
        return 'badge-success';
      case 'Good Match':
        return 'badge-info';
      case 'Fair Match':
        return 'badge-warning';
      default:
        return 'badge-error';
    }
  };

  if (!analysis && !loading) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h3 className="card-title text-lg">AI Resume Analysis</h3>
          <p className="text-sm text-gray-600 mb-4">
            Get AI-powered insights on how well this resume matches the job requirements
          </p>
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
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="card-title text-lg">AI Resume Analysis</h3>
            <p className="text-sm text-gray-600">{jobTitle}</p>
          </div>
          {analysis && (
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}%
              </div>
              <div className={`badge ${getRecommendationColor(analysis.recommendation)}`}>
                {analysis.recommendation}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-4">
          <input
            type="radio"
            name="analysis_tabs"
            className="tab"
            label="Overview"
            checked={activeTab === 'overview'}
            onChange={() => setActiveTab('overview')}
          />
          <input
            type="radio"
            name="analysis_tabs"
            className="tab"
            label="Skills"
            checked={activeTab === 'skills'}
            onChange={() => setActiveTab('skills')}
          />
          <input
            type="radio"
            name="analysis_tabs"
            className="tab"
            label="Experience"
            checked={activeTab === 'experience'}
            onChange={() => setActiveTab('experience')}
          />
          <input
            type="radio"
            name="analysis_tabs"
            className="tab"
            label="Recommendations"
            checked={activeTab === 'recommendations'}
            onChange={() => setActiveTab('recommendations')}
          />
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && analysis && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-sm">{analysis.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-semibold text-green-600 mb-2">Strengths</h5>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {analysis.strengths?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-orange-600 mb-2">Concerns</h5>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {analysis.concerns?.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
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
                  {analysis.skillMatch?.percentage}%
                </span>
              </div>
              <div className="progress bg-gray-200 h-3 rounded">
                <div
                  className="progress-bar bg-green-500"
                  style={{ width: `${analysis.skillMatch?.percentage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-semibold text-green-600 mb-2">Matched Skills</h5>
              <div className="flex flex-wrap gap-2">
                {analysis.skillMatch?.matched?.map((skill, i) => (
                  <span key={i} className="badge badge-success badge-outline">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {analysis.missingSkills?.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-red-600 mb-2">Missing Skills</h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingSkills.map((skill, i) => (
                    <span key={i} className="badge badge-error badge-outline">
                      {skill}
                    </span>
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
              <p className="text-sm">{analysis.experienceRelevance.relevantExperience}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Years Relevant</p>
                <p className="text-2xl font-bold">
                  {analysis.experienceRelevance.yearsRelevant}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Alignment</p>
                <div className={`badge ${
                  analysis.experienceRelevance.alignment === 'High' ? 'badge-success' :
                  analysis.experienceRelevance.alignment === 'Medium' ? 'badge-warning' :
                  'badge-error'
                }`}>
                  {analysis.experienceRelevance.alignment}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-2">
            <h5 className="font-semibold mb-3">Suggestions for Improvement</h5>
            <ul className="space-y-2">
              {analysis?.suggestions?.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          className="btn btn-sm btn-outline mt-4 w-full"
          disabled={loading}
        >
          {loading ? 'Re-analyzing...' : 'Re-analyze'}
        </button>
      </div>
    </div>
  );
};

/**
 * BulkResumeAnalyzer Component
 * Analyze multiple resumes at once
 */
export const BulkResumeAnalyzer = ({ jobId, applications, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleBulkAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/recruitment/resume-analysis/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          jobId,
          applications: applications.map(a => ({
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (results) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h3 className="card-title">Bulk Analysis Results</h3>
          <div className="stats shadow w-full">
            <div className="stat">
              <div className="stat-title">Total Analyzed</div>
              <div className="stat-value text-primary">{results.totalAnalyzed}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Success Rate</div>
              <div className="stat-value text-success">
                {((results.successCount / results.totalAnalyzed) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
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
                    <td>#{r.rank}</td>
                    <td className="font-bold">{r.score}%</td>
                    <td>
                      <div className={`badge ${
                        r.recommendation === 'Strong Match' ? 'badge-success' :
                        r.recommendation === 'Good Match' ? 'badge-info' :
                        'badge-warning'
                      }`}>
                        {r.recommendation}
                      </div>
                    </td>
                    <td className="text-xs">{r.summary?.substring(0, 50)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        <p className="text-sm text-gray-600 mb-4">
          Analyze all {applications?.length} resumes at once and get ranked results
        </p>
        <button
          onClick={handleBulkAnalyze}
          className="btn btn-primary w-full"
          disabled={!applications?.length || loading}
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Analyzing {applications?.length} resumes...
            </>
          ) : (
            `Analyze All ${applications?.length} Resumes`
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
