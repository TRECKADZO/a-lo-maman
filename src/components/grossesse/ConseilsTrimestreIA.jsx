import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Heart, Baby, Apple, Activity, Moon, AlertCircle,
  Loader2, RefreshCw, Stethoscope, Smile
} from 'lucide-react';

const CATEGORIES_CONSEILS = [
  { id: 'nutrition', label: 'Nutrition', icon: Apple, color: 'text-green-500' },
  { id: 'activite', label: 'Activité', icon: Activity, color: 'text-blue-500' },
  { id: 'sommeil', label: 'Sommeil', icon: Moon, color: 'text-purple-500' },
  { id: 'sante', label: 'Santé', icon: Stethoscope, color: 'text-red-500' },
  { id: 'bienetre', label: 'Bien-être', icon: Smile, color: 'text-amber-500' },
  { id: 'preparation', label: 'Préparation', icon: Baby, color: 'text-pink-500' },
];

export default function ConseilsTrimestreIA({ grossesse, semainesGrossesse, trimestre }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Récupérer les symptômes récents
  const symptomesRecents = React.useMemo(() => {
    const journal = grossesse?.symptomes_journal || [];
    const last7Days = journal.filter(e => {
      const diff = Math.floor((new Date() - new Date(e.date)) / (1000 * 60 * 60 * 24));
      return diff <= 7;
    });
    const allSymptomes = last7Days.flatMap(e => e.symptomes || []);
    return [...new Set(allSymptomes)];
  }, [grossesse?.symptomes_journal]);

  const getSymptomeLabel = (id) => {
    const labels = {
      'nausees': 'Nausées', 'vomissements': 'Vomissements', 'fatigue': 'Fatigue',
      'maux_tete': 'Maux de tête', 'vertiges': 'Vertiges', 'douleurs_dos': 'Douleurs de dos',
      'brulures_estomac': 'Brûlures d\'estomac', 'constipation': 'Constipation',
      'insomnie': 'Insomnie', 'crampes': 'Crampes', 'oedemes': 'Œdèmes',
      'contractions': 'Contractions', 'saignements': 'Saignements',
      'douleurs_pelviennes': 'Douleurs pelviennes', 'essoufflement': 'Essoufflement',
      'humeur': 'Changements d\'humeur'
    };
    return labels[id] || id;
  };

  const { data: conseils, isLoading, refetch } = useQuery({
    queryKey: ['conseils_ia', trimestre, semainesGrossesse, symptomesRecents.join(',')],
    queryFn: async () => {
      const symptomesTexte = symptomesRecents.length > 0 
        ? symptomesRecents.map(s => getSymptomeLabel(s)).join(', ')
        : 'Aucun symptôme particulier signalé';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un expert en santé maternelle. Génère des conseils personnalisés pour une femme enceinte avec les caractéristiques suivantes:

PROFIL:
- Semaine de grossesse: ${semainesGrossesse} SA
- Trimestre: ${trimestre}
- Type de grossesse: ${grossesse?.type_grossesse || 'unique'}
- Groupe sanguin: ${grossesse?.groupe_sanguin || 'non renseigné'}
- Rhésus: ${grossesse?.rhesus || 'non renseigné'}

SYMPTÔMES ACTUELS (derniers 7 jours):
${symptomesTexte}

TRÈS IMPORTANT: Adapte TOUS tes conseils aux symptômes mentionnés. Par exemple:
- Si nausées: conseils anti-nausées dans nutrition ET bien-être
- Si fatigue: conseils repos ET alimentation énergisante
- Si douleurs de dos: exercices adaptés ET positions de sommeil
- Si insomnie: routine sommeil ET relaxation
- Si humeur changeante: conseils émotionnels ET activités apaisantes

Génère des conseils pratiques, bienveillants et adaptés au contexte ivoirien pour chaque catégorie.
Les conseils doivent être spécifiques à la semaine actuelle et au trimestre.
Inclus des aliments locaux, des pratiques culturelles positives si pertinent.`,
        response_json_schema: {
          type: 'object',
          properties: {
            message_personnalise: { type: 'string', description: 'Message d\'encouragement personnalisé pour cette semaine' },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', enum: ['nutrition', 'activite', 'sommeil', 'sante', 'bienetre', 'preparation'] },
                  conseils: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        titre: { type: 'string' },
                        description: { type: 'string' },
                        importance: { type: 'string', enum: ['essentiel', 'recommande', 'optionnel'] }
                      }
                    }
                  }
                }
              }
            },
            alertes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  type: { type: 'string', enum: ['info', 'attention', 'urgent'] }
                }
              }
            },
            rdv_recommandes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nom: { type: 'string' },
                  semaine_ideale: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        }
      });

      return response;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache 24h
    enabled: !!grossesse && !!semainesGrossesse,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getTrimestreColor = () => {
    switch (trimestre) {
      case 1: return 'from-pink-400 to-rose-500';
      case 2: return 'from-purple-400 to-violet-500';
      case 3: return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getImportanceStyle = (importance) => {
    switch (importance) {
      case 'essentiel': return 'border-l-4 border-l-red-500 bg-red-50';
      case 'recommande': return 'border-l-4 border-l-amber-500 bg-amber-50';
      default: return 'border-l-4 border-l-gray-300 bg-gray-50';
    }
  };

  const filteredConseils = conseils?.categories?.filter(
    cat => selectedCategory === 'all' || cat.id === selectedCategory
  ) || [];

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Génération de conseils personnalisés...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec message personnalisé */}
      <Card className={`shadow-xl bg-gradient-to-r ${getTrimestreColor()} text-white overflow-hidden`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-2">
                Conseils pour votre semaine {semainesGrossesse}
              </h2>
              <p className="text-sm opacity-90">
                {conseils?.message_personnalise || 'Conseils personnalisés pour cette étape de votre grossesse.'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertes si présentes */}
      {conseils?.alertes?.length > 0 && (
        <div className="space-y-2">
          {conseils.alertes.map((alerte, i) => (
            <Card 
              key={i} 
              className={`shadow-md ${
                alerte.type === 'urgent' ? 'bg-red-50 border-red-200' :
                alerte.type === 'attention' ? 'bg-amber-50 border-amber-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                  alerte.type === 'urgent' ? 'text-red-500' :
                  alerte.type === 'attention' ? 'text-amber-500' :
                  'text-blue-500'
                }`} />
                <p className="text-sm">{alerte.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filtres par catégorie */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="flex-shrink-0"
        >
          Tous
        </Button>
        {CATEGORIES_CONSEILS.map(cat => {
          const Icon = cat.icon;
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="flex-shrink-0"
            >
              <Icon className={`w-4 h-4 mr-1 ${selectedCategory === cat.id ? '' : cat.color}`} />
              {cat.label}
            </Button>
          );
        })}
      </div>

      {/* Conseils par catégorie */}
      {filteredConseils.map(category => {
        const catInfo = CATEGORIES_CONSEILS.find(c => c.id === category.id);
        const Icon = catInfo?.icon || Heart;

        return (
          <Card key={category.id} className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className={`w-5 h-5 ${catInfo?.color || 'text-gray-500'}`} />
                {catInfo?.label || category.id}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.conseils?.map((conseil, i) => (
                <div key={i} className={`p-4 rounded-lg ${getImportanceStyle(conseil.importance)}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{conseil.titre}</h4>
                        {conseil.importance === 'essentiel' && (
                          <Badge className="bg-red-100 text-red-800 text-xs">Essentiel</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{conseil.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* RDV recommandés */}
      {conseils?.rdv_recommandes?.length > 0 && (
        <Card className="shadow-lg bg-teal-50 border-teal-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-teal-800">
              <Stethoscope className="w-5 h-5" />
              Rendez-vous recommandés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conseils.rdv_recommandes.map((rdv, i) => (
              <div key={i} className="p-3 bg-white rounded-lg border border-teal-200">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-teal-900">{rdv.nom}</h4>
                  <Badge className="bg-teal-100 text-teal-800">{rdv.semaine_ideale}</Badge>
                </div>
                <p className="text-sm text-teal-700">{rdv.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}