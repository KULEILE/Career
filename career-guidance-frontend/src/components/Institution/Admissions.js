import React, { useState, useEffect } from 'react';
import { getInstitutionApplications, publishAdmissions } from '../../services/api';
import Loading from '../Common/Loading';

const InstitutionAdmissions = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

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

  const handlePublishAdmissions = async () => {
    if (!selectedCourse) {
      setError('Please select a course to publish admissions for');
      return;
    }

    if (!window.confirm(
      'Are you sure you want to publish admissions for this course? ' +
      'This will make admission results visible to students.'
    )) {
      return;
    }

    setPublishing(true);
    setMessage('');
    setError('');

    try {
      await publishAdmissions({ courseId: selectedCourse });
      setMessage('Admissions published successfully! Students can now view their admission results.');
      fetchApplications();
    } catch (error) {
      setError(error.response?.data?.error || 'Error publishing admissions');
    } finally {
      setPublishing(false);
    }
  };

  const getUniqueCourses = () => {
    const courses = applications.map(app => app.course);
    return [...new Map(courses.map(course => [course.id, course])).values()];
  };

  const getCourseStats = (courseId) => {
    const courseApplications = applications.filter(app => app.courseId === courseId);
    return {
      total: courseApplications.length,
      admitted: courseApplications.filter(app => app.status === 'admitted').length,
      pending: courseApplications.filter(app => app.status === 'pending').length,
      published: courseApplications.some(app => app.admissionPublished)
    };
  };

  if (loading) return <Loading message="Loading admissions data..." />;

  const courses = getUniqueCourses();

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Admissions Management</h2>
          <p>Publish admission results and manage waitlists</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Publish Admissions Section */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Publish Admission Results</h3>
          <p>
            Once you've reviewed and admitted students, publish the results to make them visible to students.
            Students will be able to see and accept their admission offers.
          </p>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Select Course</label>
                <select
                  className="form-select"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">Choose a course</option>
                  {courses.map(course => {
                    const stats = getCourseStats(course.id);
                    return (
                      <option key={course.id} value={course.id}>
                        {course.name} ({stats.admitted} admitted, {stats.pending} pending)
                        {stats.published ? ' - Published' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">&nbsp;</label>
                <div>
                  <button
                    className="btn btn-success"
                    disabled={publishing || !selectedCourse}
                    onClick={handlePublishAdmissions}
                  >
                    {publishing ? 'Publishing...' : 'Publish Admissions'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {selectedCourse && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Course Summary:</strong>
              {(() => {
                const stats = getCourseStats(selectedCourse);
                return (
                  <ul>
                    <li>Total Applications: {stats.total}</li>
                    <li>Admitted Students: {stats.admitted}</li>
                    <li>Pending Decisions: {stats.pending}</li>
                    <li>Status: {stats.published ? 'Published' : 'Not Published'}</li>
                  </ul>
                );
              })()}
            </div>
          )}
        </div>

        {/* Courses Overview */}
        <h3>Courses Overview</h3>
        {courses.length === 0 ? (
          <div className="alert alert-info">
            No courses with applications found.
          </div>
        ) : (
          <div className="row">
            {courses.map(course => {
              const stats = getCourseStats(course.id);
              return (
                <div key={course.id} className="col-6">
                  <div className="card">
                    <h4>{course.name}</h4>
                    <p><strong>Faculty:</strong> {course.faculty}</p>
                    
                    <div style={{ marginTop: '1rem' }}>
                      <strong>Application Statistics:</strong>
                      <ul>
                        <li>Total Applications: {stats.total}</li>
                        <li>Admitted: <span style={{ color: '#28a745' }}>{stats.admitted}</span></li>
                        <li>Pending: <span style={{ color: '#ffc107' }}>{stats.pending}</span></li>
                        <li>Rejected: <span style={{ color: '#dc3545' }}>{stats.total - stats.admitted - stats.pending}</span></li>
                      </ul>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <strong>Admission Status:</strong>
                      <span
                        style={{
                          marginLeft: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: stats.published ? '#28a745' : '#6c757d',
                          color: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        {stats.published ? 'PUBLISHED' : 'NOT PUBLISHED'}
                      </span>
                    </div>

                    {stats.published && (
                      <div style={{ 
                        marginTop: '1rem', 
                        padding: '0.5rem',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px'
                      }}>
                        Students can view and accept admission offers for this course.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Important Notes */}
        <div className="card" style={{ marginTop: '2rem', borderLeft: '4px solid #17a2b8' }}>
          <h4>Important Notes</h4>
          <ul>
            <li>Only admitted students will see their admission offers when results are published</li>
            <li>Students can only accept one admission offer across all institutions</li>
            <li>When a student accepts an offer, they are automatically removed from other institutions' admission lists</li>
            <li>Waitlisted students will be automatically promoted when spots become available</li>
            <li>Once published, admission results cannot be unpublished (contact admin for changes)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InstitutionAdmissions;