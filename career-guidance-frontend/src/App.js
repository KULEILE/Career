// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Common/Navbar';
import Footer from './components/Common/Footer';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyEmail from './components/Auth/VerifyEmail';
import Landing from './components/Guest/Landing';
import EligibilityChecker from './components/Guest/EligibilityChecker';
import InstitutionBrowser from './components/Guest/InstitutionBrowser';
import GuestCourseBrowser from './components/Guest/CourseBrowser';
import EmailVerificationHandler from './components/Auth/EmailVerificationHandler';

// Student Components
import StudentDashboard from './components/Student/Dashboard';
import StudentProfile from './components/Student/Profile';
import CourseBrowser from './components/Student/CourseBrowser';
import Application from './components/Student/Application';
import ApplicationsList from './components/Student/ApplicationsList';
import Admissions from './components/Student/Admissions';
import JobPortal from './components/Student/JobPortal';
import Transcripts from './components/Student/Transcripts';

// Institution Components
import InstitutionDashboard from './components/Institution/Dashboard';
import InstitutionProfile from './components/Institution/Profile';
import CourseManagement from './components/Institution/CourseManagement';
import InstitutionApplications from './components/Institution/Applications';
import InstitutionAdmissions from './components/Institution/Admissions';
import Waitlist from './components/Institution/Waitlist';
import FacultyManagement from './components/Institution/FacultyManagement';
import ProspectusManagement from './components/Institution/ProspectusManagement';

// Company Components
import CompanyDashboard from './components/Company/Dashboard';
import CompanyProfile from './components/Company/Profile';
import JobManagement from './components/Company/JobManagement';
import JobPosting from './components/Company/JobPosting';
import Candidates from './components/Company/Candidates';

// Admin Components
import AdminDashboard from './components/Admin/Dashboard';
import AdminInstitutions from './components/Admin/Institutions';
import AdminCompanies from './components/Admin/Companies';
import AdminUsers from './components/Admin/Users';
import AdminReports from './components/Admin/Reports';
import TranscriptVerification from './components/Admin/TranscriptVerification';
import './styles/App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/eligibility-check" element={<EligibilityChecker />} />
              <Route path="/institutions" element={<InstitutionBrowser />} />
              <Route path="/courses" element={<GuestCourseBrowser />} />
              
              {/* Student Routes */}
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              <Route path="/student/courses" element={<CourseBrowser />} />
              <Route path="/student/courses/apply/:courseId" element={<Application />} />
              <Route path="/student/applications" element={<ApplicationsList />} />
              <Route path="/student/admissions" element={<Admissions />} />
              <Route path="/student/jobs" element={<JobPortal />} />
              <Route path="/student/documents" element={<Transcripts />} />
              <Route path="/verify-email" element={<EmailVerificationHandler />} />

              {/* Institution Routes */}
              <Route path="/institution/dashboard" element={<InstitutionDashboard />} />
              <Route path="/institution/profile" element={<InstitutionProfile />} />
              <Route path="/institution/courses" element={<CourseManagement />} />
              <Route path="/institution/applications" element={<InstitutionApplications />} />
              <Route path="/institution/admissions" element={<InstitutionAdmissions />} />
              <Route path="/institution/waitlist" element={<Waitlist />} />
              <Route path="/institution/faculties" element={<FacultyManagement />} />
              <Route path="/institution/prospectus" element={<ProspectusManagement />} />
              
              {/* Company Routes */}
              <Route path="/company/dashboard" element={<CompanyDashboard />} />
              <Route path="/company/profile" element={<CompanyProfile />} />
              <Route path="/company/jobs" element={<JobManagement />} />
              <Route path="/company/jobs/:jobId" element={<JobPosting />} />
              <Route path="/company/candidates" element={<Candidates />} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/institutions" element={<AdminInstitutions />} />
              <Route path="/admin/companies" element={<AdminCompanies />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/transcripts" element={<TranscriptVerification />} />
              
              {/* Fallback route */}
              <Route path="*" element={<Landing />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;