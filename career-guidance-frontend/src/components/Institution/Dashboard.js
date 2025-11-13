import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInstitutionProfile, getInstitutionCourses, getInstitutionApplications, getInstitutionFaculties } from '../../services/api';
import Loading from '../Common/Loading';

const InstitutionDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // FIXED: Use Promise.allSettled to handle individual API failures gracefully
      const [profileResponse, coursesResponse, applicationsResponse] = await Promise.allSettled([
        getInstitutionProfile(),
        getInstitutionCourses(),
        getInstitutionApplications()
      ]);

      // Handle profile response
      if (profileResponse.status === 'fulfilled') {
        setProfile(profileResponse.value.data.institution);
      } else {
        console.error('Profile fetch failed:', profileResponse.reason);
        setError('Failed to load profile data');
      }

      // Handle courses response
      if (coursesResponse.status === 'fulfilled') {
        setCourses(coursesResponse.value.data.courses || []);
      } else {
        console.error('Courses fetch failed:', coursesResponse.reason);
        setCourses([]);
      }

      // Handle applications response
      if (applicationsResponse.status === 'fulfilled') {
        setApplications(applicationsResponse.value.data.applications || []);
      } else {
        console.error('Applications fetch failed:', applicationsResponse.reason);
        setApplications([]);
      }

      // Try to fetch faculties, but don't fail if endpoint doesn't exist yet
      try {
        const facultiesResponse = await getInstitutionFaculties();
        setFaculties(facultiesResponse.data.faculties || []);
      } catch (facultyError) {
        console.log('Faculties endpoint not available yet, using empty array');
        setFaculties([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error loading dashboard data. Some features may not be available.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading dashboard..." />;

  const pendingApplications = applications.filter(app => app.status === 'pending').length;
  const admittedApplications = applications.filter(app => app.status === 'admitted').length;

  return (
    <div className="container">
      {/* Welcome Section */}
      <div className="card">
        <h1>Welcome, {profile?.institutionName}</h1>
        <p>Institution Management Dashboard</p>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {!profile?.approved && (
          <div className="alert alert-info">
            Your institution account is pending approval. Some features may be limited.
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="row" style={{ marginTop: '2rem' }}>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>{faculties.length}</h3>
            <p>Total Faculties</p>
          </div>
        </div>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>{courses.length}</h3>
            <p>Total Courses</p>
          </div>
        </div>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>{applications.length}</h3>
            <p>Total Applications</p>
          </div>
        </div>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <h3>{pendingApplications}</h3>
            <p>Pending Applications</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Quick Actions</h2>
        <div className="row">
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>Manage Faculties</h4>
              <p>Add and manage your institution's faculties</p>
              <Link to="/institution/faculties" className="btn btn-primary">
                Manage
              </Link>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>Manage Courses</h4>
              <p>Add and manage your institution's courses</p>
              <Link to="/institution/courses" className="btn btn-primary">
                Manage
              </Link>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>View Applications</h4>
              <p>Review and process student applications</p>
              <Link to="/institution/applications" className="btn btn-primary">
                View
              </Link>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>Admissions</h4>
              <p>Manage student admissions and waitlists</p>
              <Link to="/institution/admissions" className="btn btn-primary">
                Manage
              </Link>
            </div>
          </div>
        </div>
        <div className="row" style={{ marginTop: '1rem' }}>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>Prospectus</h4>
              <p>Upload and manage prospectus documents</p>
              <Link to="/institution/prospectus" className="btn btn-primary">
                Manage
              </Link>
            </div>
          </div>
          <div className="col-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <h4>Profile</h4>
              <p>Update your institution's information</p>
              <Link to="/institution/profile" className="btn btn-primary">
                Update
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      {applications.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2>Recent Applications</h2>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 5).map(application => (
                  <tr key={application.id}>
                    <td>
                      {application.student?.firstName} {application.student?.lastName}
                    </td>
                    <td>{application.course?.name}</td>
                    <td>{new Date(application.appliedAt).toLocaleDateString()}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(application.status),
                        color: 'white',
                        fontSize: '0.875rem'
                      }}>
                        {application.status.toUpperCase()}
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

const getStatusColor = (status) => {
  switch (status) {
    case 'admitted': return '#28a745';
    case 'rejected': return '#dc3545';
    case 'pending': return '#ffc107';
    case 'waitlisted': return '#17a2b8';
    default: return '#6c757d';
  }
};

export default InstitutionDashboard;