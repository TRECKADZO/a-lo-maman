import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FAMILLES_THERAPEUTIQUES = [
  'anticoagulant', 'antihypertenseur', 'bêta-bloquant', 'antidépresseur',
  'anxiolytique', 'antipsychotique', 'antiépileptique', 'antidiabétique',
  'anti-inflammatoire', 'antibiotique', 'antalgique', 'autre'
];

export default function AjouterTraitement({ dossierId, open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    medicament: '',
    posologie: '',
    indication: '',
    famille_therapeutique: 'autre',
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const dossier = await base44.entities.DossierMedicalComplet.filter({ id: dossierId });
      if (!dossier[0]) throw new Error('Dossier introuvable');

      const user = await base44.auth.me();
      const nouveauTraitement = {
        medicament: data.medicament,
        posologie: data.posologie,
        indication: data.indication,
        famille_therapeutique: data.famille_therapeutique,
        date_debut: new Date().toISOString().split('T')[0],
        prescripteur_id: user.email,
      };

      const traitements = [...(dossier[0].traitements_en_cours || []), nouveauTraitement];
      
      await base44.entities.DossierMedicalComplet.update(dossierId, {
        traitements_en_cours: traitements,
        derniere_synchronisation: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dossier_medical', dossierId]);
      toast.success('Traitement ajouté');
      onClose();
      setFormData({ medicament: '', posologie: '', indication: '', famille_therapeutique: 'autre' });
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l\'ajout');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un Traitement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Médicament</Label>
            <Input
              placeholder="Nom du médicament"
              value={formData.medicament}
              onChange={(e) => setFormData({ ...formData, medicament: e.target.value })}
            />
          </div>

          <div>
            <Label>Posologie</Label>
            <Input
              placeholder="Ex: 1 cp matin et soir"
              value={formData.posologie}
              onChange={(e) => setFormData({ ...formData, posologie: e.target.value })}
            />
          </div>

          <div>
            <Label>Famille thérapeutique</Label>
            <Select value={formData.famille_therapeutique} onValueChange={(v) => setFormData({ ...formData, famille_therapeutique: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FAMILLES_THERAPEUTIQUES.map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Indication</Label>
            <Textarea
              placeholder="Raison de la prescription..."
              value={formData.indication}
              onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => mutation.mutate(formData)}
            disabled={!formData.medicament || !formData.posologie || mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}