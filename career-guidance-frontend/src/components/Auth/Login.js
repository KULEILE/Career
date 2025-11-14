import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login, authLoading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user, profile } = await login(formData.email, formData.password);

      if (profile && profile.role) {
        redirectBasedOnRole(profile.role);
      } else {
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const redirectBasedOnRole = (role) => {
    switch (role) {
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

  const isLoginDisabled = loading || authLoading;

  // Spinner CSS
  const spinnerStyle = { display: 'inline-block', animation: 'spin 1s linear infinite' };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <div className="card-header"><h2 className="card-title">Login</h2></div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error" style={{ backgroundColor:'#f8d7da', color:'#721c24', padding:'0.75rem', borderRadius:'0.375rem', marginBottom:'1rem', border:'1px solid #f5c6cb' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoginDisabled}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoginDisabled}
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit"
            className="btn btn-primary"
            disabled={isLoginDisabled}
            style={{ width:'100%', opacity: isLoginDisabled ? 0.6 : 1, cursor: isLoginDisabled ? 'not-allowed' : 'pointer' }}
          >
            {isLoginDisabled ? <span><span style={spinnerStyle}></span> Logging in...</span> : 'Login'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:'1rem' }}>
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>

        {(loading || authLoading) && (
          <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 }}>
            <div style={{ backgroundColor:'white', padding:'2rem', borderRadius:'0.5rem', textAlign:'center' }}>
              <div style={{ fontSize:'2rem', marginBottom:'1rem' }}></div>
              <p>Logging you in...</p>
              <p style={{ fontSize:'0.875rem', color:'#666' }}>Redirecting to your dashboard</p>
            </div>
          </div>
        )}
      </div>

      <style>
        {`@keyframes spin {0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);}}`}
      </style>
    </div>
  );
};

export default Login;
