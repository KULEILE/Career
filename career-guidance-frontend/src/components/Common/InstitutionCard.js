import React from 'react';
import { Link } from 'react-router-dom';

const InstitutionCard = ({ institution }) => {
  return (
    <div className="card">
      <h4>{institution.institutionName}</h4>
      <p style={{ color: '#666666', fontSize: '0.9rem' }}>
        {institution.description?.substring(0, 200)}...
      </p>
      
      {institution.contactInfo && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Contact Information:</strong>
          <ul>
            {institution.contactInfo.email && (
              <li>Email: {institution.contactInfo.email}</li>
            )}
            {institution.contactInfo.phone && (
              <li>Phone: {institution.contactInfo.phone}</li>
            )}
            {institution.contactInfo.website && (
              <li>Website: {institution.contactInfo.website}</li>
            )}
          </ul>
        </div>
      )}

      {institution.address && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Address:</strong>
          <p style={{ fontSize: '0.9rem', color: '#666666' }}>
            {institution.address}
          </p>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <Link 
          to={`/courses/institution/${institution.id}`} 
          className="btn btn-primary"
        >
          View Courses
        </Link>
      </div>
    </div>
  );
};

export default InstitutionCard;