const { db } = require('../config/firebase');

class NotificationService {
  static async createNotification(userId, title, message, type = 'info', actionUrl = null) {
    try {
      const notificationData = {
        userId,
        title,
        message,
        type,
        actionUrl,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('notifications').add(notificationData);
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  static async notifyNewJobOpportunities(studentId, jobs) {
    if (jobs.length === 0) return;

    const message = jobs.length === 1 
      ? `A new job opportunity matching your profile is available: ${jobs[0].title}`
      : `${jobs.length} new job opportunities matching your profile are available`;

    await this.createNotification(
      studentId,
      'New Job Opportunities',
      message,
      'info',
      '/student/jobs'
    );
  }

  static async notifyApplicationLimit(studentId, institutionName) {
    await this.createNotification(
      studentId,
      'Application Limit Reached',
      `You have reached the maximum of 2 applications for ${institutionName}.`,
      'warning',
      '/student/applications'
    );
  }

  static async notifyStudyCompletion(studentId) {
    await this.createNotification(
      studentId,
      'Studies Completed',
      'Congratulations on completing your studies! You can now upload final documents and apply for jobs.',
      'success',
      '/student/documents'
    );
  }

  static async notifyStudentAdmission(studentId, courseName, institutionName) {
    await this.createNotification(
      studentId,
      'Admission Offer',
      `Congratulations! You have been admitted to ${courseName} at ${institutionName}.`,
      'success',
      '/student/admissions'
    );
  }

  static async getUnreadNotifications(userId, limit = 10) {
    try {
      const snapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId) {
    try {
      await db.collection('notifications').doc(notificationId).update({
        read: true,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async markAllAsRead(userId) {
    try {
      const snapshot = await db.collection('notifications')
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          updatedAt: new Date()
        });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
}

module.exports = NotificationService;