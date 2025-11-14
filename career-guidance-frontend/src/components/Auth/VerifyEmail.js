// src/components/Auth/VerifyEmail.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const VerifyEmail = () => {
  const { currentUser, sendVerificationEmail, checkEmailVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendVerificationEmail();
      setMessage('Verification email sent! Please check your inbox and click the verification link.');
    } catch (error) {
      setError('Failed to send verification email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        setMessage('Email verified successfully! You can now login to your account.');
      } else {
        setMessage('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (error) {
      setError('Failed to check verification status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '2rem auto' }}>
          <div className="card-body">
            <h2>Email Verification</h2>
            <p>Please <Link to="/login">login</Link> to verify your email address.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '2rem auto' }}>
        <div className="card-header">
          <h2 className="card-title">Verify Your Email</h2>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          
          <p>Please verify your email address to access all features.</p>
          <p><strong>Email:</strong> {currentUser.email}</p>
          <p><strong>Status:</strong> 
            <span style={{ color: currentUser.emailVerified ? 'green' : 'red', fontWeight: 'bold', marginLeft: '0.5rem' }}>
              {currentUser.emailVerified ? 'Verified' : 'Not Verified'}
            </span>
          </p>
          
          {!currentUser.emailVerified && (
            <div style={{ marginTop: '1rem' }}>
              <button 
                onClick={handleSendVerification}
                disabled={loading}
                className="btn btn-primary"
                style={{ marginRight: '1rem', marginBottom: '0.5rem' }}
              >
                {loading ? 'Sending...' : 'Send Verification Email'}
              </button>
              
              <button 
                onClick={handleCheckVerification}
                disabled={loading}
                className="btn btn-secondary"
              >
                Check Verification Status
              </button>
              
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                <p><strong>Note:</strong> After clicking the verification link in your email, 
                use the "Check Verification Status" button to confirm your email is verified.</p>
              </div>
            </div>
          )}
          
          {currentUser.emailVerified && (
            <div style={{ marginTop: '1rem' }}>
              <Link to="/login" className="btn btn-success">
                Proceed to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;