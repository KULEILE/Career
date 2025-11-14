const { db } = require('../config/firebase');

// Helper function to ensure company has role field
const ensureCompanyRole = async (companyId) => {
  try {
    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (companyDoc.exists) {
      const companyData = companyDoc.data();
      // If role is missing, add it
      if (!companyData.role) {
        await db.collection('companies').doc(companyId).update({
          role: 'company',
          updatedAt: new Date()
        });
        console.log(`Added default 'company' role to company ${companyId}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error ensuring company role:', error);
    return false;
  }
};

const getCompanyProfile = async (req, res) => {
  try {
    console.log('Getting company profile for:', req.user.uid);
    
    const companyDoc = await db.collection('companies').doc(req.user.uid).get();
    
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found. Please complete your company profile setup.' });
    }

    const companyData = companyDoc.data();
    console.log('Raw company data from Firestore:', companyData);
    
    // Ensure company has role
    if (!companyData.role) {
      await ensureCompanyRole(req.user.uid);
      companyData.role = 'company';
    }
    
    // Transform field names to match frontend expectations
    const transformedCompany = {
      companyName: companyData.name || companyData.companyName || '',
      description: companyData.description || '',
      industry: companyData.industry || '',
      contactInfo: {
        email: companyData.contactEmail || companyData.email || '',
        phone: companyData.contactPhone || ''
      },
      address: companyData.location || companyData.address || '',
      logoUrl: companyData.logoUrl || '',
      website: companyData.website || '',
      slogan: companyData.slogan || '',
      approved: companyData.approved !== false,
      role: companyData.role || 'company',
      uid: companyData.uid,
      createdAt: companyData.createdAt,
      updatedAt: companyData.updatedAt
    };
    
    console.log('Transformed company data:', transformedCompany);
    
    res.json({ 
      company: transformedCompany
    });
  } catch (error) {
    console.error('Error in getCompanyProfile:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateCompanyProfile = async (req, res) => {
  try {
    const { 
      companyName, 
      description, 
      industry, 
      contactInfo, 
      address, 
      logoUrl, 
      website,
      slogan 
    } = req.body;
    
    console.log('Update profile request body:', req.body);
    
    const updateData = {
      updatedAt: new Date()
    };

    // Handle both field naming conventions
    if (companyName !== undefined) {
      updateData.name = companyName;
      updateData.companyName = companyName;
    }
    if (description !== undefined) updateData.description = description;
    if (industry !== undefined) updateData.industry = industry;
    if (address !== undefined) updateData.location = address;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (website !== undefined) updateData.website = website;
    if (slogan !== undefined) updateData.slogan = slogan;
    
    // Handle contact info - support both structures
    if (contactInfo !== undefined) {
      if (typeof contactInfo === 'object') {
        updateData.contactEmail = contactInfo.email;
        updateData.contactPhone = contactInfo.phone;
      } else {
        updateData.contactEmail = contactInfo;
      }
    }

    // Ensure role is set
    updateData.role = 'company';

    console.log('Update data to Firestore:', updateData);

    await db.collection('companies').doc(req.user.uid).update(updateData);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error in updateCompanyProfile:', error);
    res.status(500).json({ error: error.message });
  }
};

const createJob = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      requirements, 
      qualifications, 
      location,
      salary,
      jobType,
      deadline,
      minAcademicScore,
      requiredCertificates,
      minWorkExperience,
      requiredSkills
    } = req.body;
    
    // Get company name from profile
    const companyDoc = await db.collection('companies').doc(req.user.uid).get();
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found. Please complete your company profile.' });
    }
    
    const companyData = companyDoc.data();
    
    // Ensure company has role field
    if (!companyData.role) {
      await ensureCompanyRole(req.user.uid);
      companyData.role = 'company';
    }
    
    const companyName = companyData.name || companyData.companyName || 'Unknown Company';
    
    const jobData = {
      title: title || '',
      description: description || '',
      requirements: Array.isArray(requirements) ? requirements.filter(req => req.trim() !== '') : [],
      qualifications: Array.isArray(qualifications) ? qualifications.filter(qual => qual.trim() !== '') : [],
      location: location || '',
      salary: salary || '',
      jobType: jobType || 'full-time',
      deadline: deadline ? new Date(deadline) : new Date(),
      minAcademicScore: minAcademicScore ? parseInt(minAcademicScore) : 0,
      requiredCertificates: Array.isArray(requiredCertificates) ? requiredCertificates.filter(cert => cert.trim() !== '') : [],
      minWorkExperience: minWorkExperience ? parseInt(minWorkExperience) : 0,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.filter(skill => skill.trim() !== '') : [],
      companyId: req.user.uid,
      companyName: companyName,
      companyIndustry: companyData.industry || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
      applicantCount: 0
    };

    const jobRef = await db.collection('jobs').add(jobData);

    res.status(201).json({
      message: 'Job created successfully',
      jobId: jobRef.id
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: error.message });
  }
};

const getJobs = async (req, res) => {
  try {
    console.log('Getting jobs for company:', req.user.uid);
    
    const jobsSnapshot = await db.collection('jobs')
      .where('companyId', '==', req.user.uid)
      .get();

    const jobs = [];
    jobsSnapshot.forEach(doc => {
      const jobData = doc.data();
      const processedJob = {
        id: doc.id,
        ...jobData,
        createdAt: jobData.createdAt?.toDate ? jobData.createdAt.toDate() : jobData.createdAt,
        updatedAt: jobData.updatedAt?.toDate ? jobData.updatedAt.toDate() : jobData.updatedAt,
        deadline: jobData.deadline?.toDate ? jobData.deadline.toDate() : jobData.deadline
      };
      jobs.push(processedJob);
    });

    // Sort manually by creation date (newest first)
    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ jobs });
  } catch (error) {
    console.error('Error in getJobs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch jobs',
      details: error.message 
    });
  }
};

const getApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log(`Getting applicants for job: ${jobId}, company: ${req.user.uid}`);
    
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobDoc.data();
    
    // Verify job belongs to this company
    if (job.companyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied. This job does not belong to your company.' });
    }
    
    // Get all applications for this job
    const jobApplicationsSnapshot = await db.collection('jobApplications')
      .where('jobId', '==', jobId)
      .get();

    const applicants = [];
    
    for (const doc of jobApplicationsSnapshot.docs) {
      const application = doc.data();
      const studentDoc = await db.collection('users').doc(application.studentId).get();
      
      if (studentDoc.exists) {
        const student = studentDoc.data();
        
        // Calculate match score based on job requirements
        const matchScore = calculateApplicantMatchScore(student, job, application);
        
        applicants.push({
          id: doc.id,
          ...application,
          student: {
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            email: student.email || '',
            phone: student.phone || '',
            highSchool: student.highSchool || '',
            academicScore: student.academicScore || 0,
            workExperience: student.workExperience || 0,
            certificates: student.certificates || [],
            skills: student.skills || [],
            hasTranscript: student.hasTranscript || false,
            transcriptUrl: student.transcriptUrl || ''
          },
          matchScore: matchScore,
          interviewReady: matchScore >= 70
        });
      }
    }

    // Sort applicants by match score (highest first)
    applicants.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ applicants });
  } catch (error) {
    console.error('Error in getApplicants:', error);
    res.status(500).json({ error: error.message });
  }
};

const getQualifiedApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log(`Getting qualified applicants for job: ${jobId}, company: ${req.user.uid}`);
    
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobDoc.data();
    
    // Verify job belongs to this company
    if (job.companyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied. This job does not belong to your company.' });
    }
    
    // Get all applications for this job
    const jobApplicationsSnapshot = await db.collection('jobApplications')
      .where('jobId', '==', jobId)
      .get();

    const qualifiedApplicants = [];
    
    for (const doc of jobApplicationsSnapshot.docs) {
      const application = doc.data();
      const studentDoc = await db.collection('users').doc(application.studentId).get();
      
      if (studentDoc.exists) {
        const student = studentDoc.data();
        
        // Calculate match score
        const matchScore = calculateApplicantMatchScore(student, job, application);
        
        // Only include applicants who are interview ready (70%+ match)
        if (matchScore >= 70) {
          qualifiedApplicants.push({
            id: doc.id,
            ...application,
            student: {
              firstName: student.firstName || '',
              lastName: student.lastName || '',
              email: student.email || '',
              phone: student.phone || '',
              highSchool: student.highSchool || '',
              academicScore: student.academicScore || 0,
              workExperience: student.workExperience || 0,
              certificates: student.certificates || [],
              skills: student.skills || [],
              hasTranscript: student.hasTranscript || false,
              transcriptUrl: student.transcriptUrl || ''
            },
            matchScore: matchScore,
            interviewReady: true
          });
        }
      }
    }

    // Sort by match score (highest first)
    qualifiedApplicants.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ applicants: qualifiedApplicants });
  } catch (error) {
    console.error('Error in getQualifiedApplicants:', error);
    res.status(500).json({ error: error.message });
  }
};

const getInterviewReadyCandidates = async (req, res) => {
  try {
    console.log('Getting interview-ready candidates for company:', req.user.uid);
    
    // Get company jobs
    const jobsSnapshot = await db.collection('jobs')
      .where('companyId', '==', req.user.uid)
      .get();

    const jobs = [];
    jobsSnapshot.forEach(doc => {
      jobs.push({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
        deadline: doc.data().deadline?.toDate ? doc.data().deadline.toDate() : doc.data().deadline
      });
    });

    // Get all job applications for this company
    const jobIds = jobs.map(job => job.id);
    let interviewReadyCandidates = [];

    if (jobIds.length > 0) {
      const applicationsSnapshot = await db.collection('jobApplications')
        .where('jobId', 'in', jobIds)
        .get();

      for (const doc of applicationsSnapshot.docs) {
        const application = doc.data();
        const studentDoc = await db.collection('users').doc(application.studentId).get();
        
        if (studentDoc.exists) {
          const student = studentDoc.data();
          const job = jobs.find(j => j.id === application.jobId);
          
          if (job) {
            const matchScore = calculateApplicantMatchScore(student, job, application);
            
            if (matchScore >= 70) {
              interviewReadyCandidates.push({
                id: doc.id,
                ...application,
                student: {
                  firstName: student.firstName || '',
                  lastName: student.lastName || '',
                  email: student.email || '',
                  phone: student.phone || '',
                  highSchool: student.highSchool || '',
                  academicScore: student.academicScore || 0,
                  workExperience: student.workExperience || 0,
                  certificates: student.certificates || [],
                  skills: student.skills || [],
                  hasTranscript: student.hasTranscript || false,
                  transcriptUrl: student.transcriptUrl || '',
                  subjects: student.subjects || []
                },
                job: {
                  id: job.id,
                  title: job.title || '',
                  location: job.location || '',
                  jobType: job.jobType || ''
                },
                matchScore: matchScore,
                interviewReady: true
              });
            }
          }
        }
      }
    }

    // Sort by match score (highest first)
    interviewReadyCandidates.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ candidates: interviewReadyCandidates });
  } catch (error) {
    console.error('Error in getInterviewReadyCandidates:', error);
    res.status(500).json({ error: error.message });
  }
};

const getCompanyDashboard = async (req, res) => {
  try {
    console.log('Getting dashboard for company:', req.user.uid);
    
    // Get company profile
    const companyDoc = await db.collection('companies').doc(req.user.uid).get();
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found. Please complete your company profile setup.' });
    }
    
    const companyData = companyDoc.data();
    console.log('Raw company data for dashboard:', companyData);
    
    // Ensure company has role field
    if (!companyData.role) {
      await ensureCompanyRole(req.user.uid);
      companyData.role = 'company';
    }

    // Transform company data for frontend
    const company = {
      companyName: companyData.name || companyData.companyName || '',
      description: companyData.description || '',
      industry: companyData.industry || '',
      contactInfo: {
        email: companyData.contactEmail || companyData.email || '',
        phone: companyData.contactPhone || ''
      },
      address: companyData.location || companyData.address || '',
      logoUrl: companyData.logoUrl || '',
      website: companyData.website || '',
      slogan: companyData.slogan || '',
      approved: companyData.approved !== false,
      role: companyData.role || 'company'
    };

    // Get company jobs
    const jobsSnapshot = await db.collection('jobs')
      .where('companyId', '==', req.user.uid)
      .get();

    const jobs = [];
    jobsSnapshot.forEach(doc => {
      jobs.push({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
        deadline: doc.data().deadline?.toDate ? doc.data().deadline.toDate() : doc.data().deadline
      });
    });

    // Get all job applications for this company
    const jobIds = jobs.map(job => job.id);
    let allApplicants = [];
    let interviewReadyCandidates = [];

    if (jobIds.length > 0) {
      const applicationsSnapshot = await db.collection('jobApplications')
        .where('jobId', 'in', jobIds)
        .get();

      for (const doc of applicationsSnapshot.docs) {
        const application = doc.data();
        const studentDoc = await db.collection('users').doc(application.studentId).get();
        
        if (studentDoc.exists) {
          const student = studentDoc.data();
          const job = jobs.find(j => j.id === application.jobId);
          
          if (job) {
            const matchScore = calculateApplicantMatchScore(student, job, application);
            const candidateData = {
              id: doc.id,
              ...application,
              student: {
                firstName: student.firstName || '',
                lastName: student.lastName || '',
                email: student.email || ''
              },
              job: {
                title: job.title || ''
              },
              matchScore: matchScore,
              interviewReady: matchScore >= 70
            };

            allApplicants.push(candidateData);
            
            if (matchScore >= 70) {
              interviewReadyCandidates.push(candidateData);
            }
          }
        }
      }
    }

    // Calculate statistics
    const stats = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(job => job.active && new Date(job.deadline) > new Date()).length,
      totalApplicants: allApplicants.length,
      interviewReadyCandidates: interviewReadyCandidates.length,
      pendingApplications: allApplicants.filter(app => app.status === 'pending').length,
      shortlistedApplications: allApplicants.filter(app => app.status === 'shortlisted').length
    };

    // Get recent interview-ready candidates (last 5)
    const recentCandidates = interviewReadyCandidates
      .slice(0, 5)
      .map(candidate => ({
        id: candidate.id,
        student: {
          firstName: candidate.student.firstName,
          lastName: candidate.student.lastName,
          email: candidate.student.email
        },
        job: {
          title: candidate.job.title
        },
        matchScore: candidate.matchScore,
        appliedAt: candidate.appliedAt
      }));

    res.json({
      company: company,
      stats,
      recentCandidates
    });
  } catch (error) {
    console.error('Error in getCompanyDashboard:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    console.log(`Updating application status: ${applicationId}, company: ${req.user.uid}`);

    // Verify the application exists and belongs to company's job
    const applicationDoc = await db.collection('jobApplications').doc(applicationId).get();
    if (!applicationDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = applicationDoc.data();
    
    // Verify the job belongs to this company
    const jobDoc = await db.collection('jobs').doc(application.jobId).get();
    if (!jobDoc.exists || jobDoc.data().companyId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied. This application does not belong to your company.' });
    }

    await db.collection('jobApplications').doc(applicationId).update({
      status,
      notes,
      updatedAt: new Date()
    });

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to calculate applicant match score
const calculateApplicantMatchScore = (student, job, application) => {
  let score = 0;
  let totalWeight = 0;

  // Academic Performance (40% weight)
  if (job.minAcademicScore) {
    const academicWeight = 40;
    totalWeight += academicWeight;
    const studentScore = student.academicScore || 0;
    if (studentScore >= job.minAcademicScore) {
      score += academicWeight;
    } else {
      score += (studentScore / job.minAcademicScore) * academicWeight;
    }
  }

  // Work Experience (30% weight)
  if (job.minWorkExperience) {
    const experienceWeight = 30;
    totalWeight += experienceWeight;
    const studentExperience = student.workExperience || 0;
    if (studentExperience >= job.minWorkExperience) {
      score += experienceWeight;
    } else {
      score += (studentExperience / job.minWorkExperience) * experienceWeight;
    }
  }

  // Certificates (20% weight)
  if (job.requiredCertificates && job.requiredCertificates.length > 0) {
    const certificateWeight = 20;
    totalWeight += certificateWeight;
    const studentCertificates = student.certificates || [];
    const matchingCertificates = job.requiredCertificates.filter(cert => 
      studentCertificates.includes(cert)
    );
    const certificateMatchRatio = matchingCertificates.length / job.requiredCertificates.length;
    score += certificateMatchRatio * certificateWeight;
  }

  // Skills Match (10% weight)
  if (job.requiredSkills && job.requiredSkills.length > 0) {
    const skillsWeight = 10;
    totalWeight += skillsWeight;
    const studentSkills = student.skills || [];
    const matchingSkills = job.requiredSkills.filter(skill => 
      studentSkills.includes(skill)
    );
    const skillsMatchRatio = matchingSkills.length / job.requiredSkills.length;
    score += skillsMatchRatio * skillsWeight;
  }

  // If no specific weights, use default scoring
  if (totalWeight === 0) {
    const hasTranscript = student.hasTranscript || false;
    const hasGoodAcademic = (student.academicScore || 0) >= 60;
    const hasExperience = (student.workExperience || 0) >= 1;
    
    if (hasTranscript && hasGoodAcademic && hasExperience) {
      score = 80;
    } else if (hasTranscript && hasGoodAcademic) {
      score = 70;
    } else if (hasTranscript) {
      score = 60;
    } else {
      score = 50;
    }
  } else {
    score = (score / totalWeight) * 100;
  }

  return Math.min(Math.round(score), 100);
};

module.exports = {
  getCompanyProfile,
  updateCompanyProfile,
  createJob,
  getJobs,
  getApplicants,
  getQualifiedApplicants,
  getInterviewReadyCandidates,
  getCompanyDashboard,
  updateApplicationStatus,
  ensureCompanyRole
};