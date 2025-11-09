import React, { useState, useEffect } from 'react';
import { getStudentAdmissions, acceptAdmissionOffer } from '../../services/api';
import Loading from '../Common/Loading';

const Admissions = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    try {
      const response = await getStudentAdmissions();
      setAdmissions(response.data.admissions);
    } catch (error) {
      setError('Error loading admissions');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAdmission = async (applicationId) => {
    if (!window.confirm(
      'Are you sure you want to accept this admission offer? ' +
      'This will automatically decline all other admission offers.'
    )) {
      return;
    }

    setAccepting(applicationId);
    setMessage('');
    setError('');

    try {
      await acceptAdmissionOffer({ applicationId });
      setMessage('Admission offer accepted successfully!');
      fetchAdmissions();
    } catch (error) {
      setError(error.response?.data?.error || 'Error accepting admission offer');
    } finally {
      setAccepting(null);
    }
  };

  if (loading) return <Loading message="Loading admissions..." />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Admission Offers</h2>
          <p>Review and accept your admission offers</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {admissions.length === 0 ? (
          <div className="alert alert-info">
            You don't have any admission offers yet. Keep checking back for updates on your applications.
          </div>
        ) : (
          <div className="row">
            {admissions.map(admission => (
              <div key={admission.id} className="col-6">
                <div className="card">
                  <h4>{admission.course?.name}</h4>
                  <p><strong>Institution:</strong> {admission.institution?.institutionName}</p>
                  <p><strong>Duration:</strong> {admission.course?.duration}</p>
                  
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Admission Details:</strong>
                    <ul>
                      <li>Status: <span style={{ color: '#28a745', fontWeight: 'bold' }}>ADMITTED</span></li>
                      <li>Applied: {new Date(admission.appliedAt).toLocaleDateString()}</li>
                      <li>Last Updated: {new Date(admission.updatedAt).toLocaleDateString()}</li>
                    </ul>
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <button
                      className="btn btn-success"
                      disabled={accepting === admission.id}
                      onClick={() => handleAcceptAdmission(admission.id)}
                    >
                      {accepting === admission.id ? 'Accepting...' : 'Accept Admission Offer'}
                    </button>
                    
                    <p style={{ fontSize: '0.8rem', color: '#666666', marginTop: '0.5rem' }}>
                      Note: Accepting this offer will automatically decline all other admission offers.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {admissions.length > 1 && (
          <div className="alert alert-info" style={{ marginTop: '2rem' }}>
            <strong>Important:</strong> You can only accept one admission offer. 
            When you accept an offer, all other offers will be automatically declined.
          </div>
        )}
      </div>
    </div>
  );
};

export default Admissions;