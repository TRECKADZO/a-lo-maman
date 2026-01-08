import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';
import { format } from 'date-fns';

const QUALITES = [
  { value: 'très_mauvaise', label: '😫 Très mauvaise', stars: 1 },
  { value: 'mauvaise', label: '😕 Mauvaise', stars: 2 },
  { value: 'moyenne', label: '😐 Moyenne', stars: 3 },
  { value: 'bonne', label: '😊 Bonne', stars: 4 },
  { value: 'excellente', label: '😴 Excellente', stars: 5 },
];

const HUMEURS = [
  { value: 'fatiguee', label: '😴 Fatiguée' },
  { value: 'normale', label: '😐 Normale' },
  { value: 'reposee', label: '😊 Reposée' },
  { value: 'energique', label: '⚡ Énergique' },
];

const FACTEURS = [
  'stress', 'douleurs', 'bebe', 'chaleur', 'bruit', 'ecrans', 'cafe', 'repas_lourd', 'autre'
];

export default function AjouterSommeil({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    heure_coucher: '22:00',
    heure_lever: '07:00',
    duree_heures: 7,
    qualite: 'bonne',
    nombre_reveils: 0,
    difficulte_endormissement: false,
    facteurs_perturbateurs: [],
    notes: '',
    humeur_matin: 'normale',
    sieste: false,
    duree_sieste_minutes: 0
  });

  const ajouterMutation = useMutation({
    mutationFn: (data) => base44.entities.SuiviSommeil.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suivi_sommeil'] });
      onClose();
    }
  });

  const toggleFacteur = (facteur) => {
    const current = formData.facteurs_perturbateurs || [];
    if (current.includes(facteur)) {
      setFormData({ ...formData, facteurs_perturbateurs: current.filter(f => f !== facteur) });
    } else {
      setFormData({ ...formData, facteurs_perturbateurs: [...current, facteur] });
    }
  };

  const calculerDuree = () => {
    if (!formData.heure_coucher || !formData.heure_lever) return;
    
    const [hC, mC] = formData.heure_coucher.split(':').map(Number);
    const [hL, mL] = formData.heure_lever.split(':').map(Number);
    
    let minutesCoucher = hC * 60 + mC;
    let minutesLever = hL * 60 + mL;
    
    // Si lever avant coucher, c'est le lendemain
    if (minutesLever < minutesCoucher) {
      minutesLever += 24 * 60;
    }
    
    const dureeMinutes = minutesLever - minutesCoucher;
    const dureeHeures = (dureeMinutes / 60).toFixed(1);
    
    setFormData({ ...formData, duree_heures: parseFloat(dureeHeures) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ajouter une nuit</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Heure de coucher</Label>
              <Input
                type="time"
                value={formData.heure_coucher}
                onChange={(e) => setFormData({ ...formData, heure_coucher: e.target.value })}
                onBlur={calculerDuree}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Heure de lever</Label>
              <Input
                type="time"
                value={formData.heure_lever}
                onChange={(e) => setFormData({ ...formData, heure_lever: e.target.value })}
                onBlur={calculerDuree}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Durée totale (heures)</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.duree_heures}
              onChange={(e) => setFormData({ ...formData, duree_heures: parseFloat(e.target.value) })}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Qualité du sommeil</Label>
            <Select
              value={formData.qualite}
              onValueChange={(v) => setFormData({ ...formData, qualite: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUALITES.map(q => (
                  <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nombre de réveils nocturnes</Label>
            <Input
              type="number"
              min="0"
              value={formData.nombre_reveils}
              onChange={(e) => setFormData({ ...formData, nombre_reveils: parseInt(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label>Difficulté à s'endormir</Label>
            <Switch
              checked={formData.difficulte_endormissement}
              onCheckedChange={(v) => setFormData({ ...formData, difficulte_endormissement: v })}
            />
          </div>

          <div>
            <Label className="mb-2 block">Facteurs perturbateurs</Label>
            <div className="flex flex-wrap gap-2">
              {FACTEURS.map(facteur => {
                const isActive = (formData.facteurs_perturbateurs || []).includes(facteur);
                return (
                  <Badge
                    key={facteur}
                    variant={isActive ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleFacteur(facteur)}
                  >
                    {facteur.replace(/_/g, ' ')}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Humeur au réveil</Label>
            <Select
              value={formData.humeur_matin}
              onValueChange={(v) => setFormData({ ...formData, humeur_matin: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HUMEURS.map(h => (
                  <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label>Sieste dans la journée</Label>
            <Switch
              checked={formData.sieste}
              onCheckedChange={(v) => setFormData({ ...formData, sieste: v })}
            />
          </div>

          {formData.sieste && (
            <div>
              <Label>Durée de la sieste (minutes)</Label>
              <Input
                type="number"
                min="0"
                value={formData.duree_sieste_minutes}
                onChange={(e) => setFormData({ ...formData, duree_sieste_minutes: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observations, rêves, remarques..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={() => ajouterMutation.mutate(formData)}
              disabled={ajouterMutation.isPending}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {ajouterMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}