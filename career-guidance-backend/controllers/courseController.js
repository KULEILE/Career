const { db } = require('../config/firebase');
const { courseValidation } = require('../middleware/validation');

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses').get();
    const courses = [];
    for (const doc of coursesSnapshot.docs) {
      const course = doc.data();
      const institutionDoc = await db.collection('users').doc(course.institutionId).get();
      courses.push({
        id: doc.id,
        ...course,
        institution: institutionDoc.data()
      });
    }
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single course
const getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) return res.status(404).json({ error: 'Course not found' });

    const course = courseDoc.data();
    const institutionDoc = await db.collection('users').doc(course.institutionId).get();
    res.json({
      course: { id: courseDoc.id, ...course, institution: institutionDoc.data() }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all courses for a specific institution
const getInstitutionCourses = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', institutionId)
      .get();

    const courses = [];
    coursesSnapshot.forEach(doc => courses.push({ id: doc.id, ...doc.data() }));
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new course
const createCourse = async (req, res) => {
  try {
    const { error } = courseValidation(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const courseData = {
      ...req.body,
      institutionId: req.user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const courseRef = await db.collection('courses').add(courseData);
    res.status(201).json({ message: 'Course created successfully', courseId: courseRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update course
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

// Delete course
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

module.exports = {
  getAllCourses,
  getCourse,
  getInstitutionCourses,
  createCourse,
  updateCourse,
  deleteCourse
};
