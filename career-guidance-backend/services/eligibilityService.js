const gradePoints = { 'A': 90, 'B': 80, 'C': 70, 'D': 60, 'E': 50, 'F': 0 };

const checkCourseEligibility = (course, studentSubjects, studentGrades) => {
  try {
    const requirements = course.requirements;
    if (!requirements || !requirements.subjects || !requirements.minGrades) return false;

    for (const requiredSubject of requirements.subjects) {
      const studentSubject = studentSubjects.find(s => s.name.toLowerCase() === requiredSubject.toLowerCase());
      if (!studentSubject) return false;

      const minGrade = requirements.minGrades[requiredSubject];
      const studentGrade = studentGrades[studentSubject.name];

      if (!studentGrade || gradePoints[studentGrade] < gradePoints[minGrade]) return false;
    }

    return true;
  } catch (err) {
    console.error('Eligibility check error:', err);
    return false;
  }
};

module.exports = { checkCourseEligibility };
