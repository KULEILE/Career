import React, { useState, useEffect } from 'react';
import { getCompanyProfile, updateCompanyProfile } from '../../services/api';
import Loading from '../Common/Loading';

const CompanyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await getCompanyProfile();
      setProfile(response.data.company);
    } catch (error) {
      setError('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateCompanyProfile(profile);
      setMessage('Profile updated successfully');
    } catch (error) {
      setError('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactInfoChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  if (loading) return <Loading message="Loading profile..." />;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Company Profile</h2>
          <p>Update your company information</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {!profile.approved && (
          <div className="alert alert-info">
            Your company account is pending approval. Some features may be limited until approved.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              type="text"
              name="companyName"
              className="form-control"
              value={profile.companyName || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Industry</label>
            <select
              name="industry"
              className="form-select"
              value={profile.industry || ''}
              onChange={handleChange}
              required
            >
              <option value="">Select Industry</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Finance">Finance</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Construction">Construction</option>
              <option value="Transportation">Transportation</option>
              <option value="Energy">Energy</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Government">Government</option>
              <option value="Non-profit">Non-profit</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-control"
              value={profile.description || ''}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your company, mission, and values..."
            />
          </div>

          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={profile.contactInfo?.email || ''}
                  onChange={(e) => handleContactInfoChange('email', e.target.value)}
                />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  value={profile.contactInfo?.phone || ''}
                  onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Website</label>
            <input
              type="url"
              className="form-control"
              value={profile.website || ''}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              name="address"
              className="form-control"
              value={profile.address || ''}
              onChange={handleChange}
              rows="3"
              placeholder="Company headquarters or main office address"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Logo URL</label>
            <input
              type="url"
              name="logoUrl"
              className="form-control"
              value={profile.logoUrl || ''}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompanyProfile;