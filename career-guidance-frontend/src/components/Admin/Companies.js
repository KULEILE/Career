import React, { useState, useEffect } from 'react';
import { getCompanies, approveCompany, suspendCompany } from '../../services/api';
import Loading from '../Common/Loading';

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await getCompanies();
      setCompanies(response.data.companies);
    } catch (error) {
      setError('Error loading companies');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (companyId) => {
    setActionLoading(companyId);
    setMessage('');
    setError('');

    try {
      await approveCompany(companyId);
      setMessage('Company approved successfully');
      
      // Update local state
      setCompanies(prev => prev.map(company => 
        company.id === companyId ? { ...company, approved: true } : company
      ));
    } catch (error) {
      setError(error.response?.data?.error || 'Error approving company');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (companyId) => {
    setActionLoading(companyId);
    setMessage('');
    setError('');

    try {
      await suspendCompany(companyId);
      setMessage('Company suspended successfully');
      
      // Update local state
      setCompanies(prev => prev.map(company => 
        company.id === companyId ? { ...company, approved: false } : company
      ));
    } catch (error) {
      setError(error.response?.data?.error || 'Error suspending company');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (company) => {
    // In a real implementation, this would open a modal or navigate to details page
    alert(`Company Details:\nName: ${company.companyName}\nIndustry: ${company.industry}\nEmail: ${company.email}\nContact: ${company.firstName} ${company.lastName}`);
  };

  if (loading) return <Loading message="Loading companies..." />;

  const pendingCompanies = companies.filter(company => !company.approved);
  const approvedCompanies = companies.filter(company => company.approved);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Company Management</h2>
          <p>Manage and approve partner companies</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Statistics */}
        <div className="row" style={{ marginBottom: '2rem' }}>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{companies.length}</h3>
              <p>Total Companies</p>
            </div>
          </div>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{approvedCompanies.length}</h3>
              <p>Approved</p>
            </div>
          </div>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{pendingCompanies.length}</h3>
              <p>Pending Approval</p>
            </div>
          </div>
        </div>

        {/* Pending Companies */}
        {pendingCompanies.length > 0 && (
          <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #ffc107' }}>
            <h3>Pending Approval ({pendingCompanies.length})</h3>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Industry</th>
                    <th>Contact Email</th>
                    <th>Representative</th>
                    <th>Registered Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCompanies.map(company => (
                    <tr key={company.id}>
                      <td>
                        <strong>{company.companyName}</strong>
                        {company.description && (
                          <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                            {company.description.substring(0, 100)}...
                          </div>
                        )}
                      </td>
                      <td>{company.industry}</td>
                      <td>{company.email}</td>
                      <td>{company.firstName} {company.lastName}</td>
                      <td>{new Date(company.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(company.id)}
                            disabled={actionLoading === company.id}
                          >
                            {actionLoading === company.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleSuspend(company.id)}
                            disabled={actionLoading === company.id}
                          >
                            Reject
                          </button>
                          <button 
                            className="btn btn-info btn-sm"
                            onClick={() => handleViewDetails(company)}
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

        {/* Approved Companies */}
        <div className="card">
          <h3>Approved Companies ({approvedCompanies.length})</h3>
          {approvedCompanies.length === 0 ? (
            <div className="alert alert-info">
              No approved companies yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Industry</th>
                    <th>Contact Email</th>
                    <th>Website</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedCompanies.map(company => (
                    <tr key={company.id}>
                      <td>
                        <strong>{company.companyName}</strong>
                        {company.description && (
                          <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                            {company.description.substring(0, 100)}...
                          </div>
                        )}
                      </td>
                      <td>{company.industry}</td>
                      <td>{company.email}</td>
                      <td>
                        {company.contactInfo?.website ? (
                          <a href={company.contactInfo.website} target="_blank" rel="noopener noreferrer">
                            {company.contactInfo.website}
                          </a>
                        ) : (
                          'Not provided'
                        )}
                      </td>
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
                            onClick={() => handleSuspend(company.id)}
                            disabled={actionLoading === company.id}
                          >
                            {actionLoading === company.id ? 'Suspending...' : 'Suspend'}
                          </button>
                          <button 
                            className="btn btn-info btn-sm"
                            onClick={() => handleViewDetails(company)}
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

export default AdminCompanies;