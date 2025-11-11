const { db } = require('../config/firebase');

// Get all prospectus documents for institution
const getProspectus = async (req, res) => {
  try {
    const snapshot = await db
      .collection('prospectus')
      .where('institutionId', '==', req.user.uid)
      .get();

    const prospectusList = [];
    snapshot.forEach(doc => {
      prospectusList.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort manually by creation date (newest first)
    prospectusList.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });

    res.json({
      success: true,
      prospectus: prospectusList
    });
  } catch (error) {
    console.error('Error fetching prospectus:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching prospectus documents'
    });
  }
};

// Upload prospectus
const uploadProspectus = async (req, res) => {
  try {
    const { title, description, academicYear, fileUrl, fileName, fileSize, institutionId } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    if (!academicYear || !academicYear.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Academic year is required'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Description is required'
      });
    }

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        error: 'File is required'
      });
    }

    // Validate file type from base64 data URL
    if (!fileUrl.startsWith('data:application/pdf')) {
      return res.status(400).json({
        success: false,
        error: 'Only PDF files are allowed'
      });
    }

    // Validate file size (35MB max for base64 - which is ~25MB actual file)
    const base64Data = fileUrl.split(',')[1];
    if (!base64Data) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file data'
      });
    }

    const fileSizeInBytes = Buffer.from(base64Data, 'base64').length;
    if (fileSizeInBytes > 35 * 1024 * 1024) { // 35MB for base64
      return res.status(400).json({
        success: false,
        error: 'File size must be less than 25MB (35MB for base64 encoding)'
      });
    }

    const newProspectus = {
      title: title.trim(),
      description: description.trim(),
      academicYear: academicYear.trim(),
      fileUrl: fileUrl,
      fileName: fileName || 'prospectus.pdf',
      fileSize: fileSize || fileSizeInBytes,
      institutionId: institutionId || req.user.uid,
      published: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('prospectus').add(newProspectus);
    
    // Get the created document
    const savedDoc = await docRef.get();

    res.status(201).json({
      success: true,
      prospectus: { 
        id: docRef.id, 
        ...savedDoc.data()
      },
      message: 'Prospectus uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading prospectus:', error);
    
    // Handle payload too large error specifically
    if (error.type === 'entity.too.large') {
      return res.status(413).json({
        success: false,
        error: 'File too large. Please use a file smaller than 25MB.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Error uploading prospectus'
    });
  }
};

// Publish/unpublish prospectus
const publishProspectus = async (req, res) => {
  try {
    const { id } = req.params;
    const { published } = req.body;

    if (typeof published !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Published status is required and must be a boolean'
      });
    }

    const docRef = db.collection('prospectus').doc(id);
    const prospectusDoc = await docRef.get();

    if (!prospectusDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prospectus not found' 
      });
    }

    const prospectusData = prospectusDoc.data();

    if (prospectusData.institutionId !== req.user.uid) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    await docRef.update({ 
      published: published,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `Prospectus ${published ? 'published' : 'unpublished'} successfully`
    });
  } catch (error) {
    console.error('Error updating prospectus:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating prospectus'
    });
  }
};

// Delete prospectus
const deleteProspectus = async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection('prospectus').doc(id);
    const prospectusDoc = await docRef.get();

    if (!prospectusDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prospectus not found' 
      });
    }

    const prospectusData = prospectusDoc.data();

    if (prospectusData.institutionId !== req.user.uid) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    await docRef.delete();

    res.json({ 
      success: true, 
      message: 'Prospectus deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting prospectus:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error deleting prospectus'
    });
  }
};

module.exports = {
  getProspectus,
  uploadProspectus,
  publishProspectus,
  deleteProspectus
};