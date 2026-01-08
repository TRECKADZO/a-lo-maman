import React from 'react';
import DeclarationNaissanceForm from '../components/naissance/DeclarationNaissanceForm';
import AuthGuard from '../components/auth/AuthGuard';

export default function DeclarationNaissance() {
  return (
    <AuthGuard>
      <DeclarationNaissanceForm />
    </AuthGuard>
  );
}