import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Heart, Calendar, Smile, Activity, Brain,
  Pill, Stethoscope, AlertCircle, TrendingUp,
  Baby, Plus, Sparkles
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AuthGuard from '../components/auth/AuthGuard';
import ConfigurerPostPartum from '../components/postpartum/ConfigurerPostPartum';
import ConsultationsPostnatales from '../components/postpartum/ConsultationsPostnatales';
import JournalQuotidien from '../components/postpartum/JournalQuotidien';
import TestEdinburgh from '../components/postpartum/TestEdinburgh';
import ContraceeptionPostPartum from '../components/postpartum/ContraceptionPostPartum';
import RecuperationPhysique from '../components/postpartum/RecuperationPhysique';
import ConseillsPersonnalises from '../components/postpartum/ConseilsPersonnalises';
import RetourCouches from '../components/postpartum/RetourCouches';
import SuiviAllaitement from '../components/postpartum/SuiviAllaitement';
import PoidsNourrissonSuivi from '../components/postpartum/PoidsNourrissonSuivi';
import RappelsVaccinsNourrisson from '../components/postpartum/RappelsVaccinsNourrisson';

export default function PostPartum() {
  const [showConfigurer, setShowConfigurer] = useState(false);
  const [activeTab, setActiveTab] = useState('accueil');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: suivi, isLoading } = useQuery({
    queryKey: ['suivi_postpartum', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const suivis = await base44.entities.SuiviPostPartum.filter(
        { created_by: user.email },
        '-date_accouchement',
        1
      );
      return suivis[0] || null;
    },
    enabled: !!user,
  });

  const calculatePostPartumInfo = () => {
    if (!suivi) return null;
    const today = new Date();
    const dateAccouchement = new Date(suivi.date_accouchement);
    const joursPasses = differenceInDays(today, dateAccouchement);
    const semainesPasses = Math.floor(joursPasses / 7);

    return {
      joursPasses,
      semainesPasses,
      phase: semainesPasses < 6 ? 'precoce' : semainesPasses < 12 ? 'tardif' : 'complet',
      dateAccouchement
    };
  };

  const info = calculatePostPartumInfo();

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'precoce': return 'from-pink-400 to-rose-500';
      case 'tardif': return 'from-purple-400 to-violet-500';
      case 'complet': return 'from-green-400 to-emerald-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getPhaseLabel = (phase) => {
    switch (phase) {
      case 'precoce': return 'Post-partum précoce (0-6 semaines)';
      case 'tardif': return 'Post-partum tardif (6-12 semaines)';
      case 'complet': return 'Récupération complète (3+ mois)';
      default: return '';
    }
  };

  const stats = suivi ? {
    consultations: (suivi.consultations_postnatales || []).filter(c => c.statut === 'realise').length,
    joursSuivis: (suivi.suivi_quotidien || []).length,
    testsEdinburgh: (suivi.score_edinburgh || []).length,
    alertes: (suivi.alertes_actives || []).filter(a => a.priorite === 'urgent').length
  } : null;

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center h-screen">
          <Activity className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      </AuthGuard>
    );
  }

  if (!suivi) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-28 h-28 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mb-6 shadow-xl">
              <Heart className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Suivi Post-Partum</h1>
            <p className="text-gray-600 mb-8 max-w-sm">
              Un accompagnement personnalisé pour votre récupération après l'accouchement
            </p>
            <Button
              onClick={() => setShowConfigurer(true)}
              size="lg"
              className="w-full max-w-xs h-14 bg-gradient-to-r from-pink-500 to-rose-600 shadow-lg text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Démarrer mon suivi
            </Button>

            <div className="grid grid-cols-3 gap-4 mt-10 w-full max-w-sm">
              <div className="p-4 bg-white rounded-2xl shadow-sm text-center">
                <Calendar className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Consultations</p>
              </div>
              <div className="p-4 bg-white rounded-2xl shadow-sm text-center">
                <Smile className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Humeur</p>
              </div>
              <div className="p-4 bg-white rounded-2xl shadow-sm text-center">
                <Brain className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Bien-être</p>
              </div>
            </div>
          </div>

          {showConfigurer && (
            <ConfigurerPostPartum onClose={() => setShowConfigurer(false)} />
          )}
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="bg-gray-50 pb-24 md:pb-8" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
        {info && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 pt-2 pb-4 px-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 bg-gradient-to-br ${getPhaseColor(info.phase)} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Post-Partum</p>
                    <p className="text-lg font-bold text-gray-900">
                      Jour {info.joursPasses}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConfigurer(true)}
                  className="rounded-full"
                >
                  <Sparkles className="w-5 h-5 text-gray-600" />
                </Button>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`bg-gradient-to-r ${getPhaseColor(info.phase)} text-white border-0`}>
                    {getPhaseLabel(info.phase)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Accouchement le {format(info.dateAccouchement, 'dd MMMM yyyy', { locale: fr })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {info.semainesPasses} semaines écoulées
                </p>
              </div>
            </div>

            {/* Alertes */}
            {stats && stats.alertes > 0 && (
              <div className="px-4 -mt-2 mb-4">
                <Card className="border-2 border-red-300 bg-red-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-red-900">
                        {stats.alertes} alerte(s) nécessitant votre attention
                      </p>
                      <p className="text-xs text-red-700">Consultez un professionnel</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Stats rapides */}
            {stats && (
              <div className="px-4 mb-4">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: Calendar, value: stats.consultations, label: 'Consult.', color: 'text-blue-500' },
                    { icon: Smile, value: stats.joursSuivis, label: 'Jours', color: 'text-purple-500' },
                    { icon: Brain, value: stats.testsEdinburgh, label: 'Tests', color: 'text-indigo-500' },
                    { icon: Activity, value: info.semainesPasses, label: 'Semaines', color: 'text-pink-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm">
                      <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                      <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                      <p className="text-[10px] text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="px-4 pb-32">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-white shadow-md mb-4">
                  <TabsTrigger value="accueil">Accueil</TabsTrigger>
                  <TabsTrigger value="suivi">Suivi</TabsTrigger>
                  <TabsTrigger value="sante">Santé</TabsTrigger>
                </TabsList>

                <TabsContent value="accueil" className="space-y-4">
                  <ConseillsPersonnalises suivi={suivi} info={info} />
                  
                  <Card className="shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={() => setActiveTab('suivi')}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Smile className="w-10 h-10 text-purple-500" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Journal quotidien</p>
                          <p className="text-sm text-gray-600">Notez votre humeur et énergie</p>
                        </div>
                        <Button size="sm">Ouvrir</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="suivi" className="space-y-4">
                  <JournalQuotidien suivi={suivi} />
                  <RetourCouches suivi={suivi} />
                  <SuiviAllaitement suivi={suivi} />
                  <PoidsNourrissonSuivi suivi={suivi} />
                  <ConsultationsPostnatales suivi={suivi} />
                </TabsContent>

                <TabsContent value="sante" className="space-y-4">
                  <RappelsVaccinsNourrisson suivi={suivi} />
                  <TestEdinburgh suivi={suivi} />
                  <RecuperationPhysique suivi={suivi} />
                  <ContraceeptionPostPartum suivi={suivi} />
                </TabsContent>
              </Tabs>
            </div>

            {showConfigurer && (
              <ConfigurerPostPartum
                suiviExistant={suivi}
                onClose={() => setShowConfigurer(false)}
              />
            )}
          </>
        )}
      </div>
    </AuthGuard>
  );
}