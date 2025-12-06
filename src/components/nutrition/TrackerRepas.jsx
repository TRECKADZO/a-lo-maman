import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Coffee, Sun, Moon, Cookie, Utensils, Loader2,
  Sparkles, TrendingUp, AlertTriangle, CheckCircle, Trash2, ChevronLeft, ChevronRight, Target
} from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BottomSheet } from '@/components/ui/safe-area-view';
import ScannerCodeBarre from './ScannerCodeBarre';

const TYPES_REPAS = [
  { id: 'petit_dejeuner', label: 'Petit-déjeuner', icon: Coffee, color: 'amber' },
  { id: 'dejeuner', label: 'Déjeuner', icon: Sun, color: 'orange' },
  { id: 'diner', label: 'Dîner', icon: Moon, color: 'indigo' },
  { id: 'collation', label: 'Collation', icon: Cookie, color: 'pink' },
];

const HUMEURS = [
  { value: 'tres_bien', label: '😊 Très bien', color: 'green' },
  { value: 'bien', label: '🙂 Bien', color: 'blue' },
  { value: 'moyen', label: '😐 Moyen', color: 'amber' },
  { value: 'mal', label: '😣 Mal', color: 'red' },
];

export default function TrackerRepas({ grossesse, trimestre, objectifsNutritionnels }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState('dejeuner');
  const [aliments, setAliments] = useState([]);
  const [notes, setNotes] = useState('');
  const [humeur, setHumeur] = useState('');
  const [nausees, setNausees] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const queryClient = useQueryClient();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: journalDuJour, isLoading } = useQuery({
    queryKey: ['journal_alimentaire', dateStr],
    queryFn: async () => {
      const entries = await base44.entities.JournalAlimentaire.filter({ date: dateStr });
      return entries;
    }
  });

  const { data: weekStats } = useQuery({
    queryKey: ['journal_stats_week', dateStr],
    queryFn: async () => {
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        last7Days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
      }
      
      const entries = await base44.entities.JournalAlimentaire.list('-date', 50);
      const weekEntries = entries.filter(e => last7Days.includes(e.date));
      
      const totaux = {
        calories: 0,
        proteines: 0,
        fer: 0,
        calcium: 0
      };

      weekEntries.forEach(entry => {
        if (entry.totaux) {
          totaux.calories += entry.totaux.calories || 0;
          totaux.proteines += entry.totaux.proteines || 0;
          totaux.fer += entry.totaux.fer || 0;
          totaux.calcium += entry.totaux.calcium || 0;
        }
      });

      return {
        moyenneCalories: Math.round(totaux.calories / 7),
        moyenneProteines: Math.round(totaux.proteines / 7),
        moyenneFer: Math.round(totaux.fer / 7 * 10) / 10,
        moyenneCalcium: Math.round(totaux.calcium / 7),
        nbRepasTrackes: weekEntries.length
      };
    }
  });

  const addMealMutation = useMutation({
    mutationFn: async () => {
      const totaux = {
        calories: aliments.reduce((sum, a) => sum + (a.calories || 0), 0),
        proteines: aliments.reduce((sum, a) => sum + (a.proteines || 0), 0),
        glucides: aliments.reduce((sum, a) => sum + (a.glucides || 0), 0),
        lipides: aliments.reduce((sum, a) => sum + (a.lipides || 0), 0),
        fer: aliments.reduce((sum, a) => sum + (a.fer || 0), 0),
        calcium: aliments.reduce((sum, a) => sum + (a.calcium || 0), 0),
        acide_folique: aliments.reduce((sum, a) => sum + (a.acide_folique || 0), 0)
      };

      await base44.entities.JournalAlimentaire.create({
        date: dateStr,
        type_repas: selectedType,
        aliments,
        notes,
        humeur,
        nausees,
        totaux
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal_alimentaire'] });
      setShowAddModal(false);
      resetForm();
    }
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.JournalAlimentaire.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal_alimentaire'] });
    }
  });

  const getFeedbackMutation = useMutation({
    mutationFn: async () => {
      const todayEntries = journalDuJour || [];
      const totalCalories = todayEntries.reduce((sum, e) => sum + (e.totaux?.calories || 0), 0);
      const totalProteines = todayEntries.reduce((sum, e) => sum + (e.totaux?.proteines || 0), 0);
      const totalFer = todayEntries.reduce((sum, e) => sum + (e.totaux?.fer || 0), 0);
      const totalCalcium = todayEntries.reduce((sum, e) => sum + (e.totaux?.calcium || 0), 0);

      const allAliments = todayEntries.flatMap(e => e.aliments || []);
      const nauseesCount = todayEntries.filter(e => e.nausees).length;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es nutritionniste spécialisée en grossesse. Analyse l'alimentation de la journée.

TRIMESTRE: ${trimestre}
OBJECTIFS JOURNALIERS:
- Calories: ${objectifsNutritionnels?.calories_jour || 2200} kcal
- Protéines: ${objectifsNutritionnels?.proteines_jour || 70} g
- Fer: ${objectifsNutritionnels?.fer_jour || 27} mg
- Calcium: ${objectifsNutritionnels?.calcium_jour || 1000} mg

CONSOMMATION DU JOUR:
- Calories: ${totalCalories} kcal
- Protéines: ${totalProteines} g
- Fer: ${totalFer} mg
- Calcium: ${totalCalcium} mg
- Aliments: ${allAliments.map(a => a.nom).join(', ')}
- Nausées signalées: ${nauseesCount} fois

Donne un feedback personnalisé et bienveillant avec des conseils concrets.`,
        response_json_schema: {
          type: 'object',
          properties: {
            score_global: { type: 'number', minimum: 0, maximum: 100 },
            verdict: { type: 'string', enum: ['excellent', 'bon', 'a_ameliorer', 'insuffisant'] },
            resume: { type: 'string' },
            points_positifs: { type: 'array', items: { type: 'string' } },
            ameliorations: { type: 'array', items: { type: 'string' } },
            suggestions_repas_suivant: { type: 'string' },
            conseil_anti_nausees: { type: 'string' }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setFeedback(data);
      setShowFeedback(true);
    }
  });

  const resetForm = () => {
    setAliments([]);
    setNotes('');
    setHumeur('');
    setNausees(false);
  };

  const handleProductScanned = (product) => {
    setAliments([...aliments, product]);
  };

  const addManualAliment = () => {
    setAliments([...aliments, {
      nom: '',
      quantite: '',
      calories: 0,
      proteines: 0,
      glucides: 0,
      lipides: 0,
      adapte_grossesse: true,
      alertes: []
    }]);
  };

  const updateAliment = (index, field, value) => {
    const updated = [...aliments];
    updated[index][field] = value;
    setAliments(updated);
  };

  const removeAliment = (index) => {
    setAliments(aliments.filter((_, i) => i !== index));
  };

  const getTotalDuJour = () => {
    if (!journalDuJour) return { calories: 0, proteines: 0, fer: 0, calcium: 0 };
    return {
      calories: journalDuJour.reduce((sum, e) => sum + (e.totaux?.calories || 0), 0),
      proteines: journalDuJour.reduce((sum, e) => sum + (e.totaux?.proteines || 0), 0),
      fer: journalDuJour.reduce((sum, e) => sum + (e.totaux?.fer || 0), 0),
      calcium: journalDuJour.reduce((sum, e) => sum + (e.totaux?.calcium || 0), 0)
    };
  };

  const totaux = getTotalDuJour();
  const objectifs = objectifsNutritionnels || { calories_jour: 2200, proteines_jour: 70, fer_jour: 27, calcium_jour: 1000 };

  const getTypeRepas = (type) => TYPES_REPAS.find(t => t.id === type);

  return (
    <div className="space-y-4">
      {/* Navigation date */}
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h3 className="font-bold text-lg">
                {format(selectedDate, 'EEEE', { locale: fr })}
              </h3>
              <p className="text-sm text-gray-500">
                {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              disabled={format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progression du jour */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Objectifs du jour
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => getFeedbackMutation.mutate()}
              disabled={getFeedbackMutation.isPending || !journalDuJour?.length}
              className="text-green-700 border-green-300"
            >
              {getFeedbackMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1" />
              )}
              Analyse IA
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Calories</span>
                <span className="font-medium">{totaux.calories} / {objectifs.calories_jour} kcal</span>
              </div>
              <Progress value={Math.min(100, (totaux.calories / objectifs.calories_jour) * 100)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Protéines</span>
                <span className="font-medium">{totaux.proteines} / {objectifs.proteines_jour} g</span>
              </div>
              <Progress value={Math.min(100, (totaux.proteines / objectifs.proteines_jour) * 100)} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-white rounded-lg text-center">
                <p className="text-xs text-gray-500">Fer</p>
                <p className="font-bold text-green-600">{totaux.fer}mg <span className="text-xs font-normal text-gray-400">/ {objectifs.fer_jour}</span></p>
              </div>
              <div className="p-2 bg-white rounded-lg text-center">
                <p className="text-xs text-gray-500">Calcium</p>
                <p className="font-bold text-cyan-600">{totaux.calcium}mg <span className="text-xs font-normal text-gray-400">/ {objectifs.calcium_jour}</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des repas du jour */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-800">Repas du jour</h4>
          <Button
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="bg-gradient-to-r from-green-500 to-emerald-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto" />
            </CardContent>
          </Card>
        ) : journalDuJour?.length > 0 ? (
          journalDuJour.map((entry) => {
            const typeInfo = getTypeRepas(entry.type_repas);
            const TypeIcon = typeInfo?.icon || Utensils;
            return (
              <Card key={entry.id} className={`border-l-4 border-l-${typeInfo?.color || 'gray'}-500`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-${typeInfo?.color || 'gray'}-100 rounded-xl flex items-center justify-center`}>
                        <TypeIcon className={`w-5 h-5 text-${typeInfo?.color || 'gray'}-600`} />
                      </div>
                      <div>
                        <h5 className="font-medium">{typeInfo?.label}</h5>
                        <p className="text-sm text-gray-500">
                          {entry.aliments?.length || 0} aliment(s) • {entry.totaux?.calories || 0} kcal
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMealMutation.mutate(entry.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {entry.aliments?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {entry.aliments.map((aliment, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className={aliment.adapte_grossesse === false ? 'border-red-300 text-red-700' : ''}
                        >
                          {aliment.nom}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {entry.nausees && (
                    <Badge className="mt-2 bg-amber-100 text-amber-700">
                      Nausées signalées
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun repas enregistré</p>
              <Button
                onClick={() => setShowAddModal(true)}
                variant="link"
                className="text-green-600 mt-2"
              >
                Ajouter mon premier repas
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats semaine */}
      {weekStats && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Moyenne sur 7 jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-blue-600">{weekStats.moyenneCalories}</p>
                <p className="text-xs text-gray-600">kcal/j</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">{weekStats.moyenneProteines}g</p>
                <p className="text-xs text-gray-600">protéines</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">{weekStats.moyenneFer}mg</p>
                <p className="text-xs text-gray-600">fer</p>
              </div>
              <div>
                <p className="text-lg font-bold text-cyan-600">{weekStats.moyenneCalcium}mg</p>
                <p className="text-xs text-gray-600">calcium</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal ajouter repas */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Ajouter un repas"
        fullHeight
      >
        <div className="flex flex-col h-full">
          {/* Bouton sticky en haut */}
          <div className="p-4 border-b bg-white sticky top-0 z-10">
            {aliments.length > 0 && (
              <p className="text-sm text-green-700 mb-2 text-center font-medium">
                {aliments.length} aliment(s) • {aliments.reduce((s, a) => s + (a.calories || 0), 0)} kcal
              </p>
            )}
            <Button
              onClick={() => addMealMutation.mutate()}
              disabled={aliments.length === 0 || addMealMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg"
            >
              {addMealMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {aliments.length > 0 ? 'Enregistrer le repas' : 'Ajoutez des aliments'}
                </>
              )}
            </Button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto flex-1 pb-8">
            {/* Type de repas */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Type de repas</label>
              <div className="grid grid-cols-4 gap-2">
                {TYPES_REPAS.map(type => (
                  <Button
                    key={type.id}
                    variant={selectedType === type.id ? 'default' : 'outline'}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex flex-col h-auto py-3 ${selectedType === type.id ? `bg-${type.color}-500` : ''}`}
                  >
                    <type.icon className="w-5 h-5 mb-1" />
                    <span className="text-xs">{type.label.split('-')[0]}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Scanner code-barre */}
            <ScannerCodeBarre
              onProductScanned={handleProductScanned}
              trimestre={trimestre}
              allergies={grossesse?.allergies || []}
            />

            {/* Aliments ajoutés */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Aliments</label>
                <Button variant="ghost" size="sm" onClick={addManualAliment}>
                  <Plus className="w-4 h-4 mr-1" />
                  Manuel
                </Button>
              </div>
              
              {aliments.length > 0 ? (
                <div className="space-y-2">
                  {aliments.map((aliment, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Input
                          value={aliment.nom}
                          onChange={(e) => updateAliment(index, 'nom', e.target.value)}
                          placeholder="Nom de l'aliment"
                          className="flex-1 mr-2"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAliment(index)}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Calories</label>
                          <Input
                            type="number"
                            value={aliment.calories}
                            onChange={(e) => updateAliment(index, 'calories', parseInt(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Protéines (g)</label>
                          <Input
                            type="number"
                            value={aliment.proteines}
                            onChange={(e) => updateAliment(index, 'proteines', parseInt(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Quantité</label>
                          <Input
                            value={aliment.quantite}
                            onChange={(e) => updateAliment(index, 'quantite', e.target.value)}
                            placeholder="100g"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      {aliment.alertes?.length > 0 && (
                        <div className="mt-2">
                          {aliment.alertes.map((alerte, i) => (
                            <Badge key={i} className="bg-amber-100 text-amber-700 mr-1 mb-1 text-xs">
                              ⚠️ {alerte}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4 text-sm">
                  Scannez un produit ou ajoutez manuellement
                </p>
              )}
            </div>

            {/* Humeur */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Comment vous sentez-vous ?</label>
              <Select value={humeur} onValueChange={setHumeur}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez..." />
                </SelectTrigger>
                <SelectContent>
                  {HUMEURS.map(h => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nausées */}
            <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={nausees}
                onChange={(e) => setNausees(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="text-sm">J'ai eu des nausées après ce repas</span>
            </label>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Notes (optionnel)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajoutez des notes sur ce repas..."
                rows={2}
              />
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Modal Feedback IA */}
      <BottomSheet
        isOpen={showFeedback && feedback}
        onClose={() => setShowFeedback(false)}
        title="Analyse de votre journée"
        fullHeight
      >
        {feedback && (
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Score */}
            <div className={`p-6 rounded-xl text-center ${
              feedback.verdict === 'excellent' ? 'bg-green-100' :
              feedback.verdict === 'bon' ? 'bg-blue-100' :
              feedback.verdict === 'a_ameliorer' ? 'bg-amber-100' :
              'bg-red-100'
            }`}>
              <div className="text-4xl font-bold mb-2">
                {feedback.score_global}/100
              </div>
              <Badge className={
                feedback.verdict === 'excellent' ? 'bg-green-500' :
                feedback.verdict === 'bon' ? 'bg-blue-500' :
                feedback.verdict === 'a_ameliorer' ? 'bg-amber-500' :
                'bg-red-500'
              }>
                {feedback.verdict === 'excellent' ? 'Excellent !' :
                 feedback.verdict === 'bon' ? 'Bon travail' :
                 feedback.verdict === 'a_ameliorer' ? 'À améliorer' :
                 'Insuffisant'}
              </Badge>
            </div>

            <p className="text-gray-700">{feedback.resume}</p>

            {/* Points positifs */}
            {feedback.points_positifs?.length > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Points positifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {feedback.points_positifs.map((point, i) => (
                      <li key={i} className="text-sm text-green-700">✓ {point}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Améliorations */}
            {feedback.ameliorations?.length > 0 && (
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    À améliorer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {feedback.ameliorations.map((point, i) => (
                      <li key={i} className="text-sm text-amber-700">• {point}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Suggestion prochain repas */}
            {feedback.suggestions_repas_suivant && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 text-sm">Pour votre prochain repas</p>
                      <p className="text-sm text-blue-700 mt-1">{feedback.suggestions_repas_suivant}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conseil anti-nausées */}
            {feedback.conseil_anti_nausees && (
              <Card className="bg-pink-50 border-pink-200">
                <CardContent className="p-4">
                  <p className="text-sm text-pink-800">
                    💡 {feedback.conseil_anti_nausees}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}