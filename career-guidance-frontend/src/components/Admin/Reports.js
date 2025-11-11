import React, { useState, useEffect } from 'react';
import { getReports } from '../../services/api';
import Loading from '../Common/Loading';

const AdminReports = () => {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('applications');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, [selectedReport]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getReports(selectedReport, dateRange.start, dateRange.end);
      setReports(response.data.report || {});
    } catch (error) {
      console.error('Error loading reports:', error);
      setError('Failed to load reports. Please try again.');
      setReports({});
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    fetchReports();
  };

  const handleReportTypeChange = (reportType) => {
    setSelectedReport(reportType);
  };

  // Process application statistics data
  const getApplicationStats = () => {
    if (selectedReport === 'applications' && reports) {
      return {
        pending: reports.pending || 0,
        admitted: reports.admitted || 0,
        rejected: reports.rejected || 0,
        waitlisted: reports.waitlisted || 0,
        accepted: reports.accepted || 0,
        total: (reports.pending || 0) + (reports.admitted || 0) + (reports.rejected || 0) + 
               (reports.waitlisted || 0) + (reports.accepted || 0)
      };
    }
    return {
      pending: 0,
      admitted: 0,
      rejected: 0,
      waitlisted: 0,
      accepted: 0,
      total: 0
    };
  };

  // Process user growth data
  const getUserGrowthData = () => {
    if (selectedReport === 'users' && Array.isArray(reports)) {
      return reports;
    }
    return [];
  };

  // Process institution performance data
  const getInstitutionPerformance = () => {
    if (selectedReport === 'institutions' && reports) {
      return reports;
    }
    return {};
  };

  // Process company engagement data
  const getCompanyEngagement = () => {
    if (selectedReport === 'companies' && reports) {
      return reports;
    }
    return {};
  };

  // Process system usage data
  const getSystemUsage = () => {
    if (selectedReport === 'system' && reports) {
      return reports;
    }
    return {};
  };

  if (loading) return <Loading message="Generating reports..." />;

  const applicationStats = getApplicationStats();
  const userGrowth = getUserGrowthData();
  const institutionPerformance = getInstitutionPerformance();
  const companyEngagement = getCompanyEngagement();
  const systemUsage = getSystemUsage();

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">System Reports & Analytics</h2>
          <p>Comprehensive system analytics and reporting</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ margin: '1rem' }}>
            {error}
          </div>
        )}

        {/* Report Selection */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Report Type</h3>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Select Report</label>
                <select
                  className="form-select"
                  value={selectedReport}
                  onChange={(e) => handleReportTypeChange(e.target.value)}
                >
                  <option value="applications">Application Statistics</option>
                  <option value="users">User Growth</option>
                  <option value="institutions">Institution Performance</option>
                  <option value="companies">Company Engagement</option>
                  <option value="system">System Usage</option>
                </select>
              </div>
            </div>
            <div className="col-3">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
            </div>
            <div className="col-3">
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleDateRangeChange}
            style={{ marginTop: '1rem' }}
          >
            Generate Report
          </button>
        </div>

        {/* Application Statistics Report */}
        {selectedReport === 'applications' && (
          <div>
            <h3>Application Statistics</h3>
            <div className="row" style={{ marginBottom: '2rem' }}>
              <div className="col-2">
                <div className="card" style={{ textAlign: 'center', backgroundColor: '#ffc107' }}>
                  <h4>{applicationStats.pending}</h4>
                  <p>Pending</p>
                </div>
              </div>
              <div className="col-2">
                <div className="card" style={{ textAlign: 'center', backgroundColor: '#28a745' }}>
                  <h4>{applicationStats.admitted}</h4>
                  <p>Admitted</p>
                </div>
              </div>
              <div className="col-2">
                <div className="card" style={{ textAlign: 'center', backgroundColor: '#dc3545' }}>
                  <h4>{applicationStats.rejected}</h4>
                  <p>Rejected</p>
                </div>
              </div>
              <div className="col-2">
                <div className="card" style={{ textAlign: 'center', backgroundColor: '#17a2b8' }}>
                  <h4>{applicationStats.waitlisted}</h4>
                  <p>Waitlisted</p>
                </div>
              </div>
              <div className="col-2">
                <div className="card" style={{ textAlign: 'center', backgroundColor: '#20c997' }}>
                  <h4>{applicationStats.accepted}</h4>
                  <p>Accepted</p>
                </div>
              </div>
              <div className="col-2">
                <div className="card" style={{ textAlign: 'center', backgroundColor: '#6c757d' }}>
                  <h4>{applicationStats.total}</h4>
                  <p>Total</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Growth Report */}
        {selectedReport === 'users' && (
          <div>
            <h3>User Growth Analytics</h3>
            <div className="card">
              <h4>Monthly User Registration</h4>
              {userGrowth.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Students</th>
                        <th>Institutions</th>
                        <th>Companies</th>
                        <th>Total</th>
                        <th>Growth Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userGrowth.map((data, index) => {
                        const total = (data.students || 0) + (data.institutions || 0) + (data.companies || 0);
                        const prevTotal = index > 0 ? 
                          (userGrowth[index-1].students || 0) + (userGrowth[index-1].institutions || 0) + (userGrowth[index-1].companies || 0) : 
                          total;
                        const growthRate = index > 0 ? ((total - prevTotal) / prevTotal * 100).toFixed(1) : '-';
                        
                        return (
                          <tr key={data.month || index}>
                            <td><strong>{data.month || `Month ${index + 1}`}</strong></td>
                            <td>{data.students || 0}</td>
                            <td>{data.institutions || 0}</td>
                            <td>{data.companies || 0}</td>
                            <td><strong>{total}</strong></td>
                            <td>
                              <span style={{
                                color: growthRate === '-' || parseFloat(growthRate) >= 0 ? '#28a745' : '#dc3545',
                                fontWeight: 'bold'
                              }}>
                                {growthRate === '-' ? '-' : `${growthRate}%`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info">
                  No user growth data available for the selected period.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Institution Performance Report */}
        {selectedReport === 'institutions' && (
          <div>
            <h3>Institution Performance</h3>
            {Object.keys(institutionPerformance).length > 0 ? (
              <div className="card">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Institution</th>
                        <th>Courses</th>
                        <th>Applications</th>
                        <th>Admission Rate</th>
                        <th>Active Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(institutionPerformance).map(([institutionName, data], index) => (
                        <tr key={institutionName || index}>
                          <td><strong>{institutionName}</strong></td>
                          <td>{data.courses || 0}</td>
                          <td>{data.applications || 0}</td>
                          <td>{data.admissionRate ? `${data.admissionRate}%` : 'N/A'}</td>
                          <td>{data.activeStudents || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                No institution performance data available.
              </div>
            )}
          </div>
        )}

        {/* Company Engagement Report */}
        {selectedReport === 'companies' && (
          <div>
            <h3>Company Engagement</h3>
            {Object.keys(companyEngagement).length > 0 ? (
              <div className="card">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Jobs Posted</th>
                        <th>Applications</th>
                        <th>Hires</th>
                        <th>Engagement Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(companyEngagement).map(([companyName, data], index) => (
                        <tr key={companyName || index}>
                          <td><strong>{companyName}</strong></td>
                          <td>{data.jobsPosted || 0}</td>
                          <td>{data.applications || 0}</td>
                          <td>{data.hires || 0}</td>
                          <td>{data.engagementRate ? `${data.engagementRate}%` : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                No company engagement data available.
              </div>
            )}
          </div>
        )}

        {/* System Usage Report */}
        {selectedReport === 'system' && (
          <div>
            <h3>System Usage Statistics</h3>
            {Object.keys(systemUsage).length > 0 ? (
              <div className="row" style={{ marginBottom: '2rem' }}>
                <div className="col-3">
                  <div className="card" style={{ textAlign: 'center', backgroundColor: '#17a2b8' }}>
                    <h4>{systemUsage.totalUsers || 0}</h4>
                    <p>Total Users</p>
                  </div>
                </div>
                <div className="col-3">
                  <div className="card" style={{ textAlign: 'center', backgroundColor: '#28a745' }}>
                    <h4>{systemUsage.activeUsers || 0}</h4>
                    <p>Active Users (30 days)</p>
                  </div>
                </div>
                <div className="col-3">
                  <div className="card" style={{ textAlign: 'center', backgroundColor: '#ffc107' }}>
                    <h4>{systemUsage.totalApplications || 0}</h4>
                    <p>Total Applications</p>
                  </div>
                </div>
                <div className="col-3">
                  <div className="card" style={{ textAlign: 'center', backgroundColor: '#dc3545' }}>
                    <h4>{systemUsage.systemUptime ? `${systemUsage.systemUptime}%` : 'N/A'}</h4>
                    <p>System Uptime</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                No system usage data available.
              </div>
            )}
          </div>
        )}

        {/* Export and Actions */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>Report Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">
              Export to PDF
            </button>
            <button className="btn btn-success">
              Export to Excel
            </button>
            <button className="btn btn-info">
              Print Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;