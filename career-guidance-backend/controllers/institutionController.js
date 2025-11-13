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
    res.json({ success: true, institution: { id: updatedDoc.id, ...updatedDoc.data() }, message: 'Profile updated successfully' });
  } catch (error) {
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

    const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new course - FIXED: Added institution name
const createCourse = async (req, res) => {
  try {
    const { error } = courseValidation(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Get institution name to include in course data
    const institutionDoc = await db.collection('institutions').doc(req.user.uid).get();
    if (!institutionDoc.exists) return res.status(404).json({ error: 'Institution not found' });
    
    const institutionData = institutionDoc.data();
    const institutionName = institutionData.name || institutionData.institutionName || 'Unknown Institution';

    const courseData = {
      ...req.body,
      institutionId: req.user.uid,
      institutionName: institutionName, // Add institution name to course
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const courseRef = await db.collection('courses').add(courseData);
    res.status(201).json({ message: 'Course created successfully', courseId: courseRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a course
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

    await courseRef.update({ ...req.body, updatedAt: new Date() });
    const updatedDoc = await courseRef.get();
    res.json({ success: true, course: { id: updatedDoc.id, ...updatedDoc.data() }, message: 'Course updated successfully' });
  } catch (error) {
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
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
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

    const applications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const appRef = db.collection('applications').doc(applicationId);
    const appDoc = await appRef.get();
    if (!appDoc.exists) return res.status(404).json({ error: 'Application not found' });

    if (appDoc.data().institutionId !== req.user.uid) return res.status(403).json({ error: 'Access denied' });

    await appRef.update({ status, updatedAt: new Date() });
    const updatedDoc = await appRef.get();
    res.json({ success: true, application: { id: updatedDoc.id, ...updatedDoc.data() }, message: 'Application updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =================== Admissions ===================

// Publish admissions for this institution
const publishAdmissions = async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', req.user.uid)
      .get();

    const batch = db.batch();
    coursesSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { admissionsPublished: true, updatedAt: new Date() });
    });

    await batch.commit();
    res.json({ success: true, message: 'Admissions published successfully' });
  } catch (error) {
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
  publishAdmissions
};