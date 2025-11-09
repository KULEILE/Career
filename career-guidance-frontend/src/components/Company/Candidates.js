import React, { useState, useEffect } from 'react';
import { getInterviewReadyCandidates, updateCompanyApplicationStatus } from '../../services/api';
import Loading from '../Common/Loading';

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    minMatchScore: 0,
    jobTitle: '',
    status: ''
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await getInterviewReadyCandidates();
      setCandidates(response.data.candidates || []);
    } catch (error) {
      setError('Error loading candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (candidateId, newStatus) => {
    setUpdating(candidateId);
    setMessage('');
    setError('');

    try {
      await updateCompanyApplicationStatus(candidateId, { status: newStatus });
      setMessage('Candidate status updated successfully');
      
      // Update local state
      setCandidates(prev => prev.map(candidate => 
        candidate.id === candidateId 
          ? { ...candidate, status: newStatus }
          : candidate
      ));
      
      fetchCandidates(); // Refresh data
    } catch (error) {
      setError(error.response?.data?.error || 'Error updating status');
    } finally {
      setUpdating(null);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    if (filters.minMatchScore && candidate.matchScore < filters.minMatchScore) return false;
    if (filters.jobTitle && !candidate.job.title.toLowerCase().includes(filters.jobTitle.toLowerCase())) return false;
    if (filters.status && candidate.status !== filters.status) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'shortlisted': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'hired': return '#20c997';
      case 'interview_scheduled': return '#17a2b8';
      case 'pending':
      default: return '#ffc107';
    }
  };

  const getMatchColor = (score) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    return '#dc3545';
  };

  if (loading) return <Loading message="Loading candidates..." />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Interview-Ready Candidates</h2>
          <p>Review and manage qualified candidates automatically filtered by the system</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Enhanced Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Filters</h3>
          <div className="row">
            <div className="col-4">
              <div className="form-group">
                <label className="form-label">Minimum Match Score</label>
                <select
                  className="form-select"
                  value={filters.minMatchScore}
                  onChange={(e) => setFilters(prev => ({ ...prev, minMatchScore: parseInt(e.target.value) }))}
                >
                  <option value={0}>All Scores</option>
                  <option value={80}>80%+ (Excellent)</option>
                  <option value={70}>70%+ (Very Good)</option>
                  <option value={60}>60%+ (Good)</option>
                  <option value={50}>50%+ (Qualified)</option>
                </select>
              </div>
            </div>
            <div className="col-4">
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={filters.jobTitle}
                  onChange={(e) => setFilters(prev => ({ ...prev, jobTitle: e.target.value }))}
                  placeholder="Filter by job title..."
                />
              </div>
            </div>
            <div className="col-4">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <h3>
          Qualified Candidates ({filteredCandidates.length})
          {(filters.minMatchScore || filters.jobTitle || filters.status) && ' (Filtered)'}
        </h3>

        {filteredCandidates.length === 0 ? (
          <div className="alert alert-info">
            No interview-ready candidates found matching your filters.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Position</th>
                  <th>Match Score</th>
                  <th>Academic Performance</th>
                  <th>Certificates</th>
                  <th>Experience</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map(candidate => (
                  <tr key={candidate.id}>
                    <td>
                      <strong>{candidate.student.firstName} {candidate.student.lastName}</strong>
                      <br />
                      <small>{candidate.student.email}</small>
                      <br />
                      <small>{candidate.student.phone}</small>
                      {candidate.student.hasTranscript && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <a 
                            href={candidate.student.transcriptUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            View Transcript
                          </a>
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{candidate.job.title}</strong>
                      <br />
                      <small>{candidate.job.location}</small>
                      <br />
                      <small>{candidate.job.jobType}</small>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.5rem',
                        borderRadius: '4px',
                        backgroundColor: getMatchColor(candidate.matchScore),
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}>
                        {candidate.matchScore}%
                      </span>
                    </td>
                    <td>
                      {candidate.student.subjects && candidate.student.subjects.length > 0 ? (
                        <div>
                          <strong>Average: </strong>
                          {calculateAverageGrade(candidate.student.subjects).toFixed(1)}%
                          <br />
                          <small>
                            {candidate.student.subjects.length} subjects
                          </small>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td>
                      {candidate.student.certificates && candidate.student.certificates.length > 0 ? (
                        <div>
                          <strong>{candidate.student.certificates.length} certificates</strong>
                          <br />
                          <small>
                            {candidate.student.certificates.slice(0, 2).map(cert => cert.name).join(', ')}
                            {candidate.student.certificates.length > 2 && '...'}
                          </small>
                        </div>
                      ) : 'None'}
                    </td>
                    <td>
                      {candidate.student.workExperience && candidate.student.workExperience.length > 0 ? (
                        <div>
                          <strong>
                            {calculateTotalExperience(candidate.student.workExperience)} years
                          </strong>
                          <br />
                          <small>
                            {candidate.student.workExperience.length} position(s)
                          </small>
                        </div>
                      ) : 'No experience'}
                    </td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(candidate.status || 'pending'),
                        color: 'white',
                        fontSize: '0.875rem'
                      }}>
                        {(candidate.status || 'pending').replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={updating === candidate.id}
                          onClick={() => handleStatusUpdate(candidate.id, 'shortlisted')}
                        >
                          {updating === candidate.id ? '...' : 'Shortlist'}
                        </button>
                        <button
                          className="btn btn-info btn-sm"
                          disabled={updating === candidate.id}
                          onClick={() => handleStatusUpdate(candidate.id, 'interview_scheduled')}
                        >
                          {updating === candidate.id ? '...' : 'Schedule Interview'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={updating === candidate.id}
                          onClick={() => handleStatusUpdate(candidate.id, 'rejected')}
                        >
                          {updating === candidate.id ? '...' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Enhanced Quick Stats */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>Candidate Statistics</h3>
          <div className="row">
            <div className="col-3">
              <div style={{ textAlign: 'center' }}>
                <h4>{candidates.length}</h4>
                <p>Total Qualified</p>
              </div>
            </div>
            <div className="col-3">
              <div style={{ textAlign: 'center' }}>
                <h4>{candidates.filter(c => c.matchScore >= 80).length}</h4>
                <p>Excellent Match (80%+)</p>
              </div>
            </div>
            <div className="col-3">
              <div style={{ textAlign: 'center' }}>
                <h4>{candidates.filter(c => c.status === 'shortlisted').length}</h4>
                <p>Shortlisted</p>
              </div>
            </div>
            <div className="col-3">
              <div style={{ textAlign: 'center' }}>
                <h4>{candidates.filter(c => c.status === 'interview_scheduled').length}</h4>
                <p>Interviews Scheduled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const calculateAverageGrade = (subjects) => {
  if (!subjects || subjects.length === 0) return 0;
  
  const gradePoints = {
    'A': 90, 'B': 80, 'C': 70, 'D': 60, 'E': 50, 'F': 0
  };
  
  const total = subjects.reduce((sum, subject) => {
    return sum + (gradePoints[subject.grade] || 0);
  }, 0);
  
  return total / subjects.length;
};

const calculateTotalExperience = (workExperience) => {
  if (!workExperience || workExperience.length === 0) return 0;
  
  const totalMonths = workExperience.reduce((total, exp) => {
    return total + (exp.durationInMonths || 0);
  }, 0);
  
  return (totalMonths / 12).toFixed(1);
};

export default Candidates;