import React from 'react';

const ApplicationCard = ({ application, onStatusUpdate, showActions = false }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'admitted': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'pending': return '#ffc107';
      case 'waitlisted': return '#17a2b8';
      case 'accepted': return '#20c997';
      default: return '#6c757d';
    }
  };

  const handleStatusChange = (newStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(application.id, newStatus);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4>{application.course?.name}</h4>
          <p><strong>Institution:</strong> {application.institution?.institutionName}</p>
          <p><strong>Student:</strong> {application.student?.firstName} {application.student?.lastName}</p>
        </div>
        
        <span 
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            backgroundColor: getStatusColor(application.status),
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}
        >
          {application.status.toUpperCase()}
        </span>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <strong>Applied:</strong> {new Date(application.appliedAt).toLocaleDateString()}
        <br />
        <strong>Last Updated:</strong> {new Date(application.updatedAt).toLocaleDateString()}
      </div>

      {application.subjects && application.subjects.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Student's Subjects:</strong>
          <ul>
            {application.subjects.map((subject, idx) => (
              <li key={idx}>
                {subject.name}: {subject.grade}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showActions && onStatusUpdate && (
        <div style={{ marginTop: '1.5rem' }}>
          <strong>Update Status:</strong>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-success btn-sm"
              onClick={() => handleStatusChange('admitted')}
              disabled={application.status === 'admitted'}
            >
              Admit
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleStatusChange('rejected')}
              disabled={application.status === 'rejected'}
            >
              Reject
            </button>
            <button
              className="btn btn-info btn-sm"
              onClick={() => handleStatusChange('waitlisted')}
              disabled={application.status === 'waitlisted'}
            >
              Waitlist
            </button>
            <button
              className="btn btn-warning btn-sm"
              onClick={() => handleStatusChange('pending')}
              disabled={application.status === 'pending'}
            >
              Pending
            </button>
          </div>
        </div>
      )}

      {application.admissionPublished && application.status === 'admitted' && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.5rem',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          <strong>Admission Published:</strong> Student can view and accept this offer
        </div>
      )}
    </div>
  );
};

export default ApplicationCard;