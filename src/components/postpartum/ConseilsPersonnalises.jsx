import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Heart, Brain, Activity } from 'lucide-react';

export default function ConseilsPersonnalises({ suivi, info }) {
  const conseils = [];

  // Conseils selon la phase
  if (info.phase === 'precoce') {
    conseils.push({
      icon: Heart,
      titre: 'Repos prioritaire',
      message: 'Profitez du sommeil de bébé pour vous reposer. Le ménage peut attendre !',
      color: 'from-pink-500 to-rose-600'
    });
  }

  if (info.semainesPasses >= 6) {
    conseils.push({
      icon: Activity,
      titre: 'Reprise progressive',
      message: 'Consultation post-natale des 6 semaines : moment idéal pour faire le point sur votre récupération.',
      color: 'from-purple-500 to-violet-600'
    });
  }

  // Conseil humeur si entrées récentes montrent tristesse
  const dernieresEntrees = (suivi.suivi_quotidien || []).slice(-7);
  const humeurMoyenne = dernieresEntrees.length > 0 
    ? dernieresEntrees.reduce((acc, e) => acc + (e.humeur || 0), 0) / dernieresEntrees.length
    : 0;

  if (humeurMoyenne > 0 && humeurMoyenne < 2.5) {
    conseils.push({
      icon: Brain,
      titre: 'Prenez soin de vous',
      message: 'Votre humeur semble basse ces derniers jours. N\'hésitez pas à en parler à un professionnel.',
      color: 'from-indigo-500 to-blue-600',
      priorite: true
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">Conseils personnalisés</h3>
      </div>

      {conseils.map((conseil, idx) => {
        const Icon = conseil.icon;
        return (
          <Card key={idx} className={`shadow-lg border-2 ${conseil.priorite ? 'border-red-300' : 'border-purple-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${conseil.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">{conseil.titre}</p>
                  <p className="text-sm text-gray-700">{conseil.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {conseils.length === 0 && (
        <Card className="shadow-md">
          <CardContent className="p-6 text-center">
            <Heart className="w-12 h-12 text-pink-300 mx-auto mb-3" />
            <p className="text-gray-600">Aucun conseil spécifique pour le moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}