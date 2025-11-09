import React, { useState, useEffect } from 'react';
import { getCompanyJobs, createJob } from '../../services/api';
import JobCard from '../Common/JobCard';
import Loading from '../Common/Loading';

const JobManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: [''],
    qualifications: [''],
    location: '',
    salary: '',
    jobType: 'full-time',
    deadline: '',
    minAcademicScore: '',
    requiredCertificates: [''],
    minWorkExperience: '',
    requiredSkills: ['']
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await getCompanyJobs();
      setJobs(response.data.jobs);
    } catch (error) {
      setError('Error loading jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');
    setError('');

    // Filter out empty requirements and qualifications
    const filteredJob = {
      ...newJob,
      requirements: newJob.requirements.filter(req => req.trim() !== ''),
      qualifications: newJob.qualifications.filter(qual => qual.trim() !== ''),
      requiredCertificates: newJob.requiredCertificates.filter(cert => cert.trim() !== ''),
      requiredSkills: newJob.requiredSkills.filter(skill => skill.trim() !== ''),
      deadline: new Date(newJob.deadline).toISOString(),
      minAcademicScore: newJob.minAcademicScore ? parseInt(newJob.minAcademicScore) : 0,
      minWorkExperience: newJob.minWorkExperience ? parseInt(newJob.minWorkExperience) : 0
    };

    try {
      await createJob(filteredJob);
      setMessage('Job created successfully');
      setNewJob({
        title: '',
        description: '',
        requirements: [''],
        qualifications: [''],
        location: '',
        salary: '',
        jobType: 'full-time',
        deadline: '',
        minAcademicScore: '',
        requiredCertificates: [''],
        minWorkExperience: '',
        requiredSkills: ['']
      });
      setShowForm(false);
      fetchJobs();
    } catch (error) {
      setError(error.response?.data?.error || 'Error creating job');
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewJob(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setNewJob(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const addArrayItem = (field) => {
    setNewJob(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setNewJob(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  if (loading) return <Loading message="Loading jobs..." />;

  const activeJobs = jobs.filter(job => job.active).length;
  const expiredJobs = jobs.filter(job => new Date(job.deadline) < new Date()).length;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">Job Management</h2>
            <p>Create and manage your job postings</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Post New Job'}
          </button>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Statistics */}
        <div className="row" style={{ marginBottom: '2rem' }}>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{jobs.length}</h3>
              <p>Total Jobs</p>
            </div>
          </div>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{activeJobs}</h3>
              <p>Active Jobs</p>
            </div>
          </div>
          <div className="col-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3>{expiredJobs}</h3>
              <p>Expired Jobs</p>
            </div>
          </div>
        </div>

        {/* Add Job Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3>Post New Job</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  value={newJob.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  value={newJob.description}
                  onChange={handleChange}
                  rows="4"
                  required
                />
              </div>

              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      name="location"
                      className="form-control"
                      value={newJob.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Job Type</label>
                    <select
                      name="jobType"
                      className="form-select"
                      value={newJob.jobType}
                      onChange={handleChange}
                      required
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Salary</label>
                    <input
                      type="text"
                      name="salary"
                      className="form-control"
                      value={newJob.salary}
                      onChange={handleChange}
                      placeholder="e.g., M10,000 - M15,000"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Application Deadline</label>
                    <input
                      type="date"
                      name="deadline"
                      className="form-control"
                      value={newJob.deadline}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* Qualification Criteria */}
              <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#f8f9fa' }}>
                <h4>Qualification Criteria</h4>
                
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Minimum Academic Score (%)</label>
                      <input
                        type="number"
                        name="minAcademicScore"
                        className="form-control"
                        value={newJob.minAcademicScore}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        placeholder="e.g., 70"
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Minimum Work Experience (years)</label>
                      <input
                        type="number"
                        name="minWorkExperience"
                        className="form-control"
                        value={newJob.minWorkExperience}
                        onChange={handleChange}
                        min="0"
                        placeholder="e.g., 2"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Required Certificates</label>
                  {newJob.requiredCertificates.map((certificate, index) => (
                    <div key={index} className="row" style={{ marginBottom: '0.5rem' }}>
                      <div className="col-10">
                        <input
                          type="text"
                          className="form-control"
                          value={certificate}
                          onChange={(e) => handleArrayChange('requiredCertificates', index, e.target.value)}
                          placeholder="e.g., Microsoft Certified Professional"
                        />
                      </div>
                      <div className="col-2">
                        {newJob.requiredCertificates.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => removeArrayItem('requiredCertificates', index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => addArrayItem('requiredCertificates')}
                  >
                    Add Certificate
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Required Skills</label>
                  {newJob.requiredSkills.map((skill, index) => (
                    <div key={index} className="row" style={{ marginBottom: '0.5rem' }}>
                      <div className="col-10">
                        <input
                          type="text"
                          className="form-control"
                          value={skill}
                          onChange={(e) => handleArrayChange('requiredSkills', index, e.target.value)}
                          placeholder="e.g., JavaScript, Project Management"
                        />
                      </div>
                      <div className="col-2">
                        {newJob.requiredSkills.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => removeArrayItem('requiredSkills', index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => addArrayItem('requiredSkills')}
                  >
                    Add Skill
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Requirements</label>
                {newJob.requirements.map((requirement, index) => (
                  <div key={index} className="row" style={{ marginBottom: '0.5rem' }}>
                    <div className="col-10">
                      <input
                        type="text"
                        className="form-control"
                        value={requirement}
                        onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                        placeholder="e.g., 2+ years of experience in..."
                      />
                    </div>
                    <div className="col-2">
                      {newJob.requirements.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removeArrayItem('requirements', index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => addArrayItem('requirements')}
                >
                  Add Requirement
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Qualifications</label>
                {newJob.qualifications.map((qualification, index) => (
                  <div key={index} className="row" style={{ marginBottom: '0.5rem' }}>
                    <div className="col-10">
                      <input
                        type="text"
                        className="form-control"
                        value={qualification}
                        onChange={(e) => handleArrayChange('qualifications', index, e.target.value)}
                        placeholder="e.g., Bachelor's degree in Computer Science"
                      />
                    </div>
                    <div className="col-2">
                      {newJob.qualifications.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removeArrayItem('qualifications', index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => addArrayItem('qualifications')}
                >
                  Add Qualification
                </button>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Job Posting'}
              </button>
            </form>
          </div>
        )}

        {/* Jobs List */}
        <h3>Your Job Postings ({jobs.length})</h3>
        {jobs.length === 0 ? (
          <div className="alert alert-info">
            No job postings found. Create your first job posting to get started.
          </div>
        ) : (
          <div className="row">
            {jobs.map(job => (
              <div key={job.id} className="col-6">
                <JobCard
                  job={job}
                  showApplicants={true}
                  showQualifiedApplicants={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobManagement;