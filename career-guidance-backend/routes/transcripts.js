const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authenticate, requireRole } = require('../middleware/auth');

// Apply authentication and admin role check to all routes
router.use(authenticate, requireRole(['admin']));

// Get all pending transcripts
router.get('/pending', async (req, res) => {
  console.log('GET /admin/transcripts/pending - Starting...');
  try {
    const db = admin.firestore();
    
    console.log('Querying users collection for pending transcripts...');
    const usersSnapshot = await db.collection('users')
      .where('transcriptVerified', '==', false)
      .where('transcriptFileName', '!=', null)
      .get();

    console.log(`Found ${usersSnapshot.size} users with transcriptVerified=false`);
    
    const pendingTranscripts = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.transcriptData && userData.transcriptFileName) {
        pendingTranscripts.push({
          uid: doc.id,
          transcriptData: userData.transcriptData,
          transcriptFileName: userData.transcriptFileName,
          transcriptFileSize: userData.transcriptFileSize,
          transcriptFileType: userData.transcriptFileType,
          transcriptUploadedAt: userData.transcriptUploadedAt,
          transcriptVerified: userData.transcriptVerified,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email
        });
      }
    });

    console.log(`Returning ${pendingTranscripts.length} pending transcripts with files`);
    res.json({
      success: true,
      pendingTranscripts
    });
  } catch (error) {
    console.error('Error fetching pending transcripts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending transcripts',
      message: error.message
    });
  }
});

// Approve transcript
router.put('/:uid/approve', async (req, res) => {
  console.log(`PUT /admin/transcripts/${req.params.uid}/approve - Starting...`);
  try {
    const { uid } = req.params;
    const db = admin.firestore();
    
    const updateData = {
      transcriptVerified: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      transcriptVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      transcriptVerifiedBy: req.user.uid
    };

    await db.collection('users').doc(uid).update(updateData);

    console.log(`Transcript approved for user: ${uid}`);
    res.json({
      success: true,
      message: 'Transcript approved successfully'
    });
  } catch (error) {
    console.error('Error approving transcript:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve transcript',
      message: error.message
    });
  }
});

// Reject transcript
router.put('/:uid/reject', async (req, res) => {
  console.log(`PUT /admin/transcripts/${req.params.uid}/reject - Starting...`);
  try {
    const { uid } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const db = admin.firestore();
    
    const updateData = {
      transcriptVerified: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      transcriptRejectionReason: reason,
      transcriptRejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      transcriptRejectedBy: req.user.uid
    };

    await db.collection('users').doc(uid).update(updateData);

    console.log(`Transcript rejected for user: ${uid}`);
    res.json({
      success: true,
      message: 'Transcript rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting transcript:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject transcript',
      message: error.message
    });
  }
});

module.exports = router;