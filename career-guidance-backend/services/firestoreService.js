const { db } = require('../config/firebase');

class FirestoreService {
  // Generic methods
  async create(collection, data) {
    const docRef = await db.collection(collection).add(data);
    return docRef.id;
  }

  async getById(collection, id) {
    const doc = await db.collection(collection).doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async update(collection, id, data) {
    await db.collection(collection).doc(id).update({
      ...data,
      updatedAt: new Date()
    });
  }

  async delete(collection, id) {
    await db.collection(collection).doc(id).delete();
  }

  async query(collection, field, operator, value) {
    const snapshot = await db.collection(collection)
      .where(field, operator, value)
      .get();
    
    const results = [];
    snapshot.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  }

  // Student specific methods
  async getStudentApplications(studentId) {
    return this.query('applications', 'studentId', '==', studentId);
  }

  async getInstitutionCourses(institutionId) {
    return this.query('courses', 'institutionId', '==', institutionId);
  }

  async getCourseApplications(courseId) {
    return this.query('applications', 'courseId', '==', courseId);
  }

  async getCompanyJobs(companyId) {
    return this.query('jobs', 'companyId', '==', companyId);
  }

  // Check if student has reached application limit for institution
  async canStudentApplyToInstitution(studentId, institutionId) {
    const applications = await this.query('applications', 'studentId', '==', studentId);
    const institutionApplications = applications.filter(app => app.institutionId === institutionId);
    return institutionApplications.length < 2;
  }

  // Get waitlisted students for a course
  async getWaitlistedStudents(courseId) {
    return this.query('applications', 'courseId', '==', courseId)
      .then(applications => applications.filter(app => app.status === 'waitlisted'));
  }

  // Promote waitlisted student
  async promoteWaitlistedStudent(applicationId) {
    await this.update('applications', applicationId, { status: 'admitted' });
  }
}

module.exports = new FirestoreService();