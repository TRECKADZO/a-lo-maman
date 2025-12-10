import React from 'react';
import TestDocumentation from '../components/testing/TestDocumentation';
import AuthGuard from '../components/auth/AuthGuard';

export default function Tests() {
  return (
    <AuthGuard>
      <TestDocumentation />
    </AuthGuard>
  );
}