class Course {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.duration = data.duration;
    this.requirements = data.requirements || {
      subjects: [],
      minGrades: {}
    };
    this.institutionId = data.institutionId;
    this.institutionName = data.institutionName || ''; // ✅ Add institutionName field
    this.faculty = data.faculty;
    this.tuitionFee = data.tuitionFee || 'Not specified'; // ✅ Ensure default value
    this.intakePeriod = data.intakePeriod; // ✅ Fixed: removed duplicate declaration
    this.applicationDeadline = data.applicationDeadline;
    this.availableSeats = data.availableSeats;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.active = data.active !== undefined ? data.active : true;
  }

  toFirestore() {
    return {
      name: this.name,
      description: this.description,
      duration: this.duration,
      requirements: this.requirements,
      institutionId: this.institutionId,
      institutionName: this.institutionName, // ✅ Include in Firestore
      faculty: this.faculty,
      tuitionFee: this.tuitionFee,
      intakePeriod: this.intakePeriod,
      applicationDeadline: this.applicationDeadline,
      availableSeats: this.availableSeats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      active: this.active
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Course({
      id: doc.id,
      ...data
    });
  }
}

module.exports = Course;