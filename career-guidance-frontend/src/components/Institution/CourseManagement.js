import React, { useState, useEffect } from 'react';
import { getInstitutionCourses, createCourse, updateCourse, deleteCourse, getInstitutionFaculties } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { userProfile } = useAuth();
  
  const [courseData, setCourseData] = useState({
    name: '',
    description: '',
    duration: '',
    facultyId: '',
    requirements: {
      subjects: [],
      minGrades: {}
    },
    tuitionFee: '',
    intakePeriod: '',
    applicationDeadline: '',
    availableSeats: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesResponse, facultiesResponse] = await Promise.all([
        getInstitutionCourses(),
        getInstitutionFaculties()
      ]);
      setCourses(coursesResponse.data.courses);
      setFaculties(facultiesResponse.data.faculties);
    } catch (error) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');
    setError('');

    try {
      const courseWithInstitution = {
        ...courseData,
        institutionId: userProfile?.uid
      };

      if (editingCourse) {
        await updateCourse(editingCourse.id, courseWithInstitution);
        setMessage('Course updated successfully');
      } else {
        await createCourse(courseWithInstitution);
        setMessage('Course created successfully');
      }

      resetForm();
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || `Error ${editingCourse ? 'updating' : 'creating'} course`);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setCourseData({
      name: course.name || '',
      description: course.description || '',
      duration: course.duration || '',
      facultyId: course.facultyId || '',
      requirements: course.requirements || { subjects: [], minGrades: {} },
      tuitionFee: course.tuitionFee || '',
      intakePeriod: course.intakePeriod || '',
      applicationDeadline: course.applicationDeadline || '',
      availableSeats: course.availableSeats || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This will also delete all associated applications.')) {
      return;
    }

    try {
      await deleteCourse(courseId);
      setMessage('Course deleted successfully');
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Error deleting course');
    }
  };

  const resetForm = () => {
    setCourseData({
      name: '',
      description: '',
      duration: '',
      facultyId: '',
      requirements: {
        subjects: [],
        minGrades: {}
      },
      tuitionFee: '',
      intakePeriod: '',
      applicationDeadline: '',
      availableSeats: ''
    });
    setEditingCourse(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addRequirement = () => {
    setCourseData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        subjects: [...prev.requirements.subjects, ''],
        minGrades: { ...prev.requirements.minGrades }
      }
    }));
  };

  const updateRequirement = (index, field, value) => {
    setCourseData(prev => {
      const newRequirements = { ...prev.requirements };
      
      if (field === 'subject') {
        const oldSubject = newRequirements.subjects[index];
        newRequirements.subjects[index] = value;
        
        if (oldSubject && newRequirements.minGrades[oldSubject]) {
          newRequirements.minGrades[value] = newRequirements.minGrades[oldSubject];
          delete newRequirements.minGrades[oldSubject];
        }
      } else if (field === 'grade') {
        const subject = newRequirements.subjects[index];
        if (subject) {
          newRequirements.minGrades[subject] = value;
        }
      }
      
      return {
        ...prev,
        requirements: newRequirements
      };
    });
  };

  const removeRequirement = (index) => {
    setCourseData(prev => {
      const newRequirements = { ...prev.requirements };
      const subjectToRemove = newRequirements.subjects[index];
      
      newRequirements.subjects = newRequirements.subjects.filter((_, i) => i !== index);
      if (subjectToRemove) {
        delete newRequirements.minGrades[subjectToRemove];
      }
      
      return {
        ...prev,
        requirements: newRequirements
      };
    });
  };

  const availableSubjects = [
    'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Accounting', 'Economics', 'Business Studies',
    'Computer Science', 'Agriculture',  'Sesotho', 
  ];

  const grades = ['A*','A', 'B', 'C', 'D', 'E'];

  if (loading) return <Loading message="Loading courses..." />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">Course Management</h2>
            <p>Manage your institution's courses and programs</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add New Course'}
          </button>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Course Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Course Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={courseData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input
                      type="text"
                      name="duration"
                      className="form-control"
                      value={courseData.duration}
                      onChange={handleChange}
                      placeholder="e.g., 4 years, 2 semesters"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  value={courseData.description}
                  onChange={handleChange}
                  rows="4"
                  required
                />
              </div>

              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Faculty</label>
                    <select
                      name="facultyId"
                      className="form-select"
                      value={courseData.facultyId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Faculty</option>
                      {faculties.map(faculty => (
                        <option key={faculty.id} value={faculty.id}>
                          {faculty.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Tuition Fee</label>
                    <input
                      type="text"
                      name="tuitionFee"
                      className="form-control"
                      value={courseData.tuitionFee}
                      onChange={handleChange}
                      placeholder="e.g., M10,000 per year"
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Intake Period</label>
                    <input
                      type="text"
                      name="intakePeriod"
                      className="form-control"
                      value={courseData.intakePeriod}
                      onChange={handleChange}
                      placeholder="e.g., January 2024"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Application Deadline</label>
                    <input
                      type="date"
                      name="applicationDeadline"
                      className="form-control"
                      value={courseData.applicationDeadline}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Available Seats</label>
                <input
                  type="number"
                  name="availableSeats"
                  className="form-control"
                  value={courseData.availableSeats}
                  onChange={handleChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Entry Requirements</label>
                {courseData.requirements.subjects.map((subject, index) => (
                  <div key={index} className="row" style={{ marginBottom: '1rem' }}>
                    <div className="col-5">
                      <select
                        className="form-select"
                        value={subject}
                        onChange={(e) => updateRequirement(index, 'subject', e.target.value)}
                        required
                      >
                        <option value="">Select Subject</option>
                        {availableSubjects.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-5">
                      <select
                        className="form-select"
                        value={courseData.requirements.minGrades[subject] || ''}
                        onChange={(e) => updateRequirement(index, 'grade', e.target.value)}
                        required
                      >
                        <option value="">Select Minimum Grade</option>
                        {grades.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-2">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeRequirement(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addRequirement}
                >
                  Add Requirement
                </button>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={creating}
                >
                  {creating ? 'Saving...' : (editingCourse ? 'Update Course' : 'Create Course')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Courses List */}
        <h3>Your Courses ({courses.length})</h3>
        {courses.length === 0 ? (
          <div className="alert alert-info">
            No courses found. Add your first course to get started.
          </div>
        ) : (
          <div className="row">
            {courses.map(course => {
              const faculty = faculties.find(f => f.id === course.facultyId);
              return (
                <div key={course.id} className="col-6">
                  <div className="card">
                    <h4>{course.name}</h4>
                    <p><strong>Faculty:</strong> {faculty?.name || 'N/A'}</p>
                    <p><strong>Duration:</strong> {course.duration}</p>
                    <p><strong>Seats:</strong> {course.availableSeats || 'Not specified'}</p>
                    
                    <p style={{ color: '#666666', fontSize: '0.9rem' }}>
                      {course.description?.substring(0, 100)}...
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

                    <div style={{ marginTop: '1rem' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(course)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        style={{ marginLeft: '0.5rem' }}
                        onClick={() => handleDelete(course.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;