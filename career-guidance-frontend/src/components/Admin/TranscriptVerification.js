import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPendingTranscripts, approveTranscript, rejectTranscript } from '../../services/api';
import Loading from '../Common/Loading';

const TranscriptVerification = () => {
  const [pendingTranscripts, setPendingTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingTranscripts();
  }, []);

  const fetchPendingTranscripts = async () => {
    try {
      const response = await getPendingTranscripts();
      setPendingTranscripts(response.data.pendingTranscripts || []);
    } catch (error) {
      console.error('Error fetching pending transcripts:', error);
      setPendingTranscripts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (uid) => {
    setActionLoading(uid);
    try {
      await approveTranscript(uid);
      setPendingTranscripts(prev => prev.filter(transcript => transcript.uid !== uid));
    } catch (error) {
      console.error('Error approving transcript:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uid) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    setActionLoading(uid);
    try {
      await rejectTranscript(uid, reason);
      setPendingTranscripts(prev => prev.filter(transcript => transcript.uid !== uid));
    } catch (error) {
      console.error('Error rejecting transcript:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return <Loading message="Loading pending transcripts..." />;

  return (
    <div className="container">
      <div className="card">
        <h1>Transcript Verification</h1>
        <p>Review and verify student transcripts</p>
        <Link to="/admin/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Pending Transcripts ({pendingTranscripts.length})</h2>
        
        {pendingTranscripts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>No pending transcripts for verification</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>File Name</th>
                  <th>File Size</th>
                  <th>Upload Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTranscripts.map(transcript => (
                  <tr key={transcript.uid}>
                    <td>{transcript.uid}</td>
                    <td>
                      <a 
                        href={transcript.transcriptData} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        {transcript.transcriptFileName}
                      </a>
                    </td>
                    <td>{formatFileSize(transcript.transcriptFileSize)}</td>
                    <td>
                      {transcript.transcriptUploadedAt ? 
                        new Date(transcript.transcriptUploadedAt).toLocaleDateString() : 
                        'N/A'
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(transcript.uid)}
                          disabled={actionLoading === transcript.uid}
                        >
                          {actionLoading === transcript.uid ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(transcript.uid)}
                          disabled={actionLoading === transcript.uid}
                        >
                          {actionLoading === transcript.uid ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptVerification;