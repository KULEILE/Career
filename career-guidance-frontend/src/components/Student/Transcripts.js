import React, { useState, useEffect } from 'react';
import { getStudentDocuments, uploadTranscript, uploadCertificate, deleteDocument } from '../../services/api';
import Loading from '../Common/Loading';

const Transcripts = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await getStudentDocuments();
      setDocuments(response.data.documents || []);
    } catch (error) {
      setError('Error loading documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    e.preventDefault();
    const file = e.target.files[0];
    
    if (!file) return;

    // Validate file type - PDF only
    const validTypes = ['application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload PDF files only');
      return;
    }

    // Validate file size (100MB max)
    const maxFileSize = 100 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setError('File size must be less than 100MB');
      return;
    }

    setUploading(true);
    setUploadType(type);
    setMessage('');
    setError('');

    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64File = event.target.result;
          const fileName = file.name;
          const fileSize = file.size;

          if (type === 'transcript') {
            await uploadTranscript({
              transcriptUrl: base64File,
              fileName: fileName,
              fileSize: fileSize
            });
            setMessage('Academic transcript uploaded successfully!');
          } else {
            await uploadCertificate({
              certificateUrl: base64File,
              name: fileName,
              size: fileSize
            });
            setMessage('Certificate uploaded successfully!');
          }

          fetchDocuments();
        } catch (uploadError) {
          setError(uploadError.response?.data?.error || `Error uploading ${type}`);
        } finally {
          setUploading(false);
          setUploadType('');
          e.target.value = '';
        }
      };
      
      reader.onerror = () => {
        setError('Error reading file');
        setUploading(false);
        setUploadType('');
        e.target.value = '';
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      setError('Error processing file upload');
      setUploading(false);
      setUploadType('');
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (documentId, documentType, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(documentId);
    setMessage('');
    setError('');

    try {
      await deleteDocument(documentId);
      setMessage(`${documentType} deleted successfully!`);
      
      // Update local state immediately
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
    } catch (error) {
      setError(error.response?.data?.error || `Error deleting ${documentType}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleViewDocument = (document) => {
    if (document.fileUrl) {
      // For PDF files, open in new tab
      if (document.fileUrl.startsWith('data:application/pdf') || document.fileName?.toLowerCase().endsWith('.pdf')) {
        const newWindow = window.open();
        newWindow.document.write(`
          <html>
            <head>
              <title>${document.fileName}</title>
              <style>
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                .container { width: 100%; height: 100vh; }
                .pdf-view { width: 100%; height: 100vh; border: none; }
                .info { display: none; }
              </style>
            </head>
            <body>
              <div class="container">
                <iframe src="${document.fileUrl}" class="pdf-view" title="${document.fileName}"></iframe>
              </div>
            </body>
          </html>
        `);
      } else {
        // Fallback for other file types
        window.open(document.fileUrl, '_blank');
      }
    } else {
      setError('Document URL not available');
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

  const getDocumentTypeColor = (type) => {
    switch (type) {
      case 'transcript': return '#17a2b8';
      case 'certificate': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) return <Loading message="Loading documents..." />;

  const documentsArray = Array.isArray(documents) ? documents : [];
  const hasTranscript = documentsArray.some(doc => doc.type === 'transcript' && doc.verified);
  const transcriptCount = documentsArray.filter(doc => doc.type === 'transcript').length;
  const certificateCount = documentsArray.filter(doc => doc.type === 'certificate').length;

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
                    accept=".pdf"
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
                  Supported format: PDF only (Max 100MB)
                </small>
                {transcriptCount > 0 && (
                  <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#17a2b8' }}>
                    {transcriptCount} transcript(s) uploaded
                  </div>
                )}
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
                    accept=".pdf"
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
                  Supported format: PDF only (Max 100MB)
                </small>
                {certificateCount > 0 && (
                  <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#28a745' }}>
                    {certificateCount} certificate(s) uploaded
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Documents Statistics */}
        {documentsArray.length > 0 && (
          <div className="row" style={{ marginBottom: '2rem' }}>
            <div className="col-4">
              <div className="card" style={{ textAlign: 'center' }}>
                <h3>{documentsArray.length}</h3>
                <p>Total Documents</p>
              </div>
            </div>
            <div className="col-4">
              <div className="card" style={{ textAlign: 'center' }}>
                <h3>{documentsArray.filter(doc => doc.verified).length}</h3>
                <p>Verified</p>
              </div>
            </div>
            <div className="col-4">
              <div className="card" style={{ textAlign: 'center' }}>
                <h3>{documentsArray.filter(doc => !doc.verified).length}</h3>
                <p>Pending Review</p>
              </div>
            </div>
          </div>
        )}

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
                  <th>File Size</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documentsArray.map(document => (
                  <tr key={document.id}>
                    <td>
                      <strong style={{ color: getDocumentTypeColor(document.type) }}>
                        {getDocumentTypeDisplay(document.type)}
                      </strong>
                    </td>
                    <td>
                      <div>
                        <strong>{document.fileName}</strong>
                        {document.fileSize > 0 && (
                          <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                            {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      {document.fileSize > 0 ? 
                        `${(document.fileSize / 1024 / 1024).toFixed(2)} MB` : 
                        'N/A'
                      }
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
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleViewDocument(document)}
                          disabled={!document.fileUrl}
                          title="View Document"
                        >
                          View
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteDocument(
                            document.id, 
                            getDocumentTypeDisplay(document.type), 
                            document.fileName
                          )}
                          disabled={deleting === document.id}
                          title="Delete Document"
                        >
                          {deleting === document.id ? 'Deleting...' : 'Delete'}
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
        {documentsArray.length > 0 && (
          <div className="card" style={{ marginTop: '2rem' }}>
            <h4>Quick Actions</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const unverifiedDocs = documentsArray.filter(doc => !doc.verified);
                  if (unverifiedDocs.length > 0) {
                    alert(`You have ${unverifiedDocs.length} document(s) pending verification. They will be reviewed by administrators within 2-3 business days.`);
                  } else {
                    alert('All your documents have been verified!');
                  }
                }}
              >
                Check Verification Status
              </button>
              <button
                className="btn btn-info"
                onClick={() => {
                  const hasUnverified = documentsArray.some(doc => !doc.verified);
                  if (hasUnverified) {
                    alert('Some of your documents are still pending verification. Verified documents are required for job applications and enhanced course recommendations.');
                  } else {
                    alert('All your documents are verified! You can now apply for jobs and get better course recommendations.');
                  }
                }}
              >
                Document Benefits
              </button>
            </div>
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
            <li><strong>Deletion:</strong> You can delete uploaded documents at any time. Deleted documents cannot be recovered.</li>
            <li><strong>File Format:</strong> Only PDF files are accepted (maximum 100MB per file)</li>
          </ul>
        </div>

        {/* Document Tips */}
        <div className="card" style={{ marginTop: '1rem', backgroundColor: '#f8f9fa' }}>
          <h5>Document Tips</h5>
          <div className="row">
            <div className="col-6">
              <strong>For Best Results:</strong>
              <ul style={{ fontSize: '0.9rem', marginBottom: 0 }}>
                <li>Ensure documents are clear and readable</li>
                <li>Upload high-quality PDF scans</li>
                <li>Keep file sizes under 100MB</li>
                <li>Use PDF format for all documents</li>
              </ul>
            </div>
            <div className="col-6">
              <strong>Verification Process:</strong>
              <ul style={{ fontSize: '0.9rem', marginBottom: 0 }}>
                <li>Documents are verified within 2-3 business days</li>
                <li>You'll receive notifications when verified</li>
                <li>Verified documents unlock additional features</li>
                <li>Contact support if verification takes longer</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transcripts;