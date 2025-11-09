import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        Career Guidance Platform
      </Link>
      
      <div className="nav-links">
        {!currentUser ? (
          <>
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/eligibility-check" className="nav-link">Check Eligibility</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        ) : (
          <>
            <div className="nav-user">
              <span>Welcome, {userProfile?.firstName}</span>
              <span>({userProfile?.role})</span>
            </div>
            {userProfile?.role === 'student' && (
              <Link to="/student/dashboard" className="nav-link">Dashboard</Link>
            )}
            {userProfile?.role === 'institution' && (
              <Link to="/institution/dashboard" className="nav-link">Dashboard</Link>
            )}
            {userProfile?.role === 'company' && (
              <Link to="/company/dashboard" className="nav-link">Dashboard</Link>
            )}
            {userProfile?.role === 'admin' && (
              <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
            )}
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;