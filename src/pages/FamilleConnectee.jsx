import React from 'react';
import AuthGuard from '../components/auth/AuthGuard';
import FamilleConnectee from '../components/famille/FamilleConnectee';

export default function FamilleConnecteePage() {
  return (
    <AuthGuard>
      <div className="min-h-full bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <FamilleConnectee />
        </div>
      </div>
    </AuthGuard>
  );
}