import React, { useState, useEffect } from 'react';
import { getStudentProfile, updateStudentProfile } from '../../services/api';
import Loading from '../Common/Loading';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getStudentProfile();
      setProfile(response.data.student);
    } catch (error) {
      setError('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateStudentProfile(profile);
      setMessage('Profile updated successfully');
    } catch (error) {
      setError('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...profile.subjects];
    newSubjects[index] = {
      ...newSubjects[index],
      [field]: value
    };
    setProfile(prev => ({
      ...prev,
      subjects: newSubjects
    }));
  };

  const addSubject = () => {
    setProfile(prev => ({
      ...prev,
      subjects: [...(prev.subjects || []), { name: '', grade: '' }]
    }));
  };

  const removeSubject = (index) => {
    const newSubjects = profile.subjects.filter((_, i) => i !== index);
    setProfile(prev => ({
      ...prev,
      subjects: newSubjects
    }));
  };

  if (loading) return <Loading message="Loading profile..." />;

  const availableSubjects = [
    'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Accounting', 'Economics', 'Business Studies',
    'Computer Science', 'Agriculture', 'Music', 'Sesotho'
  ];

  const grades = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Student Profile</h2>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  value={profile.firstName || ''}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  value={profile.lastName || ''}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={profile.email || ''}
                  disabled
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={profile.phone || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="form-control"
                  value={profile.dateOfBirth || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Graduation Year</label>
                <input
                  type="number"
                  name="graduationYear"
                  className="form-control"
                  value={profile.graduationYear || ''}
                  onChange={handleChange}
                  min="2000"
                  max="2030"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">High School</label>
            <input
              type="text"
              name="highSchool"
              className="form-control"
              value={profile.highSchool || ''}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              name="address"
              className="form-control"
              value={profile.address || ''}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">High School Subjects and Grades</label>
            {(profile.subjects || []).map((subject, index) => (
              <div key={index} className="row" style={{ marginBottom: '1rem' }}>
                <div className="col-5">
                  <select
                    className="form-select"
                    value={subject.name}
                    onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
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
                    value={subject.grade}
                    onChange={(e) => handleSubjectChange(index, 'grade', e.target.value)}
                  >
                    <option value="">Select Grade</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div className="col-2">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeSubject(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addSubject}
            >
              Add Subject
            </button>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;