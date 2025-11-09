import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getJob, getJobApplicants, getQualifiedApplicants } from '../../services/api';
import Loading from '../Common/Loading';

const JobPosting = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [qualifiedApplicants, setQualifiedApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [qualifiedLoading, setQualifiedLoading] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);
  const [showQualified, setShowQualified] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await getJob(jobId);
      setJob(response.data.job);
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async () => {
    setApplicantsLoading(true);
    try {
      const response = await getJobApplicants(jobId);
      setApplicants(response.data.applicants);
      setShowApplicants(true);
      setActiveTab('all');
    } catch (error) {
      console.error('Error loading applicants:', error);
    } finally {
      setApplicantsLoading(false);
    }
  };

  const fetchQualifiedApplicants = async () => {
    setQualifiedLoading(true);
    try {
      const response = await getQualifiedApplicants(jobId);
      setQualifiedApplicants(response.data.applicants);
      setShowQualified(true);
      setActiveTab('qualified');
    } catch (error) {
      console.error('Error loading qualified applicants:', error);
    } finally {
      setQualifiedLoading(false);
    }
  };

  if (loading) return <Loading message="Loading job details..." />;
  if (!job) return <div className="alert alert-error">Job not found</div>;

  const isExpired = new Date(job.deadline) < new Date();

  const getMatchScoreColor = (score) => {
    if (score >= 80) return '#28a745';
    if (score >= 70) return '#20c997';
    if (score >= 60) return '#ffc107';
    return '#dc3545';
  };

  const renderApplicantCard = (applicant, isQualified = false) => (
    <div key={applicant.id} className="col-6">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <h4>{applicant.student?.firstName} {applicant.student?.lastName}</h4>
          {applicant.matchScore && (
            <span style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              backgroundColor: getMatchScoreColor(applicant.matchScore),
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}>
              {applicant.matchScore}% Match
            </span>
          )}
        </div>
        
        <p><strong>Email:</strong> {applicant.student?.email}</p>
        
        {applicant.student?.phone && (
          <p><strong>Phone:</strong> {applicant.student.phone}</p>
        )}

        {applicant.student?.highSchool && (
          <p><strong>Education:</strong> {applicant.student.highSchool}</p>
        )}

        {applicant.student?.academicScore && (
          <p><strong>Academic Score:</strong> {applicant.student.academicScore}%</p>
        )}

        {applicant.student?.workExperience && (
          <p><strong>Work Experience:</strong> {applicant.student.workExperience} years</p>
        )}

        {applicant.student?.certificates && applicant.student.certificates.length > 0 && (
          <p>
            <strong>Certificates:</strong> {applicant.student.certificates.join(', ')}
          </p>
        )}

        {applicant.student?.skills && applicant.student.skills.length > 0 && (
          <p>
            <strong>Skills:</strong> {applicant.student.skills.join(', ')}
          </p>
        )}

        {applicant.student?.hasTranscript && (
          <div style={{ marginTop: '1rem' }}>
            <a 
              href={applicant.student.transcriptUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              View Transcript
            </a>
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <strong>Applied:</strong> {new Date(applicant.appliedAt).toLocaleDateString()}
        </div>

        {isQualified && applicant.interviewReady && (
          <div style={{ 
            marginTop: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '4px'
          }}>
            <strong style={{ color: '#155724' }}>Ready for Interview</strong>
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-success btn-sm">
            Shortlist
          </button>
          <button className="btn btn-info btn-sm">
            Contact
          </button>
          <button className="btn btn-warning btn-sm">
            Schedule Interview
          </button>
          <button className="btn btn-danger btn-sm">
            Reject
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{job.title}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p>Job Details and Applicant Management</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-primary"
                onClick={fetchApplicants}
                disabled={applicantsLoading}
              >
                {applicantsLoading ? 'Loading...' : 'View All Applicants'}
              </button>
              <button
                className="btn btn-success"
                onClick={fetchQualifiedApplicants}
                disabled={qualifiedLoading}
              >
                {qualifiedLoading ? 'Loading...' : 'View Qualified Applicants'}
              </button>
            </div>
          </div>
        </div>

        {/* Job Details */}
        {activeTab === 'details' && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>Job Information</h3>
            <div className="row">
              <div className="col-6">
                <p><strong>Company:</strong> {job.company?.companyName}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Job Type:</strong> {job.jobType}</p>
              </div>
              <div className="col-6">
                <p><strong>Posted:</strong> {new Date(job.createdAt).toLocaleDateString()}</p>
                <p><strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}</p>
                <p>
                  <strong>Status:</strong> 
                  <span style={{ 
                    marginLeft: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: job.active && !isExpired ? '#28a745' : '#dc3545',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}>
                    {job.active && !isExpired ? 'ACTIVE' : isExpired ? 'EXPIRED' : 'INACTIVE'}
                  </span>
                </p>
              </div>
            </div>

            {job.salary && (
              <p><strong>Salary:</strong> {job.salary}</p>
            )}

            {/* Qualification Criteria */}
            {(job.minAcademicScore || job.minWorkExperience || job.requiredCertificates?.length > 0 || job.requiredSkills?.length > 0) && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4>Qualification Criteria</h4>
                <div className="row">
                  {job.minAcademicScore && (
                    <div className="col-3">
                      <p><strong>Min Academic Score:</strong> {job.minAcademicScore}%</p>
                    </div>
                  )}
                  {job.minWorkExperience && (
                    <div className="col-3">
                      <p><strong>Min Experience:</strong> {job.minWorkExperience} years</p>
                    </div>
                  )}
                  {job.requiredCertificates?.length > 0 && (
                    <div className="col-6">
                      <p><strong>Required Certificates:</strong> {job.requiredCertificates.join(', ')}</p>
                    </div>
                  )}
                </div>
                {job.requiredSkills?.length > 0 && (
                  <p><strong>Required Skills:</strong> {job.requiredSkills.join(', ')}</p>
                )}
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <strong>Job Description:</strong>
              <p style={{ color: '#666666', whiteSpace: 'pre-wrap' }}>{job.description}</p>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <strong>Requirements:</strong>
              <ul>
                {job.requirements?.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <strong>Qualifications:</strong>
              <ul>
                {job.qualifications?.map((qual, idx) => (
                  <li key={idx}>{qual}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Applicants Section */}
        {(showApplicants || showQualified) && (
          <div className="card">
            <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6', marginBottom: '1rem' }}>
              <button
                className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setActiveTab('all')}
                style={{ marginRight: '1rem' }}
              >
                All Applicants ({applicants.length})
              </button>
              <button
                className={`btn ${activeTab === 'qualified' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => setActiveTab('qualified')}
              >
                Qualified Applicants ({qualifiedApplicants.length})
              </button>
            </div>

            {activeTab === 'all' && (
              <>
                <h3>All Applicants ({applicants.length})</h3>
                {applicantsLoading ? (
                  <Loading message="Loading applicants..." />
                ) : applicants.length === 0 ? (
                  <div className="alert alert-info">
                    No applicants for this job yet.
                  </div>
                ) : (
                  <div className="row">
                    {applicants.map(applicant => renderApplicantCard(applicant))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'qualified' && (
              <>
                <h3>Qualified Applicants ({qualifiedApplicants.length})</h3>
                {qualifiedLoading ? (
                  <Loading message="Loading qualified applicants..." />
                ) : qualifiedApplicants.length === 0 ? (
                  <div className="alert alert-info">
                    No qualified applicants found. The system automatically filters applicants based on academic performance, certificates, and work experience.
                  </div>
                ) : (
                  <>
                    <div className="alert alert-success">
                      <strong>These applicants meet your qualification criteria and are ready for interview consideration.</strong>
                      <br />
                      They have been automatically filtered based on academic performance, certificates, and work experience.
                    </div>
                    <div className="row">
                      {qualifiedApplicants.map(applicant => renderApplicantCard(applicant, true))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Management Actions */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>Job Management</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">
              Edit Job
            </button>
            <button className="btn btn-warning">
              {job.active ? 'Deactivate' : 'Activate'}
            </button>
            <button className="btn btn-danger">
              Delete Job
            </button>
            <button className="btn btn-secondary">
              Extend Deadline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPosting;