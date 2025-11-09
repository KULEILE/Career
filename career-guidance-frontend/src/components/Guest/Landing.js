import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllCourses, getAllJobs } from '../../services/api';
import Loading from '../Common/Loading';

const Landing = () => {
  const { isAuthenticated, userRole } = useAuth();
  const [courses, setCourses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesResponse, jobsResponse] = await Promise.all([
          getAllCourses(),
          getAllJobs()
        ]);
        
        // Safe data extraction with fallbacks
        const coursesData = coursesResponse?.data?.courses || [];
        const jobsData = jobsResponse?.data?.jobs || [];
        
        setCourses(coursesData.slice(0, 6));
        setJobs(jobsData.slice(0, 6));
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set empty arrays on error to prevent further issues
        setCourses([]);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading message="Loading platform data..." />;
  }

  return (
    <div className="container">
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '4rem 0', borderBottom: '1px solid #cccccc' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Career Guidance Platform
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: '#666666' }}>
          Discover higher learning institutions, find your perfect course, and launch your career in Lesotho
        </p>
        
        {!isAuthenticated ? (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
              Get Started
            </Link>
            <Link to="/eligibility-check" className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
              Check Course Eligibility
            </Link>
          </div>
        ) : (
          <div>
            <h3>Welcome back! Continue to your dashboard</h3>
            <Link 
              to={`/${userRole}/dashboard`} 
              className="btn btn-primary"
              style={{ fontSize: '1.1rem', padding: '1rem 2rem', marginTop: '1rem' }}
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 0', borderBottom: '1px solid #cccccc' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>How It Works</h2>
        <div className="row">
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>For Students</h3>
              <p>Discover courses, check eligibility, apply to institutions, and find employment opportunities after graduation.</p>
            </div>
          </div>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>For Institutions</h3>
              <p>Manage courses, review applications, admit students, and publish admission results efficiently.</p>
            </div>
          </div>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>For Companies</h3>
              <p>Post job opportunities, find qualified candidates, and connect with talented graduates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section style={{ padding: '4rem 0', borderBottom: '1px solid #cccccc' }}>
        <h2 style={{ marginBottom: '2rem' }}>Featured Courses</h2>
        <div className="row">
          {courses.length > 0 ? (
            courses.map(course => (
              <div key={course.id} className="col-6">
                <div className="card">
                  <h4>{course.name || 'Unnamed Course'}</h4>
                  <p>{course.institution?.institutionName || 'Unknown Institution'}</p>
                  <p style={{ color: '#666666', fontSize: '0.9rem' }}>
                    {course.description ? `${course.description.substring(0, 100)}...` : 'No description available'}
                  </p>
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontWeight: 'bold' }}>Duration:</span> {course.duration || 'Not specified'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <p style={{ textAlign: 'center', color: '#666666' }}>No courses available at the moment.</p>
            </div>
          )}
        </div>
        {!isAuthenticated && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/register" className="btn btn-secondary">
              View All Courses
            </Link>
          </div>
        )}
      </section>

      {/* Job Opportunities */}
      <section style={{ padding: '4rem 0' }}>
        <h2 style={{ marginBottom: '2rem' }}>Recent Job Opportunities</h2>
        <div className="row">
          {jobs.length > 0 ? (
            jobs.map(job => (
              <div key={job.id} className="col-6">
                <div className="card">
                  <h4>{job.title || 'Untitled Job'}</h4>
                  <p>{job.company?.companyName || 'Unknown Company'}</p>
                  <p style={{ color: '#666666', fontSize: '0.9rem' }}>
                    {job.description ? `${job.description.substring(0, 100)}...` : 'No description available'}
                  </p>
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontWeight: 'bold' }}>Location:</span> {job.location || 'Not specified'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <p style={{ textAlign: 'center', color: '#666666' }}>No job opportunities available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;