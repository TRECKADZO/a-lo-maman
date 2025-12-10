import React from 'react';
import NotificationsPushManager from '@/components/notifications/NotificationsPushManager';
import AuthGuard from '@/components/auth/AuthGuard';

export default function NotificationsPush() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Notifications Push</h1>
          <NotificationsPushManager />
        </div>
      </div>
    </AuthGuard>
  );
}