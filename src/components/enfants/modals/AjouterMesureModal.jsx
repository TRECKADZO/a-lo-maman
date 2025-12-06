import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Loader2 } from 'lucide-react';

export default function AjouterMesureModal({ enfantId, mesuresExistantes, onClose }) {
  const queryClient = useQueryClient();
  const [mesure, setMesure] = useState({
    date: new Date().toISOString().split('T')[0],
    poids: '',
    taille: '',
    perimetre_cranien: '',
  });

  const mutation = useMutation({
    mutationFn: (newMesures) => base44.entities.EnfantCarnet.update(enfantId, { mesures_croissance: newMesures }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      queryClient.invalidateQueries({ queryKey: ['mes_patients'] });
      queryClient.invalidateQueries({ queryKey: ['dossier_patient', enfantId] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newMesure = {
      ...mesure,
      poids: mesure.poids ? parseFloat(mesure.poids) : null,
      taille: mesure.taille ? parseFloat(mesure.taille) : null,
      perimetre_cranien: mesure.perimetre_cranien ? parseFloat(mesure.perimetre_cranien) : null,
    };
    const updatedMesures = [...mesuresExistantes, newMesure].sort((a, b) => new Date(a.date) - new Date(b.date));
    mutation.mutate(updatedMesures);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMesure(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg shadow-2xl animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Ajouter une mesure</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={mutation.isPending}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date de la mesure *</Label>
              <Input id="date" name="date" type="date" value={mesure.date} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poids">Poids (kg)</Label>
                <Input id="poids" name="poids" type="number" step="0.1" placeholder="ex: 5.2" value={mesure.poids} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taille">Taille (cm)</Label>
                <Input id="taille" name="taille" type="number" step="0.1" placeholder="ex: 58.5" value={mesure.taille} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perimetre_cranien">Pér. crânien (cm)</Label>
                <Input id="perimetre_cranien" name="perimetre_cranien" type="number" step="0.1" placeholder="ex: 40.1" value={mesure.perimetre_cranien} onChange={handleChange} />
              </div>
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