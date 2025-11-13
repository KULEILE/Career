const { db } = require('../config/firebase');
const { courseValidation } = require('../middleware/validation');

// =================== Institution Profile ===================

// Get institution profile
const getInstitutionProfile = async (req, res) => {
  try {
    const institutionDoc = await db.collection('institutions').doc(req.user.uid).get();
    if (!institutionDoc.exists) return res.status(404).json({ error: 'Institution not found' });

    res.json({ institution: { id: institutionDoc.id, ...institutionDoc.data() } });
  } catch (error) {
    console.error('Error in getInstitutionProfile:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update institution profile
const updateInstitutionProfile = async (req, res) => {
  try {
    const institutionRef = db.collection('institutions').doc(req.user.uid);
    const institutionDoc = await institutionRef.get();
    if (!institutionDoc.exists) return res.status(404).json({ error: 'Institution not found' });

    await institutionRef.update({ ...req.body, updatedAt: new Date() });
    const updatedDoc = await institutionRef.get();
    res.json({ 
      success: true, 
      institution: { id: updatedDoc.id, ...updatedDoc.data() }, 
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Error in updateInstitutionProfile:', error);
    res.status(500).json({ error: error.message });
  }
};

// =================== Courses ===================

// Get all courses for this institution
const getCourses = async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', req.user.uid)
      .get();

    const courses = coursesSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      // ✅ Ensure tuitionFee is always included
      tuitionFee: doc.data().tuitionFee || 'Not specified'
    }));
    
    res.json({ courses });
  } catch (error) {
    console.error('Error in getCourses:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new course - UPDATED: Ensure all required fields are included
const createCourse = async (req, res) => {
  try {
    const { error } = courseValidation(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Get institution data to include in course
    const institutionDoc = await db.collection('institutions').doc(req.user.uid).get();
    if (!institutionDoc.exists) return res.status(404).json({ error: 'Institution not found' });
    
    const institutionData = institutionDoc.data();
    const institutionName = institutionData.name || institutionData.institutionName || 'Unknown Institution';

    const courseData = {
      ...req.body,
      institutionId: req.user.uid,
      institutionName: institutionName, // ✅ Add institution name directly
      createdAt: new Date(),
      updatedAt: new Date(),
      // ✅ Ensure tuitionFee is always set with default value
      tuitionFee: req.body.tuitionFee || 'Not specified',
      // ✅ Ensure other optional fields have defaults
      intakePeriod: req.body.intakePeriod || 'Not specified',
      availableSeats: req.body.availableSeats || 0,
      // ✅ Ensure requirements structure is complete
      requirements: {
        subjects: req.body.requirements?.subjects || [],
        minGrades: req.body.requirements?.minGrades || {}
      }
    };

    const courseRef = await db.collection('courses').add(courseData);
    
    // Get the created course to return complete data
    const createdCourseDoc = await courseRef.get();
    
    res.status(201).json({ 
      message: 'Course created successfully', 
      courseId: courseRef.id,
      course: { id: createdCourseDoc.id, ...createdCourseDoc.data() }
    });
  } catch (error) {
    console.error('Error in createCourse:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a course - UPDATED: Ensure consistent field structure
const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { error } = courseValidation(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) return res.status(404).json({ error: 'Course not found' });

    const course = courseDoc.data();
    if (course.institutionId !== req.user.uid) return res.status(403).json({ error: 'Access denied' });

    // ✅ Update with consistent field structure
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
      // ✅ Ensure tuitionFee is preserved or updated
      tuitionFee: req.body.tuitionFee || course.tuitionFee || 'Not specified',
      // ✅ Ensure requirements structure is maintained
      requirements: {
        subjects: req.body.requirements?.subjects || course.requirements?.subjects || [],
        minGrades: req.body.requirements?.minGrades || course.requirements?.minGrades || {}
      }
    };

    await courseRef.update(updateData);
    const updatedDoc = await courseRef.get();
    
    res.json({ 
      success: true, 
      course: { 
        id: updatedDoc.id, 
        ...updatedDoc.data(),
        // ✅ Ensure frontend gets consistent data
        tuitionFee: updatedDoc.data().tuitionFee || 'Not specified'
      }, 
      message: 'Course updated successfully' 
    });
  } catch (error) {
    console.error('Error in updateCourse:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a course
const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) return res.status(404).json({ error: 'Course not found' });

    const course = courseDoc.data();
    if (course.institutionId !== req.user.uid) return res.status(403).json({ error: 'Access denied' });

    await courseRef.delete();
    res.json({ 
      success: true, 
      message: 'Course deleted successfully' 
    });
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    res.status(500).json({ error: error.message });
  }
};

// =================== Applications ===================

// Get all applications for this institution
const getApplications = async (req, res) => {
  try {
    const applicationsSnapshot = await db.collection('applications')
      .where('institutionId', '==', req.user.uid)
      .get();

    const applications = applicationsSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    res.json({ applications });
  } catch (error) {
    console.error('Error in getApplications:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    const appRef = db.collection('applications').doc(applicationId);
    const appDoc = await appRef.get();
    if (!appDoc.exists) return res.status(404).json({ error: 'Application not found' });

    const application = appDoc.data();
    if (application.institutionId !== req.user.uid) return res.status(403).json({ error: 'Access denied' });

    const updateData = {
      status,
      updatedAt: new Date()
    };

    // Add notes if provided
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await appRef.update(updateData);
    const updatedDoc = await appRef.get();
    
    res.json({ 
      success: true, 
      application: { id: updatedDoc.id, ...updatedDoc.data() }, 
      message: 'Application updated successfully' 
    });
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    res.status(500).json({ error: error.message });
  }
};

// =================== Admissions ===================

// Publish admissions for this institution - FIXED VERSION
const publishAdmissions = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ 
        success: false,
        error: 'Course ID is required' 
      });
    }

    // Verify the course belongs to this institution
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Course not found' 
      });
    }

    const course = courseDoc.data();
    if (course.institutionId !== req.user.uid) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied' 
      });
    }

    // Update ALL applications for this course to set admissionPublished = true
    const applicationsSnapshot = await db.collection('applications')
      .where('courseId', '==', courseId)
      .where('institutionId', '==', req.user.uid)
      .get();

    if (applicationsSnapshot.empty) {
      return res.status(400).json({ 
        success: false,
        error: 'No applications found for this course' 
      });
    }

    const batch = db.batch();
    
    applicationsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        admissionPublished: true, 
        updatedAt: new Date() 
      });
    });

    await batch.commit();

    console.log(`Published admissions for ${applicationsSnapshot.size} applications in course: ${courseId}`);

    res.json({ 
      success: true, 
      message: `Admissions published successfully for ${applicationsSnapshot.size} applications`,
      publishedCount: applicationsSnapshot.size
    });
  } catch (error) {
    console.error('Error in publishAdmissions:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// =================== Waitlist Promotion ===================

// Promote student from waitlist
const promoteWaitlistedStudent = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const appRef = db.collection('applications').doc(applicationId);
    const appDoc = await appRef.get();
    
    if (!appDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = appDoc.data();
    
    // Verify the application belongs to this institution
    if (application.institutionId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify the application is waitlisted
    if (application.status !== 'waitlisted') {
      return res.status(400).json({ error: 'Only waitlisted applications can be promoted' });
    }

    // Promote to admitted
    await appRef.update({
      status: 'admitted',
      updatedAt: new Date(),
      promotedFromWaitlist: true,
      promotionDate: new Date()
    });

    const updatedDoc = await appRef.get();
    
    res.json({ 
      success: true, 
      application: { id: updatedDoc.id, ...updatedDoc.data() }, 
      message: 'Student promoted from waitlist successfully' 
    });
  } catch (error) {
    console.error('Error in promoteWaitlistedStudent:', error);
    res.status(500).json({ error: error.message });
  }
};

// =================== Exports ===================
module.exports = {
  getInstitutionProfile,
  updateInstitutionProfile,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getApplications,
  updateApplicationStatus,
  publishAdmissions,
  promoteWaitlistedStudent
};