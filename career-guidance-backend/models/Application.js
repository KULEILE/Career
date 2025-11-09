class Application {
  constructor(data) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.courseId = data.courseId;
    this.institutionId = data.institutionId;
    this.subjects = data.subjects || []; // Student's high school subjects and grades
    this.status = data.status || 'pending'; // pending, admitted, rejected, waitlisted, accepted
    this.appliedAt = data.appliedAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.admissionPublished = data.admissionPublished || false;
    this.notes = data.notes;
  }

  toFirestore() {
    return {
      studentId: this.studentId,
      courseId: this.courseId,
      institutionId: this.institutionId,
      subjects: this.subjects,
      status: this.status,
      appliedAt: this.appliedAt,
      updatedAt: this.updatedAt,
      admissionPublished: this.admissionPublished,
      notes: this.notes
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Application({
      id: doc.id,
      ...data
    });
  }

  canBeAdmitted() {
    return this.status === 'pending' || this.status === 'waitlisted';
  }

  isAdmitted() {
    return this.status === 'admitted';
  }
}

module.exports = Application;