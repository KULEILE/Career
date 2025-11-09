// controllers/prospectusController.js
const { db } = require('../config/firebase');

// Get all prospectus documents for institution
const getProspectus = async (req, res) => {
  try {
    const snapshot = await db
      .collection('prospectus')
      .where('institutionId', '==', req.user.uid)
      .get();

    const prospectusList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

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
    const { title, description, academicYear, fileUrl, fileName, fileSize } = req.body;

    const newProspectus = {
      title,
      description,
      academicYear,
      fileUrl,
      fileName,
      fileSize: fileSize || 0,
      institutionId: req.user.uid,
      published: false,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('prospectus').add(newProspectus);
    const savedDoc = await docRef.get();

    res.status(201).json({
      success: true,
      prospectus: { id: docRef.id, ...savedDoc.data() },
      message: 'Prospectus uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading prospectus:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error uploading prospectus'
    });
  }
};

// Publish/unpublish prospectus
const publishProspectus = async (req, res) => {
  try {
    const docRef = db.collection('prospectus').doc(req.params.id);
    const prospectusDoc = await docRef.get();

    if (!prospectusDoc.exists)
      return res.status(404).json({ success: false, error: 'Prospectus not found' });

    if (prospectusDoc.data().institutionId !== req.user.uid)
      return res.status(403).json({ success: false, error: 'Access denied' });

    await docRef.update({ published: req.body.published });

    res.json({
      success: true,
      message: `Prospectus ${req.body.published ? 'published' : 'unpublished'} successfully`
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
    const docRef = db.collection('prospectus').doc(req.params.id);
    const prospectusDoc = await docRef.get();

    if (!prospectusDoc.exists)
      return res.status(404).json({ success: false, error: 'Prospectus not found' });

    if (prospectusDoc.data().institutionId !== req.user.uid)
      return res.status(403).json({ success: false, error: 'Access denied' });

    await docRef.delete();

    res.json({ success: true, message: 'Prospectus deleted successfully' });
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
