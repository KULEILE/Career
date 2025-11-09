import React, { useState, useEffect } from 'react';
import { getStudentApplications, deleteApplication } from '../../services/api';
import Loading from '../Common/Loading';

const ApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await getStudentApplications();
      setApplications(response.data.applications);
    } catch (error) {
      setError('Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    setDeleting(applicationId);
    setMessage('');
    setError('');

    try {
      await deleteApplication(applicationId);
      setMessage('Application deleted successfully');
      fetchApplications();
    } catch (error) {
      setError(error.response?.data?.error || 'Error deleting application');
    } finally {
      setDeleting(null);
    }
  };

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

  if (loading) return <Loading message="Loading applications..." />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">My Applications</h2>
          <p>Track your course applications and their status</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {applications.length === 0 ? (
          <div className="alert alert-info">
            You haven't applied to any courses yet. <a href="/courses">Browse courses</a> to get started.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Institution</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(application => (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.course?.name}</strong>
                      <br />
                      <small>{application.course?.duration}</small>
                    </td>
                    <td>{application.institution?.institutionName}</td>
                    <td>
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span 
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: getStatusColor(application.status),
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {application.status.toUpperCase()}
                      </span>
                      {application.admissionPublished && application.status === 'admitted' && (
                        <div style={{ fontSize: '0.8rem', color: '#28a745', marginTop: '0.25rem' }}>
                          Admission Published
                        </div>
                      )}
                    </td>
                    <td>
                      {application.status === 'pending' && (
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={deleting === application.id}
                          onClick={() => handleDelete(application.id)}
                        >
                          {deleting === application.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                      {application.status === 'admitted' && application.admissionPublished && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => window.location.href = '/admissions'}
                        >
                          View Admission
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsList;