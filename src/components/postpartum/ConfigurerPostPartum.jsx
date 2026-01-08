import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, addWeeks } from 'date-fns';

export default function ConfigurerPostPartum({ suiviExistant, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date_accouchement: suiviExistant?.date_accouchement || '',
    type_accouchement: suiviExistant?.type_accouchement || 'voie_basse',
    grossesse_id: suiviExistant?.grossesse_id || ''
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: grossesses = [] } = useQuery({
    queryKey: ['grossesses', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.SuiviGrossesse.filter({ created_by: user.email });
    },
    enabled: !!user,
  });

  const creerSuivi = useMutation({
    mutationFn: async () => {
      if (!formData.date_accouchement) {
        throw new Error('Date d\'accouchement requise');
      }

      const dateAccouchement = new Date(formData.date_accouchement);
      
      // Créer consultations post-natales automatiques
      const consultations = [
        {
          type: 'j1_j5',
          date_prevue: addDays(dateAccouchement, 3).toISOString().split('T')[0],
          statut: 'planifie'
        },
        {
          type: '6_semaines',
          date_prevue: addWeeks(dateAccouchement, 6).toISOString().split('T')[0],
          statut: 'planifie'
        },
        {
          type: '3_mois',
          date_prevue: addWeeks(dateAccouchement, 12).toISOString().split('T')[0],
          statut: 'planifie'
        }
      ];

      if (suiviExistant) {
        return await base44.entities.SuiviPostPartum.update(suiviExistant.id, {
          ...formData,
          consultations_postnatales: consultations
        });
      } else {
        return await base44.entities.SuiviPostPartum.create({
          ...formData,
          consultations_postnatales: consultations,
          suivi_quotidien: [],
          score_edinburgh: [],
          alertes_actives: []
        });
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries(['suivi_postpartum']);
      
      // Créer notifications pour consultations
      await base44.entities.Notification.create({
        destinataire_email: user.email,
        type: 'rendez_vous_rappel',
        titre: '📅 Consultations post-natales planifiées',
        message: 'N\'oubliez pas vos 3 consultations post-natales obligatoires !',
        action_page: 'PostPartum',
        priorite: 'haute',
        icone: 'Calendar'
      });
      
      toast.success('Suivi post-partum configuré !');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configurer mon suivi post-partum</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Date d'accouchement *</Label>
            <Input
              type="date"
              value={formData.date_accouchement}
              onChange={(e) => setFormData({ ...formData, date_accouchement: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Type d'accouchement</Label>
            <Select
              value={formData.type_accouchement}
              onValueChange={(value) => setFormData({ ...formData, type_accouchement: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voie_basse">Voie basse</SelectItem>
                <SelectItem value="cesarienne">Césarienne</SelectItem>
                <SelectItem value="forceps">Forceps</SelectItem>
                <SelectItem value="ventouse">Ventouse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {grossesses.length > 0 && (
            <div>
              <Label>Grossesse associée (optionnel)</Label>
              <Select
                value={formData.grossesse_id}
                onValueChange={(value) => setFormData({ ...formData, grossesse_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {grossesses.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      Grossesse du {new Date(g.date_derniere_regle).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-900">
            <p className="font-semibold mb-1">✅ Consultations automatiques</p>
            <p className="text-xs">
              3 consultations post-natales seront planifiées : J3, 6 semaines et 3 mois
            </p>
          </div>

          <Button
            onClick={() => creerSuivi.mutate()}
            disabled={creerSuivi.isPending || !formData.date_accouchement}
            className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-600"
          >
            {creerSuivi.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {suiviExistant ? 'Mettre à jour' : 'Démarrer le suivi'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}