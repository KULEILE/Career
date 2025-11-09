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

  useEffect(() => {
    fetchReports();
  }, [selectedReport]);

  const fetchReports = async () => {
    try {
      const response = await getReports(selectedReport);
      setReports(response.data.report);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    // In a real implementation, this would filter the reports by date range
    console.log('Date range changed:', dateRange);
    fetchReports();
  };

  const generateApplicationStats = () => {
    // Mock data for demonstration
    return {
      pending: 45,
      admitted: 120,
      rejected: 85,
      waitlisted: 23,
      accepted: 78
    };
  };

  const generateUserGrowth = () => {
    // Mock data for demonstration
    return [
      { month: 'Jan', students: 150, institutions: 5, companies: 8 },
      { month: 'Feb', students: 230, institutions: 7, companies: 12 },
      { month: 'Mar', students: 350, institutions: 10, companies: 15 },
      { month: 'Apr', students: 480, institutions: 12, companies: 18 },
      { month: 'May', students: 620, institutions: 15, companies: 22 },
      { month: 'Jun', students: 780, institutions: 18, companies: 25 }
    ];
  };

  if (loading) return <Loading message="Generating reports..." />;

  const applicationStats = generateApplicationStats();
  const userGrowth = generateUserGrowth();

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">System Reports & Analytics</h2>
          <p>Comprehensive system analytics and reporting</p>
        </div>

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
                  onChange={(e) => setSelectedReport(e.target.value)}
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
                  <h4>{Object.values(applicationStats).reduce((a, b) => a + b, 0)}</h4>
                  <p>Total</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h4>Application Trends</h4>
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <p style={{ color: '#666666' }}>
                  Application trends chart would be displayed here in a real implementation.
                </p>
                <p style={{ fontSize: '0.9rem', color: '#999' }}>
                  This would typically show monthly application volumes, admission rates, and other key metrics.
                </p>
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
                      const total = data.students + data.institutions + data.companies;
                      const prevTotal = index > 0 ? 
                        userGrowth[index-1].students + userGrowth[index-1].institutions + userGrowth[index-1].companies : 
                        total;
                      const growthRate = index > 0 ? ((total - prevTotal) / prevTotal * 100).toFixed(1) : '-';
                      
                      return (
                        <tr key={data.month}>
                          <td><strong>{data.month}</strong></td>
                          <td>{data.students}</td>
                          <td>{data.institutions}</td>
                          <td>{data.companies}</td>
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
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
              <h4>User Distribution</h4>
              <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <p style={{ color: '#666666' }}>
                  User distribution pie chart would be displayed here.
                </p>
                <p style={{ fontSize: '0.9rem', color: '#999' }}>
                  Showing percentage distribution between students, institutions, and companies.
                </p>
              </div>
            </div>
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
            <button className="btn btn-secondary">
              Schedule Automated Report
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>Key Performance Indicators</h3>
          <div className="row">
            <div className="col-3">
              <div style={{ textAlign: 'center' }}>
                <h4>78%</h4>
                <p>Admission Rate</p>
                <div style={{ fontSize: '0.8rem', color: '#28a745' }}>
                  ↑ 5% from last month
                </div>
              </div>
            </div>
            <div className="col-3">
              <div style={{ textAlign: 'center' }}>
                <h4>2.3</h4>
                <p>Avg. Applications per Student</p>
                <div style={{ fontSize: '0.8rem', color: '#17a2b8' }}>
                  → Stable
                </div>
              </div>
            </div>
            <div className="col-3">
              <div style={{ textAlign: 'center' }}>
                <h4>45%</h4>
                <p>Job Application Rate</p>
                <div style={{ fontSize: '0.8rem', color: '#ffc107' }}>
                  ↑ 12% from last month
                </div>
              </div>
            </div>
            <div className="col-3">
              <div style={{ textAlign: 'center' }}>
                <h4>92%</h4>
                <p>System Uptime</p>
                <div style={{ fontSize: '0.8rem', color: '#dc3545' }}>
                  ↓ 2% from last month
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;