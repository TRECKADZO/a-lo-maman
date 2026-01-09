import React from 'react';
import RapportAudit from '../components/admin/RapportAudit';
import AuthGuard from '../components/auth/AuthGuard';

export default function AuditApp() {
  return (
    <AuthGuard>
      <RapportAudit />
    </AuthGuard>
  );
}