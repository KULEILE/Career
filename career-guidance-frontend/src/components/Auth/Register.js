import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { currentUser, register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'student',
    // Single name field for institutions and companies
    organizationName: '',
    // Student-specific fields
    dateOfBirth: '',
    phone: '',
    highSchool: '',
    graduationYear: '',
    // Institution/Company contact requirements
    contactPhone: '',
    contactEmail: '',
    location: '',
    slogan: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[A-Za-z\s'-]+$/;
    return nameRegex.test(name) && name.length >= 2;
  };

  const validateOrganizationName = (name) => {
    const orgRegex = /^[A-Za-z0-9\s\-&.,()']+$/;
    return orgRegex.test(name) && name.length >= 2;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validatePhone = (phone) => {
    // Enhanced phone validation - allows any numeric format with optional +, spaces, hyphens, parentheses
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,20}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(phone) && cleanPhone.length >= 8 && cleanPhone.length <= 15;
  };

  const validateYear = (year) => {
    const currentYear = new Date().getFullYear();
    return year >= 2000 && year <= currentYear + 5;
  };

  const validateDateOfBirth = (date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 100);
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 13);
    
    return birthDate >= minDate && birthDate <= maxDate;
  };

  const validateLocation = (location) => {
    return location.length >= 3;
  };

  const validateSlogan = (slogan) => {
    return slogan.length >= 5 && slogan.length <= 100;
  };

  const validateDescription = (description) => {
    return description.length >= 10 && description.length <= 500;
  };

  // Real-time validation handlers
  const handleNameChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = value.replace(/[^A-Za-z\s'-]/g, '');
    
    setFormData(prev => ({
      ...prev,
      [name]: filteredValue
    }));

    if (value && !validateName(value)) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: 'Name can only contain letters, spaces, hyphens, and apostrophes'
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleOrganizationNameChange = (e) => {
    const { value } = e.target;
    const filteredValue = value.replace(/[^A-Za-z0-9\s\-&.,()']/g, '');
    
    setFormData(prev => ({
      ...prev,
      organizationName: filteredValue
    }));

    if (value && !validateOrganizationName(value)) {
      setFieldErrors(prev => ({
        ...prev,
        organizationName: 'Organization name can only contain letters, numbers, spaces, and common punctuation'
      }));
    } else if (value && value.length < 2) {
      setFieldErrors(prev => ({
        ...prev,
        organizationName: 'Organization name must be at least 2 characters long'
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        organizationName: ''
      }));
    }
  };

  const handleEmailChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      email: value
    }));

    if (value && !validateEmail(value)) {
      setFieldErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        email: ''
      }));
    }
  };

  const handleContactEmailChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      contactEmail: value
    }));

    if (value && !validateEmail(value)) {
      setFieldErrors(prev => ({
        ...prev,
        contactEmail: 'Please enter a valid contact email address'
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        contactEmail: ''
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (value && !validatePassword(value)) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: 'Password must be at least 6 characters long'
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    // Allow only numbers, +, spaces, hyphens, and parentheses
    const filteredValue = value.replace(/[^\d\s+\-\(\)]/g, '');
    
    setFormData(prev => ({
      ...prev,
      [name]: filteredValue
    }));

    // Real-time validation
    if (filteredValue && !validatePhone(filteredValue)) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: 'Please enter a valid phone number (8-15 digits, may include +, spaces, hyphens, parentheses)'
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleYearChange = (e) => {
    const { value } = e.target;
    const filteredValue = value.replace(/\D/g, '');
    
    setFormData(prev => ({
      ...prev,
      graduationYear: filteredValue
    }));

    if (value && !validateYear(parseInt(value))) {
      setFieldErrors(prev => ({
        ...prev,
        graduationYear: 'Please enter a valid graduation year (2000 - current year + 5)'
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        graduationYear: ''
      }));
    }
  };

  const handleDateOfBirthChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      dateOfBirth: value
    }));

    if (value && !validateDateOfBirth(value)) {
      setFieldErrors(prev => ({
        ...prev,
        dateOfBirth: 'You must be at least 13 years old and not older than 100 years'
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        dateOfBirth: ''
      }));
    }
  };

  const handleLocationChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: value
    }));

    if (value && !validateLocation(value)) {
      setFieldErrors(prev => ({
        ...prev,
        location: 'Location must be at least 3 characters long'
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        location: ''
      }));
    }
  };

  const handleSloganChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      slogan: value
    }));

    if (value && !validateSlogan(value)) {
      setFieldErrors(prev => ({
        ...prev,
        slogan: 'Slogan must be between 5 and 100 characters long'
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        slogan: ''
      }));
    }
  };

  const handleDescriptionChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      description: value
    }));

    if (value && !validateDescription(value)) {
      setFieldErrors(prev => ({
        ...prev,
        description: 'Description must be between 10 and 500 characters long'
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        description: ''
      }));
    }
  };

  const handleRoleChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      role: value,
      // Clear role-specific fields when changing roles
      organizationName: '',
      contactPhone: '',
      contactEmail: '',
      location: '',
      slogan: '',
      description: ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Use specific handlers for certain fields
    switch (name) {
      case 'firstName':
      case 'lastName':
        handleNameChange(e);
        break;
      case 'organizationName':
        handleOrganizationNameChange(e);
        break;
      case 'email':
        handleEmailChange(e);
        break;
      case 'contactEmail':
        handleContactEmailChange(e);
        break;
      case 'password':
      case 'confirmPassword':
        handlePasswordChange(e);
        break;
      case 'phone':
      case 'contactPhone':
        handlePhoneChange(e);
        break;
      case 'graduationYear':
        handleYearChange(e);
        break;
      case 'dateOfBirth':
        handleDateOfBirthChange(e);
        break;
      case 'location':
        handleLocationChange(e);
        break;
      case 'slogan':
        handleSloganChange(e);
        break;
      case 'description':
        handleDescriptionChange(e);
        break;
      case 'role':
        handleRoleChange(e);
        break;
      default:
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Basic validations - only require first/last name for student role
    if (formData.role === 'student') {
      if (!validateName(formData.firstName)) {
        errors.firstName = 'First name is required and can only contain letters';
      }

      if (!validateName(formData.lastName)) {
        errors.lastName = 'Last name is required and can only contain letters';
      }
    }

    if (!validateEmail(formData.email)) {
      errors.email = 'Valid email is required';
    }

    if (!validatePassword(formData.password)) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Role-specific validations
    if ((formData.role === 'institution' || formData.role === 'company') && !formData.organizationName) {
      errors.organizationName = `${formData.role === 'institution' ? 'Institution' : 'Company'} name is required`;
    }

    // Institution/Company contact requirements
    if (formData.role === 'institution' || formData.role === 'company') {
      if (!formData.contactPhone) {
        errors.contactPhone = 'Contact phone number is required';
      } else if (!validatePhone(formData.contactPhone)) {
        errors.contactPhone = 'Please enter a valid phone number (8-15 digits, may include +, spaces, hyphens, parentheses)';
      }

      if (!formData.contactEmail) {
        errors.contactEmail = 'Contact email is required';
      } else if (!validateEmail(formData.contactEmail)) {
        errors.contactEmail = 'Please enter a valid contact email address';
      }

      if (!formData.location) {
        errors.location = 'Location is required';
      } else if (!validateLocation(formData.location)) {
        errors.location = 'Location must be at least 3 characters long';
      }

      if (!formData.slogan) {
        errors.slogan = 'Slogan is required';
      } else if (!validateSlogan(formData.slogan)) {
        errors.slogan = 'Slogan must be between 5 and 100 characters long';
      }

      if (!formData.description) {
        errors.description = 'Description is required';
      } else if (!validateDescription(formData.description)) {
        errors.description = 'Description must be between 10 and 500 characters long';
      }
    }

    // Student-specific validations
    if (formData.role === 'student') {
      if (!formData.dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required';
      } else if (!validateDateOfBirth(formData.dateOfBirth)) {
        errors.dateOfBirth = 'You must be at least 13 years old';
      }

      if (!formData.phone) {
        errors.phone = 'Phone number is required';
      } else if (!validatePhone(formData.phone)) {
        errors.phone = 'Please enter a valid phone number (8-15 digits, may include +, spaces, hyphens, parentheses)';
      }

      if (!formData.highSchool) {
        errors.highSchool = 'High school name is required';
      }

      if (!formData.graduationYear) {
        errors.graduationYear = 'Graduation year is required';
      } else if (!validateYear(parseInt(formData.graduationYear))) {
        errors.graduationYear = 'Please enter a valid graduation year';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      setError('Please fix the errors in the form before submitting');
      return;
    }

    try {
      // Format the data properly before sending
      const registrationData = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await register(registrationData);
      
      // Redirect based on role
      switch (formData.role) {
        case 'institution':
          navigate('/institution/dashboard');
          break;
        case 'company':
          navigate('/company/dashboard');
          break;
        default:
          navigate('/student/dashboard');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = Object.values(fieldErrors).some(error => error !== '');
  const showPersonalNameFields = formData.role === 'student';

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card-header">
          <h2 className="card-title">Register</h2>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          
          {/* Only show first/last name fields for student role */}
          {showPersonalNameFields && (
            <div className="row">
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    className="form-control"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    maxLength="50"
                    placeholder="Enter your first name"
                  />
                  {fieldErrors.firstName && (
                    <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {fieldErrors.firstName}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-6">
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    className="form-control"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    maxLength="50"
                    placeholder="Enter your last name"
                  />
                  {fieldErrors.lastName && (
                    <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {fieldErrors.lastName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email address"
            />
            {fieldErrors.email && (
              <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {fieldErrors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Role *</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="student">Student</option>
              <option value="institution">Institution</option>
              <option value="company">Company</option>
            </select>
          </div>

          {/* Single organization name for both institutions and companies */}
          {(formData.role === 'institution' || formData.role === 'company') && (
            <div className="form-group">
              <label className="form-label">
                {formData.role === 'institution' ? 'Institution Name *' : 'Company Name *'}
              </label>
              <input
                type="text"
                name="organizationName"
                className="form-control"
                value={formData.organizationName}
                onChange={handleChange}
                required
                maxLength="100"
                placeholder={formData.role === 'institution' ? 'Enter institution name' : 'Enter company name'}
              />
              {fieldErrors.organizationName && (
                <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {fieldErrors.organizationName}
                </div>
              )}
            </div>
          )}

          {/* Student-specific fields */}
          {formData.role === 'student' && (
            <>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      className="form-control"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {fieldErrors.dateOfBirth && (
                      <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {fieldErrors.dateOfBirth}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="e.g., +266 1234 5678 or (123) 456-7890"
                      maxLength="20"
                    />
                    {fieldErrors.phone && (
                      <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {fieldErrors.phone}
                      </div>
                    )}
                    <small style={{ color: '#666666' }}>
                      Enter your phone number (digits only, may include +, spaces, hyphens, parentheses)
                    </small>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">High School *</label>
                <input
                  type="text"
                  name="highSchool"
                  className="form-control"
                  value={formData.highSchool}
                  onChange={handleChange}
                  required
                  maxLength="100"
                  placeholder="Enter your high school name"
                />
                {fieldErrors.highSchool && (
                  <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {fieldErrors.highSchool}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Graduation Year *</label>
                <input
                  type="text"
                  name="graduationYear"
                  className="form-control"
                  value={formData.graduationYear}
                  onChange={handleChange}
                  required
                  maxLength="4"
                  placeholder="2024"
                />
                {fieldErrors.graduationYear && (
                  <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {fieldErrors.graduationYear}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Institution/Company contact requirements */}
          {(formData.role === 'institution' || formData.role === 'company') && (
            <>
              <div className="row">
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Contact Phone *</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      className="form-control"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      required
                      placeholder="e.g., +266 1234 5678 or (123) 456-7890"
                      maxLength="20"
                    />
                    {fieldErrors.contactPhone && (
                      <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {fieldErrors.contactPhone}
                      </div>
                    )}
                    <small style={{ color: '#666666' }}>
                      Enter contact phone number (digits only, may include +, spaces, hyphens, parentheses)
                    </small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="form-group">
                    <label className="form-label">Contact Email *</label>
                    <input
                      type="email"
                      name="contactEmail"
                      className="form-control"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      required
                      placeholder="contact@organization.com"
                    />
                    {fieldErrors.contactEmail && (
                      <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {fieldErrors.contactEmail}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location *</label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  maxLength="100"
                  placeholder="Enter organization location"
                />
                {fieldErrors.location && (
                  <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {fieldErrors.location}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Slogan *</label>
                <input
                  type="text"
                  name="slogan"
                  className="form-control"
                  value={formData.slogan}
                  onChange={handleChange}
                  required
                  maxLength="100"
                  placeholder="Enter a short slogan or tagline"
                />
                {fieldErrors.slogan && (
                  <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {fieldErrors.slogan}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  maxLength="500"
                  placeholder={`Brief description of your ${formData.role === 'institution' ? 'institution' : 'company'} (10-500 characters)`}
                />
                {fieldErrors.description && (
                  <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {fieldErrors.description}
                  </div>
                )}
                <div style={{ color: '#666666', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {formData.description.length}/500 characters
                </div>
              </div>
            </>
          )}

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  placeholder="At least 6 characters"
                />
                {fieldErrors.password && (
                  <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {fieldErrors.password}
                  </div>
                )}
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength="6"
                  placeholder="Confirm your password"
                />
                {fieldErrors.confirmPassword && (
                  <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {fieldErrors.confirmPassword}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || hasErrors}
            style={{ width: '100%' }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;