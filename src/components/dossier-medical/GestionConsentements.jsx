import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Heart, Brain, Bone, Activity, Users, Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';

const SPECIALITES = [
  { key: 'cardiologie', label: 'Cardiologie', icon: Heart, color: 'text-red-500', description: 'Données cardiovasculaires et ECG' },
  { key: 'oncologie', label: 'Oncologie', icon: Activity, color: 'text-purple-500', description: 'Données cancérologiques et traitements' },
  { key: 'psychiatrie', label: 'Psychiatrie', icon: Brain, color: 'text-indigo-500', description: 'Données psychiatriques et scores' },
  { key: 'rhumatologie', label: 'Rhumatologie', icon: Bone, color: 'text-amber-500', description: 'Données articulaires et inflammatoires' },
  { key: 'medecine_generale', label: 'Médecine Générale', icon: Users, color: 'text-teal-500', description: 'Données générales de santé' },
  { key: 'kinesitherapie', label: 'Kinésithérapie', icon: Activity, color: 'text-blue-500', description: 'Données de rééducation' },
];

export default function GestionConsentements({ dossier, patientEmail, isPatientView = false }) {
  const queryClient = useQueryClient();
  const [consentements, setConsentements] = useState(dossier?.consentements_partage || {});
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (newConsentements) => {
      if (dossier) {
        await base44.entities.DossierMedicalComplet.update(dossier.id, {
          consentements_partage: newConsentements,
          derniere_synchronisation: new Date().toISOString(),
        });
      } else {
        // Créer un nouveau dossier si n'existe pas
        await base44.entities.DossierMedicalComplet.create({
          patient_email: patientEmail,
          consentements_partage: newConsentements,
          professionnels_autorises: [],
          derniere_synchronisation: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dossier_medical']);
      queryClient.invalidateQueries(['mon_dossier_medical']);
      queryClient.invalidateQueries(['dossier_medical_patient']);
      setHasChanges(false);
      toast.success('Consentements mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const handleToggle = (specialite) => {
    const newConsentements = {
      ...consentements,
      [specialite]: !consentements[specialite],
    };
    setConsentements(newConsentements);
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(consentements);
  };

  const handleToggleAll = (value) => {
    const newConsentements = {};
    SPECIALITES.forEach(s => {
      newConsentements[s.key] = value;
    });
    setConsentements(newConsentements);
    setHasChanges(true);
  };

  const nombreActifs = Object.values(consentements).filter(Boolean).length;

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Consentements de Partage
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{nombreActifs}/{SPECIALITES.length}</span>
            <span className="hidden md:inline">spécialités autorisées</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            {isPatientView ? (
              <>
                Gérez les spécialités médicales autorisées à consulter vos données de santé. 
                Vous pouvez modifier ces autorisations à tout moment.
              </>
            ) : (
              <>
                Le patient contrôle quelles spécialités peuvent accéder à ses données médicales.
                Voici ses préférences actuelles de partage.
              </>
            )}
          </AlertDescription>
        </Alert>

        {isPatientView && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAll(true)}
              className="flex-1"
            >
              Tout autoriser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAll(false)}
              className="flex-1"
            >
              Tout refuser
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SPECIALITES.map((specialite) => {
            const Icon = specialite.icon;
            const isActive = consentements[specialite.key] !== false;

            return (
              <div
                key={specialite.key}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100' : 'bg-gray-200'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? specialite.color : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="font-semibold text-sm truncate">
                          {specialite.label}
                        </Label>
                        {isActive ? (
                          <span className="text-xs text-green-600 font-medium">Autorisé</span>
                        ) : (
                          <span className="text-xs text-gray-500 font-medium">Bloqué</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {specialite.description}
                      </p>
                    </div>
                  </div>
                  {isPatientView && (
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => handleToggle(specialite.key)}
                      className="flex-shrink-0"
                    />
                  )}
                  {!isPatientView && (
                    <div className="flex-shrink-0">
                      {isActive ? (
                        <Lock className="w-5 h-5 text-green-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isPatientView && hasChanges && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setConsentements(dossier?.consentements_partage || {});
                setHasChanges(false);
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        )}

        {!isPatientView && (
          <Alert className="border-amber-200 bg-amber-50">
            <Info className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              Seul le patient peut modifier ces autorisations. Respectez ses choix de confidentialité.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}