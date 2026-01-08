import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Smile, Frown, Meh, Battery, BatteryLow, Zap, Plus, TrendingUp } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const HUMEUR_OPTIONS = [
  { value: 1, icon: Frown, label: 'Très mauvaise', color: 'text-red-500' },
  { value: 2, icon: Frown, label: 'Mauvaise', color: 'text-orange-500' },
  { value: 3, icon: Meh, label: 'Moyenne', color: 'text-yellow-500' },
  { value: 4, icon: Smile, label: 'Bonne', color: 'text-green-500' },
  { value: 5, icon: Smile, label: 'Excellente', color: 'text-emerald-500' }
];

const ENERGIE_OPTIONS = [
  { value: 1, icon: BatteryLow, label: 'Épuisée', color: 'text-red-500' },
  { value: 2, icon: BatteryLow, label: 'Fatiguée', color: 'text-orange-500' },
  { value: 3, icon: Battery, label: 'Moyenne', color: 'text-yellow-500' },
  { value: 4, icon: Battery, label: 'Bonne', color: 'text-green-500' },
  { value: 5, icon: Zap, label: 'Pleine d\'énergie', color: 'text-emerald-500' }
];

const SYMPTOMES = [
  'fatigue_extreme',
  'tristesse',
  'anxiete',
  'pleurs_frequents',
  'difficulte_sommeil',
  'perte_appetit',
  'douleurs_perineales',
  'douleurs_abdominales',
  'saignements_abondants',
  'problemes_allaitement'
];

export default function JournalQuotidien({ suivi }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    humeur: null,
    energie: null,
    symptomes: [],
    notes: ''
  });

  const aujourdHui = (suivi.suivi_quotidien || []).find(s => 
    isToday(new Date(s.date))
  );

  const ajouterEntree = useMutation({
    mutationFn: async () => {
      const nouvelleEntree = {
        date: new Date().toISOString().split('T')[0],
        ...formData
      };

      const suiviMisAJour = [
        ...(suivi.suivi_quotidien || []).filter(s => !isToday(new Date(s.date))),
        nouvelleEntree
      ];

      await base44.entities.SuiviPostPartum.update(suivi.id, {
        suivi_quotidien: suiviMisAJour
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['suivi_postpartum']);
      toast.success('Entrée enregistrée');
      setShowForm(false);
      setFormData({ humeur: null, energie: null, symptomes: [], notes: '' });
    }
  });

  const dernieresEntrees = (suivi.suivi_quotidien || []).slice(-7).reverse();

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Journal quotidien</CardTitle>
            {!aujourdHui && !showForm && (
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Aujourd'hui
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {aujourdHui && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm font-semibold text-green-900 mb-2">✅ Entrée d'aujourd'hui</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {HUMEUR_OPTIONS.find(h => h.value === aujourdHui.humeur)?.icon && 
                    React.createElement(HUMEUR_OPTIONS.find(h => h.value === aujourdHui.humeur).icon, {
                      className: `w-6 h-6 ${HUMEUR_OPTIONS.find(h => h.value === aujourdHui.humeur).color}`
                    })
                  }
                  <span className="text-sm">Humeur</span>
                </div>
                <div className="flex items-center gap-2">
                  {ENERGIE_OPTIONS.find(e => e.value === aujourdHui.energie)?.icon && 
                    React.createElement(ENERGIE_OPTIONS.find(e => e.value === aujourdHui.energie).icon, {
                      className: `w-6 h-6 ${ENERGIE_OPTIONS.find(e => e.value === aujourdHui.energie).color}`
                    })
                  }
                  <span className="text-sm">Énergie</span>
                </div>
              </div>
            </div>
          )}

          {showForm && !aujourdHui && (
            <div className="bg-white border-2 border-purple-200 rounded-lg p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">Comment vous sentez-vous ?</p>
                <div className="grid grid-cols-5 gap-2">
                  {HUMEUR_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFormData({ ...formData, humeur: opt.value })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.humeur === opt.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto ${opt.color}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Votre niveau d'énergie ?</p>
                <div className="grid grid-cols-5 gap-2">
                  {ENERGIE_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFormData({ ...formData, energie: opt.value })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.energie === opt.value
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto ${opt.color}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Notes (optionnel)</p>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Comment s'est passée votre journée ?"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => ajouterEntree.mutate()}
                  disabled={!formData.humeur || !formData.energie || ajouterEntree.isPending}
                  className="flex-1 bg-purple-500"
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          )}

          {dernieresEntrees.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Dernières entrées
              </p>
              <div className="space-y-2">
                {dernieresEntrees.map((entree, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-600">
                        {format(new Date(entree.date), 'EEEE d MMMM', { locale: fr })}
                      </p>
                      <div className="flex items-center gap-2">
                        {HUMEUR_OPTIONS.find(h => h.value === entree.humeur)?.icon && 
                          React.createElement(HUMEUR_OPTIONS.find(h => h.value === entree.humeur).icon, {
                            className: `w-4 h-4 ${HUMEUR_OPTIONS.find(h => h.value === entree.humeur).color}`
                          })
                        }
                        {ENERGIE_OPTIONS.find(e => e.value === entree.energie)?.icon && 
                          React.createElement(ENERGIE_OPTIONS.find(e => e.value === entree.energie).icon, {
                            className: `w-4 h-4 ${ENERGIE_OPTIONS.find(e => e.value === entree.energie).color}`
                          })
                        }
                      </div>
                    </div>
                    {entree.notes && (
                      <p className="text-xs text-gray-700">{entree.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}