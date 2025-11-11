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
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      
      // Validate file size (25MB max for actual file)
      if (file.size > 25 * 1024 * 1024) {
        setError('File size must be less than 25MB');
        return;
      }
      
      setUploadData(prev => ({ ...prev, file }));
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!uploadData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!uploadData.academicYear.trim()) {
      setError('Academic year is required');
      return;
    }
    
    if (!uploadData.description.trim()) {
      setError('Description is required');
      return;
    }
    
    if (!uploadData.file) {
      setError('Please select a PDF file to upload');
      return;
    }

    setUploading(true);
    setMessage('');
    setError('');

    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64File = event.target.result;
          const fileName = uploadData.file.name;
          const fileSize = uploadData.file.size;

          // Prepare upload data
          const uploadPayload = {
            title: uploadData.title.trim(),
            description: uploadData.description.trim(),
            academicYear: uploadData.academicYear.trim(),
            fileUrl: base64File,
            fileName: fileName,
            fileSize: fileSize,
            institutionId: userProfile?.uid
          };

          await uploadProspectus(uploadPayload);
          setMessage('Prospectus uploaded successfully');
          resetUploadForm();
          fetchProspectus();
        } catch (uploadError) {
          setError(uploadError.response?.data?.error || 'Error uploading prospectus');
        } finally {
          setUploading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Error reading file');
        setUploading(false);
      };
      
      reader.readAsDataURL(uploadData.file);
      
    } catch (err) {
      setError('Error processing file upload');
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
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleViewProspectus = (prospectus) => {
    if (prospectus.fileUrl) {
      if (prospectus.fileUrl.startsWith('data:')) {
        // Open base64 PDF in new window
        const newWindow = window.open();
        newWindow.document.write(`
          <html>
            <head>
              <title>${prospectus.title}</title>
              <style>
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                .container { max-width: 100%; text-align: center; }
                .pdf-view { width: 100%; height: 90vh; border: none; }
                .info { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
                .info h3 { margin: 0 0 10px 0; color: #333; }
                .info p { margin: 5px 0; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="info">
                  <h3>${prospectus.title}</h3>
                  <p><strong>Academic Year:</strong> ${prospectus.academicYear}</p>
                  <p><strong>Description:</strong> ${prospectus.description}</p>
                  <p><strong>Status:</strong> ${prospectus.published ? 'Published' : 'Draft'}</p>
                </div>
                <iframe src="${prospectus.fileUrl}" class="pdf-view" title="${prospectus.title}"></iframe>
              </div>
            </body>
          </html>
        `);
      } else {
        // Open regular URL in new tab
        window.open(prospectus.fileUrl, '_blank');
      }
    } else {
      setError('Prospectus file not available');
    }
  };

  if (loading) return <Loading message="Loading prospectus documents..." />;

  const publishedCount = prospectusList.filter(p => p.published).length;
  const draftCount = prospectusList.filter(p => !p.published).length;

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

        {/* Statistics */}
        {prospectusList.length > 0 && (
          <div className="row" style={{ marginBottom: '2rem' }}>
            <div className="col-4">
              <div className="card" style={{ textAlign: 'center' }}>
                <h3>{prospectusList.length}</h3>
                <p>Total Prospectus</p>
              </div>
            </div>
            <div className="col-4">
              <div className="card" style={{ textAlign: 'center' }}>
                <h3>{publishedCount}</h3>
                <p>Published</p>
              </div>
            </div>
            <div className="col-4">
              <div className="card" style={{ textAlign: 'center' }}>
                <h3>{draftCount}</h3>
                <p>Draft</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        {showUploadForm && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>Upload New Prospectus</h3>
            <form onSubmit={handleUpload}>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      value={uploadData.title}
                      onChange={handleInputChange}
                      placeholder="Enter prospectus title"
                      required
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Academic Year *</label>
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
                <label className="form-label">Description *</label>
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
                <label className="form-label">PDF File *</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                <small className="form-text">
                  Only PDF files are allowed. Maximum file size: 25MB
                  {uploadData.file && (
                    <span style={{ color: '#28a745', marginLeft: '10px' }}>
                      Selected: {uploadData.file.name} ({(uploadData.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                </small>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Prospectus'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetUploadForm}>
                  Cancel
                </button>
                {uploading && (
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    Processing file... Please wait.
                  </div>
                )}
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
                  <th>File Size</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prospectusList.map(prospectus => (
                  <tr key={prospectus.id}>
                    <td>
                      <strong>{prospectus.title}</strong>
                    </td>
                    <td>{prospectus.academicYear}</td>
                    <td style={{ maxWidth: '200px' }}>
                      {prospectus.description?.substring(0, 100)}
                      {prospectus.description?.length > 100 ? '...' : ''}
                    </td>
                    <td>
                      {prospectus.fileSize ? `${(prospectus.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
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
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleViewProspectus(prospectus)}
                          title="View Prospectus"
                        >
                          View
                        </button>
                        <button
                          className={`btn btn-sm ${prospectus.published ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handlePublish(prospectus.id, !prospectus.published)}
                          title={prospectus.published ? 'Unpublish Prospectus' : 'Publish Prospectus'}
                        >
                          {prospectus.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(prospectus.id)}
                          title="Delete Prospectus"
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

        {/* Quick Actions */}
        {prospectusList.length > 0 && (
          <div className="card" style={{ marginTop: '2rem' }}>
            <h4>Quick Actions</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-info"
                onClick={() => {
                  if (publishedCount === 0) {
                    alert('No published prospectus documents. Publish a prospectus to make it visible to students.');
                  } else {
                    alert(`You have ${publishedCount} published prospectus document(s) that are visible to students.`);
                  }
                }}
              >
                Check Published Status
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const currentYear = new Date().getFullYear();
                  const nextYear = currentYear + 1;
                  const suggestedYear = `${currentYear}-${nextYear}`;
                  alert(`Suggested academic year format: ${suggestedYear}\n\nBest practices:\n- Use consistent year format\n- Include both years for academic periods\n- Update prospectus annually`);
                }}
              >
                Academic Year Help
              </button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="card" style={{ marginTop: '2rem', borderLeft: '4px solid #17a2b8' }}>
          <h4>About Prospectus Management</h4>
          <ul>
            <li><strong>Title:</strong> Required. Choose a clear, descriptive title for your prospectus.</li>
            <li><strong>Academic Year:</strong> Required. Format: "YYYY-YYYY" (e.g., 2024-2025).</li>
            <li><strong>Description:</strong> Required. Provide a brief overview of the prospectus content.</li>
            <li><strong>File:</strong> Required. Only PDF files up to 25MB are accepted.</li>
            <li><strong>Published:</strong> Published prospectus documents are visible to students and the public.</li>
            <li><strong>Draft:</strong> Draft documents are only visible to institution staff.</li>
            <li>Students can download published prospectus documents from your institution's public profile.</li>
            <li>Keep your prospectus updated with the latest course information and requirements.</li>
          </ul>
        </div>

        {/* Upload Tips */}
        <div className="card" style={{ marginTop: '1rem', backgroundColor: '#f8f9fa' }}>
          <h5>Upload Tips</h5>
          <div className="row">
            <div className="col-6">
              <strong>For Best Results:</strong>
              <ul style={{ fontSize: '0.9rem', marginBottom: 0 }}>
                <li>Ensure PDF files are optimized for web viewing</li>
                <li>Keep file sizes under 25MB for faster loading</li>
                <li>Use clear, descriptive titles</li>
                <li>Include all relevant academic year information</li>
              </ul>
            </div>
            <div className="col-6">
              <strong>Student Access:</strong>
              <ul style={{ fontSize: '0.9rem', marginBottom: 0 }}>
                <li>Only published prospectus are visible to students</li>
                <li>Students can view and download published documents</li>
                <li>Update prospectus annually for accuracy</li>
                <li>Multiple prospectus for different programs are supported</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProspectusManagement;