class Admission {
  constructor(data) {
    this.id = data.id;
    this.studentId = data.studentId;
    this.courseId = data.courseId;
    this.institutionId = data.institutionId;
    this.applicationId = data.applicationId;
    this.offerDate = data.offerDate || new Date();
    this.acceptanceDeadline = data.acceptanceDeadline;
    this.status = data.status || 'offered'; // offered, accepted, declined
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toFirestore() {
    return {
      studentId: this.studentId,
      courseId: this.courseId,
      institutionId: this.institutionId,
      applicationId: this.applicationId,
      offerDate: this.offerDate,
      acceptanceDeadline: this.acceptanceDeadline,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Admission({
      id: doc.id,
      ...data
    });
  }

  canBeAccepted() {
    return this.status === 'offered' && new Date() < new Date(this.acceptanceDeadline);
  }
}

module.exports = Admission;