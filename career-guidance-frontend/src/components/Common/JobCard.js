import React from 'react';

const JobCard = ({ job, onApply, applied = false, applying = false, showApplicants = false }) => {
  const isExpired = new Date(job.deadline) < new Date();

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h4>{job.title}</h4>
        {isExpired && (
          <span style={{ 
            padding: '0.25rem 0.5rem',
            backgroundColor: '#dc3545',
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.8rem'
          }}>
            EXPIRED
          </span>
        )}
      </div>
      
      <p><strong>Company:</strong> {job.company?.companyName}</p>
      <p><strong>Location:</strong> {job.location}</p>
      <p><strong>Type:</strong> {job.jobType}</p>
      <p><strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}</p>
      
      {job.salary && (
        <p><strong>Salary:</strong> {job.salary}</p>
      )}
      
      <p style={{ color: '#666666', fontSize: '0.9rem', marginTop: '1rem' }}>
        {job.description?.substring(0, 200)}...
      </p>

      <div style={{ marginTop: '1rem' }}>
        <strong>Requirements:</strong>
        <ul>
          {job.requirements?.map((req, idx) => (
            <li key={idx}>{req}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <strong>Qualifications:</strong>
        <ul>
          {job.qualifications?.map((qual, idx) => (
            <li key={idx}>{qual}</li>
          ))}
        </ul>
      </div>

      {showApplicants && job.applicantCount > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Applicants:</strong> {job.applicantCount}
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        {onApply && (
          applied ? (
            <button className="btn btn-secondary" disabled>
              Already Applied
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={applying || isExpired || !job.active}
              onClick={() => onApply(job)}
            >
              {applying ? 'Applying...' : isExpired ? 'Expired' : 'Apply Now'}
            </button>
          )
        )}
        
        {!job.active && (
          <span style={{ color: '#dc3545', marginLeft: '1rem' }}>
            This job is no longer active
          </span>
        )}
      </div>
    </div>
  );
};

export default JobCard;