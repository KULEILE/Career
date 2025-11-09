import React, { useState, useEffect } from 'react';
import { getStudentNotifications, markNotificationAsRead } from '../../services/api';
import Loading from '../Common/Loading';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await getStudentNotifications();
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    setMarkingRead(notificationId);
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setMarkingRead(null);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(notif => !notif.read);
    for (const notif of unreadNotifications) {
      await handleMarkAsRead(notif.id);
    }
  };

  if (loading) return <Loading message="Loading notifications..." />;

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">Notifications</h2>
            <p>Stay updated with your applications and opportunities</p>
          </div>
          {unreadCount > 0 && (
            <button 
              className="btn btn-secondary"
              onClick={markAllAsRead}
            >
              Mark All as Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="alert alert-info">
            No notifications at the moment. You'll receive notifications for new job opportunities, 
            admission updates, and application status changes.
          </div>
        ) : (
          <div>
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className="card" 
                style={{ 
                  marginBottom: '1rem',
                  borderLeft: notification.read ? '4px solid #6c757d' : '4px solid #007bff',
                  opacity: notification.read ? 0.8 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: notification.read ? 'normal' : 'bold' }}>
                      {notification.message}
                    </p>
                    <small style={{ color: '#666666' }}>
                      {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </small>
                    {notification.actionUrl && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <a 
                          href={notification.actionUrl} 
                          className="btn btn-primary btn-sm"
                        >
                          View Details
                        </a>
                      </div>
                    )}
                  </div>
                  {!notification.read && (
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={markingRead === notification.id}
                      onClick={() => handleMarkAsRead(notification.id)}
                      style={{ marginLeft: '1rem' }}
                    >
                      {markingRead === notification.id ? '...' : 'Mark Read'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;