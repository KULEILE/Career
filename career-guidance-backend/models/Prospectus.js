const { admin } = require('../config/firebase');

// Check if Firebase is properly initialized
if (!admin.apps.length) {
  throw new Error('Firebase Admin SDK not initialized');
}

const db = admin.firestore();

class Prospectus {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.academicYear = data.academicYear;
    this.fileUrl = data.fileUrl;
    this.fileName = data.fileName;
    this.fileSize = data.fileSize;
    this.published = data.published || false;
    this.institutionId = data.institutionId;
    this.uploadedAt = data.uploadedAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new prospectus
  static async create(prospectusData) {
    try {
      const prospectusRef = db.collection('prospectus').doc();
      const prospectus = {
        id: prospectusRef.id,
        ...prospectusData,
        uploadedAt: new Date(),
        updatedAt: new Date()
      };

      await prospectusRef.set(prospectus);
      return new Prospectus(prospectus);
    } catch (error) {
      console.error('Firestore error in Prospectus.create:', error);
      throw new Error('Error creating prospectus: ' + error.message);
    }
  }

  // Find prospectus by ID
  static async findById(prospectusId) {
    try {
      const prospectusDoc = await db.collection('prospectus').doc(prospectusId).get();
      if (!prospectusDoc.exists) {
        return null;
      }
      return new Prospectus(prospectusDoc.data());
    } catch (error) {
      console.error('Firestore error in Prospectus.findById:', error);
      throw new Error('Error finding prospectus: ' + error.message);
    }
  }

  // Find prospectus by institution
  static async findByInstitution(institutionId) {
    try {
      const prospectusSnapshot = await db.collection('prospectus')
        .where('institutionId', '==', institutionId)
        .orderBy('uploadedAt', 'desc')
        .get();

      const prospectusList = [];
      prospectusSnapshot.forEach(doc => {
        prospectusList.push(new Prospectus(doc.data()));
      });

      return prospectusList;
    } catch (error) {
      console.error('Firestore error in Prospectus.findByInstitution:', error);
      throw new Error('Error finding prospectus by institution: ' + error.message);
    }
  }

  // Update prospectus
  async update(updateData) {
    try {
      const updateFields = {
        ...updateData,
        updatedAt: new Date()
      };

      await db.collection('prospectus').doc(this.id).update(updateFields);
      
      // Update local instance
      Object.assign(this, updateFields);
      return this;
    } catch (error) {
      console.error('Firestore error in Prospectus.update:', error);
      throw new Error('Error updating prospectus: ' + error.message);
    }
  }

  // Delete prospectus
  async delete() {
    try {
      await db.collection('prospectus').doc(this.id).delete();
      return true;
    } catch (error) {
      console.error('Firestore error in Prospectus.delete:', error);
      throw new Error('Error deleting prospectus: ' + error.message);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      academicYear: this.academicYear,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      fileSize: this.fileSize,
      published: this.published,
      institutionId: this.institutionId,
      uploadedAt: this.uploadedAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Prospectus;