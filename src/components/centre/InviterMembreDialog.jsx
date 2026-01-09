import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ROLES_PRESETS = {
  administrateur: {
    label: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: {
      gerer_membres: true,
      voir_tous_patients: true,
      modifier_patients: true,
      voir_dossiers_medicaux: true,
      creer_ordonnances: true,
      gerer_rdv: true,
      voir_rdv: true,
      gerer_facturation: true,
      voir_rapports: true,
      gerer_services: true,
      gerer_stock: true,
      acceder_api: true
    }
  },
  medecin: {
    label: 'Médecin',
    description: 'Accès complet aux dossiers médicaux',
    permissions: {
      gerer_membres: false,
      voir_tous_patients: true,
      modifier_patients: true,
      voir_dossiers_medicaux: true,
      creer_ordonnances: true,
      gerer_rdv: true,
      voir_rdv: true,
      gerer_facturation: false,
      voir_rapports: false,
      gerer_services: false,
      gerer_stock: false,
      acceder_api: false
    }
  },
  infirmier: {
    label: 'Infirmier(ère)',
    description: 'Suivi patients et observations',
    permissions: {
      gerer_membres: false,
      voir_tous_patients: true,
      modifier_patients: false,
      voir_dossiers_medicaux: true,
      creer_ordonnances: false,
      gerer_rdv: false,
      voir_rdv: true,
      gerer_facturation: false,
      voir_rapports: false,
      gerer_services: false,
      gerer_stock: true,
      acceder_api: false
    }
  },
  sage_femme: {
    label: 'Sage-femme',
    description: 'Suivi grossesses et accouchements',
    permissions: {
      gerer_membres: false,
      voir_tous_patients: true,
      modifier_patients: true,
      voir_dossiers_medicaux: true,
      creer_ordonnances: true,
      gerer_rdv: true,
      voir_rdv: true,
      gerer_facturation: false,
      voir_rapports: false,
      gerer_services: false,
      gerer_stock: false,
      acceder_api: false
    }
  },
  secretaire: {
    label: 'Secrétaire',
    description: 'Gestion administrative et RDV',
    permissions: {
      gerer_membres: false,
      voir_tous_patients: true,
      modifier_patients: false,
      voir_dossiers_medicaux: false,
      creer_ordonnances: false,
      gerer_rdv: true,
      voir_rdv: true,
      gerer_facturation: true,
      voir_rapports: false,
      gerer_services: false,
      gerer_stock: false,
      acceder_api: false
    }
  },
  technicien: {
    label: 'Technicien',
    description: 'Accès limité aux équipements',
    permissions: {
      gerer_membres: false,
      voir_tous_patients: false,
      modifier_patients: false,
      voir_dossiers_medicaux: false,
      creer_ordonnances: false,
      gerer_rdv: false,
      voir_rdv: true,
      gerer_facturation: false,
      voir_rapports: false,
      gerer_services: false,
      gerer_stock: true,
      acceder_api: false
    }
  },
  consultant: {
    label: 'Consultant',
    description: 'Accès lecture uniquement',
    permissions: {
      gerer_membres: false,
      voir_tous_patients: true,
      modifier_patients: false,
      voir_dossiers_medicaux: false,
      creer_ordonnances: false,
      gerer_rdv: false,
      voir_rdv: true,
      gerer_facturation: false,
      voir_rapports: true,
      gerer_services: false,
      gerer_stock: false,
      acceder_api: false
    }
  }
};

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

export default function InviterMembreDialog({ centre, onClose }) {
  const [formData, setFormData] = useState({
    user_email: '',
    user_nom: '',
    role: 'secretaire',
    specialite: '',
    telephone: '',
    departements: []
  });
  const [permissions, setPermissions] = useState(ROLES_PRESETS.secretaire.permissions);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const inviterMutation = useMutation({
    mutationFn: async () => {
      const membreData = {
        centre_id: centre.id,
        centre_nom: centre.nom,
        ...formData,
        permissions,
        statut: 'en_attente',
        date_invitation: new Date().toISOString(),
        inviteur_email: user.email
      };

      await base44.entities.MembreCentre.create(membreData);

      // TODO: Envoyer email d'invitation
      // await base44.integrations.Core.SendEmail({
      //   to: formData.user_email,
      //   subject: `Invitation à rejoindre ${centre.nom}`,
      //   body: `Vous avez été invité à rejoindre ${centre.nom} en tant que ${ROLES_PRESETS[formData.role].label}.`
      // });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['membres_centre']);
      toast.success('Invitation envoyée avec succès');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l\'invitation');
    }
  });

  const handleRoleChange = (newRole) => {
    setFormData({ ...formData, role: newRole });
    setPermissions(ROLES_PRESETS[newRole].permissions);
  };

  const togglePermission = (key) => {
    setPermissions({
      ...permissions,
      [key]: !permissions[key]
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Inviter un nouveau membre
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="membre@email.com"
                value={formData.user_email}
                onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
              />
            </div>
            <div>
              <Label>Nom complet *</Label>
              <Input
                placeholder="Dr. Jean Kouassi"
                value={formData.user_nom}
                onChange={(e) => setFormData({ ...formData, user_nom: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Téléphone</Label>
              <Input
                type="tel"
                placeholder="+225..."
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
            </div>
            <div>
              <Label>Spécialité (si applicable)</Label>
              <Input
                placeholder="Gynécologie, Pédiatrie..."
                value={formData.specialite}
                onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Rôle *</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLES_PRESETS).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-xs text-gray-500">{preset.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">
              Permissions personnalisées
            </Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.entries(PERMISSIONS_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                  <Checkbox
                    id={key}
                    checked={permissions[key]}
                    onCheckedChange={() => togglePermission(key)}
                  />
                  <Label htmlFor={key} className="text-sm cursor-pointer flex-1">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => inviterMutation.mutate()}
            disabled={!formData.user_email || !formData.user_nom || inviterMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {inviterMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              'Envoyer l\'invitation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}