import React, { useState, useEffect } from 'react';
import { getInstitutionApplications, updateInstitutionApplicationStatus } from '../../services/api';
import ApplicationCard from '../Common/ApplicationCard';
import Loading from '../Common/Loading';

const InstitutionApplications = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    courseId: '',
    status: ''
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, filters]);

  const fetchApplications = async () => {
    try {
      const response = await getInstitutionApplications();
      setApplications(response.data.applications);
    } catch (error) {
      setError('Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (filters.courseId) {
      filtered = filtered.filter(app => app.courseId === filters.courseId);
    }

    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    setFilteredApplications(filtered);
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    setUpdating(applicationId);
    setMessage('');
    setError('');

    try {
      await updateInstitutionApplicationStatus(applicationId, { status: newStatus });
      setMessage('Application status updated successfully');
      
      // Refresh applications
      fetchApplications();
    } catch (error) {
      setError(error.response?.data?.error || 'Error updating application status');
    } finally {
      setUpdating(null);
    }
  };

  const getUniqueCourses = () => {
    const courses = applications.map(app => app.course);
    return [...new Map(courses.map(course => [course.id, course])).values()];
  };

  if (loading) return <Loading message="Loading applications..." />;

  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const admittedCount = applications.filter(app => app.status === 'admitted').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Student Applications</h2>
          <p>Review and manage student applications for your courses</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Statistics */}
        <div className="row" style={{ marginBottom: '2rem' }}>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{applications.length}</h3>
              <p>Total Applications</p>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{pendingCount}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{admittedCount}</h3>
              <p>Admitted</p>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{rejectedCount}</h3>
              <p>Rejected</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Filters</h3>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Filter by Course</label>
                <select
                  className="form-select"
                  value={filters.courseId}
                  onChange={(e) => setFilters(prev => ({ ...prev, courseId: e.target.value }))}
                >
                  <option value="">All Courses</option>
                  {getUniqueCourses().map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Filter by Status</label>
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="admitted">Admitted</option>
                  <option value="rejected">Rejected</option>
                  <option value="waitlisted">Waitlisted</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <h3>
          Applications ({filteredApplications.length})
          {filters.courseId || filters.status ? ' (Filtered)' : ''}
        </h3>

        {filteredApplications.length === 0 ? (
          <div className="alert alert-info">
            No applications found matching your filters.
          </div>
        ) : (
          <div className="row">
            {filteredApplications.map(application => (
              <div key={application.id} className="col-6">
                <ApplicationCard
                  application={application}
                  onStatusUpdate={handleStatusUpdate}
                  showActions={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionApplications;