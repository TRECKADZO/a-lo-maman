import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Loader2 } from 'lucide-react';

export default function AjouterVaccinModal({ enfantId, vaccinsExistants, onClose }) {
  const queryClient = useQueryClient();
  const [vaccin, setVaccin] = useState({
    nom_vaccin: '',
    date_administration: new Date().toISOString().split('T')[0],
    lieu: '',
    professionnel: '',
    lot: '',
    prochain_rappel: '',
  });

  const mutation = useMutation({
    mutationFn: (newVaccins) => base44.entities.EnfantCarnet.update(enfantId, { vaccins: newVaccins }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      queryClient.invalidateQueries({ queryKey: ['mes_patients'] });
      queryClient.invalidateQueries({ queryKey: ['dossier_patient', enfantId] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedVaccins = [...vaccinsExistants, vaccin];
    mutation.mutate(updatedVaccins);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVaccin(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Ajouter un vaccin</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={mutation.isPending}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom_vaccin">Nom du vaccin *</Label>
              <Input id="nom_vaccin" name="nom_vaccin" value={vaccin.nom_vaccin} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_administration">Date d'administration *</Label>
                  <Input id="date_administration" name="date_administration" type="date" value={vaccin.date_administration} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prochain_rappel">Prochain rappel (optionnel)</Label>
                  <Input id="prochain_rappel" name="prochain_rappel" type="date" value={vaccin.prochain_rappel} onChange={handleChange} />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lieu">Lieu d'administration</Label>
              <Input id="lieu" name="lieu" value={vaccin.lieu} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="professionnel">Professionnel de santé</Label>
              <Input id="professionnel" name="professionnel" value={vaccin.professionnel} onChange={handleChange} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="lot">Numéro de lot</Label>
              <Input id="lot" name="lot" value={vaccin.lot} onChange={handleChange} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>Annuler</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}