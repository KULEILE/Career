import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, createApplication } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';

const Application = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await getCourse(courseId);
      setCourse(response.data.course);
    } catch (error) {
      setError('Error loading course details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!userProfile.subjects || userProfile.subjects.length === 0) {
      setError('Please complete your profile with subjects and grades before applying');
      return;
    }

    setApplying(true);
    setError('');

    try {
      const applicationData = {
        courseId: course.id,
        institutionId: course.institutionId,
        subjects: userProfile.subjects
      };

      await createApplication(applicationData);
      navigate('/student/applications', { 
        state: { message: `Successfully applied for ${course.name}` }
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Error applying for course');
    } finally {
      setApplying(false);
    }
  };

  const checkEligibility = () => {
    if (!userProfile.subjects || !course?.requirements) return false;

    const studentSubjects = userProfile.subjects.reduce((acc, subject) => {
      acc[subject.name] = subject.grade;
      return acc;
    }, {});

    const gradePoints = {
      'A': 90, 'B': 80, 'C': 70, 'D': 60, 'E': 50, 'F': 0
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

  if (loading) return <Loading message="Loading course details..." />;
  if (!course) return <div className="alert alert-error">Course not found</div>;

  const isEligible = checkEligibility();

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Course Application</h2>
          <p>Apply for {course.name}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Course Details */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>{course.name}</h3>
          <p><strong>Institution:</strong> {course.institution?.institutionName}</p>
          <p><strong>Duration:</strong> {course.duration}</p>
          <p><strong>Faculty:</strong> {course.faculty}</p>
          
          {course.tuitionFee && (
            <p><strong>Tuition Fee:</strong> {course.tuitionFee}</p>
          )}

          <div style={{ marginTop: '1rem' }}>
            <strong>Description:</strong>
            <p style={{ color: '#666666' }}>{course.description}</p>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <strong>Entry Requirements:</strong>
            <ul>
              {course.requirements?.subjects?.map((subject, idx) => (
                <li key={idx}>
                  {subject}: Minimum grade {course.requirements.minGrades[subject]}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Eligibility Check */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Eligibility Check</h3>
          
          {!userProfile.subjects || userProfile.subjects.length === 0 ? (
            <div className="alert alert-warning">
              <strong>Profile Incomplete:</strong> Please add your high school subjects and grades to your profile before applying.
              <br />
              <a href="/student/profile" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Complete Profile
              </a>
            </div>
          ) : (
            <div>
              <p><strong>Your Subjects and Grades:</strong></p>
              <ul>
                {userProfile.subjects.map((subject, idx) => (
                  <li key={idx}>
                    {subject.name}: {subject.grade}
                  </li>
                ))}
              </ul>

              <div style={{ 
                padding: '1rem',
                borderRadius: '4px',
                backgroundColor: isEligible ? '#d4edda' : '#f8d7da',
                border: `1px solid ${isEligible ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                <strong>
                  {isEligible ? '✓ You are eligible for this course' : '✗ You do not meet the entry requirements'}
                </strong>
                {!isEligible && (
                  <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                    Please check the entry requirements above and ensure you meet all subject and grade criteria.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Application Actions */}
        <div className="card">
          <h3>Submit Application</h3>
          <p>
            By submitting this application, you agree that all information provided is accurate and complete.
            You can apply for maximum 2 courses per institution.
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              className="btn btn-primary"
              disabled={applying || !isEligible || !userProfile.subjects}
              onClick={handleApply}
            >
              {applying ? 'Submitting Application...' : 'Submit Application'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>

          {!isEligible && userProfile.subjects && (
            <p style={{ color: '#dc3545', marginTop: '1rem' }}>
              You must meet all entry requirements to apply for this course.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Application;