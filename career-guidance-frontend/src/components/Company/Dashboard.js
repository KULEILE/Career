import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompanyDashboard, getCompanyJobs } from '../../services/api';
import Loading from '../Common/Loading';

const CompanyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Try to get dashboard data first
      try {
        const response = await getCompanyDashboard();
        setDashboardData(response.data);
      } catch (dashboardError) {
        console.log('Dashboard endpoint not available, using fallback data');
        // If dashboard fails, get basic company data and jobs
        const jobsResponse = await getCompanyJobs();
        setJobs(jobsResponse.data.jobs || []);
        setDashboardData({
          company: { companyName: 'Your Company' },
          stats: calculateStats(jobsResponse.data.jobs || []),
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
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate stats from jobs data
  const calculateStats = (jobs) => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.active && new Date(job.deadline) > new Date()).length;
    const totalApplicants = jobs.reduce((total, job) => total + (job.applicantCount || 0), 0);
    
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
        <h1>Welcome, {company?.companyName}</h1>
        <p>Company Management Dashboard</p>
        
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
            <h3>{stats.totalJobs}</h3>
            <p>Total Jobs</p>
          </div>
        </div>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>{stats.activeJobs}</h3>
            <p>Active Jobs</p>
          </div>
        </div>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>{stats.totalApplicants}</h3>
            <p>Total Applicants</p>
          </div>
        </div>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>{stats.interviewReadyCandidates}</h3>
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
                        <strong>{job.title}</strong>
                      </Link>
                    </td>
                    <td>{job.location}</td>
                    <td>{job.jobType}</td>
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
    </div>
  );
};

export default CompanyDashboard;