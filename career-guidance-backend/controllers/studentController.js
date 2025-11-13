const { db } = require('../config/firebase');
const NotificationService = require('../services/notificationService');
const Student = require('../models/Student');

// Helper function to safely convert timestamps
const safeToDate = (timestamp) => {
  if (!timestamp) return new Date();
  
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  } else if (timestamp instanceof Date) {
    return timestamp;
  } else if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  } else {
    return new Date(timestamp);
  }
};

const getStudentProfile = async (req, res) => {
  try {
    const studentDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    const studentData = studentDoc.data();

    const applicationsSnapshot = await db.collection('applications')
      .where('studentId', '==', req.user.uid)
      .get();

    const applicationsCount = applicationsSnapshot.size;
    const admittedApplications = applicationsSnapshot.docs.filter(doc => 
      doc.data().status === 'admitted'
    ).length;

    const jobApplicationsSnapshot = await db.collection('jobApplications')
      .where('studentId', '==', req.user.uid)
      .get();

    res.json({ 
      success: true,
      student: studentData,
      stats: {
        totalApplications: applicationsCount,
        admittedApplications: admittedApplications,
        jobApplications: jobApplicationsSnapshot.size
      }
    });
  } catch (error) {
    console.error('Error getting student profile:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      dateOfBirth, 
      phone, 
      address, 
      highSchool, 
      graduationYear, 
      subjects 
    } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (highSchool) updateData.highSchool = highSchool;
    if (graduationYear) updateData.graduationYear = graduationYear;
    if (subjects) updateData.subjects = subjects;

    await db.collection('users').doc(req.user.uid).update(updateData);

    res.json({ 
      success: true,
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const getStudentApplications = async (req, res) => {
  try {
    const applicationsSnapshot = await db.collection('applications')
      .where('studentId', '==', req.user.uid)
      .orderBy('appliedAt', 'desc')
      .get();

    const applications = [];
    for (const doc of applicationsSnapshot.docs) {
      const application = doc.data();
      const courseDoc = await db.collection('courses').doc(application.courseId).get();
      const institutionDoc = await db.collection('users').doc(application.institutionId).get();
      
      applications.push({
        id: doc.id,
        ...application,
        appliedAt: safeToDate(application.appliedAt),
        updatedAt: safeToDate(application.updatedAt),
        course: courseDoc.exists ? courseDoc.data() : null,
        institution: institutionDoc.exists ? institutionDoc.data() : null
      });
    }

    res.json({ 
      success: true,
      applications 
    });
  } catch (error) {
    console.error('Error getting student applications:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const applyForCourse = async (req, res) => {
  try {
    const { courseId, institutionId } = req.body;
    const studentId = req.user.uid;

    if (!courseId || !institutionId) {
      return res.status(400).json({ 
        success: false,
        error: 'Course ID and Institution ID are required' 
      });
    }

    const studentDoc = await db.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    // Check if Student model exists and has required methods
    let student;
    try {
      student = Student.fromFirestore ? Student.fromFirestore(studentDoc) : studentDoc.data();
    } catch (error) {
      console.warn('Student model methods not available, using basic data');
      student = studentDoc.data();
      student.applicationsCount = student.applicationsCount || {};
    }

    // Check application limits (max 2 per institution)
    const existingApplications = await db.collection('applications')
      .where('studentId', '==', studentId)
      .where('institutionId', '==', institutionId)
      .get();

    if (existingApplications.size >= 2) {
      return res.status(400).json({ 
        success: false,
        error: 'You have reached the maximum of 2 applications per institution' 
      });
    }

    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }

    const course = courseDoc.data();

    // Check course requirements
    if (course.requirements && !checkCourseRequirements(student, course.requirements)) {
      return res.status(400).json({ 
        success: false,
        error: 'You do not meet the course requirements' 
      });
    }

    if (course.applicationDeadline && safeToDate(course.applicationDeadline) < new Date()) {
      return res.status(400).json({ 
        success: false,
        error: 'Application deadline has passed' 
      });
    }

    const applicationData = {
      studentId: studentId,
      courseId: courseId,
      institutionId: institutionId,
      courseName: course.name,
      institutionName: course.institutionName,
      status: 'pending',
      appliedAt: new Date(),
      updatedAt: new Date(),
      studentSubjects: student.subjects || [],
      studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim()
    };

    const applicationRef = await db.collection('applications').add(applicationData);

    // Update student's application count
    const currentCount = student.applicationsCount || {};
    await db.collection('users').doc(studentId).update({
      applicationsCount: {
        ...currentCount,
        [institutionId]: (currentCount[institutionId] || 0) + 1
      },
      updatedAt: new Date()
    });

    await NotificationService.createNotification(
      studentId,
      'Application Submitted',
      `Your application for ${course.name} has been submitted successfully.`,
      'info',
      `/student/applications`
    );

    res.json({ 
      success: true,
      message: 'Application submitted successfully',
      applicationId: applicationRef.id
    });

  } catch (error) {
    console.error('Error applying for course:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const uploadTranscript = async (req, res) => {
  try {
    const { transcriptUrl, fileName, fileSize } = req.body;
    
    if (!transcriptUrl) {
      return res.status(400).json({ 
        success: false,
        error: 'Transcript file is required. Please upload a transcript file.' 
      });
    }

    // Validate that it's a base64 string and PDF
    if (typeof transcriptUrl !== 'string' || !transcriptUrl.startsWith('data:application/pdf')) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid file type. Please upload PDF files only.' 
      });
    }

    // Validate file size (100MB max)
    const maxFileSize = 100 * 1024 * 1024;
    if (fileSize > maxFileSize) {
      return res.status(400).json({ 
        success: false,
        error: 'File size must be less than 100MB' 
      });
    }

    const studentId = req.user.uid;
    const studentDoc = await db.collection('users').doc(studentId).get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    const student = studentDoc.data();

    // Check if student has completed studies for final transcript
    const isFinalTranscript = student.studyCompleted;
    
    const updateData = {
      transcriptData: transcriptUrl,
      transcriptFileName: fileName || 'Academic Transcript',
      transcriptFileSize: fileSize || 0,
      hasTranscript: true,
      transcriptUploadedAt: new Date(),
      transcriptVerified: false,
      updatedAt: new Date(),
      transcriptFileType: 'pdf'
    };

    if (isFinalTranscript) {
      updateData.finalTranscriptData = transcriptUrl;
      updateData.finalTranscriptFileName = fileName || 'Final Academic Transcript';
      updateData.finalTranscriptUploadedAt = new Date();
      updateData.finalTranscriptFileType = 'pdf';
    }

    await db.collection('users').doc(studentId).update(updateData);

    await NotificationService.createNotification(
      studentId,
      isFinalTranscript ? 'Final Transcript Uploaded' : 'Transcript Uploaded',
      `Your ${isFinalTranscript ? 'final ' : ''}academic transcript has been uploaded successfully and is pending verification.`,
      'info',
      '/student/documents'
    );

    res.json({ 
      success: true,
      message: `${isFinalTranscript ? 'Final ' : ''}Transcript uploaded successfully`,
      hasTranscript: true,
      isFinalTranscript: isFinalTranscript
    });
  } catch (error) {
    console.error('Error uploading transcript:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error during transcript upload'
    });
  }
};

const uploadFinalTranscript = async (req, res) => {
  try {
    const { transcriptUrl, fileName, fileSize } = req.body;
    const studentId = req.user.uid;

    if (!transcriptUrl) {
      return res.status(400).json({ 
        success: false,
        error: 'Transcript file is required. Please upload a transcript file.' 
      });
    }

    // Validate that it's a base64 string and PDF
    if (typeof transcriptUrl !== 'string' || !transcriptUrl.startsWith('data:application/pdf')) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid file type. Please upload PDF files only.' 
      });
    }

    // Validate file size (100MB max)
    const maxFileSize = 100 * 1024 * 1024;
    if (fileSize > maxFileSize) {
      return res.status(400).json({ 
        success: false,
        error: 'File size must be less than 100MB' 
      });
    }

    const studentDoc = await db.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    const student = studentDoc.data();
    if (!student.studyCompleted) {
      return res.status(400).json({ 
        success: false,
        error: 'You must complete your studies before uploading final transcript' 
      });
    }

    await db.collection('users').doc(studentId).update({
      finalTranscriptData: transcriptUrl,
      finalTranscriptFileName: fileName || 'Final Academic Transcript',
      finalTranscriptFileSize: fileSize || 0,
      hasTranscript: true,
      transcriptVerified: false,
      finalTranscriptUploadedAt: new Date(),
      updatedAt: new Date(),
      finalTranscriptFileType: 'pdf'
    });

    await NotificationService.createNotification(
      studentId,
      'Final Transcript Uploaded',
      'Your final academic transcript has been uploaded successfully and is pending verification.',
      'info',
      '/student/documents'
    );

    res.json({ 
      success: true,
      message: 'Final transcript uploaded successfully',
      hasTranscript: true
    });

  } catch (error) {
    console.error('Error uploading final transcript:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error during final transcript upload'
    });
  }
};

const uploadCertificate = async (req, res) => {
  try {
    const { certificateUrl, name, size } = req.body;
    
    if (!certificateUrl) {
      return res.status(400).json({ 
        success: false,
        error: 'Certificate file is required. Please upload a certificate file.' 
      });
    }

    // Validate that it's a base64 string and PDF
    if (typeof certificateUrl !== 'string' || !certificateUrl.startsWith('data:application/pdf')) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid file type. Please upload PDF files only.' 
      });
    }

    // Validate file size (100MB max)
    const maxFileSize = 100 * 1024 * 1024;
    if (size > maxFileSize) {
      return res.status(400).json({ 
        success: false,
        error: 'File size must be less than 100MB' 
      });
    }

    const studentId = req.user.uid;
    const studentDoc = await db.collection('users').doc(studentId).get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    const student = studentDoc.data();
    
    // Check if student has completed studies for certificate upload
    if (!student.studyCompleted) {
      return res.status(400).json({ 
        success: false,
        error: 'You must complete your studies before uploading certificates' 
      });
    }

    const newCertificate = {
      name: name || 'Certificate',
      data: certificateUrl,
      size: size || 0,
      verified: false,
      uploadedAt: new Date(),
      fileType: 'pdf'
    };

    const updatedCertificates = [...(student.certificates || []), newCertificate];

    await db.collection('users').doc(studentId).update({
      certificates: updatedCertificates,
      updatedAt: new Date()
    });

    await NotificationService.createNotification(
      studentId,
      'Certificate Uploaded',
      'Your certificate has been uploaded successfully and is pending verification.',
      'info',
      '/student/documents'
    );

    res.json({ 
      success: true,
      message: 'Certificate uploaded successfully',
      certificate: newCertificate
    });
  } catch (error) {
    console.error('Error uploading certificate:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error during certificate upload'
    });
  }
};

const markStudiesCompleted = async (req, res) => {
  try {
    const studentId = req.user.uid;

    await db.collection('users').doc(studentId).update({
      studyCompleted: true,
      updatedAt: new Date()
    });

    await NotificationService.createNotification(
      studentId,
      'Studies Completed',
      'Congratulations! You have marked your studies as completed. You can now upload your final documents.',
      'success',
      '/student/documents'
    );

    res.json({ 
      success: true,
      message: 'Studies marked as completed successfully' 
    });

  } catch (error) {
    console.error('Error marking studies completed:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const getAdmissions = async (req, res) => {
  try {
    const admissionsSnapshot = await db.collection('applications')
      .where('studentId', '==', req.user.uid)
      .where('status', '==', 'admitted')
      .where('admissionPublished', '==', true)
      .orderBy('updatedAt', 'desc')
      .get();

    const admissions = [];
    for (const doc of admissionsSnapshot.docs) {
      const application = doc.data();
      const courseDoc = await db.collection('courses').doc(application.courseId).get();
      const institutionDoc = await db.collection('users').doc(application.institutionId).get();
      
      admissions.push({
        id: doc.id,
        ...application,
        appliedAt: safeToDate(application.appliedAt),
        updatedAt: safeToDate(application.updatedAt),
        course: courseDoc.exists ? courseDoc.data() : null,
        institution: institutionDoc.exists ? institutionDoc.data() : null,
        canAccept: true
      });
    }

    res.json({ 
      success: true,
      admissions 
    });
  } catch (error) {
    console.error('Error getting admissions:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const getAvailableJobs = async (req, res) => {
  try {
    const studentDoc = await db.collection('users').doc(req.user.uid).get();
    const student = studentDoc.data();

    const currentDate = new Date();
    const jobsSnapshot = await db.collection('jobs')
      .where('deadline', '>', currentDate)
      .orderBy('deadline', 'asc')
      .get();

    const activeJobs = jobsSnapshot.docs.filter(doc => {
      const job = doc.data();
      return job.active === true;
    });

    const jobs = [];
    for (const doc of activeJobs) {
      const job = doc.data();
      const companyDoc = await db.collection('users').doc(job.companyId).get();
      const companyData = companyDoc.data();
      
      const existingApplication = await db.collection('jobApplications')
        .where('studentId', '==', req.user.uid)
        .where('jobId', '==', doc.id)
        .get();

      const isQualified = checkJobQualification(student, job);

      jobs.push({
        id: doc.id,
        ...job,
        deadline: safeToDate(job.deadline),
        createdAt: safeToDate(job.createdAt),
        updatedAt: safeToDate(job.updatedAt),
        company: companyData,
        hasApplied: !existingApplication.empty,
        isQualified: isQualified,
        applicationId: !existingApplication.empty ? existingApplication.docs[0].id : null
      });
    }

    res.json({ 
      success: true,
      jobs 
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const getJobRecommendations = async (req, res) => {
  try {
    const studentId = req.user.uid;

    const studentDoc = await db.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    const student = studentDoc.data();

    if (!student.hasTranscript) {
      return res.json({ 
        success: true,
        jobs: [],
        message: 'Upload your transcript to get job recommendations' 
      });
    }

    const currentDate = new Date();
    const jobsSnapshot = await db.collection('jobs')
      .where('deadline', '>', currentDate)
      .where('active', '==', true)
      .orderBy('deadline', 'asc')
      .get();

    const recommendedJobs = [];
    
    for (const doc of jobsSnapshot.docs) {
      const job = doc.data();
      
      const existingApplication = await db.collection('jobApplications')
        .where('studentId', '==', studentId)
        .where('jobId', '==', doc.id)
        .get();

      const matchScore = calculateJobMatch(student, job);

      if (matchScore >= 50) {
        const companyDoc = await db.collection('users').doc(job.companyId).get();
        const companyData = companyDoc.data();

        recommendedJobs.push({
          id: doc.id,
          ...job,
          deadline: safeToDate(job.deadline),
          createdAt: safeToDate(job.createdAt),
          updatedAt: safeToDate(job.updatedAt),
          company: companyData,
          hasApplied: !existingApplication.empty,
          matchScore: matchScore,
          isQualified: true,
          applicationId: !existingApplication.empty ? existingApplication.docs[0].id : null
        });
      }
    }

    recommendedJobs.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ 
      success: true,
      jobs: recommendedJobs 
    });

  } catch (error) {
    console.error('Error getting job recommendations:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.body;
    const studentId = req.user.uid;

    if (!jobId) {
      return res.status(400).json({ 
        success: false,
        error: 'Job ID is required' 
      });
    }

    const studentDoc = await db.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    const student = studentDoc.data();
    if (!student.hasTranscript) {
      return res.status(400).json({ 
        success: false,
        error: 'Please upload your academic transcript before applying for jobs' 
      });
    }

    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Job not found' 
      });
    }

    const job = jobDoc.data();
    if (!job.active || safeToDate(job.deadline) < new Date()) {
      return res.status(400).json({ 
        success: false,
        error: 'This job is no longer available' 
      });
    }

    const existingApplication = await db.collection('jobApplications')
      .where('studentId', '==', studentId)
      .where('jobId', '==', jobId)
      .get();

    if (!existingApplication.empty) {
      return res.status(400).json({ 
        success: false,
        error: 'You have already applied for this job' 
      });
    }

    const jobApplicationData = {
      studentId: studentId,
      jobId: jobId,
      jobTitle: job.title,
      companyId: job.companyId,
      companyName: job.companyName,
      status: 'pending',
      appliedAt: new Date(),
      updatedAt: new Date(),
      studentProfile: {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        hasTranscript: student.hasTranscript,
        certificates: student.certificates || []
      }
    };

    await db.collection('jobApplications').add(jobApplicationData);

    await NotificationService.createNotification(
      studentId,
      'Job Application Submitted',
      `Your application for ${job.title} at ${job.companyName} has been submitted.`,
      'info',
      '/student/jobs'
    );

    await NotificationService.createNotification(
      job.companyId,
      'New Job Application',
      `A new application has been received for ${job.title}.`,
      'info',
      `/company/jobs/${jobId}/applicants`
    );

    res.json({ 
      success: true,
      message: 'Job application submitted successfully' 
    });

  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const getStudentJobApplications = async (req, res) => {
  try {
    const studentId = req.user.uid;

    const jobApplicationsSnapshot = await db.collection('jobApplications')
      .where('studentId', '==', studentId)
      .orderBy('appliedAt', 'desc')
      .get();

    const jobApplications = jobApplicationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        appliedAt: safeToDate(data.appliedAt),
        updatedAt: safeToDate(data.updatedAt)
      };
    });

    res.json({ 
      success: true,
      jobApplications 
    });

  } catch (error) {
    console.error('Error getting job applications:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const getStudentDocuments = async (req, res) => {
  try {
    const studentDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found',
        documents: []
      });
    }

    const student = studentDoc.data();
    
    const documents = [];
    
    // Add transcript document
    if (student.transcriptData || student.hasTranscript) {
      documents.push({
        id: 'transcript',
        type: 'transcript',
        fileName: student.transcriptFileName || 'Academic Transcript',
        fileUrl: student.transcriptData || '',
        fileSize: student.transcriptFileSize || 0,
        verified: student.transcriptVerified || false,
        uploadedAt: safeToDate(student.transcriptUploadedAt || student.updatedAt),
        createdAt: safeToDate(student.transcriptUploadedAt || student.updatedAt)
      });
    }
    
    // Add final transcript document
    if (student.finalTranscriptData) {
      documents.push({
        id: 'final-transcript',
        type: 'transcript',
        fileName: student.finalTranscriptFileName || 'Final Academic Transcript',
        fileUrl: student.finalTranscriptData || '',
        fileSize: student.finalTranscriptFileSize || 0,
        verified: student.transcriptVerified || false,
        uploadedAt: safeToDate(student.finalTranscriptUploadedAt || student.updatedAt),
        createdAt: safeToDate(student.finalTranscriptUploadedAt || student.updatedAt)
      });
    }
    
    // Add certificates
    if (student.certificates && Array.isArray(student.certificates)) {
      student.certificates.forEach((cert, index) => {
        documents.push({
          id: `certificate-${index}`,
          type: 'certificate',
          fileName: cert.name || `Certificate ${index + 1}`,
          fileUrl: cert.data || '',
          fileSize: cert.size || 0,
          verified: cert.verified || false,
          uploadedAt: safeToDate(cert.uploadedAt || student.updatedAt),
          createdAt: safeToDate(cert.uploadedAt || student.updatedAt)
        });
      });
    }

    res.json({
      success: true,
      documents: documents || []
    });
  } catch (error) {
    console.error('Error fetching student documents:', error);
    res.status(500).json({
      success: false,
      error: 'Error loading documents',
      documents: []
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const studentDoc = await db.collection('users').doc(req.user.uid).get();
    const student = studentDoc.data();

    let updatedData = {};
    
    if (id === 'transcript') {
      updatedData = {
        transcriptData: null,
        transcriptFileName: null,
        transcriptFileSize: null,
        hasTranscript: false,
        transcriptVerified: false,
        updatedAt: new Date()
      };
    } else if (id === 'final-transcript') {
      updatedData = {
        finalTranscriptData: null,
        finalTranscriptFileName: null,
        finalTranscriptFileSize: null,
        updatedAt: new Date()
      };
    } else if (id.startsWith('certificate-')) {
      const index = parseInt(id.split('-')[1]);
      if (student.certificates && student.certificates[index]) {
        const updatedCertificates = [...student.certificates];
        updatedCertificates.splice(index, 1);
        updatedData = {
          certificates: updatedCertificates,
          updatedAt: new Date()
        };
      } else {
        return res.status(404).json({
          success: false,
          error: 'Certificate not found'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid document ID'
      });
    }

    await db.collection('users').doc(req.user.uid).update(updatedData);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting document'
    });
  }
};

const acceptAdmissionOffer = async (req, res) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ 
        success: false,
        error: 'Application ID is required' 
      });
    }

    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Application not found' 
      });
    }

    const application = applicationDoc.data();

    if (application.studentId !== req.user.uid) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    if (application.status !== 'admitted' || !application.admissionPublished) {
      return res.status(400).json({ 
        success: false,
        error: 'This admission offer is not available for acceptance' 
      });
    }

    const otherAdmittedApplications = await db.collection('applications')
      .where('studentId', '==', req.user.uid)
      .where('status', '==', 'admitted')
      .get();

    const batch = db.batch();

    otherAdmittedApplications.docs.forEach(doc => {
      if (doc.id !== applicationId) {
        batch.update(doc.ref, {
          status: 'rejected',
          updatedAt: new Date(),
          rejectionReason: 'Student accepted another offer'
        });

        promoteWaitlistedStudent(doc.data().courseId, doc.data().institutionId);
      }
    });

    batch.update(applicationDoc.ref, {
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date()
    });

    await batch.commit();

    await NotificationService.createNotification(
      req.user.uid,
      'Admission Accepted',
      `You have accepted the admission offer for ${application.courseName}. Other offers have been automatically declined.`,
      'success'
    );

    res.json({ 
      success: true,
      message: 'Admission offer accepted successfully',
      acceptedApplicationId: applicationId
    });
  } catch (error) {
    console.error('Error accepting admission offer:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.uid;

    const [
      studentDoc,
      applicationsSnapshot,
      admissionsSnapshot,
      jobsSnapshot,
      notificationsSnapshot
    ] = await Promise.all([
      db.collection('users').doc(studentId).get(),
      db.collection('applications').where('studentId', '==', studentId).get(),
      db.collection('applications')
        .where('studentId', '==', studentId)
        .where('status', '==', 'admitted')
        .where('admissionPublished', '==', true)
        .get(),
      db.collection('jobs')
        .where('deadline', '>', new Date())
        .limit(5)
        .get(),
      db.collection('notifications')
        .where('userId', '==', studentId)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
    ]);

    const student = studentDoc.data();
    const applications = applicationsSnapshot.size;
    const pendingApplications = applicationsSnapshot.docs.filter(doc => 
      doc.data().status === 'pending'
    ).length;
    const admittedApplications = admissionsSnapshot.size;
    
    const activeJobs = jobsSnapshot.docs.filter(doc => doc.data().active === true);
    const availableJobs = activeJobs.length;

    const notifications = [];
    notificationsSnapshot.forEach(doc => {
      const notification = doc.data();
      notifications.push({ 
        id: doc.id, 
        ...notification,
        createdAt: safeToDate(notification.createdAt)
      });
    });

    const dashboardData = {
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        hasTranscript: student.hasTranscript || false,
        profileComplete: !!(student.subjects && student.subjects.length > 0),
        studyCompleted: student.studyCompleted || false
      },
      stats: {
        totalApplications: applications,
        pendingApplications: pendingApplications,
        admittedApplications: admittedApplications,
        availableJobs: availableJobs
      },
      recentNotifications: notifications,
      quickActions: [
        {
          title: 'Apply for Courses',
          description: 'Browse and apply to available courses',
          link: '/courses',
          enabled: true
        },
        {
          title: 'View Admissions',
          description: 'Check your admission status',
          link: '/admissions',
          enabled: admittedApplications > 0
        },
        {
          title: 'Upload Transcript',
          description: 'Upload your academic transcript',
          link: '/documents',
          enabled: !student.hasTranscript
        },
        {
          title: 'Browse Jobs',
          description: 'Find job opportunities',
          link: '/jobs',
          enabled: student.hasTranscript
        },
        {
          title: 'Mark Studies Completed',
          description: 'Complete your studies to upload final documents',
          link: '/documents',
          enabled: !student.studyCompleted && student.hasTranscript
        }
      ]
    };

    res.json({
      success: true,
      ...dashboardData
    });
  } catch (error) {
    console.error('Error in getStudentDashboard:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

const deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Application not found' 
      });
    }

    const application = applicationDoc.data();

    if (application.studentId !== req.user.uid) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot delete application that is already processed' 
      });
    }

    await db.collection('applications').doc(applicationId).delete();

    res.json({ 
      success: true,
      message: 'Application deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Helper functions
const checkJobQualification = (student, job) => {
  if (!student.hasTranscript) return false;
  if (job.qualifications && job.qualifications.length > 0) {
    return true;
  }
  return true;
};

const calculateJobMatch = (student, job) => {
  let score = 0;
  
  if (student.hasTranscript) score += 30;
  if (student.studyCompleted) score += 20;
  if (student.certificates && student.certificates.length > 0) {
    score += Math.min(student.certificates.length * 5, 20);
  }
  if (job.requiredSkills && student.subjects) {
    const relevantSubjects = student.subjects.filter(subject => 
      job.requiredSkills.some(skill => 
        subject.name.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(subject.name.toLowerCase())
      )
    );
    score += Math.min(relevantSubjects.length * 10, 30);
  }
  
  return Math.min(score, 100);
};

const checkCourseRequirements = (student, requirements) => {
  if (!requirements || !student.subjects) return true;
  
  // Basic requirement checking logic
  // You can expand this based on your specific requirements structure
  const studentSubjects = student.subjects.map(subj => subj.name.toLowerCase());
  const requiredSubjects = requirements.requiredSubjects || [];
  
  return requiredSubjects.every(reqSubject => 
    studentSubjects.includes(reqSubject.toLowerCase())
  );
};

const promoteWaitlistedStudent = async (courseId, institutionId) => {
  try {
    const waitlistedSnapshot = await db.collection('applications')
      .where('courseId', '==', courseId)
      .where('institutionId', '==', institutionId)
      .where('status', '==', 'waitlisted')
      .orderBy('appliedAt', 'asc')
      .limit(1)
      .get();

    if (!waitlistedSnapshot.empty) {
      const nextStudent = waitlistedSnapshot.docs[0];
      await db.collection('applications').doc(nextStudent.id).update({
        status: 'admitted',
        updatedAt: new Date(),
        promotedFromWaitlist: true
      });

      const courseDoc = await db.collection('courses').doc(courseId).get();
      const institutionDoc = await db.collection('users').doc(institutionId).get();
      
      await NotificationService.createNotification(
        nextStudent.data().studentId,
        'Admission Offer',
        `Congratulations! You have been admitted to ${courseDoc.data().name} at ${institutionDoc.data().institutionName} from the waitlist.`,
        'success',
        '/student/admissions'
      );
    }
  } catch (error) {
    console.error('Error promoting waitlisted student:', error);
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  getStudentApplications,
  applyForCourse,
  uploadTranscript,
  uploadFinalTranscript,
  uploadCertificate,
  markStudiesCompleted,
  getAdmissions,
  getAvailableJobs,
  getJobRecommendations,
  applyForJob,
  getStudentJobApplications,
  getStudentDocuments,
  acceptAdmissionOffer,
  getStudentDashboard,
  deleteApplication,
  deleteDocument
};