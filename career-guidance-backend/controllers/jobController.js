const { db } = require('../config/firebase');

// FIXED: Get company from correct collection
const getAllJobs = async (req, res) => {
  try {
    const jobsSnapshot = await db.collection('jobs')
      .where('active', '==', true)
      .get();

    const jobs = [];
    for (const doc of jobsSnapshot.docs) {
      const job = doc.data();
      
      // FIXED: Get company from companies collection instead of users
      let companyData = {};
      try {
        const companyDoc = await db.collection('companies').doc(job.companyId).get();
        if (companyDoc.exists) {
          companyData = companyDoc.data();
        }
      } catch (error) {
        console.log('Company not found in companies collection');
      }
      
      jobs.push({
        id: doc.id,
        ...job,
        company: companyData
      });
    }

    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// FIXED: Get company from correct collection
const getJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobDoc.data();
    
    // FIXED: Get company from companies collection instead of users
    let companyData = {};
    try {
      const companyDoc = await db.collection('companies').doc(job.companyId).get();
      if (companyDoc.exists) {
        companyData = companyDoc.data();
      }
    } catch (error) {
      console.log('Company not found in companies collection');
    }

    res.json({
      job: {
        id: jobDoc.id,
        ...job,
        company: companyData
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const studentId = req.user.uid;

    // Check if job exists
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobDoc.data();

    // Check if deadline has passed
    if (new Date(job.deadline) < new Date()) {
      return res.status(400).json({ error: 'Application deadline has passed' });
    }

    // Check if already applied
    const existingApplication = await db.collection('jobApplications')
      .where('studentId', '==', studentId)
      .where('jobId', '==', jobId)
      .get();

    if (!existingApplication.empty) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    // Get student profile
    const studentDoc = await db.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const student = studentDoc.data();

    // Calculate match score
    const matchScore = calculateApplicantMatchScore(student, job, {});

    // Create job application
    const jobApplication = {
      studentId,
      jobId,
      studentName: `${student.firstName} ${student.lastName}`,
      studentEmail: student.email,
      studentPhone: student.phone,
      appliedAt: new Date(),
      status: 'pending',
      matchScore: matchScore,
      interviewReady: matchScore >= 70
    };

    const applicationRef = await db.collection('jobApplications').add(jobApplication);

    // Update applicant count
    await db.collection('jobs').doc(jobId).update({
      applicantCount: (job.applicantCount || 0) + 1,
      updatedAt: new Date()
    });

    res.json({ 
      message: 'Job application submitted successfully',
      applicationId: applicationRef.id 
    });
  } catch (error) {
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
  getAllJobs,
  getJob,
  applyForJob
};