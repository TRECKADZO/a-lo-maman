import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Loader2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ROLES_LABELS = {
  administrateur: 'Administrateur',
  medecin: 'Médecin',
  infirmier: 'Infirmier(ère)',
  sage_femme: 'Sage-femme',
  secretaire: 'Secrétaire',
  technicien: 'Technicien',
  consultant: 'Consultant'
};

const PERMISSIONS_LABELS = {
  gerer_membres: 'Gérer les membres',
  voir_tous_patients: 'Voir tous les patients',
  modifier_patients: 'Modifier dossiers patients',
  voir_dossiers_medicaux: 'Voir dossiers médicaux',
  creer_ordonnances: 'Prescrire médicaments',
  gerer_rdv: 'Gérer rendez-vous',
  voir_rdv: 'Voir agenda',
  gerer_facturation: 'Gérer facturation',
  voir_rapports: 'Voir rapports',
  gerer_services: 'Modifier services',
  gerer_stock: 'Gérer stock',
  acceder_api: 'Accès API'
};

export default function EditerMembreDialog({ membre, centre, onClose }) {
  const [formData, setFormData] = useState({
    user_nom: membre.user_nom || '',
    role: membre.role || 'secretaire',
    specialite: membre.specialite || '',
    telephone: membre.telephone || '',
    statut: membre.statut || 'actif'
  });
  const [permissions, setPermissions] = useState(membre.permissions || {});
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.MembreCentre.update(membre.id, {
        ...formData,
        permissions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['membres_centre']);
      toast.success('Membre mis à jour');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });

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
            <Edit className="w-5 h-5 text-purple-600" />
            Modifier le membre
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Email (non modifiable)</Label>
            <Input value={membre.user_email} disabled />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nom complet</Label>
              <Input
                value={formData.user_nom}
                onChange={(e) => setFormData({ ...formData, user_nom: e.target.value })}
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rôle</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Spécialité</Label>
              <Input
                value={formData.specialite}
                onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Statut</Label>
            <Select 
              value={formData.statut} 
              onValueChange={(value) => setFormData({ ...formData, statut: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">
              Permissions
            </Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.entries(PERMISSIONS_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                  <Checkbox
                    id={key}
                    checked={permissions[key] || false}
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
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer les modifications'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}