import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompanyDashboard, getCompanyJobs, getCompanyProfile, updateCompanyProfile } from '../../services/api';
import Loading from '../Common/Loading';

const CompanyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Try to get dashboard data first
      try {
        const response = await getCompanyDashboard();
        setDashboardData(response?.data || {
          company: { companyName: 'Your Company' },
          stats: { totalJobs: 0, activeJobs: 0, totalApplicants: 0, interviewReadyCandidates: 0 },
          recentCandidates: []
        });
        
        // Also fetch jobs separately for the jobs table
        const jobsResponse = await getCompanyJobs();
        setJobs(jobsResponse?.data?.jobs || []);
      } catch (dashboardError) {
        console.log('Dashboard endpoint not available, using fallback data');
        // If dashboard fails, get basic company data and jobs
        const jobsResponse = await getCompanyJobs();
        const jobsData = jobsResponse?.data?.jobs || [];
        setJobs(jobsData);
        setDashboardData({
          company: { companyName: 'Your Company' },
          stats: calculateStats(jobsData),
          recentCandidates: []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set fallback data
      setDashboardData({
        company: { companyName: 'Your Company' },
        stats: { totalJobs: 0, activeJobs: 0, totalApplicants: 0, interviewReadyCandidates: 0 },
        recentCandidates: []
      });
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await getCompanyProfile();
      setProfile(response.data.company);
    } catch (error) {
      setError('Error loading profile');
    }
  };

  const handleShowProfileModal = async () => {
    setShowProfileModal(true);
    setMessage('');
    setError('');
    await fetchProfile();
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setProfile(null);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateCompanyProfile(profile);
      setMessage('Profile updated successfully');
      // Refresh dashboard data to show updated company name
      fetchDashboardData();
      setTimeout(() => {
        setShowProfileModal(false);
      }, 2000);
    } catch (error) {
      setError('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactInfoChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  // Helper function to calculate stats from jobs data
  const calculateStats = (jobs) => {
    const jobsArray = jobs || [];
    const totalJobs = jobsArray.length;
    const activeJobs = jobsArray.filter(job => job.active && new Date(job.deadline) > new Date()).length;
    const totalApplicants = jobsArray.reduce((total, job) => total + (job.applicantCount || 0), 0);
    
    return {
      totalJobs,
      activeJobs,
      totalApplicants,
      interviewReadyCandidates: 0 // This would need to be calculated from applications
    };
  };

  if (loading) return <Loading message="Loading dashboard..." />;
  if (!dashboardData) return <div className="alert alert-error">Error loading dashboard</div>;

  const { company, stats, recentCandidates } = dashboardData;

  return (
    <div className="container">
      {/* Welcome Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Welcome, {company?.companyName || 'Your Company'}</h1>
            <p>Company Management Dashboard</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleShowProfileModal}
          >
            Update Profile
          </button>
        </div>
        
        {!company?.approved && (
          <div className="alert alert-info">
            Your company account is pending approval. Some features may be limited.
          </div>
        )}

        {stats.interviewReadyCandidates > 0 && (
          <div className="alert alert-success">
            <strong>You have {stats.interviewReadyCandidates} interview-ready candidates!</strong>
            <br />
            <Link to="/company/candidates" className="btn btn-success" style={{ marginTop: '0.5rem' }}>
              Review Candidates
            </Link>
          </div>
        )}
      </div>

      {/* Enhanced Stats Overview */}
      <div className="row" style={{ marginTop: '2rem' }}>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>{stats.totalJobs || 0}</h3>
            <p>Total Jobs</p>
          </div>
        </div>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>{stats.activeJobs || 0}</h3>
            <p>Active Jobs</p>
          </div>
        </div>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>{stats.totalApplicants || 0}</h3>
            <p>Total Applicants</p>
          </div>
        </div>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>{stats.interviewReadyCandidates || 0}</h3>
            <p>Interview Ready</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Quick Actions</h2>
        <div className="row">
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>Post Job</h4>
              <p>Create new job opportunities</p>
              <Link to="/company/jobs/new" className="btn btn-primary">
                Post Job
              </Link>
            </div>
          </div>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>Manage Jobs</h4>
              <p>View and manage your job postings</p>
              <Link to="/company/jobs" className="btn btn-primary">
                Manage
              </Link>
            </div>
          </div>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>View Candidates</h4>
              <p>Review interview-ready candidates</p>
              <Link to="/company/candidates" className="btn btn-primary">
                View Candidates
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Jobs Section */}
      {jobs.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2>Your Job Postings</h2>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Applicants</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 5).map(job => (
                  <tr key={job.id}>
                    <td>
                      <Link to={`/company/jobs/${job.id}`}>
                        <strong>{job.title || 'Untitled Job'}</strong>
                      </Link>
                    </td>
                    <td>{job.location || 'Not specified'}</td>
                    <td>{job.jobType || 'Not specified'}</td>
                    <td>{job.applicantCount || 0}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: job.active ? '#28a745' : '#dc3545',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}>
                        {job.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profile Update Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Update Company Profile</h2>
              <button
                onClick={handleCloseProfileModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {profile && (
              <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    className="form-control"
                    value={profile.companyName || ''}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <select
                    name="industry"
                    className="form-select"
                    value={profile.industry || ''}
                    onChange={handleProfileChange}
                    required
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Finance">Finance</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Construction">Construction</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Energy">Energy</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Government">Government</option>
                    <option value="Non-profit">Non-profit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    value={profile.description || ''}
                    onChange={handleProfileChange}
                    rows="4"
                    placeholder="Describe your company, mission, and values..."
                  />
                </div>

                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Contact Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={profile.contactInfo?.email || ''}
                        onChange={(e) => handleContactInfoChange('email', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={profile.contactInfo?.phone || ''}
                        onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    name="website"
                    className="form-control"
                    value={profile.website || ''}
                    onChange={handleProfileChange}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    name="address"
                    className="form-control"
                    value={profile.address || ''}
                    onChange={handleProfileChange}
                    rows="3"
                    placeholder="Company headquarters or main office address"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Logo URL</label>
                  <input
                    type="url"
                    name="logoUrl"
                    className="form-control"
                    value={profile.logoUrl || ''}
                    onChange={handleProfileChange}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Update Profile'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleCloseProfileModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;