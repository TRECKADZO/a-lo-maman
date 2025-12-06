import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Activity,
  Calendar as CalendarIcon,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

export default function SuiviTensionArterielle({ grossesse }) {
  const queryClient = useQueryClient();
  const [showAjouter, setShowAjouter] = useState(false);
  const [nouvelleTension, setNouvelleTension] = useState({
    date: new Date(),
    systolique: '',
    diastolique: '',
    notes: ''
  });

  // Extraire les tensions des consultations
  const tensions = (grossesse.consultations || [])
    .filter(c => c.tension_arterielle)
    .map(c => {
      const [systolique, diastolique] = c.tension_arterielle.split('/').map(Number);
      return {
        date: c.date,
        systolique,
        diastolique,
        semaine: c.semaine_grossesse,
        notes: c.notes
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const ajouterTensionMutation = useMutation({
    mutationFn: async () => {
      const consultations = grossesse.consultations || [];
      const tensionString = `${nouvelleTension.systolique}/${nouvelleTension.diastolique}`;
      
      consultations.push({
        date: format(nouvelleTension.date, 'yyyy-MM-dd'),
        tension_arterielle: tensionString,
        notes: nouvelleTension.notes,
        type: 'mesure_tension'
      });
      
      return base44.entities.SuiviGrossesse.update(grossesse.id, { consultations });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      setShowAjouter(false);
      setNouvelleTension({ date: new Date(), systolique: '', diastolique: '', notes: '' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    ajouterTensionMutation.mutate();
  };

  const analyserTension = (systolique, diastolique) => {
    if (systolique >= 140 || diastolique >= 90) {
      return { niveau: 'haute', couleur: 'red', message: '⚠️ Hypertension - Consultez rapidement' };
    } else if (systolique >= 130 || diastolique >= 85) {
      return { niveau: 'elevee', couleur: 'orange', message: '⚡ Légèrement élevée - Surveillez' };
    } else if (systolique < 90 || diastolique < 60) {
      return { niveau: 'basse', couleur: 'blue', message: '💙 Tension basse - Hydratez-vous' };
    } else {
      return { niveau: 'normale', couleur: 'green', message: '✅ Tension normale' };
    }
  };

  const derniereTension = tensions[tensions.length - 1];
  const analyse = derniereTension ? analyserTension(derniereTension.systolique, derniereTension.diastolique) : null;

  // Préparer les données pour le graphique
  const dataTension = tensions.map(t => ({
    date: format(new Date(t.date), 'dd/MM'),
    Systolique: t.systolique,
    Diastolique: t.diastolique,
    semaine: t.semaine
  }));

  return (
    <div className="space-y-6">
      {/* Dernière mesure */}
      {derniereTension && analyse && (
        <Card className={`shadow-lg border-l-4 border-l-${analyse.couleur}-500 bg-${analyse.couleur}-50`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Dernière tension mesurée</p>
                <p className="text-4xl font-bold text-gray-900">
                  {derniereTension.systolique}/{derniereTension.diastolique}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {format(new Date(derniereTension.date), 'dd MMMM yyyy', { locale: fr })}
                </p>
                <Badge className={`mt-3 bg-${analyse.couleur}-600`}>
                  {analyse.message}
                </Badge>
              </div>
              <Activity className={`w-16 h-16 text-${analyse.couleur}-200`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerte hypertension */}
      {analyse && analyse.niveau === 'haute' && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-red-900 mb-2">Attention : Hypertension détectée</h4>
                <p className="text-sm text-red-800 mb-3">
                  Votre tension artérielle est élevée. L'hypertension pendant la grossesse peut être dangereuse.
                </p>
                <ul className="text-sm text-red-800 space-y-1 mb-4">
                  <li>• Contactez immédiatement votre médecin ou sage-femme</li>
                  <li>• Reposez-vous et évitez le stress</li>
                  <li>• Limitez le sel dans votre alimentation</li>
                  <li>• Surveillez les maux de tête, vision floue, douleurs abdominales</li>
                </ul>
                <Button className="bg-red-600 hover:bg-red-700 w-full">
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Contacter un professionnel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphique */}
      {dataTension.length > 1 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Évolution de la tension artérielle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dataTension}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                
                {/* Lignes de référence */}
                <ReferenceLine y={140} stroke="red" strokeDasharray="3 3" label="Max systolique" />
                <ReferenceLine y={90} stroke="red" strokeDasharray="3 3" label="Max diastolique" />
                
                <Line type="monotone" dataKey="Systolique" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Diastolique" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-semibold text-sm mb-2">Valeurs normales pendant la grossesse :</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Systolique (max) :</p>
                  <p className="font-semibold text-blue-600">{"<"} 140 mmHg</p>
                </div>
                <div>
                  <p className="text-gray-600">Diastolique (min) :</p>
                  <p className="font-semibold text-green-600">{"<"} 90 mmHg</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire d'ajout */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Mesures de tension</CardTitle>
            <Button onClick={() => setShowAjouter(!showAjouter)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une mesure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAjouter && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-blue-50 rounded-lg space-y-4">
              <div>
                <Label>Date de la mesure</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {format(nouvelleTension.date, 'dd MMMM yyyy', { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={nouvelleTension.date}
                      onSelect={(date) => setNouvelleTension({ ...nouvelleTension, date })}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Systolique (mmHg) *</Label>
                  <Input
                    type="number"
                    value={nouvelleTension.systolique}
                    onChange={(e) => setNouvelleTension({ ...nouvelleTension, systolique: e.target.value })}
                    placeholder="Ex: 120"
                    required
                  />
                </div>
                <div>
                  <Label>Diastolique (mmHg) *</Label>
                  <Input
                    type="number"
                    value={nouvelleTension.diastolique}
                    onChange={(e) => setNouvelleTension({ ...nouvelleTension, diastolique: e.target.value })}
                    placeholder="Ex: 80"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Notes (optionnel)</Label>
                <Textarea
                  value={nouvelleTension.notes}
                  onChange={(e) => setNouvelleTension({ ...nouvelleTension, notes: e.target.value })}
                  placeholder="Observations, contexte de la mesure..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAjouter(false)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={!nouvelleTension.systolique || !nouvelleTension.diastolique || ajouterTensionMutation.isPending}
                  className="flex-1"
                >
                  {ajouterTensionMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" />Enregistrer</>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Historique */}
          <div>
            <h4 className="font-semibold mb-3">Historique des mesures</h4>
            {tensions.length > 0 ? (
              <div className="space-y-2">
                {tensions.slice().reverse().slice(0, 5).map((t, i) => {
                  const analyse = analyserTension(t.systolique, t.diastolique);
                  return (
                    <div key={i} className={`p-3 bg-${analyse.couleur}-50 border border-${analyse.couleur}-200 rounded-lg`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg text-gray-900">
                            {t.systolique}/{t.diastolique} mmHg
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(t.date), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                          {t.semaine && (
                            <p className="text-xs text-gray-500">Semaine {t.semaine}</p>
                          )}
                          {t.notes && (
                            <p className="text-sm text-gray-700 mt-2">{t.notes}</p>
                          )}
                        </div>
                        <Badge className={`bg-${analyse.couleur}-600`}>
                          {analyse.niveau}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Aucune mesure enregistrée</p>
                <Button variant="outline" onClick={() => setShowAjouter(true)}>
                  Ajouter la première mesure
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <CheckCircle className="w-5 h-5" />
            Recommandations pour la tension
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-blue-600">•</span>
              <span className="text-gray-700">
                <strong>Mesurez régulièrement :</strong> Idéalement 1-2 fois par semaine au 3ème trimestre
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600">•</span>
              <span className="text-gray-700">
                <strong>Conditions de mesure :</strong> Au repos, assise, après 5 minutes de calme
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600">•</span>
              <span className="text-gray-700">
                <strong>Alimentation :</strong> Limitez le sel, hydratez-vous bien
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600">•</span>
              <span className="text-gray-700">
                <strong>Signes d'alerte :</strong> Maux de tête, vision floue, douleurs abdominales → Consultez immédiatement
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}