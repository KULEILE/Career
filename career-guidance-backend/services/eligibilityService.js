// Grade point mapping
const gradePoints = {
  'A': 90,
  'B': 80,
  'C': 70,
  'D': 60,
  'E': 50,
  'F': 0
};

const checkCourseEligibility = (course, studentSubjects, studentGrades) => {
  try {
    const courseRequirements = course.requirements;
    
    if (!courseRequirements || !courseRequirements.subjects || !courseRequirements.minGrades) {
      return false;
    }

    // Check if student meets all required subjects
    const requiredSubjects = courseRequirements.subjects;
    const minGrades = courseRequirements.minGrades;

    for (const requiredSubject of requiredSubjects) {
      const studentSubject = studentSubjects.find(sub => 
        sub.name.toLowerCase() === requiredSubject.toLowerCase()
      );

      if (!studentSubject) {
        return false; // Student doesn't have this subject
      }

      const minGrade = minGrades[requiredSubject];
      const studentGrade = studentGrades[studentSubject.name];

      if (!studentGrade || gradePoints[studentGrade] < gradePoints[minGrade]) {
        return false; // Student doesn't meet grade requirement
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return false;
  }
};

module.exports = { checkCourseEligibility };