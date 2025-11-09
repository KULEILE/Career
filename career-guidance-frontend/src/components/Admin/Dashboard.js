import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard, getInstitutions, getCompanies, getUsers } from '../../services/api';
import Loading from '../Common/Loading';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, institutionsResponse, companiesResponse, usersResponse] = await Promise.all([
        getAdminDashboard().catch(() => ({ data: { stats: null } })),
        getInstitutions().catch(() => ({ data: { institutions: [] } })),
        getCompanies().catch(() => ({ data: { companies: [] } })),
        getUsers().catch(() => ({ data: { users: [] } }))
      ]);

      setStats(statsResponse?.data?.stats || {
        totalStudents: 0,
        totalInstitutions: 0,
        totalCompanies: 0,
        totalApplications: 0
      });
      setInstitutions(institutionsResponse?.data?.institutions || []);
      setCompanies(companiesResponse?.data?.companies || []);
      setUsers(usersResponse?.data?.users || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set fallback data
      setStats({
        totalStudents: 0,
        totalInstitutions: 0,
        totalCompanies: 0,
        totalApplications: 0
      });
      setInstitutions([]);
      setCompanies([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading admin dashboard..." />;

  const pendingCompanies = companies.filter(company => !company.approved).length;
  const pendingInstitutions = institutions.filter(inst => !inst.approved).length;
  const recentUsers = (users || []).slice(0, 5).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="container">
      {/* Welcome Section */}
      <div className="card">
        <h1>Admin Dashboard</h1>
        <p>System Administration and Management</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="row" style={{ marginTop: '2rem' }}>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{stats.totalStudents || 0}</h3>
              <p>Total Students</p>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{stats.totalInstitutions || 0}</h3>
              <p>Institutions</p>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{stats.totalCompanies || 0}</h3>
              <p>Companies</p>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{stats.totalApplications || 0}</h3>
              <p>Applications</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {(pendingCompanies > 0 || pendingInstitutions > 0) && (
        <div className="card" style={{ marginTop: '2rem', borderLeft: '4px solid #ffc107' }}>
          <h3>Pending Approvals</h3>
          <div className="row">
            {pendingInstitutions > 0 && (
              <div className="col-6">
                <div className="alert alert-warning">
                  <strong>{pendingInstitutions} Institutions</strong> waiting for approval
                  <br />
                  <Link to="/admin/institutions" className="btn btn-warning btn-sm" style={{ marginTop: '0.5rem' }}>
                    Review Institutions
                  </Link>
                </div>
              </div>
            )}
            {pendingCompanies > 0 && (
              <div className="col-6">
                <div className="alert alert-warning">
                  <strong>{pendingCompanies} Companies</strong> waiting for approval
                  <br />
                  <Link to="/admin/companies" className="btn btn-warning btn-sm" style={{ marginTop: '0.5rem' }}>
                    Review Companies
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Quick Actions</h2>
        <div className="row">
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>Manage Institutions</h4>
              <p>Approve and manage institutions</p>
              <Link to="/admin/institutions" className="btn btn-primary">
                Manage
              </Link>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>Manage Companies</h4>
              <p>Approve and manage companies</p>
              <Link to="/admin/companies" className="btn btn-primary">
                Manage
              </Link>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>User Management</h4>
              <p>View and manage all users</p>
              <Link to="/admin/users" className="btn btn-primary">
                Manage
              </Link>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>Reports</h4>
              <p>View system reports and analytics</p>
              <Link to="/admin/reports" className="btn btn-primary">
                View Reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Recent User Registrations</h2>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Institution/Company</th>
                <th>Registered</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(user => (
                <tr key={user.id}>
                  <td>{(user.firstName || '') + ' ' + (user.lastName || '')}</td>
                  <td>{user.email || 'No email'}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: getRoleColor(user.role),
                      color: 'white',
                      fontSize: '0.875rem'
                    }}>
                      {(user.role || 'user').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {user.role === 'institution' && user.institutionName}
                    {user.role === 'company' && user.companyName}
                    {user.role === 'student' && user.highSchool}
                    {(user.role === 'admin' || (!user.institutionName && !user.companyName && !user.highSchool)) && 
                      'N/A'}
                  </td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: user.approved !== false ? '#28a745' : '#ffc107',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}>
                      {user.approved !== false ? 'ACTIVE' : 'PENDING'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/admin/users" className="btn btn-secondary">
            View All Users
          </Link>
        </div>
      </div>

      {/* System Health */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>System Health</h2>
        <div className="row">
          <div className="col-4">
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: '#28a745',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                99.2%
              </div>
              <p style={{ marginTop: '1rem' }}>Uptime</p>
            </div>
          </div>
          <div className="col-4">
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: '#17a2b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                2.1s
              </div>
              <p style={{ marginTop: '1rem' }}>Avg. Response Time</p>
            </div>
          </div>
          <div className="col-4">
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: '#ffc107',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                0
              </div>
              <p style={{ marginTop: '1rem' }}>Active Issues</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return '#dc3545';
    case 'institution': return '#17a2b8';
    case 'company': return '#28a745';
    case 'student': return '#6c757d';
    default: return '#6c757d';
  }
};

export default AdminDashboard;