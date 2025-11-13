import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.config.url);
      return Promise.reject(new Error('Request timeout. Please check your connection.'));
    }

    if (!error.response) {
      console.error('Network error - no response received:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection and ensure the server is running.'));
    }

    if (error.response.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// -------------------- Auth API --------------------
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (loginData) => api.post('/auth/login', loginData);
export const getUserProfile = (token) => {
  if (!token) {
    return Promise.reject(new Error('No token provided'));
  }
  return api.get('/auth/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// -------------------- Student API --------------------
export const getStudentProfile = () => api.get('/students/profile');
export const updateStudentProfile = (data) => api.put('/students/profile', data);
export const getStudentApplications = () => api.get('/students/applications');
export const applyForCourse = (data) => api.post('/students/applications/apply', data);
export const getStudentAdmissions = () => api.get('/students/admissions');
export const getAvailableJobs = () => api.get('/students/jobs');
export const getJobRecommendations = () => api.get('/students/jobs/recommendations');
export const applyForJob = (jobId) => api.post('/students/jobs/apply', { jobId });
export const getStudentJobApplications = () => api.get('/students/jobs/applications');
export const getStudentDocuments = () => api.get('/students/documents');
export const uploadTranscript = (formData) => api.post('/students/transcript', formData);
export const uploadFinalTranscript = (formData) => api.post('/students/transcript/final', formData);
export const uploadCertificate = (formData) => api.post('/students/certificates', formData);
export const markStudiesCompleted = () => api.post('/students/studies/completed');
export const acceptAdmissionOffer = (data) => api.post('/students/admissions/accept', data);
export const getStudentDashboard = () => api.get('/students/dashboard');
export const deleteApplication = (applicationId) => api.delete(`/students/applications/${applicationId}`);
export const deleteDocument = (documentId) => api.delete(`/students/documents/${documentId}`);

// -------------------- Student Notifications API --------------------
export const getStudentNotifications = () => api.get('/students/notifications');
export const markNotificationAsRead = (notificationId) => api.put(`/students/notifications/${notificationId}/read`);
export const markAllNotificationsAsRead = () => api.put('/students/notifications/mark-all-read');

// -------------------- Company API --------------------
export const getCompanyProfile = () => api.get('/companies/profile');
export const updateCompanyProfile = (data) => api.put('/companies/profile', data);
export const createJob = (data) => api.post('/companies/jobs', data);
export const getCompanyJobs = () => api.get('/companies/jobs');
export const getJobApplicants = (jobId, filter = 'all') => api.get(`/companies/jobs/${jobId}/applicants?filter=${filter}`);
export const getInterviewReadyCandidates = () => api.get('/companies/candidates/interview-ready');
export const updateCompanyApplicationStatus = (applicationId, statusData) => api.put(`/companies/applications/${applicationId}/status`, statusData);
export const getCompanyDashboard = () => api.get('/companies/dashboard');
export const getQualifiedApplicants = (jobId) => api.get(`/companies/jobs/${jobId}/qualified-applicants`);

// -------------------- Institution API --------------------
export const getInstitutionProfile = () => api.get('/institutions/profile');
export const updateInstitutionProfile = (data) => api.put('/institutions/profile', data);
export const createCourse = (data) => api.post('/institutions/courses', data);
export const getInstitutionCourses = () => api.get('/institutions/courses');
export const getInstitutionApplications = (courseId) => api.get(`/institutions/applications${courseId ? `?courseId=${courseId}` : ''}`);
export const updateInstitutionApplicationStatus = (applicationId, data) => api.put(`/institutions/applications/${applicationId}`, data);
export const publishAdmissions = (data) => api.post('/institutions/admissions/publish', data);

// -------------------- Institution Faculty API --------------------
export const getInstitutionFaculties = () => api.get('/institutions/faculties');
export const createFaculty = (facultyData) => api.post('/institutions/faculties', facultyData);
export const updateFaculty = (facultyId, facultyData) => api.put(`/institutions/faculties/${facultyId}`, facultyData);
export const deleteFaculty = (facultyId) => api.delete(`/institutions/faculties/${facultyId}`);

// -------------------- Institution Prospectus API --------------------
export const getInstitutionProspectus = () => api.get('/institutions/prospectus');
export const uploadProspectus = (formData) => api.post('/institutions/prospectus/upload', formData);
export const publishProspectus = (prospectusId, data) => api.put(`/institutions/prospectus/${prospectusId}/publish`, data);
export const deleteProspectus = (prospectusId) => api.delete(`/institutions/prospectus/${prospectusId}`);

// -------------------- Institution Course Management --------------------
export const updateCourse = (courseId, courseData) => api.put(`/institutions/courses/${courseId}`, courseData);
export const deleteCourse = (courseId) => api.delete(`/institutions/courses/${courseId}`);

// -------------------- Institution Waitlist API --------------------
export const promoteWaitlistedStudent = (applicationId) => api.put(`/institutions/applications/${applicationId}/promote`);

// -------------------- Admin API --------------------
export const getAdminDashboard = () => api.get('/admin/dashboard');
export const getInstitutions = () => api.get('/admin/institutions');
export const getCompanies = () => api.get('/admin/companies');
export const approveInstitution = (institutionId) => api.put(`/admin/institutions/${institutionId}/approve`);
export const suspendInstitution = (institutionId) => api.put(`/admin/institutions/${institutionId}/suspend`);
export const approveCompany = (companyId) => api.put(`/admin/companies/${companyId}/approve`);
export const suspendCompany = (companyId) => api.put(`/admin/companies/${companyId}/suspend`);
export const getUsers = () => api.get('/admin/users');
export const getReports = (type, startDate = '', endDate = '') => {
  let url = `/admin/reports?type=${type}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  return api.get(url);
};
export const getPendingDocuments = () => api.get('/admin/documents/pending');
export const verifyDocument = (documentId, data) => api.put(`/admin/documents/${documentId}/verify`, data);
export const rejectDocument = (documentId, data) => api.put(`/admin/documents/${documentId}/reject`, data);

// -------------------- Admin User Management API --------------------
export const updateUser = (userId, userData) => api.put(`/admin/users/${userId}`, userData);
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);

// -------------------- Public API --------------------
export const getAllCourses = () => api.get('/courses');
export const getCourse = (courseId) => api.get(`/courses/${courseId}`);
export const getInstitutionCoursesPublic = (institutionId) => api.get(`/courses/institution/${institutionId}`);
export const getAllJobs = () => api.get('/jobs');
export const getJob = (jobId) => api.get(`/jobs/${jobId}`);
export const checkEligibility = (data) => api.post('/eligibility/check', data);
export const getInstitutionPublicProfile = (institutionId) => api.get(`/institutions/public/${institutionId}`);
export const getInstitutionProspectusPublic = (institutionId) => api.get(`/institutions/public/${institutionId}/prospectus`);

// -------------------- Application API --------------------
export const createApplication = (data) => api.post('/applications', data);
export const getApplication = (applicationId) => api.get(`/applications/${applicationId}`);

// -------------------- Analytics API --------------------
export const getStudentAnalytics = () => api.get('/students/analytics');
export const getApplicationStats = () => api.get('/students/applications/stats');

// -------------------- File Upload with Progress --------------------
export const uploadFileWithProgress = (url, formData, onUploadProgress) =>
  api.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
  });

export const uploadTranscriptWithProgress = (formData, onUploadProgress) =>
  uploadFileWithProgress('/students/transcript', formData, onUploadProgress);

export const uploadCertificateWithProgress = (formData, onUploadProgress) =>
  uploadFileWithProgress('/students/certificates', formData, onUploadProgress);

export default api;