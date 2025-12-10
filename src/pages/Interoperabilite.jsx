import React from 'react';
import AuthGuard from '../components/auth/AuthGuard';
import DashboardInterop from '../components/interoperabilite/DashboardInterop';

export default function Interoperabilite() {
  return (
    <AuthGuard>
      <DashboardInterop />
    </AuthGuard>
  );
}