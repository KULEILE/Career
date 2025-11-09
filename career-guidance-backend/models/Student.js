const { db } = require('../config/firebase');

class Student {
  constructor(data) {
    this.uid = data.uid;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = 'student';
    this.dateOfBirth = data.dateOfBirth;
    this.phone = data.phone;
    this.address = data.address;
    this.highSchool = data.highSchool;
    this.graduationYear = data.graduationYear;
    this.subjects = data.subjects || [];
    this.transcriptUrl = data.transcriptUrl;
    this.certificates = data.certificates || [];
    this.hasTranscript = data.hasTranscript || false;
    this.studyCompleted = data.studyCompleted || false;
    this.applicationsCount = data.applicationsCount || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toFirestore() {
    return {
      uid: this.uid,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      dateOfBirth: this.dateOfBirth,
      phone: this.phone,
      address: this.address,
      highSchool: this.highSchool,
      graduationYear: this.graduationYear,
      subjects: this.subjects,
      transcriptUrl: this.transcriptUrl,
      certificates: this.certificates,
      hasTranscript: this.hasTranscript,
      studyCompleted: this.studyCompleted,
      applicationsCount: this.applicationsCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Student({
      uid: doc.id,
      ...data
    });
  }

  canApplyToInstitution(institutionId) {
    const currentCount = this.applicationsCount[institutionId] || 0;
    return currentCount < 2;
  }

  incrementApplicationCount(institutionId) {
    this.applicationsCount[institutionId] = (this.applicationsCount[institutionId] || 0) + 1;
  }

  canUploadFinalDocuments() {
    return this.studyCompleted === true;
  }

  meetsRequirements(courseRequirements) {
    if (!courseRequirements || !courseRequirements.subjects) return false;

    const studentGrades = {};
    this.subjects.forEach(subject => {
      studentGrades[subject.name] = subject.grade;
    });

    for (const requiredSubject of courseRequirements.subjects) {
      const studentGrade = studentGrades[requiredSubject.name];
      if (!studentGrade || this.getGradePoint(studentGrade) < this.getGradePoint(requiredSubject.minGrade)) {
        return false;
      }
    }
    return true;
  }

  getGradePoint(grade) {
    const gradePoints = {
      'A': 90, 'B': 80, 'C': 70, 'D': 60, 'E': 50, 'F': 0
    };
    return gradePoints[grade] || 0;
  }

  markStudiesCompleted() {
    this.studyCompleted = true;
    this.updatedAt = new Date();
  }

  addFinalTranscript(transcriptUrl) {
    if (!this.studyCompleted) {
      throw new Error('Cannot upload final transcript before completing studies');
    }
    this.transcriptUrl = transcriptUrl;
    this.hasTranscript = true;
    this.updatedAt = new Date();
  }

  addCertificate(certificate) {
    if (!this.studyCompleted) {
      throw new Error('Cannot upload certificates before completing studies');
    }
    this.certificates.push({
      ...certificate,
      uploadedAt: new Date()
    });
    this.updatedAt = new Date();
  }

  static async getByUid(uid) {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) return null;
    return Student.fromFirestore(doc);
  }

  async save() {
    await db.collection('users').doc(this.uid).set(this.toFirestore(), { merge: true });
  }
}

module.exports = Student;