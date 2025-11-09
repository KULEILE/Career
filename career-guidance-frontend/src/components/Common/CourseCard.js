import React from 'react';

const CourseCard = ({ course, onApply, applied = false, applying = false }) => {
  return (
    <div className="card">
      <h4>{course.name}</h4>
      <p><strong>Institution:</strong> {course.institution?.institutionName}</p>
      <p><strong>Duration:</strong> {course.duration}</p>
      <p><strong>Faculty:</strong> {course.faculty}</p>
      
      <p style={{ color: '#666666', fontSize: '0.9rem', marginTop: '1rem' }}>
        {course.description?.substring(0, 150)}...
      </p>
      
      <div style={{ marginTop: '1rem' }}>
        <strong>Requirements:</strong>
        <ul>
          {course.requirements?.subjects?.map((subject, idx) => (
            <li key={idx}>
              {subject}: Minimum {course.requirements.minGrades[subject]}
            </li>
          ))}
        </ul>
      </div>

      {course.tuitionFee && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Tuition Fee:</strong> {course.tuitionFee}
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        {applied ? (
          <button className="btn btn-secondary" disabled>
            Already Applied
          </button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={applying}
            onClick={() => onApply(course)}
          >
            {applying ? 'Applying...' : 'Apply Now'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCard;