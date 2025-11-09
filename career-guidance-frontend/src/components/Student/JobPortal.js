import React, { useState, useEffect } from 'react';
import { getAvailableJobs, applyForJob } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';

const JobPortal = () => {
  const { userProfile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await getAvailableJobs();
      setJobs(response.data.jobs);
    } catch (error) {
      setError('Error loading jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    if (!userProfile.hasTranscript) {
      setError('Please upload your academic transcript before applying for jobs');
      return;
    }

    setApplying(jobId);
    setMessage('');
    setError('');

    try {
      await applyForJob(jobId);
      setMessage('Job application submitted successfully!');
      
      // Refresh jobs to update application status
      fetchJobs();
    } catch (error) {
      setError(error.response?.data?.error || 'Error applying for job');
    } finally {
      setApplying(null);
    }
  };

  if (loading) return <Loading message="Loading jobs..." />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Job Opportunities</h2>
          <p>Browse and apply for job opportunities from partner companies</p>
        </div>

        {!userProfile.hasTranscript && (
          <div className="alert alert-warning">
            <strong>Notice:</strong> You need to upload your academic transcript before you can apply for jobs. 
            <a href="/documents" style={{ marginLeft: '0.5rem' }}>Upload Transcript</a>
          </div>
        )}

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="row">
          {jobs.map(job => (
            <div key={job.id} className="col-6">
              <div className="card">
                <h4>{job.title}</h4>
                <p><strong>Company:</strong> {job.company?.companyName}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Type:</strong> {job.jobType}</p>
                <p><strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}</p>
                
                <p style={{ color: '#666666', fontSize: '0.9rem', marginTop: '1rem' }}>
                  {job.description?.substring(0, 150)}...
                </p>

                <div style={{ marginTop: '1rem' }}>
                  <strong>Requirements:</strong>
                  <ul>
                    {job.requirements?.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  {job.hasApplied ? (
                    <button className="btn btn-secondary" disabled>
                      Already Applied
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      disabled={applying === job.id || !userProfile.hasTranscript || !job.isQualified}
                      onClick={() => handleApply(job.id)}
                    >
                      {applying === job.id ? 'Applying...' : 'Apply Now'}
                    </button>
                  )}
                  
                  {!job.isQualified && (
                    <p style={{ fontSize: '0.8rem', color: '#dc3545', marginTop: '0.5rem' }}>
                      You may not meet all qualifications for this position
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="alert alert-info">
            No job opportunities available at the moment. Please check back later.
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPortal;