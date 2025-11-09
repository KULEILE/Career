import React, { useState, useEffect } from 'react';
import { getUsers } from '../../services/api';
import Loading from '../Common/Loading';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filterRole && user.role !== filterRole) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.institutionName?.toLowerCase().includes(searchLower) ||
        user.companyName?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'institution': return '#17a2b8';
      case 'company': return '#28a745';
      case 'student': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getRoleCount = (role) => {
    return users.filter(user => user.role === role).length;
  };

  if (loading) return <Loading message="Loading users..." />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">User Management</h2>
          <p>Manage all users in the system</p>
        </div>

        {/* Statistics */}
        <div className="row" style={{ marginBottom: '2rem' }}>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{users.length}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{getRoleCount('student')}</h3>
              <p>Students</p>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{getRoleCount('institution')}</h3>
              <p>Institutions</p>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{getRoleCount('company')}</h3>
              <p>Companies</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Filters</h3>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Search Users</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, institution, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Filter by Role</label>
                <select
                  className="form-select"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="student">Students</option>
                  <option value="institution">Institutions</option>
                  <option value="company">Companies</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <h3>
          Users ({filteredUsers.length})
          {(filterRole || searchTerm) && ' (Filtered)'}
        </h3>

        {filteredUsers.length === 0 ? (
          <div className="alert alert-info">
            No users found matching your filters.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Institution/Company</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.firstName} {user.lastName}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                        ID: {user.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: getRoleColor(user.role),
                        color: 'white',
                        fontSize: '0.875rem'
                      }}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {user.role === 'institution' && user.institutionName && (
                        <strong>{user.institutionName}</strong>
                      )}
                      {user.role === 'company' && user.companyName && (
                        <strong>{user.companyName}</strong>
                      )}
                      {user.role === 'student' && user.highSchool && (
                        <div style={{ fontSize: '0.8rem' }}>
                          {user.highSchool}
                        </div>
                      )}
                      {!user.institutionName && !user.companyName && !user.highSchool && (
                        <span style={{ color: '#666666', fontStyle: 'italic' }}>
                          Not specified
                        </span>
                      )}
                    </td>
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
                    <td>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-info btn-sm">
                          View
                        </button>
                        <button className="btn btn-warning btn-sm">
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* User Statistics by Role */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>User Statistics</h3>
          <div className="row">
            <div className="col-3">
              <div style={{ textAlign: 'center' }}>
                <h4>{getRoleCount('student')}</h4>
                <p>Students</p>
                <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                  {((getRoleCount('student') / users.length) * 100).toFixed(1)}% of total
                </div>
              </div>
            </div>
            <div className="col-3">
              <div style={{ textAlign: 'center' }}>
                <h4>{getRoleCount('institution')}</h4>
                <p>Institutions</p>
                <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                  {((getRoleCount('institution') / users.length) * 100).toFixed(1)}% of total
                </div>
              </div>
            </div>
            <div className="col-3">
              <div style={{ textAlign: 'center' }}>
                <h4>{getRoleCount('company')}</h4>
                <p>Companies</p>
                <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                  {((getRoleCount('company') / users.length) * 100).toFixed(1)}% of total
                </div>
              </div>
            </div>
            <div className="col-3">
              <div style={{ textAlign: 'center' }}>
                <h4>{getRoleCount('admin')}</h4>
                <p>Admins</p>
                <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                  {((getRoleCount('admin') / users.length) * 100).toFixed(1)}% of total
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;