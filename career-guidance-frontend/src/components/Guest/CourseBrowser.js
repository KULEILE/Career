import React, { useState, useEffect } from 'react';
import { getAllCourses } from '../../services/api';
import CourseCard from '../Common/CourseCard';
import Loading from '../Common/Loading';

const GuestCourseBrowser = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    institution: '',
    faculty: '',
    search: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, filters]);

  const fetchCourses = async () => {
    try {
      const response = await getAllCourses();
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (filters.institution) {
      filtered = filtered.filter(course => 
        course.institution?.institutionName?.toLowerCase().includes(filters.institution.toLowerCase())
      );
    }

    if (filters.faculty) {
      filtered = filtered.filter(course => 
        course.faculty?.toLowerCase().includes(filters.faculty.toLowerCase())
      );
    }

    if (filters.search) {
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  };

  const getUniqueInstitutions = () => {
    const institutions = courses.map(course => course.institution?.institutionName).filter(Boolean);
    return [...new Set(institutions)];
  };

  const getUniqueFaculties = () => {
    const faculties = courses.map(course => course.faculty).filter(Boolean);
    return [...new Set(faculties)];
  };

  if (loading) return <Loading message="Loading courses..." />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Browse All Courses</h2>
          <p>Discover courses from various institutions in Lesotho</p>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Filter Courses</h3>
          <div className="row">
            <div className="col-4">
              <div className="form-group">
                <label className="form-label">Search</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search course names or descriptions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            <div className="col-4">
              <div className="form-group">
                <label className="form-label">Institution</label>
                <select
                  className="form-select"
                  value={filters.institution}
                  onChange={(e) => setFilters(prev => ({ ...prev, institution: e.target.value }))}
                >
                  <option value="">All Institutions</option>
                  {getUniqueInstitutions().map(institution => (
                    <option key={institution} value={institution}>
                      {institution}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-4">
              <div className="form-group">
                <label className="form-label">Faculty</label>
                <select
                  className="form-select"
                  value={filters.faculty}
                  onChange={(e) => setFilters(prev => ({ ...prev, faculty: e.target.value }))}
                >
                  <option value="">All Faculties</option>
                  {getUniqueFaculties().map(faculty => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <h3>
          Available Courses ({filteredCourses.length})
          {filters.institution || filters.faculty || filters.search ? ' (Filtered)' : ''}
        </h3>

        {filteredCourses.length === 0 ? (
          <div className="alert alert-info">
            No courses found matching your filters. Try adjusting your search criteria.
          </div>
        ) : (
          <div className="row">
            {filteredCourses.map(course => (
              <div key={course.id} className="col-6">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="card" style={{ marginTop: '2rem', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
          <h4>Ready to Apply?</h4>
          <p>Create an account to start your application process and track your admissions.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <a href="/register" className="btn btn-primary">Register Now</a>
            <a href="/eligibility-check" className="btn btn-secondary">Check Eligibility</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestCourseBrowser;