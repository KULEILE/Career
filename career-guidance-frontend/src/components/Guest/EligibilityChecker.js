import React, { useState } from 'react';
import { checkEligibility, getAllCourses } from '../../services/api';
import Loading from '../Common/Loading';

const EligibilityChecker = () => {
  const [subjects, setSubjects] = useState([{ name: '', grade: '' }]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableSubjects = [
    'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Accounting', 'Economics', 'Business Studies',
    'Computer Science', 'Agriculture', 'Art', 'Sesotho',
  ];

  const grades = ['A*','A', 'B', 'C', 'D', 'E', 'F'];

  const addSubject = () => {
    setSubjects([...subjects, { name: '', grade: '' }]);
  };

  const removeSubject = (index) => {
    const newSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(newSubjects);
  };

  const updateSubject = (index, field, value) => {
    const newSubjects = subjects.map((subject, i) => 
      i === index ? { ...subject, [field]: value } : subject
    );
    setSubjects(newSubjects);
  };

  const handleCheckEligibility = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    // Validate subjects
    const validSubjects = subjects.filter(subject => subject.name && subject.grade);
    if (validSubjects.length === 0) {
      setError('Please add at least one subject with grade');
      setLoading(false);
      return;
    }

    try {
      // Convert subjects to the format expected by backend
      const subjectsObj = {};
      const gradesObj = {};
      
      validSubjects.forEach(subject => {
        subjectsObj[subject.name] = true;
        gradesObj[subject.name] = subject.grade;
      });

      const response = await checkEligibility({
        subjects: subjectsObj,
        grades: gradesObj
      });

      setResults(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Error checking eligibility');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Check Course Eligibility</h2>
          <p>Enter your high school subjects and grades to see which courses you qualify for</p>
        </div>

        <form onSubmit={handleCheckEligibility}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Your Subjects and Grades</label>
            {subjects.map((subject, index) => (
              <div key={index} className="row" style={{ marginBottom: '1rem' }}>
                <div className="col-6">
                  <select
                    className="form-select"
                    value={subject.name}
                    onChange={(e) => updateSubject(index, 'name', e.target.value)}
                    required
                  >
                    <option value="">Select Subject</option>
                    {availableSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div className="col-4">
                  <select
                    className="form-select"
                    value={subject.grade}
                    onChange={(e) => updateSubject(index, 'grade', e.target.value)}
                    required
                  >
                    <option value="">Select Grade</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div className="col-2">
                  {subjects.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeSubject(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addSubject}
            >
              Add Another Subject
            </button>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? 'Checking Eligibility...' : 'Check Eligibility'}
          </button>
        </form>

        {results && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Eligibility Results</h3>
            <p>
              You qualify for {results.eligibleCount} out of {results.totalCourses} courses
            </p>

            {results.eligibleCourses.length > 0 ? (
              <div className="row">
                {results.eligibleCourses.map(course => (
                  <div key={course.id} className="col-6">
                    <div className="card">
                      <h4>{course.name}</h4>
                      <p><strong>Institution:</strong> {course.institution?.institutionName}</p>
                      <p><strong>Duration:</strong> {course.duration}</p>
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-info">
                No courses found that match your subjects and grades. 
                Consider improving your grades or trying different subject combinations.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EligibilityChecker;