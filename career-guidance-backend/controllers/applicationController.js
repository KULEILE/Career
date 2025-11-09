const { db } = require('../config/firebase');
const { applicationValidation } = require('../middleware/validation');
const { checkCourseEligibility } = require('../services/eligibilityService');

const createApplication = async (req, res) => {
  try {
    const { error } = applicationValidation(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { courseId, institutionId, subjects } = req.body;
    const studentId = req.user.uid;

    // Check if student has already applied to 2 courses in this institution
    const existingApplications = await db.collection('applications')
      .where('studentId', '==', studentId)
      .where('institutionId', '==', institutionId)
      .get();

    if (existingApplications.size >= 2) {
      return res.status(400).json({ 
        error: 'You can only apply for maximum 2 courses per institution' 
      });
    }

    // Check if already applied to this course
    const existingCourseApplication = await db.collection('applications')
      .where('studentId', '==', studentId)
      .where('courseId', '==', courseId)
      .get();

    if (!existingCourseApplication.empty) {
      return res.status(400).json({ 
        error: 'You have already applied for this course' 
      });
    }

    // Get course details
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseDoc.data();

    // Check eligibility
    const isEligible = await checkCourseEligibility(course, subjects);
    if (!isEligible) {
      return res.status(400).json({ 
        error: 'You do not meet the course requirements' 
      });
    }

    // Create application
    const applicationData = {
      studentId,
      courseId,
      institutionId,
      subjects,
      status: 'pending',
      appliedAt: new Date(),
      updatedAt: new Date()
    };

    const applicationRef = await db.collection('applications').add(applicationData);

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: applicationRef.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = applicationDoc.data();
    
    // Get additional data
    const [courseDoc, institutionDoc, studentDoc] = await Promise.all([
      db.collection('courses').doc(application.courseId).get(),
      db.collection('users').doc(application.institutionId).get(),
      db.collection('users').doc(application.studentId).get()
    ]);

    res.json({
      application: {
        id: applicationDoc.id,
        ...application,
        course: courseDoc.data(),
        institution: institutionDoc.data(),
        student: studentDoc.data()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const acceptAdmission = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const applicationDoc = await db.collection('applications').doc(applicationId).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = applicationDoc.data();

    // Check if this application belongs to the student
    if (application.studentId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if already admitted
    if (application.status !== 'admitted') {
      return res.status(400).json({ error: 'You are not admitted to this course' });
    }

    // Get all other admitted applications for this student
    const otherAdmittedApplications = await db.collection('applications')
      .where('studentId', '==', req.user.uid)
      .where('status', '==', 'admitted')
      .get();

    // Update all other admitted applications to rejected
    const batch = db.batch();
    otherAdmittedApplications.docs.forEach(doc => {
      if (doc.id !== applicationId) {
        batch.update(doc.ref, {
          status: 'rejected',
          updatedAt: new Date()
        });

        // TODO: Promote next student from waitlist for each rejected application
      }
    });

    // Mark this application as accepted
    batch.update(applicationDoc.ref, {
      status: 'accepted',
      updatedAt: new Date()
    });

    await batch.commit();

    res.json({ message: 'Admission accepted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createApplication,
  getApplication,
  acceptAdmission
};