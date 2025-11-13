import React, { useState, useEffect } from 'react';
import { getInstitutions, approveInstitution, suspendInstitution } from '../../services/api'; // ✅ FIXED IMPORTS
import Loading from '../Common/Loading';

const AdminInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const response = await getInstitutions();
      setInstitutions(response.data.institutions);
    } catch (error) {
      console.error('Error loading institutions:', error);
      setError('Error loading institutions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (institutionId) => {
    setActionLoading(institutionId);
    setMessage('');
    setError('');

    try {
      await approveInstitution(institutionId); // ✅ FIXED: Now calls institution approval
      setMessage('Institution approved successfully');
      
      // Update local state
      setInstitutions(prev => prev.map(inst => 
        inst.id === institutionId ? { ...inst, approved: true } : inst
      ));
    } catch (error) {
      console.error('Error approving institution:', error);
      setError(error.response?.data?.error || 'Error approving institution');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (institutionId) => {
    setActionLoading(institutionId);
    setMessage('');
    setError('');

    try {
      await suspendInstitution(institutionId); // ✅ FIXED: Now calls institution suspension
      setMessage('Institution suspended successfully');
      
      // Update local state
      setInstitutions(prev => prev.map(inst => 
        inst.id === institutionId ? { ...inst, approved: false } : inst
      ));
    } catch (error) {
      console.error('Error suspending institution:', error);
      setError(error.response?.data?.error || 'Error suspending institution');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (institution) => {
    alert(`Institution Details:\nName: ${institution.institutionName}\nEmail: ${institution.email}\nContact Email: ${institution.contactInfo?.email || 'Not provided'}\nPhone: ${institution.contactInfo?.phone || 'Not provided'}\nLocation: ${institution.location}\nDescription: ${institution.description || 'No description'}`);
  };

  if (loading) return <Loading message="Loading institutions..." />;

  const pendingInstitutions = institutions.filter(inst => !inst.approved);
  const approvedInstitutions = institutions.filter(inst => inst.approved);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Institution Management</h2>
          <p>Manage and approve higher learning institutions</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Statistics */}
        <div className="row" style={{ marginBottom: '2rem' }}>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{institutions.length}</h3>
              <p>Total Institutions</p>
            </div>
          </div>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{approvedInstitutions.length}</h3>
              <p>Approved</p>
            </div>
          </div>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{pendingInstitutions.length}</h3>
              <p>Pending Approval</p>
            </div>
          </div>
        </div>

        {/* Pending Institutions */}
        {pendingInstitutions.length > 0 && (
          <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #ffc107' }}>
            <h3>Pending Approval ({pendingInstitutions.length})</h3>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Institution Name</th>
                    <th>Contact Email</th>
                    <th>Location</th>
                    <th>Slogan</th>
                    <th>Registered Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInstitutions.map(institution => (
                    <tr key={institution.id}>
                      <td>
                        <strong>{institution.institutionName}</strong>
                        {institution.description && (
                          <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                            {institution.description.substring(0, 100)}...
                          </div>
                        )}
                      </td>
                      <td>{institution.email}</td>
                      <td>{institution.location}</td>
                      <td>{institution.slogan || 'No slogan'}</td>
                      <td>{new Date(institution.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(institution.id)}
                            disabled={actionLoading === institution.id}
                          >
                            {actionLoading === institution.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleSuspend(institution.id)}
                            disabled={actionLoading === institution.id}
                          >
                            Reject
                          </button>
                          <button 
                            className="btn btn-info btn-sm"
                            onClick={() => handleViewDetails(institution)}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approved Institutions */}
        <div className="card">
          <h3>Approved Institutions ({approvedInstitutions.length})</h3>
          {approvedInstitutions.length === 0 ? (
            <div className="alert alert-info">
              No approved institutions yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Institution Name</th>
                    <th>Contact Email</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedInstitutions.map(institution => (
                    <tr key={institution.id}>
                      <td>
                        <strong>{institution.institutionName}</strong>
                        {institution.contactInfo?.website && (
                          <div style={{ fontSize: '0.8rem' }}>
                            <a href={institution.contactInfo.website} target="_blank" rel="noopener noreferrer">
                              {institution.contactInfo.website}
                            </a>
                          </div>
                        )}
                      </td>
                      <td>{institution.email}</td>
                      <td>{institution.contactInfo?.phone || 'Not provided'}</td>
                      <td>{institution.location}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          fontSize: '0.875rem'
                        }}>
                          APPROVED
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleSuspend(institution.id)}
                            disabled={actionLoading === institution.id}
                          >
                            {actionLoading === institution.id ? 'Suspending...' : 'Suspend'}
                          </button>
                          <button 
                            className="btn btn-info btn-sm"
                            onClick={() => handleViewDetails(institution)}
                          >
                            View Details
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
      </div>
    </div>
  );
};

export default AdminInstitutions;