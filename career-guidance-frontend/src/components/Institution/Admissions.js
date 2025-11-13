import React, { useState, useEffect } from 'react';
import { getInstitutionApplications, publishAdmissions, getInstitutionCourses } from '../../services/api';
import Loading from '../Common/Loading';

const InstitutionAdmissions = () => {
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch both applications and courses in parallel
      const [applicationsResponse, coursesResponse] = await Promise.all([
        getInstitutionApplications(),
        getInstitutionCourses()
      ]);
      
      setApplications(applicationsResponse.data.applications || []);
      setCourses(coursesResponse.data.courses || []);
    } catch (error) {
      setError('Error loading data');
      console.error('Error fetching data:', error);
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
      // Refresh applications to get updated published status
      const applicationsResponse = await getInstitutionApplications();
      setApplications(applicationsResponse.data.applications || []);
    } catch (error) {
      setError(error.response?.data?.error || 'Error publishing admissions');
    } finally {
      setPublishing(false);
    }
  };

  const getCourseApplications = (courseId) => {
    return applications.filter(app => app.courseId === courseId);
  };

  const getCourseStats = (courseId) => {
    const courseApplications = getCourseApplications(courseId);
    return {
      total: courseApplications.length,
      admitted: courseApplications.filter(app => app.status === 'admitted').length,
      pending: courseApplications.filter(app => app.status === 'pending').length,
      rejected: courseApplications.filter(app => app.status === 'rejected').length,
      published: courseApplications.some(app => app.admissionPublished)
    };
  };

  // Get courses that have applications
  const getCoursesWithApplications = () => {
    return courses.filter(course => {
      const courseApps = getCourseApplications(course.id);
      return courseApps.length > 0;
    });
  };

  if (loading) return <Loading message="Loading admissions data..." />;

  const coursesWithApplications = getCoursesWithApplications();

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
                  {coursesWithApplications.map(course => {
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
                const selectedCourseData = courses.find(course => course.id === selectedCourse);
                return (
                  <div>
                    <p><strong>Course:</strong> {selectedCourseData?.name}</p>
                    <ul>
                      <li>Total Applications: {stats.total}</li>
                      <li>Admitted Students: {stats.admitted}</li>
                      <li>Pending Decisions: {stats.pending}</li>
                      <li>Rejected Students: {stats.rejected}</li>
                      <li>Status: {stats.published ? 
                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>Published</span> : 
                        <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Not Published</span>
                      }</li>
                    </ul>
                    {stats.admitted === 0 && (
                      <div style={{ 
                        padding: '0.5rem',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        marginTop: '0.5rem'
                      }}>
                        <strong>Note:</strong> No students have been admitted to this course yet.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Courses Overview */}
        <h3>Courses Overview</h3>
        {coursesWithApplications.length === 0 ? (
          <div className="alert alert-info">
            No courses with applications found.
          </div>
        ) : (
          <div className="row">
            {coursesWithApplications.map(course => {
              const stats = getCourseStats(course.id);
              return (
                <div key={course.id} className="col-6">
                  <div className="card">
                    <h4>{course.name}</h4>
                    <p><strong>Faculty:</strong> {course.faculty}</p>
                    <p><strong>Department:</strong> {course.department}</p>
                    
                    <div style={{ marginTop: '1rem' }}>
                      <strong>Application Statistics:</strong>
                      <ul>
                        <li>Total Applications: {stats.total}</li>
                        <li>Admitted: <span style={{ color: '#28a745' }}>{stats.admitted}</span></li>
                        <li>Pending: <span style={{ color: '#ffc107' }}>{stats.pending}</span></li>
                        <li>Rejected: <span style={{ color: '#dc3545' }}>{stats.rejected}</span></li>
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

                    {stats.published ? (
                      <div style={{ 
                        marginTop: '1rem', 
                        padding: '0.5rem',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px'
                      }}>
                        <strong>Published:</strong> Students can view and accept admission offers for this course.
                      </div>
                    ) : (
                      <div style={{ 
                        marginTop: '1rem', 
                        padding: '0.5rem',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px'
                      }}>
                        <strong>Not Published:</strong> Admission results are not visible to students yet.
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
            <li>You can only publish admissions for courses that have applications</li>
            <li>Make sure all admission decisions are finalized before publishing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InstitutionAdmissions;