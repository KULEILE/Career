const { db } = require('../config/firebase');
const { courseValidation } = require('../middleware/validation');

// Get all courses - FIXED: Include both direct fields and nested institution
const getAllCourses = async (req, res) => {
  try {
    const coursesSnapshot = await db.collection('courses').get();
    const courses = [];
    
    for (const doc of coursesSnapshot.docs) {
      const course = doc.data();
      
      // Get institution data
      let institutionData = {};
      let institutionName = '';
      let institutionContact = {};
      
      try {
        const institutionDoc = await db.collection('institutions').doc(course.institutionId).get();
        if (institutionDoc.exists) {
          institutionData = institutionDoc.data();
          institutionName = institutionData.name || institutionData.institutionName || 'Unknown Institution';
          institutionContact = institutionData.contactInfo || {};
        }
      } catch (error) {
        console.log('Institution not found for course:', course.institutionId);
      }
      
      courses.push({
        id: doc.id,
        ...course,
        // ✅ DIRECT FIELDS for frontend compatibility
        institutionName: institutionName,
        institutionEmail: institutionContact.email || '',
        institutionPhone: institutionContact.phone || '',
        // Ensure tuitionFee is always included
        tuitionFee: course.tuitionFee || 'Not specified',
        // Keep the nested institution for other uses
        institution: institutionData
      });
    }
    
    res.json({ courses });
  } catch (error) {
    console.error('Error in getAllCourses:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get single course - FIXED: Include both direct fields and nested institution
const getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) return res.status(404).json({ error: 'Course not found' });

    const course = courseDoc.data();
    
    // Get institution data
    let institutionData = {};
    let institutionName = '';
    let institutionContact = {};
    
    try {
      const institutionDoc = await db.collection('institutions').doc(course.institutionId).get();
      if (institutionDoc.exists) {
        institutionData = institutionDoc.data();
        institutionName = institutionData.name || institutionData.institutionName || 'Unknown Institution';
        institutionContact = institutionData.contactInfo || {};
      }
    } catch (error) {
      console.log('Institution not found for course:', course.institutionId);
    }
    
    res.json({
      course: { 
        id: courseDoc.id, 
        ...course,
        // ✅ DIRECT FIELDS for frontend compatibility
        institutionName: institutionName,
        institutionEmail: institutionContact.email || '',
        institutionPhone: institutionContact.phone || '',
        // Ensure tuitionFee is always included
        tuitionFee: course.tuitionFee || 'Not specified',
        // Keep the nested institution for other uses
        institution: institutionData 
      }
    });
  } catch (error) {
    console.error('Error in getCourse:', error);
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
    
    // Get institution data once
    let institutionData = {};
    let institutionName = '';
    
    try {
      const institutionDoc = await db.collection('institutions').doc(institutionId).get();
      if (institutionDoc.exists) {
        institutionData = institutionDoc.data();
        institutionName = institutionData.name || institutionData.institutionName || 'Unknown Institution';
      }
    } catch (error) {
      console.log('Institution not found:', institutionId);
    }
    
    coursesSnapshot.forEach(doc => {
      const course = doc.data();
      courses.push({ 
        id: doc.id, 
        ...course,
        // ✅ Add direct institution name for consistency
        institutionName: institutionName,
        // Ensure tuitionFee is included
        tuitionFee: course.tuitionFee || 'Not specified'
      });
    });
    
    res.json({ courses });
  } catch (error) {
    console.error('Error in getInstitutionCourses:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create new course - FIXED: Ensure all required fields are included
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
      // Ensure tuitionFee is always set
      tuitionFee: req.body.tuitionFee || 'Not specified'
    };

    const courseRef = await db.collection('courses').add(courseData);
    res.status(201).json({ 
      message: 'Course created successfully', 
      courseId: courseRef.id 
    });
  } catch (error) {
    console.error('Error in createCourse:', error);
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

    await courseRef.update({ 
      ...req.body, 
      updatedAt: new Date(),
      // Ensure tuitionFee is updated
      tuitionFee: req.body.tuitionFee || course.tuitionFee || 'Not specified'
    });
    
    const updatedDoc = await courseRef.get();
    res.json({ 
      success: true, 
      course: { id: updatedDoc.id, ...updatedDoc.data() }, 
      message: 'Course updated successfully' 
    });
  } catch (error) {
    console.error('Error in updateCourse:', error);
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
    console.error('Error in deleteCourse:', error);
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