const { db } = require('../config/firebase');

const getCompanyProfile = async (req, res) => {
  try {
    const companyDoc = await db.collection('companies').doc(req.user.uid).get();
    
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const companyData = companyDoc.data();
    
    res.json({ 
      company: {
        ...companyData,
        approved: companyData.approved !== false
      }
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
      website 
    } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };

    // Only update fields that are provided
    if (companyName !== undefined) updateData.companyName = companyName;
    if (description !== undefined) updateData.description = description;
    if (industry !== undefined) updateData.industry = industry;
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
    if (address !== undefined) updateData.address = address;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (website !== undefined) updateData.website = website;

    await db.collection('companies').doc(req.user.uid).update(updateData);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error in updateCompanyProfile:', error);
    res.status(500).json({ error: error.message });
  }
};

// FIXED: Job creation with proper company name
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
    
    // Get company name from profile - FIXED: Use correct field names
    const companyDoc = await db.collection('companies').doc(req.user.uid).get();
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const companyData = companyDoc.data();
    // FIXED: Use correct field names for company name
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
      companyName: companyName, // FIXED: This will now have the correct company name
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
    
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobDoc.data();
    
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
    
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobDoc.data();
    
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
    // Get company profile
    const companyDoc = await db.collection('companies').doc(req.user.uid).get();
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }
    const company = companyDoc.data();

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
      company: {
        ...company,
        approved: company.approved !== false
      },
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
  updateApplicationStatus
};