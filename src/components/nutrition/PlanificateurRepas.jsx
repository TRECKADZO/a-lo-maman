import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Calendar, Sparkles, Loader2, ChefHat, ShoppingCart,
  Sun, Coffee, Moon, Cookie, RefreshCw,
  Check, AlertTriangle, Utensils, Leaf
} from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BottomSheet } from '@/components/ui/safe-area-view';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const RESTRICTIONS_OPTIONS = [
  { id: 'vegetarien', label: 'Végétarien' },
  { id: 'vegan', label: 'Végétalien' },
  { id: 'halal', label: 'Halal' },
  { id: 'sans_gluten', label: 'Sans gluten' },
  { id: 'sans_lactose', label: 'Sans lactose' },
];

const SYMPTOMES_OPTIONS = [
  { id: 'nausees', label: 'Nausées matinales' },
  { id: 'brulures_estomac', label: 'Brûlures d\'estomac' },
  { id: 'constipation', label: 'Constipation' },
  { id: 'fatigue', label: 'Fatigue intense' },
  { id: 'envies', label: 'Envies spécifiques' },
];

export default function PlanificateurRepas({ grossesse, semainesGrossesse, trimestre, imc }) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [restrictions, setRestrictions] = useState([]);
  const [symptomes, setSymptomes] = useState([]);
  const [allergiesInput, setAllergiesInput] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const queryClient = useQueryClient();

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: planActuel, isLoading } = useQuery({
    queryKey: ['plan_repas', weekStart],
    queryFn: async () => {
      const plans = await base44.entities.PlanRepasHebdo.filter({ 
        semaine_debut: weekStart 
      });
      return plans[0] || null;
    }
  });

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      const allergies = allergiesInput.split(',').map(a => a.trim()).filter(Boolean);
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es une nutritionniste spécialisée en grossesse en Côte d'Ivoire. Crée un plan de repas hebdomadaire personnalisé.

PROFIL:
- Semaine de grossesse: ${semainesGrossesse} SA
- Trimestre: ${trimestre}
- IMC pré-grossesse: ${imc || 'non renseigné'}
- Restrictions alimentaires: ${restrictions.length > 0 ? restrictions.join(', ') : 'Aucune'}
- Allergies: ${allergies.length > 0 ? allergies.join(', ') : 'Aucune'}
- Symptômes actuels: ${symptomes.length > 0 ? symptomes.join(', ') : 'Aucun symptôme particulier'}

CONTRAINTES:
- Privilégie les aliments locaux ivoiriens (attiéké, placali, foutou, alloco, igname, manioc, poisson braisé, sauce graine, sauce arachide, etc.)
- Adapte les repas aux symptômes (ex: si nausées, repas légers le matin)
- Assure un apport suffisant en: fer, acide folique, calcium, protéines, fibres
- Varie les sources de protéines (poisson, viande, légumineuses, œufs)
- Inclus des collations saines
- Respecte les interdits de grossesse (poisson cru, fromage non pasteurisé, etc.)

Génère un plan pour 7 jours avec petit-déjeuner, déjeuner, dîner et collations.
Inclus une liste de courses organisée par catégorie.`,
        response_json_schema: {
          type: 'object',
          properties: {
            jours: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  jour: { type: 'string' },
                  petit_dejeuner: {
                    type: 'object',
                    properties: {
                      plat: { type: 'string' },
                      ingredients: { type: 'array', items: { type: 'string' } },
                      calories: { type: 'number' },
                      conseils: { type: 'string' }
                    }
                  },
                  dejeuner: {
                    type: 'object',
                    properties: {
                      plat: { type: 'string' },
                      ingredients: { type: 'array', items: { type: 'string' } },
                      calories: { type: 'number' },
                      conseils: { type: 'string' }
                    }
                  },
                  diner: {
                    type: 'object',
                    properties: {
                      plat: { type: 'string' },
                      ingredients: { type: 'array', items: { type: 'string' } },
                      calories: { type: 'number' },
                      conseils: { type: 'string' }
                    }
                  },
                  collations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        nom: { type: 'string' },
                        calories: { type: 'number' }
                      }
                    }
                  }
                }
              }
            },
            liste_courses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  categorie: { type: 'string' },
                  items: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            conseils_generaux: { type: 'string' },
            objectifs_nutritionnels: {
              type: 'object',
              properties: {
                calories_jour: { type: 'number' },
                proteines_jour: { type: 'number' },
                fer_jour: { type: 'number' },
                calcium_jour: { type: 'number' },
                acide_folique_jour: { type: 'number' }
              }
            }
          }
        }
      });

      // Sauvegarder le plan
      const planData = {
        semaine_debut: weekStart,
        semaine_grossesse: semainesGrossesse,
        trimestre,
        imc,
        preferences: [],
        allergies,
        restrictions,
        symptomes_actuels: symptomes,
        ...response
      };

      if (planActuel) {
        await base44.entities.PlanRepasHebdo.update(planActuel.id, planData);
      } else {
        await base44.entities.PlanRepasHebdo.create(planData);
      }

      return planData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan_repas'] });
      setShowConfigModal(false);
    }
  });

  const getMealIcon = (type) => {
    switch (type) {
      case 'petit_dejeuner': return <Coffee className="w-4 h-4 text-amber-500" />;
      case 'dejeuner': return <Sun className="w-4 h-4 text-orange-500" />;
      case 'diner': return <Moon className="w-4 h-4 text-indigo-500" />;
      case 'collation': return <Cookie className="w-4 h-4 text-pink-500" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  const toggleRestriction = (id) => {
    setRestrictions(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleSymptome = (id) => {
    setSymptomes(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du plan de repas...</p>
        </CardContent>
      </Card>
    );
  }

  if (!planActuel) {
    return (
      <>
        <Card className="shadow-xl border-none">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <ChefHat className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Plan de repas personnalisé
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Notre IA nutritionniste va créer un menu hebdomadaire adapté à votre grossesse, 
              vos préférences et avec des recettes ivoiriennes.
            </p>
            <Button
              onClick={() => setShowConfigModal(true)}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Créer mon plan de repas
            </Button>
          </CardContent>
        </Card>

        <BottomSheet
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          title="Personnaliser mon plan"
          fullHeight
        >
          <div className="flex flex-col h-full">
            {/* Bouton sticky en haut */}
            <div className="p-4 border-b bg-white sticky top-0 z-10">
              <Button
                onClick={() => generatePlanMutation.mutate()}
                disabled={generatePlanMutation.isPending}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg"
              >
                {generatePlanMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Générer mon plan de repas
                  </>
                )}
              </Button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 pb-8">
              {/* Restrictions */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-500" />
                  Régime alimentaire
                </h4>
                <div className="space-y-2">
                  {RESTRICTIONS_OPTIONS.map(opt => (
                    <label key={opt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                      <Checkbox
                        checked={restrictions.includes(opt.id)}
                        onCheckedChange={() => toggleRestriction(opt.id)}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Allergies alimentaires
                </h4>
                <Input
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  placeholder="Ex: arachides, fruits de mer, lait..."
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Séparez par des virgules</p>
              </div>

              {/* Symptômes */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-pink-500" />
                  Symptômes actuels
                </h4>
                <div className="space-y-2">
                  {SYMPTOMES_OPTIONS.map(opt => (
                    <label key={opt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                      <Checkbox
                        checked={symptomes.includes(opt.id)}
                        onCheckedChange={() => toggleSymptome(opt.id)}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-green-800">Plan de la semaine</h3>
                <p className="text-sm text-green-700">
                  Semaine du {format(new Date(planActuel.semaine_debut), 'dd MMMM', { locale: fr })}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfigModal(true)}
              className="border-green-300 text-green-700"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Régénérer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Objectifs nutritionnels */}
      {planActuel.objectifs_nutritionnels && (
        <div className="grid grid-cols-5 gap-2">
          <div className="p-2 bg-blue-50 rounded-lg text-center">
            <p className="text-sm font-bold text-blue-600">{planActuel.objectifs_nutritionnels.calories_jour}</p>
            <p className="text-[10px] text-gray-600">kcal/j</p>
          </div>
          <div className="p-2 bg-red-50 rounded-lg text-center">
            <p className="text-sm font-bold text-red-600">{planActuel.objectifs_nutritionnels.proteines_jour}g</p>
            <p className="text-[10px] text-gray-600">Protéines</p>
          </div>
          <div className="p-2 bg-green-50 rounded-lg text-center">
            <p className="text-sm font-bold text-green-600">{planActuel.objectifs_nutritionnels.fer_jour}mg</p>
            <p className="text-[10px] text-gray-600">Fer</p>
          </div>
          <div className="p-2 bg-cyan-50 rounded-lg text-center">
            <p className="text-sm font-bold text-cyan-600">{planActuel.objectifs_nutritionnels.calcium_jour}mg</p>
            <p className="text-[10px] text-gray-600">Calcium</p>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg text-center">
            <p className="text-sm font-bold text-purple-600">{planActuel.objectifs_nutritionnels.acide_folique_jour}µg</p>
            <p className="text-[10px] text-gray-600">Folates</p>
          </div>
        </div>
      )}

      {/* Tabs jours / courses */}
      <Tabs defaultValue="planning">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="planning">
            <Calendar className="w-4 h-4 mr-2" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="courses">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="space-y-3 mt-4">
          {/* Sélecteur de jours */}
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
            {planActuel.jours?.map((jour, idx) => (
              <Button
                key={jour.jour}
                variant={selectedDay === idx ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDay(idx)}
                className={`flex-shrink-0 ${selectedDay === idx ? 'bg-green-500' : ''}`}
              >
                {jour.jour.charAt(0).toUpperCase() + jour.jour.slice(1, 3)}
              </Button>
            ))}
          </div>

          {/* Détail du jour sélectionné */}
          {selectedDay !== null && planActuel.jours?.[selectedDay] && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800 capitalize">
                {planActuel.jours[selectedDay].jour}
              </h4>
              
              {/* Petit-déjeuner */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getMealIcon('petit_dejeuner')}
                    <span className="font-medium text-amber-800">Petit-déjeuner</span>
                    <Badge className="ml-auto bg-amber-100 text-amber-700">
                      {planActuel.jours[selectedDay].petit_dejeuner?.calories || 0} kcal
                    </Badge>
                  </div>
                  <p className="text-sm text-amber-900 font-medium">
                    {planActuel.jours[selectedDay].petit_dejeuner?.plat}
                  </p>
                  {planActuel.jours[selectedDay].petit_dejeuner?.conseils && (
                    <p className="text-xs text-amber-700 mt-2 italic">
                      💡 {planActuel.jours[selectedDay].petit_dejeuner.conseils}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Déjeuner */}
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getMealIcon('dejeuner')}
                    <span className="font-medium text-orange-800">Déjeuner</span>
                    <Badge className="ml-auto bg-orange-100 text-orange-700">
                      {planActuel.jours[selectedDay].dejeuner?.calories || 0} kcal
                    </Badge>
                  </div>
                  <p className="text-sm text-orange-900 font-medium">
                    {planActuel.jours[selectedDay].dejeuner?.plat}
                  </p>
                  {planActuel.jours[selectedDay].dejeuner?.ingredients?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {planActuel.jours[selectedDay].dejeuner.ingredients.slice(0, 4).map((ing, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{ing}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dîner */}
              <Card className="bg-indigo-50 border-indigo-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getMealIcon('diner')}
                    <span className="font-medium text-indigo-800">Dîner</span>
                    <Badge className="ml-auto bg-indigo-100 text-indigo-700">
                      {planActuel.jours[selectedDay].diner?.calories || 0} kcal
                    </Badge>
                  </div>
                  <p className="text-sm text-indigo-900 font-medium">
                    {planActuel.jours[selectedDay].diner?.plat}
                  </p>
                </CardContent>
              </Card>

              {/* Collations */}
              {planActuel.jours[selectedDay].collations?.length > 0 && (
                <Card className="bg-pink-50 border-pink-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getMealIcon('collation')}
                      <span className="font-medium text-pink-800">Collations</span>
                    </div>
                    <div className="space-y-1">
                      {planActuel.jours[selectedDay].collations.map((col, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-pink-900">{col.nom}</span>
                          <span className="text-pink-600">{col.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {selectedDay === null && (
            <p className="text-center text-gray-500 py-8">
              Sélectionnez un jour pour voir le menu détaillé
            </p>
          )}
        </TabsContent>

        <TabsContent value="courses" className="space-y-3 mt-4">
          {planActuel.liste_courses?.map((cat, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-green-500" />
                  {cat.categorie}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {cat.items?.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 border rounded flex items-center justify-center hover:bg-green-100 cursor-pointer">
                        <Check className="w-3 h-3 text-green-500 opacity-0 hover:opacity-100" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Conseils généraux */}
      {planActuel.conseils_generaux && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{planActuel.conseils_generaux}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal régénérer */}
      <BottomSheet
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Régénérer le plan"
        fullHeight
      >
        <div className="flex flex-col h-full">
          {/* Bouton sticky en haut */}
          <div className="p-4 border-b bg-white sticky top-0 z-10">
            <Button
              onClick={() => generatePlanMutation.mutate()}
              disabled={generatePlanMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg"
            >
              {generatePlanMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Régénération...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Régénérer le plan
                </>
              )}
            </Button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto flex-1 pb-8">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Régime alimentaire</h4>
              <div className="space-y-2">
                {RESTRICTIONS_OPTIONS.map(opt => (
                  <label key={opt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <Checkbox
                      checked={restrictions.includes(opt.id)}
                      onCheckedChange={() => toggleRestriction(opt.id)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Allergies</h4>
              <Input
                value={allergiesInput}
                onChange={(e) => setAllergiesInput(e.target.value)}
                placeholder="Ex: arachides, fruits de mer..."
              />
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Symptômes actuels</h4>
              <div className="space-y-2">
                {SYMPTOMES_OPTIONS.map(opt => (
                  <label key={opt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <Checkbox
                      checked={symptomes.includes(opt.id)}
                      onCheckedChange={() => toggleSymptome(opt.id)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}