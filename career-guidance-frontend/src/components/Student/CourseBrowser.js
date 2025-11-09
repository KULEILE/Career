import React, { useState, useEffect } from 'react';
import { getAllCourses, createApplication, getStudentApplications } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';

const CourseBrowser = () => {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesResponse, applicationsResponse] = await Promise.all([
        getAllCourses(),
        getStudentApplications()
      ]);
      
      setCourses(coursesResponse.data.courses);
      setApplications(applicationsResponse.data.applications || []);
    } catch (error) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const getApplicationsCountForInstitution = (institutionId) => {
    return applications.filter(app => 
      app.institutionId === institutionId && 
      ['pending', 'admitted', 'waitlisted'].includes(app.status)
    ).length;
  };

  const hasAppliedToCourse = (courseId) => {
    return applications.some(app => 
      app.courseId === courseId && 
      ['pending', 'admitted', 'waitlisted'].includes(app.status)
    );
  };

  const handleApply = async (course) => {
    if (!userProfile.subjects || userProfile.subjects.length === 0) {
      setError('Please complete your profile with subjects and grades before applying');
      return;
    }

    const applicationsCount = getApplicationsCountForInstitution(course.institutionId);
    if (applicationsCount >= 2) {
      setError(`You can only apply to maximum 2 courses per institution. You already have ${applicationsCount} applications at this institution.`);
      return;
    }

    if (hasAppliedToCourse(course.id)) {
      setError('You have already applied to this course');
      return;
    }

    setApplying(course.id);
    setMessage('');
    setError('');

    try {
      const applicationData = {
        courseId: course.id,
        institutionId: course.institutionId,
        subjects: userProfile.subjects
      };

      await createApplication(applicationData);
      setMessage(`Successfully applied for ${course.name}`);
      
      // Refresh data to update application status
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Error applying for course');
    } finally {
      setApplying(null);
    }
  };

  const checkEligibility = (course) => {
    if (!userProfile.subjects || !course?.requirements) return false;

    const studentSubjects = userProfile.subjects.reduce((acc, subject) => {
      acc[subject.name] = subject.grade;
      return acc;
    }, {});

    const gradePoints = {
      'A*':100,'A': 90, 'B': 80, 'C': 70, 'D': 60, 'E': 50, 'F': 0
    };

    for (const requiredSubject of course.requirements.subjects) {
      const studentGrade = studentSubjects[requiredSubject];
      const minGrade = course.requirements.minGrades[requiredSubject];
      
      if (!studentGrade || gradePoints[studentGrade] < gradePoints[minGrade]) {
        return false;
      }
    }

    return true;
  };

  if (loading) return <Loading message="Loading courses..." />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Browse Courses</h2>
          <p>Discover and apply to courses from various institutions (maximum 2 per institution)</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {!userProfile.subjects || userProfile.subjects.length === 0 ? (
          <div className="alert alert-warning">
            <strong>Profile Incomplete:</strong> Please add your high school subjects and grades to your profile before applying.
            <br />
            <a href="/student/profile" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Complete Profile
            </a>
          </div>
        ) : null}

        <div className="row">
          {courses.map(course => {
            const isEligible = checkEligibility(course);
            const applicationsCount = getApplicationsCountForInstitution(course.institutionId);
            const hasApplied = hasAppliedToCourse(course.id);
            const canApply = applicationsCount < 2 && !hasApplied && isEligible;

            return (
              <div key={course.id} className="col-6">
                <div className="card">
                  <h4>{course.name}</h4>
                  <p><strong>Institution:</strong> {course.institution?.institutionName}</p>
                  <p><strong>Duration:</strong> {course.duration}</p>
                  <p><strong>Faculty:</strong> {course.faculty}</p>
                  
                  {course.tuitionFee && (
                    <p><strong>Tuition Fee:</strong> {course.tuitionFee}</p>
                  )}

                  <p style={{ color: '#666666', fontSize: '0.9rem' }}>
                    {course.description?.substring(0, 150)}...
                  </p>
                  
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Requirements:</strong>
                    <ul>
                      {course.requirements?.subjects?.map((subject, idx) => (
                        <li key={idx}>
                          {subject}: Minimum {course.requirements.minGrades[subject]}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ 
                    padding: '0.75rem',
                    borderRadius: '4px',
                    backgroundColor: isEligible ? '#d4edda' : '#f8d7da',
                    border: `1px solid ${isEligible ? '#c3e6cb' : '#f5c6cb'}`,
                    marginTop: '1rem'
                  }}>
                    <strong>
                      {isEligible ? '✓ You meet the requirements' : '✗ You do not meet the requirements'}
                    </strong>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    {hasApplied ? (
                      <button className="btn btn-secondary" disabled>
                        Already Applied
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary"
                        disabled={applying === course.id || !canApply}
                        onClick={() => handleApply(course)}
                      >
                        {applying === course.id ? 'Applying...' : 'Apply Now'}
                      </button>
                    )}
                    
                    <div style={{ fontSize: '0.8rem', color: '#666666', marginTop: '0.5rem' }}>
                      {applicationsCount}/2 applications at this institution
                      {!canApply && !hasApplied && (
                        <div>
                          {applicationsCount >= 2 && ' - Maximum applications reached'}
                          {!isEligible && ' - Requirements not met'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {courses.length === 0 && (
          <div className="alert alert-info">
            No courses available at the moment. Please check back later.
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseBrowser;