import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import Loading from '../Common/Loading';

const StudentDashboard = () => {
  const { userProfile, currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;

      try {
        // Fetch applications
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('studentId', '==', currentUser.uid),
          orderBy('appliedAt', 'desc')
        );
        const applicationsSnapshot = await getDocs(applicationsQuery);
        
        // Fetch course and institution details for each application
        const applications = await Promise.all(
          applicationsSnapshot.docs.map(async (docSnapshot) => {
            const application = docSnapshot.data();
            
            let courseName = application.courseName;
            let institutionName = application.institutionName;
            
            // If course name is not stored in application, fetch from courses collection
            if (!courseName && application.courseId) {
              try {
                const courseDoc = await getDoc(doc(db, 'courses', application.courseId));
                if (courseDoc.exists()) {
                  courseName = courseDoc.data().name;
                }
              } catch (error) {
                console.error('Error fetching course:', error);
              }
            }
            
            // If institution name is not stored in application, fetch from institutions collection
            if (!institutionName && application.institutionId) {
              try {
                const institutionDoc = await getDoc(doc(db, 'institutions', application.institutionId));
                if (institutionDoc.exists()) {
                  institutionName = institutionDoc.data().institutionName;
                }
              } catch (error) {
                console.error('Error fetching institution:', error);
              }
            }
            
            return {
              id: docSnapshot.id,
              ...application,
              courseName: courseName || 'Unknown Course',
              institutionName: institutionName || 'Unknown Institution'
            };
          })
        );

        // FIXED: Simplified jobs query to avoid index issues
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('deadline', '>=', new Date()),
          orderBy('deadline', 'asc')
        );
        const jobsSnapshot = await getDocs(jobsQuery);
        
        // Filter active jobs manually
        const activeJobs = jobsSnapshot.docs.filter(doc => doc.data().active === true);
        const jobs = activeJobs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch notifications
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', currentUser.uid),
          where('read', '==', false),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const notificationsData = notificationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notificationsData);

        // Calculate stats with safe array access
        const totalApplications = applications.length;
        const pendingApplications = applications.filter(app => app.status === 'pending').length;
        const admittedApplications = applications.filter(app => app.status === 'admitted').length;
        const availableJobs = jobs.length;

        // Check application limits per institution
        const applicationsPerInstitution = {};
        applications.forEach(app => {
          if (app.institutionId) {
            applicationsPerInstitution[app.institutionId] = (applicationsPerInstitution[app.institutionId] || 0) + 1;
          }
        });

        const maxApplicationsReached = Object.values(applicationsPerInstitution).some(count => count >= 2);

        setDashboardData({
          student: userProfile || {},
          stats: {
            totalApplications,
            pendingApplications,
            admittedApplications,
            availableJobs
          },
          recentApplications: applications.slice(0, 3),
          maxApplicationsReached,
          quickActions: [
            {
              title: 'Apply for Courses',
              description: 'Browse and apply to available courses',
              link: '/student/courses',
              enabled: !maxApplicationsReached
            },
            {
              title: 'View Applications',
              description: 'Track your course applications',
              link: '/student/applications',
              enabled: totalApplications > 0
            },
            {
              title: 'View Admissions',
              description: 'Check your admission status',
              link: '/student/admissions',
              enabled: admittedApplications > 0
            },
            {
              title: 'Upload Documents',
              description: 'Upload transcripts and certificates',
              link: '/student/documents',
              enabled: true
            },
            {
              title: 'Browse Jobs',
              description: 'Find job opportunities',
              link: '/student/jobs',
              enabled: userProfile?.hasTranscript
            },
            {
              title: 'Update Profile',
              description: 'Keep your information current',
              link: '/student/profile',
              enabled: true
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set fallback data
        setDashboardData({
          student: userProfile || {},
          stats: {
            totalApplications: 0,
            pendingApplications: 0,
            admittedApplications: 0,
            availableJobs: 0
          },
          recentApplications: [],
          maxApplicationsReached: false,
          quickActions: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser, userProfile]);

  if (loading) {
    return <Loading message="Loading your dashboard..." />;
  }

  if (!dashboardData) {
    return (
      <div className="container">
        <div className="alert alert-error">Error loading dashboard data</div>
      </div>
    );
  }

  const { student, stats, recentApplications, maxApplicationsReached, quickActions } = dashboardData;

  return (
    <div className="container">
      {/* Welcome Section */}
      <div className="card">
        <h1 style={{ marginBottom: '0.5rem' }}>Welcome back, {student?.firstName || 'Student'}!</h1>
        <p style={{ color: '#666666', marginBottom: '0' }}>
          Here's your career guidance dashboard
        </p>
        
        {(!student?.subjects || student.subjects.length === 0) ? (
          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            <strong>Complete Your Profile:</strong> Add your high school subjects and grades to get better course recommendations.
            <br />
            <Link to="/student/profile" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Complete Profile
            </Link>
          </div>
        ) : null}

        {!student?.hasTranscript && (
          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            <strong>Upload Transcript:</strong> Upload your academic transcript to apply for jobs and get career opportunities.
            <br />
            <Link to="/student/documents" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Upload Transcript
            </Link>
          </div>
        )}

        {maxApplicationsReached && (
          <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
            <strong>Application Limit:</strong> You've reached the maximum of 2 applications per institution for some institutions.
          </div>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            <strong>New Notifications ({notifications.length}):</strong>
            <ul style={{ marginBottom: '0', marginTop: '0.5rem' }}>
              {notifications.slice(0, 3).map(notification => (
                <li key={notification.id}>{notification.message}</li>
              ))}
            </ul>
            {notifications.length > 3 && (
              <Link to="/student/notifications" style={{ fontSize: '0.9rem' }}>
                View all notifications
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="row" style={{ marginTop: '2rem' }}>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <h3 style={{ margin: '0', color: '#000000' }}>{stats.totalApplications}</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666666' }}>Total Applications</p>
          </div>
        </div>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <h3 style={{ margin: '0', color: '#000000' }}>{stats.pendingApplications}</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666666' }}>Pending Applications</p>
          </div>
        </div>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <h3 style={{ margin: '0', color: '#000000' }}>{stats.admittedApplications}</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666666' }}>Admission Offers</p>
          </div>
        </div>
        <div className="col-3">
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <h3 style={{ margin: '0', color: '#000000' }}>{stats.availableJobs}</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666666' }}>Available Jobs</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Quick Actions</h2>
        <div className="row">
          {(quickActions || []).map((action, index) => (
            <div key={index} className="col-4">
              <div 
                className="card" 
                style={{ 
                  textAlign: 'center', 
                  padding: '1.5rem',
                  opacity: action.enabled ? 1 : 0.6,
                  height: '100%'
                }}
              >
                <h4 style={{ marginBottom: '0.5rem', color: '#000000' }}>{action.title}</h4>
                <p style={{ fontSize: '0.9rem', color: '#666666', marginBottom: '1rem' }}>
                  {action.description}
                </p>
                {action.enabled ? (
                  <Link 
                    to={action.link} 
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Go
                  </Link>
                ) : (
                  <button 
                    className="btn btn-secondary" 
                    disabled
                    style={{ width: '100%' }}
                  >
                    Unavailable
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Applications */}
      {recentApplications && recentApplications.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Recent Applications</h2>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th style={{ borderColor: '#cccccc' }}>Course</th>
                  <th style={{ borderColor: '#cccccc' }}>Institution</th>
                  <th style={{ borderColor: '#cccccc' }}>Applied Date</th>
                  <th style={{ borderColor: '#cccccc' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map(application => (
                  <tr key={application.id}>
                    <td style={{ borderColor: '#cccccc' }}>
                      <strong>{application.courseName || 'Unknown Course'}</strong>
                    </td>
                    <td style={{ borderColor: '#cccccc' }}>{application.institutionName || 'Unknown Institution'}</td>
                    <td style={{ borderColor: '#cccccc' }}>
                      {application.appliedAt?.toDate?.().toLocaleDateString() || 'N/A'}
                    </td>
                    <td style={{ borderColor: '#cccccc' }}>
                      <span 
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: getStatusColor(application.status),
                          color: '#ffffff',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {application.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/student/applications" className="btn btn-secondary">
              View All Applications
            </Link>
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

export default StudentDashboard;