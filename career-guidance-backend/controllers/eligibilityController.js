const { db } = require('../config/firebase');
const { checkCourseEligibility } = require('../services/eligibilityService');

const checkEligibility = async (req, res) => {
  try {
    const { subjects, grades } = req.body;

    if (!subjects || !grades) {
      return res.status(400).json({ error: 'Subjects and grades are required' });
    }

    // Get all courses from Firestore
    const coursesSnapshot = await db.collection('courses').get();
    const courses = [];
    
    coursesSnapshot.forEach(doc => {
      courses.push({ id: doc.id, ...doc.data() });
    });

    // Check eligibility for each course
    const eligibleCourses = [];
    for (const course of courses) {
      const isEligible = await checkCourseEligibility(course, subjects, grades);
      if (isEligible) {
        // Get institution details
        const institutionDoc = await db.collection('users').doc(course.institutionId).get();
        if (institutionDoc.exists) {
          eligibleCourses.push({
            ...course,
            id: course.id,
            institution: institutionDoc.data()
          });
        }
      }
    }

    res.json({ 
      eligibleCourses,
      totalCourses: courses.length,
      eligibleCount: eligibleCourses.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { checkEligibility };