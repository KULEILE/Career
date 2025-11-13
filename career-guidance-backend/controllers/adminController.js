const { db, admin } = require('../config/firebase'); // Firebase Admin SDK for timestamps

// ====================== DASHBOARD ======================
const getDashboard = async (req, res) => {
  try {
    const [
      studentsSnapshot,
      institutionsSnapshot,
      companiesSnapshot,
      applicationsSnapshot,
      jobsSnapshot
    ] = await Promise.all([
      db.collection('users').where('role', '==', 'student').get(),
      db.collection('institutions').get(),
      db.collection('companies').get(),
      db.collection('applications').get(),
      db.collection('jobs').get()
    ]);

    const stats = {
      totalStudents: studentsSnapshot.size,
      totalInstitutions: institutionsSnapshot.size,
      totalCompanies: companiesSnapshot.size,
      totalApplications: applicationsSnapshot.size,
      totalJobs: jobsSnapshot.size
    };

    res.json({ stats });
  } catch (error) {
    console.error('getDashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ====================== INSTITUTIONS ======================
const getInstitutions = async (req, res) => {
  try {
    const snapshot = await db.collection('institutions').get();
    const institutions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid || doc.id,
        institutionName: data.name || 'No Name',
        email: data.email,
        description: data.description || '',
        contactInfo: {
          email: data.contactEmail || '',
          phone: data.contactPhone || ''
        },
        location: data.location || 'Not specified',
        slogan: data.slogan || '',
        approved: data.approved || false,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
      };
    });

    res.json({ institutions });
  } catch (error) {
    console.error('getInstitutions error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ====================== COMPANIES ======================
const getCompanies = async (req, res) => {
  try {
    const snapshot = await db.collection('companies').get();
    const companies = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid || doc.id,
        companyName: data.name || 'No Name',
        industry: data.industry || 'Not specified',
        email: data.email,
        description: data.description || '',
        contactInfo: {
          email: data.contactEmail || '',
          phone: data.contactPhone || ''
        },
        location: data.location || 'Not specified',
        approved: data.approved || false,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
      };
    });

    res.json({ companies });
  } catch (error) {
    console.error('getCompanies error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ====================== APPROVE / SUSPEND COMPANY ======================
const approveCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const docRef = db.collection('companies').doc(companyId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await docRef.update({
      approved: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Company approved successfully' });
  } catch (error) {
    console.error('approveCompany error:', error);
    res.status(500).json({ error: error.message });
  }
};

const suspendCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const docRef = db.collection('companies').doc(companyId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await docRef.update({
      approved: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Company suspended successfully' });
  } catch (error) {
    console.error('suspendCompany error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ====================== APPROVE / SUSPEND INSTITUTION ======================
const approveInstitution = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const snapshot = await db.collection('institutions').where('uid', '==', institutionId).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const docRef = snapshot.docs[0].ref;
    await docRef.update({
      approved: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Institution approved successfully' });
  } catch (error) {
    console.error('approveInstitution error:', error);
    res.status(500).json({ error: error.message });
  }
};

const suspendInstitution = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const snapshot = await db.collection('institutions').where('uid', '==', institutionId).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const docRef = snapshot.docs[0].ref;
    await docRef.update({
      approved: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Institution suspended successfully' });
  } catch (error) {
    console.error('suspendInstitution error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ====================== USERS (STUDENTS / ADMINS) ======================
const getUsers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        highSchool: data.highSchool || '',
        approved: data.approved !== false,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
      };
    });

    res.json({ users });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ====================== REPORTS ======================
const getReports = async (req, res) => {
  try {
    const { type } = req.query;
    let reportData = {};

    if (type === 'applications') {
      const snapshot = await db.collection('applications').get();
      const applicationsByStatus = {
        pending: 0,
        admitted: 0,
        rejected: 0,
        waitlisted: 0,
        accepted: 0
      };
      snapshot.forEach(doc => {
        const status = doc.data().status || 'pending';
        if (applicationsByStatus[status] !== undefined) applicationsByStatus[status]++;
      });
      reportData = applicationsByStatus;
    } else if (type === 'users') {
      const studentsSnap = await db.collection('users').where('role', '==', 'student').get();
      const institutionsSnap = await db.collection('institutions').get();
      const companiesSnap = await db.collection('companies').get();

      reportData = {
        students: studentsSnap.size,
        institutions: institutionsSnap.size,
        companies: companiesSnap.size
      };
    }

    res.json({ report: reportData });
  } catch (error) {
    console.error('getReports error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ====================== UPDATE USER ======================
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    await db.collection('users').doc(userId).update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ====================== DELETE USER ======================
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await db.collection('users').doc(userId).delete();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboard,
  getInstitutions,
  getCompanies,
  approveCompany,
  suspendCompany,
  approveInstitution,
  suspendInstitution,
  getUsers,
  getReports,
  updateUser,
  deleteUser
};
