import React, { useState, useEffect } from 'react';
import { getInstitutionFaculties, createFaculty, updateFaculty, deleteFaculty } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';

const FacultyManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { userProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dean: '',
    contactEmail: '',
    phone: '',
    departments: ['']
  });

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const response = await getInstitutionFaculties();
      setFaculties(response.data.faculties || []);
    } catch (err) {
      console.error('Error fetching faculties:', err);
      setError('Error loading faculties. Please try again later.');
      setFaculties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleDepartmentChange = (index, value) => {
    const updatedDepartments = [...formData.departments];
    updatedDepartments[index] = value;
    setFormData(prev => ({
      ...prev,
      departments: updatedDepartments
    }));
  };

  const addDepartmentField = () => {
    setFormData(prev => ({
      ...prev,
      departments: [...prev.departments, '']
    }));
  };

  const removeDepartmentField = (index) => {
    if (formData.departments.length > 1) {
      const updatedDepartments = formData.departments.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        departments: updatedDepartments
      }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Faculty name is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.dean.trim()) {
      setError('Dean name is required');
      return false;
    }
    if (!formData.contactEmail.trim()) {
      setError('Contact email is required');
      return false;
    }
    if (!formData.contactEmail.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.departments.some(dept => !dept.trim())) {
      setError('All department names must be filled');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const facultyData = {
        ...formData,
        departments: formData.departments.filter(dept => dept.trim()),
        institutionId: userProfile?.uid
      };

      if (editingFaculty) {
        await updateFaculty(editingFaculty.id, facultyData);
        setMessage('Faculty updated successfully');
      } else {
        await createFaculty(facultyData);
        setMessage('Faculty created successfully');
      }

      resetForm();
      fetchFaculties();
    } catch (err) {
      setError(err.response?.data?.error || `Error ${editingFaculty ? 'updating' : 'creating'} faculty`);
    }
  };

  const handleEdit = (faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      name: faculty.name || '',
      description: faculty.description || '',
      dean: faculty.dean || '',
      contactEmail: faculty.contactEmail || '',
      phone: faculty.phone || '',
      departments: faculty.departments && faculty.departments.length > 0 
        ? [...faculty.departments] 
        : ['']
    });
    setShowForm(true);
    setError('');
    setMessage('');
  };

  const handleDelete = async (facultyId) => {
    if (!window.confirm('Are you sure you want to delete this faculty? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteFaculty(facultyId);
      setMessage('Faculty deleted successfully');
      fetchFaculties();
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting faculty');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dean: '',
      contactEmail: '',
      phone: '',
      departments: ['']
    });
    setEditingFaculty(null);
    setShowForm(false);
    setError('');
  };

  const handleCancel = () => {
    resetForm();
    setMessage('');
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
            disabled={showForm}
          >
            Add New Faculty
          </button>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Faculty Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>{editingFaculty ? 'Edit Faculty' : 'Create New Faculty'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Faculty Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter faculty name"
                      required
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Dean Name *</label>
                    <input
                      type="text"
                      name="dean"
                      className="form-control"
                      value={formData.dean}
                      onChange={handleInputChange}
                      placeholder="Enter dean's name"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Brief description of the faculty..."
                  required
                />
              </div>

              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Contact Email *</label>
                    <input
                      type="email"
                      name="contactEmail"
                      className="form-control"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      placeholder="faculty@institution.edu"
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
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Departments *</label>
                {formData.departments.map((department, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      value={department}
                      onChange={(e) => handleDepartmentChange(index, e.target.value)}
                      placeholder={`Department ${index + 1} name`}
                      required
                    />
                    {formData.departments.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeDepartmentField(index)}
                        style={{ minWidth: '40px' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addDepartmentField}
                >
                  Add Another Department
                </button>
                <small className="form-text">
                  Add all departments that belong to this faculty. At least one department is required.
                </small>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button type="submit" className="btn btn-primary">
                  {editingFaculty ? 'Update Faculty' : 'Create Faculty'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Faculties List */}
        <h3>Faculties ({faculties.length})</h3>
        {faculties.length === 0 ? (
          <div className="alert alert-info">
            No faculties found. Create your first faculty to start organizing your courses.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Faculty Name</th>
                  <th>Dean</th>
                  <th>Contact Email</th>
                  <th>Departments</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculties.map(faculty => (
                  <tr key={faculty.id}>
                    <td>
                      <strong>{faculty.name}</strong>
                      <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                        {faculty.description?.substring(0, 100)}
                        {faculty.description?.length > 100 ? '...' : ''}
                      </div>
                    </td>
                    <td>{faculty.dean}</td>
                    <td>{faculty.contactEmail}</td>
                    <td>
                      {faculty.departments && faculty.departments.length > 0 ? (
                        <div>
                          {faculty.departments.slice(0, 2).map((dept, idx) => (
                            <span key={idx} style={{ display: 'block', fontSize: '0.875rem' }}>
                              • {dept}
                            </span>
                          ))}
                          {faculty.departments.length > 2 && (
                            <span style={{ fontSize: '0.875rem', color: '#666' }}>
                              +{faculty.departments.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#999', fontSize: '0.875rem' }}>No departments</span>
                      )}
                    </td>
                    <td>
                      {faculty.createdAt ? new Date(faculty.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleEdit(faculty)}
                          title="Edit Faculty"
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(faculty.id)}
                          title="Delete Faculty"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Information Section */}
        <div className="card" style={{ marginTop: '2rem', borderLeft: '4px solid #17a2b8' }}>
          <h4>About Faculty Management</h4>
          <ul>
            <li><strong>Faculty Name:</strong> Required. The official name of the faculty (e.g., "Faculty of Engineering").</li>
            <li><strong>Dean:</strong> Required. The name of the faculty dean or head.</li>
            <li><strong>Description:</strong> Required. Brief overview of the faculty's focus and programs.</li>
            <li><strong>Contact Email:</strong> Required. Official email address for the faculty office.</li>
            <li><strong>Phone:</strong> Optional. Contact number for the faculty office.</li>
            <li><strong>Departments:</strong> Required. List all academic departments under this faculty.</li>
            <li>Each faculty can have multiple departments for better organization.</li>
            <li>Faculties are used to categorize and organize courses in your institution.</li>
          </ul>
        </div>

        {/* Best Practices */}
        <div className="card" style={{ marginTop: '1rem', backgroundColor: '#f8f9fa' }}>
          <h5>Best Practices</h5>
          <div className="row">
            <div className="col-6">
              <strong>Organization Tips:</strong>
              <ul style={{ fontSize: '0.9rem', marginBottom: 0 }}>
                <li>Create faculties based on academic disciplines</li>
                <li>Use clear, descriptive faculty names</li>
                <li>Include all relevant departments</li>
                <li>Keep contact information updated</li>
              </ul>
            </div>
            <div className="col-6">
              <strong>Course Management:</strong>
              <ul style={{ fontSize: '0.9rem', marginBottom: 0 }}>
                <li>Courses are assigned to specific faculties</li>
                <li>Students can filter courses by faculty</li>
                <li>Each faculty can have multiple courses</li>
                <li>Organize departments logically within faculties</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyManagement;