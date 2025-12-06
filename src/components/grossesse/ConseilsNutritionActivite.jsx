import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Apple, Dumbbell, Sparkles, Loader2, AlertCircle, CheckCircle2,
  Droplets, Leaf, Scale, RefreshCw,
  ChefHat, Utensils
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/safe-area-view';
import PlanificateurRepas from '../nutrition/PlanificateurRepas';
import TrackerRepas from '../nutrition/TrackerRepas';

export default function ConseilsNutritionActivite({ grossesse, semainesGrossesse, trimestre }) {
  const [showIMCModal, setShowIMCModal] = useState(false);
  const [poids, setPoids] = useState('');
  const [taille, setTaille] = useState('');
  const [imc, setImc] = useState(grossesse?.imc_pre_grossesse || null);

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

  const calculerIMC = () => {
    const p = parseFloat(poids);
    const t = parseFloat(taille) / 100;
    if (p && t) {
      const newImc = (p / (t * t)).toFixed(1);
      setImc(parseFloat(newImc));
      setShowIMCModal(false);
    }
  };

  const getIMCCategorie = (imc) => {
    if (!imc) return null;
    if (imc < 18.5) return { label: 'Insuffisance pondérale', color: 'bg-blue-100 text-blue-800', gain: '12.5-18 kg' };
    if (imc < 25) return { label: 'Poids normal', color: 'bg-green-100 text-green-800', gain: '11.5-16 kg' };
    if (imc < 30) return { label: 'Surpoids', color: 'bg-amber-100 text-amber-800', gain: '7-11.5 kg' };
    return { label: 'Obésité', color: 'bg-red-100 text-red-800', gain: '5-9 kg' };
  };

  const imcCategorie = getIMCCategorie(imc);

  const { data: conseils, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['conseils_nutrition', imc, trimestre, semainesGrossesse, symptomesRecents.join(',')],
    queryFn: async () => {
      const symptomesTexte = symptomesRecents.length > 0 
        ? symptomesRecents.map(s => {
            const labels = {
              'nausees': 'Nausées',
              'vomissements': 'Vomissements',
              'fatigue': 'Fatigue intense',
              'maux_tete': 'Maux de tête',
              'brulures_estomac': 'Brûlures d\'estomac',
              'constipation': 'Constipation',
              'crampes': 'Crampes musculaires',
              'oedemes': 'Œdèmes/Gonflements',
              'insomnie': 'Troubles du sommeil'
            };
            return labels[s] || s;
          }).join(', ')
        : 'Aucun symptôme particulier';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es une nutritionniste et coach sportif spécialisée en grossesse. Génère des conseils personnalisés.

PROFIL:
- Semaine de grossesse: ${semainesGrossesse} SA
- Trimestre: ${trimestre}
- IMC pré-grossesse: ${imc || 'non renseigné'}
- Catégorie IMC: ${imcCategorie?.label || 'non déterminée'}
- Prise de poids recommandée: ${imcCategorie?.gain || 'à déterminer'}

SYMPTÔMES ACTUELS (derniers 7 jours):
${symptomesTexte}

IMPORTANT: Adapte spécifiquement tes conseils aux symptômes mentionnés:
- Si nausées/vomissements: privilégier repas légers, fractionnés, éviter odeurs fortes
- Si brûlures d'estomac: éviter aliments acides, épicés, manger en petites quantités
- Si constipation: augmenter fibres, hydratation
- Si fatigue: aliments riches en fer, B12, petites collations énergétiques
- Si crampes: augmenter magnésium, potassium
- Si œdèmes: réduire sel, favoriser drainage naturel

Adapte les conseils au contexte ivoirien (aliments locaux disponibles, climat, culture).
Sois précise et pratique dans tes recommandations.`,
        response_json_schema: {
          type: 'object',
          properties: {
            nutrition: {
              type: 'object',
              properties: {
                resume: { type: 'string' },
                besoins_caloriques: { type: 'string' },
                nutriments_prioritaires: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      nom: { type: 'string' },
                      importance: { type: 'string' },
                      sources_locales: { type: 'array', items: { type: 'string' } }
                    }
                  }
                },
                aliments_recommandes: { type: 'array', items: { type: 'string' } },
                aliments_eviter: { type: 'array', items: { type: 'string' } },
                exemple_menu_journee: {
                  type: 'object',
                  properties: {
                    petit_dejeuner: { type: 'string' },
                    dejeuner: { type: 'string' },
                    diner: { type: 'string' },
                    collations: { type: 'array', items: { type: 'string' } }
                  }
                },
                hydratation: { type: 'string' }
              }
            },
            activite_physique: {
              type: 'object',
              properties: {
                resume: { type: 'string' },
                frequence_recommandee: { type: 'string' },
                exercices_recommandes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      nom: { type: 'string' },
                      duree: { type: 'string' },
                      benefices: { type: 'string' },
                      precautions: { type: 'string' }
                    }
                  }
                },
                exercices_eviter: { type: 'array', items: { type: 'string' } },
                signes_arret: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      });
      return response;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !!grossesse,
  });

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Génération de vos conseils personnalisés...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Carte IMC */}
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">IMC pré-grossesse</p>
                {imc ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">{imc}</p>
                    {imcCategorie && (
                      <Badge className={imcCategorie.color}>{imcCategorie.label}</Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">Non renseigné</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowIMCModal(true)}>
              {imc ? 'Modifier' : 'Calculer'}
            </Button>
          </div>
          {imcCategorie && (
            <p className="text-xs text-gray-500 mt-2">
              Prise de poids recommandée: <span className="font-medium">{imcCategorie.gain}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Conseils */}
      <Tabs defaultValue="tracker">
        <TabsList className="flex overflow-x-auto no-scrollbar w-full">
          <TabsTrigger value="tracker" className="flex-shrink-0">
            <Utensils className="w-4 h-4 mr-1" />
            Tracker
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex-shrink-0">
            <ChefHat className="w-4 h-4 mr-1" />
            Plan repas
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex-shrink-0">
            <Apple className="w-4 h-4 mr-1" />
            Conseils
          </TabsTrigger>
          <TabsTrigger value="activite" className="flex-shrink-0">
            <Dumbbell className="w-4 h-4 mr-1" />
            Activité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="mt-4">
          <TrackerRepas 
            grossesse={grossesse}
            trimestre={trimestre}
            objectifsNutritionnels={conseils?.nutrition ? {
              calories_jour: 2200 + (trimestre === 2 ? 340 : trimestre === 3 ? 450 : 0),
              proteines_jour: 70,
              fer_jour: 27,
              calcium_jour: 1000,
              acide_folique_jour: 600
            } : null}
          />
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <PlanificateurRepas 
            grossesse={grossesse}
            semainesGrossesse={semainesGrossesse}
            trimestre={trimestre}
            imc={imc}
          />
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4 mt-4">
          {conseils?.nutrition && (
            <>
              {/* Résumé */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Vos besoins nutritionnels</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => refetch()}
                      disabled={isFetching}
                      className="ml-auto h-8 w-8"
                    >
                      <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <p className="text-sm text-green-700">{conseils.nutrition.resume}</p>
                  {conseils.nutrition.besoins_caloriques && (
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      {conseils.nutrition.besoins_caloriques}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Nutriments prioritaires */}
              {conseils.nutrition.nutriments_prioritaires?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Nutriments prioritaires</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {conseils.nutrition.nutriments_prioritaires.map((n, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Leaf className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-sm">{n.nom}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{n.importance}</p>
                        <div className="flex flex-wrap gap-1">
                          {n.sources_locales?.map((s, j) => (
                            <Badge key={j} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Aliments */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-green-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> À privilégier
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="text-xs text-green-700 space-y-1">
                      {conseils.nutrition.aliments_recommandes?.slice(0, 5).map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-red-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> À éviter
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="text-xs text-red-700 space-y-1">
                      {conseils.nutrition.aliments_eviter?.slice(0, 5).map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Menu exemple */}
              {conseils.nutrition.exemple_menu_journee && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">💡 Exemple de menu journée</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <p className="text-xs font-medium text-amber-800">Petit-déjeuner</p>
                      <p className="text-xs text-amber-700">{conseils.nutrition.exemple_menu_journee.petit_dejeuner}</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <p className="text-xs font-medium text-orange-800">Déjeuner</p>
                      <p className="text-xs text-orange-700">{conseils.nutrition.exemple_menu_journee.dejeuner}</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <p className="text-xs font-medium text-purple-800">Dîner</p>
                      <p className="text-xs text-purple-700">{conseils.nutrition.exemple_menu_journee.diner}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Hydratation */}
              {conseils.nutrition.hydratation && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Droplets className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Hydratation</p>
                      <p className="text-xs text-blue-700">{conseils.nutrition.hydratation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="activite" className="space-y-4 mt-4">
          {conseils?.activite_physique && (
            <>
              {/* Résumé */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Activité physique adaptée</span>
                  </div>
                  <p className="text-sm text-blue-700">{conseils.activite_physique.resume}</p>
                  {conseils.activite_physique.frequence_recommandee && (
                    <Badge className="mt-2 bg-blue-100 text-blue-800">
                      {conseils.activite_physique.frequence_recommandee}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Exercices recommandés */}
              {conseils.activite_physique.exercices_recommandes?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Exercices recommandés</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {conseils.activite_physique.exercices_recommandes.map((e, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm">{e.nom}</span>
                          <Badge variant="outline" className="text-xs">{e.duree}</Badge>
                        </div>
                        <p className="text-xs text-gray-600">{e.benefices}</p>
                        {e.precautions && (
                          <p className="text-xs text-amber-600 mt-1">⚠️ {e.precautions}</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* À éviter */}
              {conseils.activite_physique.exercices_eviter?.length > 0 && (
                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-red-800">❌ À éviter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs text-red-700 space-y-1">
                      {conseils.activite_physique.exercices_eviter.map((e, i) => (
                        <li key={i}>• {e}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Signes d'arrêt */}
              {conseils.activite_physique.signes_arret?.length > 0 && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-amber-800">🛑 Arrêtez si vous ressentez</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-xs text-amber-700 space-y-1">
                      {conseils.activite_physique.signes_arret.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal IMC */}
      <BottomSheet
        isOpen={showIMCModal}
        onClose={() => setShowIMCModal(false)}
        title="Calculer votre IMC"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            L'IMC pré-grossesse permet de personnaliser vos conseils nutritionnels et de suivre votre prise de poids.
          </p>
          <div>
            <Label>Poids avant grossesse (kg)</Label>
            <Input
              type="number"
              value={poids}
              onChange={(e) => setPoids(e.target.value)}
              placeholder="Ex: 60"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Taille (cm)</Label>
            <Input
              type="number"
              value={taille}
              onChange={(e) => setTaille(e.target.value)}
              placeholder="Ex: 165"
              className="mt-1"
            />
          </div>
          <Button onClick={calculerIMC} disabled={!poids || !taille} className="w-full">
            Calculer
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}