import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Moon, TrendingUp, Lightbulb, Plus, Calendar } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

import AjouterSommeil from '@/components/sommeil/AjouterSommeil';
import GraphiqueSommeil from '@/components/sommeil/GraphiqueSommeil';
import ConseilsSommeil from '@/components/sommeil/ConseilsSommeil';
import StatistiquesSommeil from '@/components/sommeil/StatistiquesSommeil';

export default function SuiviSommeil() {
  const [showAjout, setShowAjout] = useState(false);
  const [periode, setPeriode] = useState('7j'); // 7j, 30j, 3m
  const [activeTab, setActiveTab] = useState('vue');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['suivi_sommeil', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const data = await base44.entities.SuiviSommeil.filter(
        { created_by: user.email },
        '-date'
      );
      return data;
    },
    enabled: !!user,
  });

  // Filtrer par période
  const getDateLimit = () => {
    const now = new Date();
    if (periode === '7j') return subDays(now, 7);
    if (periode === '30j') return subDays(now, 30);
    if (periode === '3m') return subDays(now, 90);
    return subDays(now, 7);
  };

  const filteredEntries = entries.filter(e => new Date(e.date) >= getDateLimit());

  // Stats rapides
  const moyenneDuree = filteredEntries.length > 0
    ? (filteredEntries.reduce((acc, e) => acc + e.duree_heures, 0) / filteredEntries.length).toFixed(1)
    : 0;

  const qualiteMoyenne = filteredEntries.length > 0
    ? Math.round(filteredEntries.reduce((acc, e) => {
        const scores = { très_mauvaise: 1, mauvaise: 2, moyenne: 3, bonne: 4, excellente: 5 };
        return acc + (scores[e.qualite] || 3);
      }, 0) / filteredEntries.length)
    : 0;

  const nuitsBonnes = filteredEntries.filter(e => ['bonne', 'excellente'].includes(e.qualite)).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Moon className="w-8 h-8 text-indigo-600" />
              Suivi du Sommeil
            </h1>
            <p className="text-gray-600 mt-1">Suivez et améliorez la qualité de votre sommeil</p>
          </div>
          <Button
            onClick={() => setShowAjout(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Durée moyenne</p>
                  <p className="text-3xl font-bold text-indigo-600">{moyenneDuree}h</p>
                  <p className="text-xs text-gray-500 mt-1">{periode === '7j' ? '7 derniers jours' : (periode === '30j' ? '30 derniers jours' : '3 derniers mois')}</p>
                </div>
                <Moon className="w-12 h-12 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Qualité moyenne</p>
                  <div className="flex items-center gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`text-2xl ${star <= qualiteMoyenne ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                    ))}
                  </div>
                </div>
                <TrendingUp className="w-12 h-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bonnes nuits</p>
                  <p className="text-3xl font-bold text-green-600">{nuitsBonnes}/{filteredEntries.length}</p>
                  <p className="text-xs text-gray-500 mt-1">{filteredEntries.length > 0 ? Math.round((nuitsBonnes / filteredEntries.length) * 100) : 0}%</p>
                </div>
                <Calendar className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres période */}
        <div className="flex justify-end">
          <Tabs value={periode} onValueChange={setPeriode}>
            <TabsList>
              <TabsTrigger value="7j">7 jours</TabsTrigger>
              <TabsTrigger value="30j">30 jours</TabsTrigger>
              <TabsTrigger value="3m">3 mois</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Navigation principale */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vue">
              <TrendingUp className="w-4 h-4 mr-2" />
              Graphique
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Calendar className="w-4 h-4 mr-2" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="conseils">
              <Lightbulb className="w-4 h-4 mr-2" />
              Conseils
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Contenu selon tab */}
        {activeTab === 'vue' && (
          <GraphiqueSommeil entries={filteredEntries} periode={periode} />
        )}

        {activeTab === 'stats' && (
          <StatistiquesSommeil entries={filteredEntries} />
        )}

        {activeTab === 'conseils' && (
          <ConseilsSommeil entries={filteredEntries} />
        )}

        {/* Modal ajout */}
        {showAjout && (
          <AjouterSommeil
            onClose={() => setShowAjout(false)}
          />
        )}
      </div>
    </div>
  );
}