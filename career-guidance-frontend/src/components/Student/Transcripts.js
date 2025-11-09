import React, { useState, useEffect } from 'react';
import { getStudentDocuments, uploadTranscript, uploadCertificate } from '../../services/api';
import Loading from '../Common/Loading';

const Transcripts = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await getStudentDocuments();
      // Ensure documents is always an array
      setDocuments(response.data.documents || []);
    } catch (error) {
      setError('Error loading documents');
      setDocuments([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    e.preventDefault();
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload PDF, JPEG, or PNG files only');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadType(type);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      
      // Use the correct field names that the server expects
      if (type === 'transcript') {
        formData.append('transcript', file); // Server expects 'transcript'
        await uploadTranscript(formData);
        setMessage('Academic transcript uploaded successfully!');
      } else {
        formData.append('certificate', file); // Server expects 'certificate'
        await uploadCertificate(formData);
        setMessage('Certificate uploaded successfully!');
      }

      fetchDocuments();
    } catch (error) {
      setError(error.response?.data?.error || `Error uploading ${type}`);
    } finally {
      setUploading(false);
      setUploadType('');
      e.target.value = ''; // Reset file input
    }
  };

  const getDocumentTypeDisplay = (type) => {
    switch (type) {
      case 'transcript': return 'Academic Transcript';
      case 'certificate': return 'Additional Certificate';
      default: return type;
    }
  };

  const getStatusColor = (verified) => {
    return verified ? '#28a745' : '#ffc107';
  };

  if (loading) return <Loading message="Loading documents..." />;

  // Ensure documents is always treated as an array
  const documentsArray = Array.isArray(documents) ? documents : [];
  const hasTranscript = documentsArray.some(doc => doc.type === 'transcript' && doc.verified);

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Documents & Certificates</h2>
          <p>Upload and manage your academic documents</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Upload Section */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Upload Documents</h3>
          
          <div className="row">
            <div className="col-6">
              <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <h4>Academic Transcript</h4>
                <p style={{ color: '#666666', marginBottom: '1.5rem' }}>
                  Upload your official academic transcript for course applications and job opportunities
                </p>
                <div className="form-group">
                  <input
                    type="file"
                    id="transcript-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'transcript')}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="transcript-upload" 
                    className={`btn ${hasTranscript ? 'btn-success' : 'btn-primary'}`}
                    style={{ 
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      opacity: uploading ? 0.6 : 1
                    }}
                  >
                    {uploading && uploadType === 'transcript' ? 'Uploading...' : 
                     hasTranscript ? 'Transcript Uploaded ✓' : 'Upload Transcript'}
                  </label>
                </div>
                <small style={{ color: '#666666' }}>
                  Supported formats: PDF, JPG, PNG (Max 5MB)
                </small>
              </div>
            </div>

            <div className="col-6">
              <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <h4>Additional Certificates</h4>
                <p style={{ color: '#666666', marginBottom: '1.5rem' }}>
                  Upload additional certificates, diplomas, or awards to enhance your profile
                </p>
                <div className="form-group">
                  <input
                    type="file"
                    id="certificate-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'certificate')}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="certificate-upload" 
                    className="btn btn-primary"
                    style={{ 
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      opacity: uploading ? 0.6 : 1
                    }}
                  >
                    {uploading && uploadType === 'certificate' ? 'Uploading...' : 'Upload Certificate'}
                  </label>
                </div>
                <small style={{ color: '#666666' }}>
                  Supported formats: PDF, JPG, PNG (Max 5MB)
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <h3>Your Documents ({documentsArray.length})</h3>
        
        {documentsArray.length === 0 ? (
          <div className="alert alert-info">
            No documents uploaded yet. Upload your academic transcript to apply for jobs and enhance your profile.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>File Name</th>
                  <th>Upload Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documentsArray.map(document => (
                  <tr key={document.id}>
                    <td>
                      <strong>{getDocumentTypeDisplay(document.type)}</strong>
                    </td>
                    <td>{document.fileName}</td>
                    <td>
                      {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <span 
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: getStatusColor(document.verified),
                          color: 'white',
                          fontSize: '0.875rem'
                        }}
                      >
                        {document.verified ? 'VERIFIED' : 'PENDING REVIEW'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                        >
                          View
                        </a>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {/* Add delete functionality */}}
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
          <h4>About Document Upload</h4>
          <ul>
            <li><strong>Academic Transcript:</strong> Required for job applications and enhanced course recommendations</li>
            <li><strong>Additional Certificates:</strong> Showcase your achievements and skills to potential employers</li>
            <li><strong>Verification:</strong> Documents are reviewed by administrators (usually within 2-3 business days)</li>
            <li><strong>Privacy:</strong> Your documents are securely stored and only shared with institutions/companies you apply to</li>
            <li><strong>Job Opportunities:</strong> Verified transcripts unlock job matching and application features</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Transcripts;