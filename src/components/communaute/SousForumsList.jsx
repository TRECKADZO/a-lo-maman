import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Baby,
  Apple,
  Heart,
  Stethoscope,
  Activity,
  Milk,
  Moon,
  Syringe,
  Briefcase,
  Users,
  MessageSquare,
  TrendingUp
} from 'lucide-react';

const SOUS_FORUMS = [
  {
    id: 'soins_nouveau_ne',
    titre: 'Soins du Nouveau-né',
    description: 'Premiers soins, hygiène, cordon ombilical',
    icon: Baby,
    color: 'from-pink-400 to-rose-500'
  },
  {
    id: 'nutrition_grossesse',
    titre: 'Nutrition Grossesse',
    description: 'Alimentation pendant la grossesse',
    icon: Apple,
    color: 'from-green-400 to-emerald-500'
  },
  {
    id: 'soutien_post_partum',
    titre: 'Soutien Post-Partum',
    description: 'Récupération, émotions, baby blues',
    icon: Heart,
    color: 'from-purple-400 to-violet-500'
  },
  {
    id: 'questions_specialistes',
    titre: "Questions aux Spécialistes",
    description: 'Posez vos questions aux professionnels',
    icon: Stethoscope,
    color: 'from-teal-400 to-cyan-500',
    badge: 'Vérifié'
  },
  {
    id: 'developpement_moteur',
    titre: 'Développement Moteur',
    description: 'Motricité, étapes de développement',
    icon: Activity,
    color: 'from-blue-400 to-indigo-500'
  },
  {
    id: 'allaitement_biberon',
    titre: 'Allaitement & Biberon',
    description: 'Conseils, difficultés, sevrage',
    icon: Milk,
    color: 'from-amber-400 to-orange-500'
  },
  {
    id: 'sommeil_bebe',
    titre: 'Sommeil de Bébé',
    description: 'Routines, troubles du sommeil',
    icon: Moon,
    color: 'from-indigo-400 to-purple-500'
  },
  {
    id: 'vaccination_sante',
    titre: 'Vaccination & Santé',
    description: 'Calendrier vaccinal, maladies infantiles',
    icon: Syringe,
    color: 'from-red-400 to-pink-500'
  },
  {
    id: 'retour_travail',
    titre: 'Retour au Travail',
    description: 'Conciliation vie pro/famille',
    icon: Briefcase,
    color: 'from-gray-400 to-slate-500'
  },
  {
    id: 'vie_famille',
    titre: 'Vie de Famille',
    description: 'Relations, fratrie, organisation',
    icon: Users,
    color: 'from-cyan-400 to-blue-500'
  }
];

export default function SousForumsList({ onSelectSousForum, messagesBySousForum }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {SOUS_FORUMS.map((forum) => {
        const Icon = forum.icon;
        const count = messagesBySousForum[forum.id] || 0;
        
        return (
          <Card
            key={forum.id}
            className="hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => onSelectSousForum(forum.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${forum.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{forum.titre}</h3>
                    {forum.badge && (
                      <Badge className="bg-teal-100 text-teal-800 text-xs">{forum.badge}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{forum.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{count} discussions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Actif</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export { SOUS_FORUMS };