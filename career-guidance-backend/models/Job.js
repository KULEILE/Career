class Job {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.requirements = data.requirements || [];
    this.qualifications = data.qualifications || [];
    this.companyId = data.companyId;
    this.deadline = data.deadline;
    this.location = data.location;
    this.salary = data.salary;
    this.jobType = data.jobType; // full-time, part-time, contract
    this.active = data.active !== undefined ? data.active : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toFirestore() {
    return {
      title: this.title,
      description: this.description,
      requirements: this.requirements,
      qualifications: this.qualifications,
      companyId: this.companyId,
      deadline: this.deadline,
      location: this.location,
      salary: this.salary,
      jobType: this.jobType,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Job({
      id: doc.id,
      ...data
    });
  }

  isActive() {
    return this.active && new Date(this.deadline) > new Date();
  }
}

module.exports = Job;