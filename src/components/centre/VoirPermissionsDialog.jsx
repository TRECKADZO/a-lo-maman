import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, X } from 'lucide-react';

const PERMISSIONS_LABELS = {
  gerer_membres: 'Gérer les membres du centre',
  voir_tous_patients: 'Voir tous les patients',
  modifier_patients: 'Créer/modifier dossiers patients',
  voir_dossiers_medicaux: 'Accéder aux dossiers médicaux',
  creer_ordonnances: 'Prescrire médicaments',
  gerer_rdv: 'Créer/modifier/annuler rendez-vous',
  voir_rdv: 'Consulter l\'agenda',
  gerer_facturation: 'Gérer la facturation',
  voir_rapports: 'Voir les rapports statistiques',
  gerer_services: 'Modifier les services',
  gerer_stock: 'Gérer le stock',
  acceder_api: 'Accéder aux clés API'
};

const ROLE_LABELS = {
  administrateur: 'Administrateur',
  medecin: 'Médecin',
  infirmier: 'Infirmier(ère)',
  sage_femme: 'Sage-femme',
  secretaire: 'Secrétaire',
  technicien: 'Technicien',
  consultant: 'Consultant'
};

export default function VoirPermissionsDialog({ membre, onClose }) {
  const permissions = membre.permissions || {};

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Permissions de {membre.user_nom}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-100 text-purple-800 text-base px-4 py-1">
              {ROLE_LABELS[membre.role]}
            </Badge>
            {membre.specialite && (
              <span className="text-sm text-gray-600">{membre.specialite}</span>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Permissions détaillées</h3>
            <div className="space-y-2">
              {Object.entries(PERMISSIONS_LABELS).map(([key, label]) => {
                const hasPermission = permissions[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      hasPermission ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    {hasPermission ? (
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${hasPermission ? 'text-gray-900' : 'text-gray-500'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {membre.departements && membre.departements.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Départements assignés</h3>
              <div className="flex flex-wrap gap-2">
                {membre.departements.map((dept, idx) => (
                  <Badge key={idx} variant="outline">
                    {dept}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}