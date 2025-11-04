import React from 'react';
import { Bell } from 'lucide-react';
import usePushNotifications from '../../hooks/usePushNotifications';

const NotificationBadge = ({ className = '' }) => {
  const { unreadCount } = usePushNotifications();

  return (
    <div className={`relative ${className}`}>
      <Bell className="h-6 w-6 text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBadge;