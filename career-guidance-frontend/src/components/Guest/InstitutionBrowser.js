import React, { useState, useEffect } from 'react';
import { getInstitutions, getInstitutionCoursesPublic } from '../../services/api';
import InstitutionCard from '../Common/InstitutionCard';
import CourseCard from '../Common/CourseCard';
import Loading from '../Common/Loading';

const InstitutionBrowser = () => {
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const response = await getInstitutions();
      setInstitutions(response.data.institutions);
    } catch (error) {
      console.error('Error loading institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstitutionSelect = async (institution) => {
    setSelectedInstitution(institution);
    setCoursesLoading(true);
    
    try {
      const response = await getInstitutionCoursesPublic(institution.id);
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  if (loading) return <Loading message="Loading institutions..." />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Browse Institutions</h2>
          <p>Discover higher learning institutions in Lesotho and their courses</p>
        </div>

        {/* Institutions List */}
        <div className="row">
          {institutions.map(institution => (
            <div key={institution.id} className="col-6">
              <div 
                className="card" 
                style={{ 
                  cursor: 'pointer',
                  border: selectedInstitution?.id === institution.id ? '2px solid #000000' : '1px solid #cccccc'
                }}
                onClick={() => handleInstitutionSelect(institution)}
              >
                <h4>{institution.institutionName}</h4>
                <p style={{ color: '#666666', fontSize: '0.9rem' }}>
                  {institution.description?.substring(0, 150)}...
                </p>
                
                {institution.contactInfo && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Contact:</strong>
                    <p style={{ fontSize: '0.9rem', color: '#666666' }}>
                      {institution.contactInfo.email}
                      {institution.contactInfo.phone && ` | ${institution.contactInfo.phone}`}
                    </p>
                  </div>
                )}

                <div style={{ marginTop: '1rem' }}>
                  <button className="btn btn-primary btn-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {institutions.length === 0 && (
          <div className="alert alert-info">
            No institutions found. Please check back later.
          </div>
        )}
      </div>

      {/* Selected Institution Courses */}
      {selectedInstitution && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-header">
            <h3>Courses at {selectedInstitution.institutionName}</h3>
            <p>Available programs and courses</p>
          </div>

          {coursesLoading ? (
            <Loading message="Loading courses..." />
          ) : (
            <div className="row">
              {courses.map(course => (
                <div key={course.id} className="col-6">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          )}

          {!coursesLoading && courses.length === 0 && (
            <div className="alert alert-info">
              No courses available for this institution at the moment.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstitutionBrowser;