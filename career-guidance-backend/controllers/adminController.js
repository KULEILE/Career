const { db } = require('../config/firebase');

const getDashboard = async (req, res) => {
  try {
    // Get counts for dashboard
    const [
      studentsSnapshot,
      institutionsSnapshot,
      companiesSnapshot,
      applicationsSnapshot,
      jobsSnapshot
    ] = await Promise.all([
      db.collection('users').where('role', '==', 'student').get(),
      db.collection('users').where('role', '==', 'institution').get(),
      db.collection('users').where('role', '==', 'company').get(),
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
    res.status(500).json({ error: error.message });
  }
};

const getInstitutions = async (req, res) => {
  try {
    const institutionsSnapshot = await db.collection('users')
      .where('role', '==', 'institution')
      .get();

    const institutions = [];
    institutionsSnapshot.forEach(doc => {
      institutions.push({ id: doc.id, ...doc.data() });
    });

    res.json({ institutions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCompanies = async (req, res) => {
  try {
    const companiesSnapshot = await db.collection('users')
      .where('role', '==', 'company')
      .get();

    const companies = [];
    companiesSnapshot.forEach(doc => {
      companies.push({ id: doc.id, ...doc.data() });
    });

    res.json({ companies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const approveCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    await db.collection('users').doc(companyId).update({
      approved: true,
      updatedAt: new Date()
    });

    res.json({ message: 'Company approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const suspendCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    await db.collection('users').doc(companyId).update({
      approved: false,
      updatedAt: new Date()
    });

    res.json({ message: 'Company suspended successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();

    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const { type } = req.query;
    
    let reportData = {};

    if (type === 'applications') {
      const applicationsSnapshot = await db.collection('applications').get();
      const applicationsByStatus = {};
      
      applicationsSnapshot.forEach(doc => {
        const status = doc.data().status || 'pending';
        applicationsByStatus[status] = (applicationsByStatus[status] || 0) + 1;
      });
      
      reportData = applicationsByStatus;
    }

    res.json({ report: reportData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboard,
  getInstitutions,
  getCompanies,
  approveCompany,
  suspendCompany,
  getUsers,
  getReports
};