// src/components/Auth/Login.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { currentUser, login, userProfile, sendVerificationEmail } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResendOption, setShowResendOption] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from registration or verification
  React.useEffect(() => {
    if (location.state?.message) {
      setResendMessage(location.state.message);
    }
  }, [location]);

  React.useEffect(() => {
    if (currentUser && userProfile) {
      redirectBasedOnRole();
    }
  }, [currentUser, userProfile]);

  const redirectBasedOnRole = () => {
    if (!userProfile) return;
    
    switch (userProfile.role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'institution':
        navigate('/institution/dashboard');
        break;
      case 'company':
        navigate('/company/dashboard');
        break;
      case 'student':
        navigate('/student/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResendMessage('');
    setShowResendOption(false);

    try {
      await login(formData.email, formData.password);
      // The useEffect will handle redirection after userProfile is loaded
    } catch (error) {
      setError(error.message);
      
      // Show resend option if the error is about unverified email
      if (error.message.includes('verify your email')) {
        setShowResendOption(true);
      }
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage('');
    
    try {
      // For resending verification, the user needs to be signed in first
      // This is a limitation of Firebase - we need to sign in temporarily
      const userCredential = await login(formData.email, formData.password);
      if (userCredential && !userCredential.emailVerified) {
        await sendVerificationEmail();
        setResendMessage('Verification email sent! Please check your inbox.');
        setShowResendOption(false);
      }
    } catch (error) {
      setResendMessage('Failed to send verification email: ' + error.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <div className="card-header">
          <h2 className="card-title">Login</h2>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          {resendMessage && (
            <div className={resendMessage.includes('Failed') ? "alert alert-error" : "alert alert-success"}>
              {resendMessage}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {showResendOption && (
            <button 
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;