import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Plus, Sparkles, Loader2, Activity, Frown, Smile, Meh, AlertCircle, CheckCircle2
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BottomSheet } from '@/components/ui/safe-area-view';
import { Touchable } from '@/components/ui/native-interactions';

const SYMPTOMES_COURANTS = [
  { id: 'nausees', label: 'Nausées', icon: '🤢', category: 'digestif' },
  { id: 'vomissements', label: 'Vomissements', icon: '🤮', category: 'digestif' },
  { id: 'fatigue', label: 'Fatigue', icon: '😴', category: 'general' },
  { id: 'maux_tete', label: 'Maux de tête', icon: '🤕', category: 'douleur' },
  { id: 'vertiges', label: 'Vertiges', icon: '😵', category: 'general' },
  { id: 'douleurs_dos', label: 'Douleurs de dos', icon: '💆', category: 'douleur' },
  { id: 'brulures_estomac', label: 'Brûlures d\'estomac', icon: '🔥', category: 'digestif' },
  { id: 'constipation', label: 'Constipation', icon: '😣', category: 'digestif' },
  { id: 'insomnie', label: 'Insomnie', icon: '🌙', category: 'sommeil' },
  { id: 'crampes', label: 'Crampes', icon: '⚡', category: 'douleur' },
  { id: 'oedemes', label: 'Œdèmes', icon: '🦶', category: 'general' },
  { id: 'contractions', label: 'Contractions', icon: '💫', category: 'uterus' },
  { id: 'saignements', label: 'Saignements', icon: '🩸', category: 'urgent' },
  { id: 'douleurs_pelviennes', label: 'Douleurs pelviennes', icon: '😖', category: 'douleur' },
  { id: 'essoufflement', label: 'Essoufflement', icon: '😮‍💨', category: 'respiratoire' },
  { id: 'humeur', label: 'Changements d\'humeur', icon: '😢', category: 'emotionnel' },
];

const HUMEURS = [
  { value: 1, label: 'Très mal', icon: Frown, color: 'text-red-500' },
  { value: 2, label: 'Mal', icon: Frown, color: 'text-orange-500' },
  { value: 3, label: 'Neutre', icon: Meh, color: 'text-yellow-500' },
  { value: 4, label: 'Bien', icon: Smile, color: 'text-lime-500' },
  { value: 5, label: 'Très bien', icon: Smile, color: 'text-green-500' },
];

export default function JournalSymptomes({ grossesse, semainesGrossesse }) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnalyse, setShowAnalyse] = useState(false);
  const [selectedSymptomes, setSelectedSymptomes] = useState([]);
  const [humeur, setHumeur] = useState(3);
  const [energie, setEnergie] = useState(50);
  const [sommeil, setSommeil] = useState(50);
  const [notes, setNotes] = useState('');
  const [analyseIA, setAnalyseIA] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const journal = grossesse?.symptomes_journal || [];
  const today = new Date().toISOString().split('T')[0];
  const entreeAujourdhui = journal.find(e => e.date === today);

  // Symptômes des 7 derniers jours
  const symptomes7jours = journal.filter(e => {
    const diff = differenceInDays(new Date(), new Date(e.date));
    return diff <= 7;
  });

  const toggleSymptome = (id) => {
    setSelectedSymptomes(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entree = {
        date: today,
        symptomes: selectedSymptomes,
        humeur,
        energie,
        sommeil,
        notes,
        semaine: semainesGrossesse
      };

      const newJournal = [...journal.filter(e => e.date !== today), entree];
      
      return base44.entities.SuiviGrossesse.update(grossesse.id, {
        symptomes_journal: newJournal
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      setShowAddModal(false);
      resetForm();
    }
  });

  const analyzeSymptoms = async () => {
    setAnalyzing(true);
    try {
      const symptomesRecents = symptomes7jours.flatMap(e => e.symptomes || []);
      const symptomesUniques = [...new Set(symptomesRecents)];
      const humeursRecentes = symptomes7jours.map(e => e.humeur).filter(Boolean);
      const moyenneHumeur = humeursRecentes.length > 0 
        ? humeursRecentes.reduce((a, b) => a + b, 0) / humeursRecentes.length 
        : 3;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un assistant médical spécialisé en suivi de grossesse. Analyse ces symptômes et fournis des conseils personnalisés.

CONTEXTE:
- Semaine de grossesse: ${semainesGrossesse} SA
- Trimestre: ${semainesGrossesse < 14 ? 1 : semainesGrossesse < 28 ? 2 : 3}

SYMPTÔMES DES 7 DERNIERS JOURS:
${symptomesUniques.map(s => `- ${SYMPTOMES_COURANTS.find(sc => sc.id === s)?.label || s}`).join('\n')}

HUMEUR MOYENNE: ${moyenneHumeur.toFixed(1)}/5

ENTRÉES DÉTAILLÉES:
${symptomes7jours.map(e => `${e.date}: ${e.symptomes?.length || 0} symptômes, humeur ${e.humeur}/5, énergie ${e.energie}%`).join('\n')}

Fournis une analyse bienveillante et des conseils pratiques adaptés au contexte ivoirien.`,
        response_json_schema: {
          type: 'object',
          properties: {
            resume: { type: 'string', description: 'Résumé de l\'état général' },
            symptomes_normaux: { type: 'array', items: { type: 'string' }, description: 'Symptômes considérés normaux pour ce stade' },
            points_attention: { type: 'array', items: { type: 'object', properties: { symptome: { type: 'string' }, conseil: { type: 'string' }, urgence: { type: 'string', enum: ['faible', 'moyenne', 'elevee'] } } } },
            conseils_bien_etre: { type: 'array', items: { type: 'string' } },
            quand_consulter: { type: 'string' },
            tendance: { type: 'string', enum: ['amelioration', 'stable', 'deterioration'] }
          }
        }
      });

      setAnalyseIA(response);
      setShowAnalyse(true);
    } catch (error) {
      console.error('Erreur analyse:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const resetForm = () => {
    setSelectedSymptomes([]);
    setHumeur(3);
    setEnergie(50);
    setSommeil(50);
    setNotes('');
  };

  // Fréquence des symptômes
  const frequenceSymptomes = SYMPTOMES_COURANTS.map(s => ({
    ...s,
    count: symptomes7jours.filter(e => e.symptomes?.includes(s.id)).length
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      {/* Carte principale */}
      <Card className="shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-4">
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Journal de symptômes
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={analyzeSymptoms}
                disabled={analyzing || symptomes7jours.length === 0}
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                Analyser
              </Button>
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Statut aujourd'hui */}
          {entreeAujourdhui ? (
            <div className="p-4 bg-green-50 rounded-xl mb-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Entrée d'aujourd'hui enregistrée</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {entreeAujourdhui.symptomes?.slice(0, 3).map(s => (
                  <Badge key={s} variant="outline" className="text-xs">
                    {SYMPTOMES_COURANTS.find(sc => sc.id === s)?.icon} {SYMPTOMES_COURANTS.find(sc => sc.id === s)?.label}
                  </Badge>
                ))}
                {entreeAujourdhui.symptomes?.length > 3 && (
                  <Badge variant="outline" className="text-xs">+{entreeAujourdhui.symptomes.length - 3}</Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl mb-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-5 h-5" />
                <span>N'oubliez pas d'enregistrer vos symptômes aujourd'hui</span>
              </div>
            </div>
          )}

          {/* Symptômes fréquents cette semaine */}
          {frequenceSymptomes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Cette semaine</h4>
              <div className="space-y-2">
                {frequenceSymptomes.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="text-lg">{s.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span>{s.label}</span>
                        <span className="text-gray-500">{s.count} jour(s)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: `${(s.count / 7) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historique récent */}
          {journal.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Historique récent</h4>
              <div className="space-y-2">
                {[...journal].reverse().slice(0, 5).map((entree, i) => {
                  const HumeurIcon = HUMEURS.find(h => h.value === entree.humeur)?.icon || Meh;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">
                            {format(new Date(entree.date), 'dd', { locale: fr })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(entree.date), 'MMM', { locale: fr })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {entree.symptomes?.length || 0} symptôme(s)
                          </p>
                          <p className="text-xs text-gray-500">SA {entree.semaine}</p>
                        </div>
                      </div>
                      <HumeurIcon className={`w-5 h-5 ${HUMEURS.find(h => h.value === entree.humeur)?.color}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal ajout */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="Comment vous sentez-vous ?"
        fullHeight
      >
        <div className="flex flex-col h-full">
          {/* Bouton sticky en haut */}
          <div className="p-4 border-b bg-white sticky top-0 z-10">
            {selectedSymptomes.length > 0 && (
              <p className="text-sm text-purple-700 mb-2 text-center font-medium">
                {selectedSymptomes.length} symptôme(s) sélectionné(s)
              </p>
            )}
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Enregistrer mon état
                </>
              )}
            </Button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto flex-1 pb-8">
            {/* Humeur */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Humeur générale</label>
              <div className="flex justify-between">
                {HUMEURS.map(h => {
                  const Icon = h.icon;
                  return (
                    <Touchable
                      key={h.value}
                      onPress={() => setHumeur(h.value)}
                      className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                        humeur === h.value ? 'bg-purple-100 scale-110' : 'bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${humeur === h.value ? h.color : 'text-gray-400'}`} />
                      <span className="text-xs mt-1">{h.label}</span>
                    </Touchable>
                  );
                })}
              </div>
            </div>

            {/* Énergie */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Niveau d'énergie</label>
                <span className="text-sm text-purple-600">{energie}%</span>
              </div>
              <Slider
                value={[energie]}
                onValueChange={([v]) => setEnergie(v)}
                max={100}
                step={10}
                className="w-full"
              />
            </div>

            {/* Qualité sommeil */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Qualité du sommeil</label>
                <span className="text-sm text-purple-600">{sommeil}%</span>
              </div>
              <Slider
                value={[sommeil]}
                onValueChange={([v]) => setSommeil(v)}
                max={100}
                step={10}
                className="w-full"
              />
            </div>

            {/* Symptômes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Symptômes ressentis
              </label>
              <div className="grid grid-cols-1 gap-2">
                {SYMPTOMES_COURANTS.map(s => (
                  <Touchable
                    key={s.id}
                    onPress={() => toggleSymptome(s.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      selectedSymptomes.includes(s.id) 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200'
                    } ${s.category === 'urgent' ? 'border-red-200' : ''}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedSymptomes.includes(s.id) ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                    }`}>
                      {selectedSymptomes.includes(s.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-lg">{s.icon}</span>
                    <span className={`text-sm font-medium ${s.category === 'urgent' ? 'text-red-600' : ''}`}>
                      {s.label}
                    </span>
                  </Touchable>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Notes (optionnel)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Autres observations..."
                rows={2}
              />
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Modal analyse IA */}
      <BottomSheet
        isOpen={showAnalyse}
        onClose={() => setShowAnalyse(false)}
        title="Analyse IA de vos symptômes"
        fullHeight
      >
        {analyseIA && (
          <div className="p-6 space-y-4">
            {/* Résumé */}
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold text-purple-800">Résumé</span>
                  {analyseIA.tendance && (
                    <Badge className={`ml-auto ${
                      analyseIA.tendance === 'amelioration' ? 'bg-green-100 text-green-800' :
                      analyseIA.tendance === 'deterioration' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {analyseIA.tendance === 'amelioration' ? '📈 Amélioration' :
                       analyseIA.tendance === 'deterioration' ? '📉 À surveiller' : '➡️ Stable'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-purple-900">{analyseIA.resume}</p>
              </CardContent>
            </Card>

            {/* Symptômes normaux */}
            {analyseIA.symptomes_normaux?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Symptômes normaux à ce stade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analyseIA.symptomes_normaux.map((s, i) => (
                      <Badge key={i} className="bg-green-100 text-green-800">{s}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Points d'attention */}
            {analyseIA.points_attention?.length > 0 && (
              <Card className="border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                    <AlertCircle className="w-4 h-4" />
                    Points d'attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analyseIA.points_attention.map((p, i) => (
                    <div key={i} className={`p-3 rounded-lg ${
                      p.urgence === 'elevee' ? 'bg-red-50 border border-red-200' :
                      p.urgence === 'moyenne' ? 'bg-amber-50 border border-amber-200' :
                      'bg-gray-50'
                    }`}>
                      <p className="font-medium text-sm">{p.symptome}</p>
                      <p className="text-xs text-gray-600 mt-1">{p.conseil}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Conseils */}
            {analyseIA.conseils_bien_etre?.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-800">💡 Conseils bien-être</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analyseIA.conseils_bien_etre.map((c, i) => (
                      <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                        <span>•</span>{c}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Quand consulter */}
            {analyseIA.quand_consulter && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-red-800 mb-1">🏥 Quand consulter</p>
                  <p className="text-sm text-red-700">{analyseIA.quand_consulter}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}