/**
 * COMPOSANT DE VALIDATION D'ACCÈS PATIENT
 * 
 * Validations de sécurité avant d'afficher/modifier les données du patient
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Hook custom pour valider l'accès d'un professionnel à un patient
 */
export const useValidatePatientAccess = (patientEmail, enfantId) => {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: professionnel } = useQuery({
    queryKey: ['professionnel_current', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const pros = await base44.entities.Professionnel.list();
      return pros.find(p => p.email === user.email);
    },
    enabled: !!user,
  });

  const { data: enfant } = useQuery({
    queryKey: ['patient_access_check', enfantId],
    queryFn: async () => {
      if (!enfantId) return null;
      const results = await base44.entities.EnfantCarnet.filter({ id: enfantId });
      return results[0] || null;
    },
    enabled: !!enfantId,
  });

  // Vérifier que le professionnel est autorisé
  const hasAccess = professionnel && enfant 
    ? enfant.professionnels_suivi?.includes(professionnel.email)
    : false;

  // Vérifier que l'email du patient correspond
  const patientEmailMatches = enfant?.created_by === patientEmail;

  const isValid = hasAccess && patientEmailMatches;

  return {
    isValid,
    hasAccess,
    patientEmailMatches,
    enfant,
    professionnel,
    isLoading: !professionnel || !enfant
  };
};

/**
 * Composant pour afficher un message d'erreur si accès refusé
 */
export function AccessDeniedAlert({ enfantId, patientEmail }) {
  const { isValid, isLoading } = useValidatePatientAccess(patientEmail, enfantId);

  if (isLoading) return null;
  
  if (!isValid) {
    return (
      <Alert className="border-l-4 border-l-red-500 bg-red-50 mb-4">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Accès refusé:</strong> Vous n'avez pas les autorisations nécessaires pour accéder aux données de ce patient.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

/**
 * Wrapper pour protéger une page/composant
 */
export function ProtectPatientAccess({ 
  enfantId, 
  patientEmail, 
  children, 
  fallback = null 
}) {
  const { isValid, isLoading } = useValidatePatientAccess(patientEmail, enfantId);

  if (isLoading) return null;
  
  if (!isValid) {
    return fallback || (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 text-xl">Accès refusé</p>
        <p className="text-red-500 text-sm mt-2">Vous n'êtes pas autorisé à voir ces données</p>
      </div>
    );
  }

  return children;
}

export default useValidatePatientAccess;