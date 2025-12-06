import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Scale, Plus, TrendingUp, TrendingDown, Loader2,
  AlertCircle, CheckCircle2, Target
} from 'lucide-react';
import { format, differenceInWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { BottomSheet } from '@/components/ui/safe-area-view';

// Courbes de référence OMS pour prise de poids
const getRecommendedGain = (imc, semainesGrossesse) => {
  // Gain recommandé par semaine selon IMC pré-grossesse
  let gainParSemaine;
  if (imc < 18.5) {
    gainParSemaine = 0.51; // 12.5-18 kg total
  } else if (imc < 25) {
    gainParSemaine = 0.42; // 11.5-16 kg total
  } else if (imc < 30) {
    gainParSemaine = 0.28; // 7-11.5 kg total
  } else {
    gainParSemaine = 0.22; // 5-9 kg total
  }

  // Pas de gain au 1er trimestre (semaines 1-12)
  if (semainesGrossesse <= 12) return 0;
  
  return (semainesGrossesse - 12) * gainParSemaine;
};

export default function SuiviPoidsGrossesse({ grossesse }) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPoids, setNewPoids] = useState('');
  const [datePoids, setDatePoids] = useState(new Date().toISOString().split('T')[0]);

  const mesures = grossesse?.consultations?.filter(c => c.poids) || [];
  
  // Calculer le poids initial (1ère mesure ou poids pré-grossesse)
  const poidsInitial = mesures[0]?.poids || 60;
  const poidsActuel = mesures[mesures.length - 1]?.poids;
  const prisePoidsTotal = poidsActuel ? poidsActuel - poidsInitial : 0;

  // Estimer l'IMC pré-grossesse (supposer taille moyenne 165cm si non renseignée)
  const taille = 1.65; // À améliorer avec vraies données
  const imcPreGrossesse = poidsInitial / (taille * taille);

  // Semaine actuelle
  const semainesGrossesse = differenceInWeeks(new Date(), new Date(grossesse?.date_derniere_regle));

  // Gain recommandé actuel
  const gainRecommande = getRecommendedGain(imcPreGrossesse, semainesGrossesse);
  const poidsRecommande = poidsInitial + gainRecommande;

  // Préparer les données pour le graphique
  const chartData = mesures.map(m => {
    const semaine = differenceInWeeks(new Date(m.date), new Date(grossesse?.date_derniere_regle));
    return {
      semaine,
      poids: m.poids,
      date: format(new Date(m.date), 'dd/MM', { locale: fr }),
      gain: m.poids - poidsInitial
    };
  });

  // Ajouter courbe recommandée
  const courbeRecommandee = [];
  for (let s = 0; s <= 40; s += 2) {
    courbeRecommandee.push({
      semaine: s,
      recommande: poidsInitial + getRecommendedGain(imcPreGrossesse, s)
    });
  }

  // Évaluation de la prise de poids
  const getEvaluation = () => {
    if (!poidsActuel) return null;
    
    const ecart = prisePoidsTotal - gainRecommande;
    const ecartPct = (ecart / gainRecommande) * 100;

    if (Math.abs(ecart) < 1) {
      return { status: 'optimal', message: 'Votre prise de poids est parfaite !', color: 'text-green-600', icon: CheckCircle2 };
    } else if (ecart > 0 && ecart < 3) {
      return { status: 'attention', message: 'Légèrement au-dessus des recommandations', color: 'text-amber-600', icon: AlertCircle };
    } else if (ecart < 0 && ecart > -2) {
      return { status: 'attention', message: 'Légèrement en-dessous des recommandations', color: 'text-amber-600', icon: AlertCircle };
    } else if (ecart >= 3) {
      return { status: 'vigilance', message: 'Prise de poids importante - consultez votre médecin', color: 'text-red-600', icon: AlertCircle };
    } else {
      return { status: 'vigilance', message: 'Prise de poids insuffisante - consultez votre médecin', color: 'text-red-600', icon: AlertCircle };
    }
  };

  const evaluation = getEvaluation();

  const addPoidsMutation = useMutation({
    mutationFn: async () => {
      const consultation = {
        date: datePoids,
        semaine_grossesse: differenceInWeeks(new Date(datePoids), new Date(grossesse.date_derniere_regle)),
        poids: parseFloat(newPoids)
      };

      const consultations = [...(grossesse.consultations || []), consultation];
      
      return base44.entities.SuiviGrossesse.update(grossesse.id, { consultations });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      setShowAddModal(false);
      setNewPoids('');
    }
  });

  return (
    <div className="space-y-4">
      {/* Hero Stats - Mobile optimized */}
      <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Suivi du poids</p>
              <p className="text-lg font-bold text-gray-900">SA {semainesGrossesse}</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)} className="bg-white text-pink-600 shadow-sm">
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {/* Stats compactes */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500 mb-1">Initial</p>
            <p className="text-lg font-bold text-gray-800">{poidsInitial}</p>
            <p className="text-[10px] text-gray-400">kg</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500 mb-1">Actuel</p>
            <p className="text-lg font-bold text-pink-600">{poidsActuel || '-'}</p>
            <p className="text-[10px] text-gray-400">kg</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500 mb-1">Prise</p>
            <div className="flex items-center justify-center gap-1">
              {prisePoidsTotal > 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> : prisePoidsTotal < 0 ? <TrendingDown className="w-3 h-3 text-red-500" /> : null}
              <p className="text-lg font-bold text-purple-600">{prisePoidsTotal > 0 ? '+' : ''}{prisePoidsTotal.toFixed(1)}</p>
            </div>
            <p className="text-[10px] text-gray-400">kg</p>
          </div>
        </div>
      </div>

      {/* Évaluation compacte */}
      {evaluation && (
        <div className={`p-3 rounded-xl flex items-center gap-3 ${
          evaluation.status === 'optimal' ? 'bg-green-50' :
          evaluation.status === 'attention' ? 'bg-amber-50' : 'bg-red-50'
        }`}>
          <evaluation.icon className={`w-5 h-5 flex-shrink-0 ${evaluation.color}`} />
          <p className={`text-sm font-medium ${evaluation.color}`}>{evaluation.message}</p>
        </div>
      )}

      {/* Objectif compact */}
      <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-3">
        <Target className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div className="text-sm">
          <span className="font-medium text-blue-800">Objectif: </span>
          <span className="text-blue-600">+{gainRecommande.toFixed(1)}kg → {poidsRecommande.toFixed(1)}kg</span>
        </div>
      </div>

      {/* Graphique compact */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 mb-3">Évolution</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="semaine" tickFormatter={(s) => `${s}`} tick={{ fontSize: 9 }} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 9 }} width={35} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 rounded-lg shadow-lg border text-xs">
                          <p className="font-semibold">{data.date} - SA {data.semaine}</p>
                          <p className="text-pink-600 font-bold">{data.poids} kg</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="poids" stroke="#EC4899" strokeWidth={2} dot={{ fill: '#EC4899', r: 4 }} />
                <ReferenceLine y={poidsRecommande} stroke="#3B82F6" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-pink-500" />Poids
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="w-4 h-0.5 bg-blue-500" style={{ borderTop: '1px dashed #3B82F6' }} />Cible
            </div>
          </div>
        </div>
      )}

      {/* Historique compact */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-800 mb-3">Historique</p>
        {mesures.length === 0 ? (
          <p className="text-center text-gray-400 py-4 text-sm">Aucune mesure</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...mesures].reverse().slice(0, 8).map((m, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-pink-600">{m.poids}</span>
                  </div>
                  <p className="text-xs text-gray-500">{format(new Date(m.date), 'dd MMM', { locale: fr })}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">SA {differenceInWeeks(new Date(m.date), new Date(grossesse.date_derniere_regle))}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal ajout poids */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter une mesure de poids"
      >
        <div className="p-6 space-y-4">
          <div>
            <Label>Date de la mesure</Label>
            <Input
              type="date"
              value={datePoids}
              onChange={(e) => setDatePoids(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Poids (kg)</Label>
            <Input
              type="number"
              step="0.1"
              min="30"
              max="200"
              value={newPoids}
              onChange={(e) => setNewPoids(e.target.value)}
              placeholder="Ex: 65.5"
              className="mt-1"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={() => addPoidsMutation.mutate()}
              disabled={!newPoids || addPoidsMutation.isPending}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500"
            >
              {addPoidsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}