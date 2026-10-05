import React, { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import { Card, Badge, Button, EmptyState } from '../ui';

const NotificationCenterWidget = ({ emergencyId, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    notificationService.setupPushListener((notification) => {
      loadNotifications();
    });
  }, []);

  const loadNotifications = () => {
    const stored = notificationService.getStoredNotifications();
    setNotifications(stored);
    setUnreadCount(stored.filter(n => !n.read).length);
  };

  const handleMarkRead = (id) => {
    notificationService.markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    loadNotifications();
  };

  const handleClear = () => {
    notificationService.clearAll();
    loadNotifications();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen && unreadCount === 0 && !emergencyId) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant={unreadCount > 0 ? 'error' : 'outline'}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <Badge variant="error" size="sm" dot className="ml-1">{unreadCount}</Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute bottom-full right-0 mb-2 w-96 max-h-[400px] shadow-xl">
          <Card.Header className="flex items-center justify-between">
            <Card.Title>Notifications</Card.Title>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleClear}>Clear</Button>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Close</Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0 max-h-[350px] overflow-y-auto">
            {notifications.length === 0 ? (
              <EmptyState icon="🔔" title="No notifications" description="Emergency updates will appear here" />
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-background/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                    onClick={() => handleMarkRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text-primary">{notification.title || 'LifeLink Update'}</span>
                          <span className="text-xs text-text-tertiary">{formatTime(notification.timestamp)}</span>
                          {!notification.read && <Badge variant="primary" size="xs">New</Badge>}
                        </div>
                        <p className="text-sm text-text-secondary truncate">{notification.body || notification.description || notification.message}</p>
                        {notification.data?.emergencyId && (
                          <span className="text-xs text-primary font-mono">Case: {notification.data.emergencyId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default NotificationCenterWidget;