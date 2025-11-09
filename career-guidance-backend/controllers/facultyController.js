const { db } = require('../config/firebase');
const { facultyValidation } = require('../middleware/validation');

// Get all faculties for institution
const getFaculties = async (req, res) => {
  try {
    const institutionId = req.user.uid; // user.uid = institution ID

    const snapshot = await db
      .collection('faculties')
      .where('institutionId', '==', institutionId)
      .get();

    const faculties = [];
    snapshot.forEach(doc => faculties.push({ id: doc.id, ...doc.data() }));

    res.json({
      success: true,
      faculties,
    });
  } catch (error) {
    console.error('Error fetching faculties:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching faculties',
    });
  }
};

// Get single faculty
const getFaculty = async (req, res) => {
  try {
    const docRef = db.collection('faculties').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Faculty not found' });
    }

    const faculty = doc.data();

    if (faculty.institutionId !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, faculty: { id: doc.id, ...faculty } });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ success: false, error: error.message || 'Error fetching faculty' });
  }
};

// Create new faculty
const createFaculty = async (req, res) => {
  try {
    const { error } = facultyValidation(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const facultyData = {
      ...req.body,
      institutionId: req.user.uid,
      createdAt: new Date(),
    };

    const docRef = await db.collection('faculties').add(facultyData);
    res.status(201).json({ success: true, faculty: { id: docRef.id, ...facultyData }, message: 'Faculty created successfully' });
  } catch (error) {
    console.error('Error creating faculty:', error);
    res.status(500).json({ success: false, error: error.message || 'Error creating faculty' });
  }
};

// Update faculty
const updateFaculty = async (req, res) => {
  try {
    const { error } = facultyValidation(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const docRef = db.collection('faculties').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ success: false, error: 'Faculty not found' });

    const faculty = doc.data();
    if (faculty.institutionId !== req.user.uid) return res.status(403).json({ success: false, error: 'Access denied' });

    await docRef.update(req.body);

    const updatedDoc = await docRef.get();
    res.json({ success: true, faculty: { id: updatedDoc.id, ...updatedDoc.data() }, message: 'Faculty updated successfully' });
  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({ success: false, error: error.message || 'Error updating faculty' });
  }
};

// Delete faculty
const deleteFaculty = async (req, res) => {
  try {
    const docRef = db.collection('faculties').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ success: false, error: 'Faculty not found' });

    const faculty = doc.data();
    if (faculty.institutionId !== req.user.uid) return res.status(403).json({ success: false, error: 'Access denied' });

    await docRef.delete();
    res.json({ success: true, message: 'Faculty deleted successfully' });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({ success: false, error: error.message || 'Error deleting faculty' });
  }
};

module.exports = { getFaculties, getFaculty, createFaculty, updateFaculty, deleteFaculty };
