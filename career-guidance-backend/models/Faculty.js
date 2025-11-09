const { admin } = require('../config/firebase');

// Check if Firebase is properly initialized
if (!admin.apps.length) {
  throw new Error('Firebase Admin SDK not initialized');
}

const db = admin.firestore();

class Faculty {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.dean = data.dean;
    this.contactEmail = data.contactEmail;
    this.phone = data.phone;
    this.departments = data.departments || [];
    this.institutionId = data.institutionId;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new faculty
  static async create(facultyData) {
    try {
      const facultyRef = db.collection('faculties').doc();
      const faculty = {
        id: facultyRef.id,
        ...facultyData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await facultyRef.set(faculty);
      return new Faculty(faculty);
    } catch (error) {
      console.error('Firestore error in Faculty.create:', error);
      throw new Error('Error creating faculty: ' + error.message);
    }
  }

  // Find faculty by ID
  static async findById(facultyId) {
    try {
      const facultyDoc = await db.collection('faculties').doc(facultyId).get();
      if (!facultyDoc.exists) {
        return null;
      }
      return new Faculty(facultyDoc.data());
    } catch (error) {
      console.error('Firestore error in Faculty.findById:', error);
      throw new Error('Error finding faculty: ' + error.message);
    }
  }

  // Find faculties by institution
  static async findByInstitution(institutionId) {
    try {
      const facultiesSnapshot = await db.collection('faculties')
        .where('institutionId', '==', institutionId)
        .orderBy('createdAt', 'desc')
        .get();

      const faculties = [];
      facultiesSnapshot.forEach(doc => {
        faculties.push(new Faculty(doc.data()));
      });

      return faculties;
    } catch (error) {
      console.error('Firestore error in Faculty.findByInstitution:', error);
      throw new Error('Error finding faculties by institution: ' + error.message);
    }
  }

  // Update faculty
  async update(updateData) {
    try {
      const updateFields = {
        ...updateData,
        updatedAt: new Date()
      };

      await db.collection('faculties').doc(this.id).update(updateFields);
      
      // Update local instance
      Object.assign(this, updateFields);
      return this;
    } catch (error) {
      console.error('Firestore error in Faculty.update:', error);
      throw new Error('Error updating faculty: ' + error.message);
    }
  }

  // Delete faculty
  async delete() {
    try {
      // Check if faculty has courses
      const coursesSnapshot = await db.collection('courses')
        .where('facultyId', '==', this.id)
        .limit(1)
        .get();

      if (!coursesSnapshot.empty) {
        throw new Error('Cannot delete faculty with existing courses');
      }

      await db.collection('faculties').doc(this.id).delete();
      return true;
    } catch (error) {
      console.error('Firestore error in Faculty.delete:', error);
      throw new Error('Error deleting faculty: ' + error.message);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      dean: this.dean,
      contactEmail: this.contactEmail,
      phone: this.phone,
      departments: this.departments,
      institutionId: this.institutionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Faculty;