import React, { useState, useEffect } from 'react';
import { getInstitutionApplications } from '../../services/api';
import Loading from '../Common/Loading';

const Waitlist = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await getInstitutionApplications();
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWaitlistedStudents = () => {
    let waitlisted = applications.filter(app => app.status === 'waitlisted');
    
    if (selectedCourse) {
      waitlisted = waitlisted.filter(app => app.courseId === selectedCourse);
    }

    // Sort by application date (oldest first)
    return waitlisted.sort((a, b) => new Date(a.appliedAt) - new Date(b.appliedAt));
  };

  const getUniqueCourses = () => {
    const courses = applications.map(app => app.course);
    return [...new Map(courses.map(course => [course.id, course])).values()];
  };

  const promoteStudent = async (applicationId) => {
    // This would call an API to promote the student
    // For now, we'll just show a message
    alert('This would promote the student from waitlist to admitted. Implementation would connect to backend API.');
  };

  if (loading) return <Loading message="Loading waitlist..." />;

  const waitlistedStudents = getWaitlistedStudents();
  const courses = getUniqueCourses();

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Waitlist Management</h2>
          <p>Manage waitlisted students and promote them when spots become available</p>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Filter Waitlist</h3>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Filter by Course</label>
                <select
                  className="form-select"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">&nbsp;</label>
                <div>
                  <p>
                    <strong>Total Waitlisted:</strong> {waitlistedStudents.length} students
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Waitlist */}
        <h3>
          Waitlisted Students ({waitlistedStudents.length})
          {selectedCourse ? ' (Filtered)' : ''}
        </h3>

        {waitlistedStudents.length === 0 ? (
          <div className="alert alert-info">
            No waitlisted students found.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Student Name</th>
                  <th>Course</th>
                  <th>Applied Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {waitlistedStudents.map((application, index) => (
                  <tr key={application.id}>
                    <td>{index + 1}</td>
                    <td>
                      {application.student?.firstName} {application.student?.lastName}
                    </td>
                    <td>{application.course?.name}</td>
                    <td>{new Date(application.appliedAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => promoteStudent(application.id)}
                      >
                        Promote to Admitted
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Automatic Promotion Info */}
        <div className="card" style={{ marginTop: '2rem', borderLeft: '4px solid #17a2b8' }}>
          <h4>Automatic Waitlist Promotion</h4>
          <p>
            The system automatically promotes waitlisted students when:
          </p>
          <ul>
            <li>A student declines an admission offer</li>
            <li>A student accepts an offer from another institution</li>
            <li>An admitted student's application is withdrawn</li>
          </ul>
          <p>
            <strong>Note:</strong> Students are promoted in the order they applied (first-come, first-served).
          </p>
        </div>
      </div>
    </div>
  );
};

export default Waitlist;