const { db, admin } = require('../config/firebase');

const getDashboard = async (req, res) => {
  console.log('GET /admin/dashboard - Starting...');
  try {
    console.log('Fetching dashboard data from Firestore...');
    
    // Test each collection separately with error handling
    let totalStudents = 0;
    let totalInstitutions = 0;
    let totalCompanies = 0;
    let totalApplications = 0;
    let totalJobs = 0;

    try {
      const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
      totalStudents = studentsSnapshot.size;
      console.log(`Found ${totalStudents} students`);
    } catch (error) {
      console.log('Error fetching students:', error.message);
    }

    try {
      const institutionsSnapshot = await db.collection('institutions').get();
      totalInstitutions = institutionsSnapshot.size;
      console.log(`Found ${totalInstitutions} institutions`);
    } catch (error) {
      console.log('Error fetching institutions:', error.message);
    }

    try {
      const companiesSnapshot = await db.collection('companies').get();
      totalCompanies = companiesSnapshot.size;
      console.log(`Found ${totalCompanies} companies`);
    } catch (error) {
      console.log('Error fetching companies:', error.message);
    }

    try {
      const applicationsSnapshot = await db.collection('applications').get();
      totalApplications = applicationsSnapshot.size;
      console.log(`Found ${totalApplications} applications`);
    } catch (error) {
      console.log('Error fetching applications:', error.message);
    }

    try {
      const jobsSnapshot = await db.collection('jobs').get();
      totalJobs = jobsSnapshot.size;
      console.log(`Found ${totalJobs} jobs`);
    } catch (error) {
      console.log('Error fetching jobs:', error.message);
    }

    const stats = {
      totalStudents,
      totalInstitutions,
      totalCompanies,
      totalApplications,
      totalJobs
    };

    console.log('Dashboard data fetched successfully:', stats);
    res.json({ 
      success: true,
      stats 
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message 
    });
  }
};

const getInstitutions = async (req, res) => {
  console.log('GET /admin/institutions - Starting...');
  try {
    const snapshot = await db.collection('institutions').get();
    const institutions = snapshot.docs.map(doc => {
      const data = doc.data();
      
      let createdAt = new Date();
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt;
        } else if (data.createdAt.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else {
          createdAt = new Date(data.createdAt);
        }
      }
      
      let updatedAt = new Date();
      if (data.updatedAt) {
        if (typeof data.updatedAt.toDate === 'function') {
          updatedAt = data.updatedAt.toDate();
        } else if (data.updatedAt instanceof Date) {
          updatedAt = data.updatedAt;
        } else if (data.updatedAt.seconds) {
          updatedAt = new Date(data.updatedAt.seconds * 1000);
        } else {
          updatedAt = new Date(data.updatedAt);
        }
      }

      return {
        id: doc.id,
        institutionName: data.institutionName || data.name || 'No Name',
        email: data.email || data.contactEmail || '',
        description: data.description || '',
        contactInfo: {
          email: data.contactEmail || data.email || '',
          phone: data.contactPhone || data.phone || ''
        },
        location: data.location || 'Not specified',
        slogan: data.slogan || '',
        approved: data.approved || false,
        createdAt: createdAt,
        updatedAt: updatedAt
      };
    });

    console.log(`Found ${institutions.length} institutions`);
    res.json({ 
      success: true,
      institutions 
    });
  } catch (error) {
    console.error('getInstitutions error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch institutions',
      message: error.message 
    });
  }
};

const getCompanies = async (req, res) => {
  console.log('GET /admin/companies - Starting...');
  try {
    const snapshot = await db.collection('companies').get();
    const companies = snapshot.docs.map(doc => {
      const data = doc.data();
      
      let createdAt = new Date();
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt;
        } else if (data.createdAt.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else {
          createdAt = new Date(data.createdAt);
        }
      }
      
      let updatedAt = new Date();
      if (data.updatedAt) {
        if (typeof data.updatedAt.toDate === 'function') {
          updatedAt = data.updatedAt.toDate();
        } else if (data.updatedAt instanceof Date) {
          updatedAt = data.updatedAt;
        } else if (data.updatedAt.seconds) {
          updatedAt = new Date(data.updatedAt.seconds * 1000);
        } else {
          updatedAt = new Date(data.updatedAt);
        }
      }

      return {
        id: doc.id,
        companyName: data.companyName || data.name || 'No Name',
        industry: data.industry || 'Not specified',
        email: data.email || data.contactEmail || '',
        description: data.description || '',
        contactInfo: {
          email: data.contactEmail || data.email || '',
          phone: data.contactPhone || data.phone || ''
        },
        location: data.location || 'Not specified',
        approved: data.approved || false,
        createdAt: createdAt,
        updatedAt: updatedAt
      };
    });

    console.log(`Found ${companies.length} companies`);
    res.json({ 
      success: true,
      companies 
    });
  } catch (error) {
    console.error('getCompanies error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch companies',
      message: error.message 
    });
  }
};

const approveCompany = async (req, res) => {
  console.log(`PUT /admin/companies/${req.params.companyId}/approve - Starting...`);
  try {
    const { companyId } = req.params;
    const docRef = db.collection('companies').doc(companyId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }

    await docRef.update({
      approved: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Company ${companyId} approved successfully`);
    res.json({ 
      success: true,
      message: 'Company approved successfully' 
    });
  } catch (error) {
    console.error('approveCompany error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to approve company',
      message: error.message 
    });
  }
};

const suspendCompany = async (req, res) => {
  console.log(`PUT /admin/companies/${req.params.companyId}/suspend - Starting...`);
  try {
    const { companyId } = req.params;
    const docRef = db.collection('companies').doc(companyId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found' 
      });
    }

    await docRef.update({
      approved: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Company ${companyId} suspended successfully`);
    res.json({ 
      success: true,
      message: 'Company suspended successfully' 
    });
  } catch (error) {
    console.error('suspendCompany error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to suspend company',
      message: error.message 
    });
  }
};

const approveInstitution = async (req, res) => {
  console.log(`PUT /admin/institutions/${req.params.institutionId}/approve - Starting...`);
  try {
    const { institutionId } = req.params;
    const docRef = db.collection('institutions').doc(institutionId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Institution not found' 
      });
    }

    await docRef.update({
      approved: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Institution ${institutionId} approved successfully`);
    res.json({ 
      success: true,
      message: 'Institution approved successfully' 
    });
  } catch (error) {
    console.error('approveInstitution error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to approve institution',
      message: error.message 
    });
  }
};

const suspendInstitution = async (req, res) => {
  console.log(`PUT /admin/institutions/${req.params.institutionId}/suspend - Starting...`);
  try {
    const { institutionId } = req.params;
    const docRef = db.collection('institutions').doc(institutionId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Institution not found' 
      });
    }

    await docRef.update({
      approved: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Institution ${institutionId} suspended successfully`);
    res.json({ 
      success: true,
      message: 'Institution suspended successfully' 
    });
  } catch (error) {
    console.error('suspendInstitution error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to suspend institution',
      message: error.message 
    });
  }
};

const getUsers = async (req, res) => {
  console.log('GET /admin/users - Starting...');
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      
      let createdAt = new Date();
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt;
        } else if (data.createdAt.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000);
        } else {
          createdAt = new Date(data.createdAt);
        }
      }
      
      let updatedAt = new Date();
      if (data.updatedAt) {
        if (typeof data.updatedAt.toDate === 'function') {
          updatedAt = data.updatedAt.toDate();
        } else if (data.updatedAt instanceof Date) {
          updatedAt = data.updatedAt;
        } else if (data.updatedAt.seconds) {
          updatedAt = new Date(data.updatedAt.seconds * 1000);
        } else {
          updatedAt = new Date(data.updatedAt);
        }
      }

      return {
        id: doc.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        role: data.role || 'student',
        highSchool: data.highSchool || '',
        approved: data.approved !== false,
        createdAt: createdAt,
        updatedAt: updatedAt
      };
    });

    console.log(`Found ${users.length} users`);
    res.json({ 
      success: true,
      users 
    });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch users',
      message: error.message 
    });
  }
};

const getReports = async (req, res) => {
  console.log('GET /admin/reports - Starting...');
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
      let studentsCount = 0;
      let institutionsCount = 0;
      let companiesCount = 0;

      try {
        const studentsSnap = await db.collection('users').where('role', '==', 'student').get();
        studentsCount = studentsSnap.size;
      } catch (error) {
        console.log('Error counting students:', error.message);
      }

      try {
        const institutionsSnap = await db.collection('institutions').get();
        institutionsCount = institutionsSnap.size;
      } catch (error) {
        console.log('Error counting institutions:', error.message);
      }

      try {
        const companiesSnap = await db.collection('companies').get();
        companiesCount = companiesSnap.size;
      } catch (error) {
        console.log('Error counting companies:', error.message);
      }

      reportData = {
        students: studentsCount,
        institutions: institutionsCount,
        companies: companiesCount
      };
    }

    console.log(`Generated ${type} report successfully`);
    res.json({ 
      success: true,
      report: reportData 
    });
  } catch (error) {
    console.error('getReports error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate report',
      message: error.message 
    });
  }
};

const updateUser = async (req, res) => {
  console.log(`PUT /admin/users/${req.params.userId} - Starting...`);
  try {
    const { userId } = req.params;
    const updateData = req.body;

    await db.collection('users').doc(userId).update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`User ${userId} updated successfully`);
    res.json({ 
      success: true,
      message: 'User updated successfully' 
    });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update user',
      message: error.message 
    });
  }
};

const deleteUser = async (req, res) => {
  console.log(`DELETE /admin/users/${req.params.userId} - Starting...`);
  try {
    const { userId } = req.params;
    await db.collection('users').doc(userId).delete();
    
    console.log(`User ${userId} deleted successfully`);
    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete user',
      message: error.message 
    });
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