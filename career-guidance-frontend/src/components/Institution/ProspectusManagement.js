import React, { useState, useEffect } from 'react';
import { getInstitutionProspectus, uploadProspectus, deleteProspectus, publishProspectus } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../Common/Loading';

const ProspectusManagement = () => {
  const [prospectusList, setProspectusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { userProfile } = useAuth();

  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    academicYear: '',
    file: null
  });

  useEffect(() => {
    fetchProspectus();
  }, []);

  const fetchProspectus = async () => {
    try {
      const response = await getInstitutionProspectus();
      setProspectusList(response.data.prospectus || []);
    } catch (err) {
      console.error('Error loading prospectus:', err);
      setError('Error loading prospectus documents. Please try again later.');
      setProspectusList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadData(prev => ({ ...prev, file }));
    } else {
      setError('Please select a PDF file');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      setError('Please select a PDF file to upload');
      return;
    }

    setUploading(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('academicYear', uploadData.academicYear);
      formData.append('file', uploadData.file);
      formData.append('institutionId', userProfile?.uid);

      await uploadProspectus(formData);
      setMessage('Prospectus uploaded successfully');
      resetUploadForm();
      fetchProspectus();
    } catch (err) {
      setError(err.response?.data?.error || 'Error uploading prospectus');
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async (prospectusId, publishStatus) => {
    try {
      await publishProspectus(prospectusId, { published: publishStatus });
      setMessage(`Prospectus ${publishStatus ? 'published' : 'unpublished'} successfully`);
      fetchProspectus();
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating prospectus status');
    }
  };

  const handleDelete = async (prospectusId) => {
    if (!window.confirm('Are you sure you want to delete this prospectus? This action cannot be undone.')) return;

    try {
      await deleteProspectus(prospectusId);
      setMessage('Prospectus deleted successfully');
      fetchProspectus();
    } catch (err) {
      setError(err.response?.data?.error || 'Error deleting prospectus');
    }
  };

  const resetUploadForm = () => {
    setUploadData({
      title: '',
      description: '',
      academicYear: '',
      file: null
    });
    setShowUploadForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <Loading message="Loading prospectus documents..." />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">Prospectus Management</h2>
            <p>Upload and manage your institution's prospectus documents</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
            {showUploadForm ? 'Cancel' : 'Upload Prospectus'}
          </button>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Upload Form */}
        {showUploadForm && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>Upload New Prospectus</h3>
            <form onSubmit={handleUpload}>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      value={uploadData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <input
                      type="text"
                      name="academicYear"
                      className="form-control"
                      value={uploadData.academicYear}
                      onChange={handleInputChange}
                      placeholder="e.g., 2024-2025"
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
                  value={uploadData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Brief description of the prospectus content..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">PDF File</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                <small className="form-text">Only PDF files are allowed. Maximum file size: 10MB</small>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Prospectus'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetUploadForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Prospectus List */}
        <h3>Prospectus Documents ({prospectusList.length})</h3>
        {prospectusList.length === 0 ? (
          <div className="alert alert-info">
            No prospectus documents found. Upload your first prospectus to make it available to students.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Academic Year</th>
                  <th>Description</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prospectusList.map(prospectus => (
                  <tr key={prospectus.id}>
                    <td><strong>{prospectus.title}</strong></td>
                    <td>{prospectus.academicYear}</td>
                    <td style={{ maxWidth: '200px' }}>
                      {prospectus.description?.substring(0, 100)}
                      {prospectus.description?.length > 100 ? '...' : ''}
                    </td>
                    <td>{new Date(prospectus.uploadedAt || prospectus.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: prospectus.published ? '#28a745' : '#6c757d',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}>
                        {prospectus.published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <a href={prospectus.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                          View
                        </a>
                        <button
                          className={`btn btn-sm ${prospectus.published ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handlePublish(prospectus.id, !prospectus.published)}
                        >
                          {prospectus.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(prospectus.id)}>
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

        {/* Info Section */}
        <div className="card" style={{ marginTop: '2rem', borderLeft: '4px solid #17a2b8' }}>
          <h4>About Prospectus Management</h4>
          <ul>
            <li>Upload PDF prospectus documents for different academic years</li>
            <li>Published prospectus documents are visible to students and the public</li>
            <li>Draft prospectus documents are only visible to institution staff</li>
            <li>Students can download published prospectus documents from your institution's public profile</li>
            <li>Keep your prospectus updated with the latest course information and requirements</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProspectusManagement;
