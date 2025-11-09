import React, { useState, useEffect } from 'react';
import { getInstitutionFaculties, createFaculty, updateFaculty, deleteFaculty } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';

const FacultyManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { userProfile } = useAuth();
  
  const [facultyData, setFacultyData] = useState({
    name: '',
    description: '',
    dean: '',
    contactEmail: '',
    phone: '',
    departments: []
  });

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const response = await getInstitutionFaculties();
      setFaculties(response.data.faculties || []);
    } catch (error) {
      console.error('Error loading faculties:', error);
      setError('Error loading faculties. Please try again later.');
      setFaculties([]);
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
      const facultyWithInstitution = {
        ...facultyData,
        institutionId: userProfile?.uid
      };

      if (editingFaculty) {
        await updateFaculty(editingFaculty.id, facultyWithInstitution);
        setMessage('Faculty updated successfully');
      } else {
        await createFaculty(facultyWithInstitution);
        setMessage('Faculty created successfully');
      }

      resetForm();
      fetchFaculties();
    } catch (error) {
      setError(error.response?.data?.error || `Error ${editingFaculty ? 'updating' : 'creating'} faculty`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (faculty) => {
    setEditingFaculty(faculty);
    setFacultyData({
      name: faculty.name || '',
      description: faculty.description || '',
      dean: faculty.dean || '',
      contactEmail: faculty.contactEmail || '',
      phone: faculty.phone || '',
      departments: faculty.departments || []
    });
    setShowForm(true);
  };

  const handleDelete = async (facultyId) => {
    if (!window.confirm('Are you sure you want to delete this faculty? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteFaculty(facultyId);
      setMessage('Faculty deleted successfully');
      fetchFaculties();
    } catch (error) {
      setError(error.response?.data?.error || 'Error deleting faculty');
    }
  };

  const resetForm = () => {
    setFacultyData({
      name: '',
      description: '',
      dean: '',
      contactEmail: '',
      phone: '',
      departments: []
    });
    setEditingFaculty(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFacultyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addDepartment = () => {
    setFacultyData(prev => ({
      ...prev,
      departments: [...prev.departments, '']
    }));
  };

  const updateDepartment = (index, value) => {
    setFacultyData(prev => {
      const newDepartments = [...prev.departments];
      newDepartments[index] = value;
      return {
        ...prev,
        departments: newDepartments
      };
    });
  };

  const removeDepartment = (index) => {
    setFacultyData(prev => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index)
    }));
  };

  if (loading) return <Loading message="Loading faculties..." />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">Faculty Management</h2>
            <p>Manage your institution's faculties and departments</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add New Faculty'}
          </button>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Faculty Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Faculty Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={facultyData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Dean Name</label>
                    <input
                      type="text"
                      name="dean"
                      className="form-control"
                      value={facultyData.dean}
                      onChange={handleChange}
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
                  value={facultyData.description}
                  onChange={handleChange}
                  rows="4"
                  required
                />
              </div>

              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Contact Email</label>
                    <input
                      type="email"
                      name="contactEmail"
                      className="form-control"
                      value={facultyData.contactEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      value={facultyData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Departments</label>
                {facultyData.departments.map((department, index) => (
                  <div key={index} className="row" style={{ marginBottom: '1rem' }}>
                    <div className="col-10">
                      <input
                        type="text"
                        className="form-control"
                        value={department}
                        onChange={(e) => updateDepartment(index, e.target.value)}
                        placeholder="Department name"
                        required
                      />
                    </div>
                    <div className="col-2">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeDepartment(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addDepartment}
                >
                  Add Department
                </button>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editingFaculty ? 'Update Faculty' : 'Create Faculty')}
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

        {/* Faculties List */}
        <h3>Your Faculties ({faculties.length})</h3>
        {faculties.length === 0 ? (
          <div className="alert alert-info">
            No faculties found. Add your first faculty to get started.
          </div>
        ) : (
          <div className="row">
            {faculties.map(faculty => (
              <div key={faculty.id} className="col-6">
                <div className="card">
                  <h4>{faculty.name}</h4>
                  <p><strong>Dean:</strong> {faculty.dean}</p>
                  <p><strong>Contact:</strong> {faculty.contactEmail} {faculty.phone && `| ${faculty.phone}`}</p>
                  
                  <p style={{ color: '#666666', fontSize: '0.9rem' }}>
                    {faculty.description?.substring(0, 100)}...
                  </p>

                  {faculty.departments && faculty.departments.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <strong>Departments:</strong>
                      <ul>
                        {faculty.departments.map((dept, idx) => (
                          <li key={idx}>{dept}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ marginTop: '1rem' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEdit(faculty)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      style={{ marginLeft: '0.5rem' }}
                      onClick={() => handleDelete(faculty.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyManagement;