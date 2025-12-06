import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Calendar, Activity, TrendingUp, Baby, Weight, Footprints } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function JournalGrossesse({ grossesse, semainesGrossesse }) {
  const [showAjouter, setShowAjouter] = useState(false);
  const [activeTab, setActiveTab] = useState("symptomes");
  const queryClient = useQueryClient();

  const [nouvelleEntree, setNouvelleEntree] = useState({
    date: new Date().toISOString().split('T')[0],
    symptomes: [],
    notes: "",
    poids: "",
    mouvements_count: ""
  });

  const [nouveauSymptome, setNouveauSymptome] = useState("");

  const symptomesCommuns = [
    "Nausées", "Fatigue", "Douleurs dorsales", "Brûlures d'estomac",
    "Contractions", "Mouvements du bébé", "Insomnie", "Jambes lourdes",
    "Crampes", "Maux de tête", "Vertiges", "Constipation"
  ];

  const ajouterSymptome = (symptome) => {
    if (!nouvelleEntree.symptomes.includes(symptome)) {
      setNouvelleEntree({
        ...nouvelleEntree,
        symptomes: [...nouvelleEntree.symptomes, symptome]
      });
    }
  };

  const retirerSymptome = (symptome) => {
    setNouvelleEntree({
      ...nouvelleEntree,
      symptomes: nouvelleEntree.symptomes.filter(s => s !== symptome)
    });
  };

  const ajouterEntreeMutation = useMutation({
    mutationFn: async (data) => {
      const journal = [...(grossesse.symptomes_journal || []), data];
      
      // Ajouter aussi le poids aux consultations si fourni
      let updates = { symptomes_journal: journal };
      
      if (data.poids) {
        const consultations = [...(grossesse.consultations || [])];
        const existingConsult = consultations.find(c => c.date === data.date);
        
        if (existingConsult) {
          existingConsult.poids = parseFloat(data.poids);
        } else {
          consultations.push({
            date: data.date,
            semaine_grossesse: semainesGrossesse,
            poids: parseFloat(data.poids),
            notes: "Pesée personnelle"
          });
        }
        updates.consultations = consultations;
      }

      // Ajouter les mouvements du bébé
      if (data.mouvements_count) {
        const mouvements = [...(grossesse.mouvements_bebe || [])];
        mouvements.push({
          date: new Date(data.date).toISOString(),
          nombre_mouvements: parseInt(data.mouvements_count),
          notes: data.notes || ""
        });
        updates.mouvements_bebe = mouvements;
      }

      return base44.entities.SuiviGrossesse.update(grossesse.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      setShowAjouter(false);
      setNouvelleEntree({
        date: new Date().toISOString().split('T')[0],
        symptomes: [],
        notes: "",
        poids: "",
        mouvements_count: ""
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    ajouterEntreeMutation.mutate(nouvelleEntree);
  };

  const entries = (grossesse.symptomes_journal || []).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Préparer les données pour le graphique de poids
  const poidsData = (grossesse.consultations || [])
    .filter(c => c.poids)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(c => ({
      date: format(new Date(c.date), 'dd/MM', { locale: fr }),
      poids: c.poids,
      semaine: c.semaine_grossesse
    }));

  // Statistiques des mouvements du bébé (dernière semaine)
  const mouvementsRecents = (grossesse.mouvements_bebe || [])
    .filter(m => {
      const dateM = new Date(m.date);
      const aujourdhui = new Date();
      const diffJours = Math.floor((aujourdhui - dateM) / (1000 * 60 * 60 * 24));
      return diffJours <= 7;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const moyenneMouvements = mouvementsRecents.length > 0
    ? Math.round(mouvementsRecents.reduce((sum, m) => sum + m.nombre_mouvements, 0) / mouvementsRecents.length)
    : 0;

  // Insights personnalisés
  const getInsights = () => {
    const insights = [];

    // Insight sur le poids
    if (poidsData.length >= 2) {
      const dernierPoids = poidsData[poidsData.length - 1].poids;
      const avantDernierPoids = poidsData[poidsData.length - 2].poids;
      const gainPoids = (dernierPoids - avantDernierPoids).toFixed(1);
      
      insights.push({
        type: gainPoids > 0 ? "info" : "warning",
        icon: Weight,
        title: "Évolution du poids",
        message: `${gainPoids > 0 ? '+' : ''}${gainPoids} kg depuis la dernière pesée. Une prise de poids de 0.3-0.5 kg/semaine est normale au 2ème et 3ème trimestre.`
      });
    }

    // Insight sur les mouvements
    if (semainesGrossesse >= 20) {
      if (mouvementsRecents.length === 0) {
        insights.push({
          type: "warning",
          icon: Baby,
          title: "Mouvements du bébé",
          message: "Pensez à noter les mouvements de votre bébé quotidiennement à partir de 28 SA. C'est un indicateur important de son bien-être."
        });
      } else if (moyenneMouvements < 10 && semainesGrossesse >= 28) {
        insights.push({
          type: "alert",
          icon: Baby,
          title: "Mouvements du bébé",
          message: `Moyenne de ${moyenneMouvements} mouvements/jour cette semaine. Si vous ressentez une diminution notable, consultez rapidement.`
        });
      } else if (moyenneMouvements >= 10) {
        insights.push({
          type: "success",
          icon: Baby,
          title: "Mouvements du bébé",
          message: `Excellent ! Moyenne de ${moyenneMouvements} mouvements/jour. Votre bébé est actif.`
        });
      }
    }

    // Insight sur les symptômes fréquents
    const symptomesFrequents = {};
    entries.slice(0, 7).forEach(entry => {
      entry.symptomes?.forEach(s => {
        symptomesFrequents[s] = (symptomesFrequents[s] || 0) + 1;
      });
    });

    const symptomeLePlusFrequent = Object.entries(symptomesFrequents)
      .sort((a, b) => b[1] - a[1])[0];

    if (symptomeLePlusFrequent && symptomeLePlusFrequent[1] >= 3) {
      insights.push({
        type: "info",
        icon: Activity,
        title: "Symptôme fréquent",
        message: `Vous avez noté "${symptomeLePlusFrequent[0]}" ${symptomeLePlusFrequent[1]} fois cette semaine. Parlez-en à votre sage-femme si cela vous inquiète.`
      });
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <div className="space-y-6">
      {/* Insights personnalisés */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <Card 
              key={index} 
              className={`border-l-4 ${
                insight.type === 'success' ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' :
                insight.type === 'warning' ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                insight.type === 'alert' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' :
                'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <insight.icon className={`w-5 h-5 mt-1 ${
                    insight.type === 'success' ? 'text-green-600' :
                    insight.type === 'warning' ? 'text-orange-600' :
                    insight.type === 'alert' ? 'text-red-600' :
                    'text-blue-600'
                  }`} />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{insight.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Graphique de poids */}
      {poidsData.length > 1 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Évolution du poids
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={poidsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="poids" stroke="#9333ea" strokeWidth={2} name="Poids (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Formulaire d'ajout */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Mon Journal de Grossesse
            </CardTitle>
            <Button 
              onClick={() => setShowAjouter(!showAjouter)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle entrée
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAjouter && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="symptomes">Symptômes</TabsTrigger>
                  <TabsTrigger value="mesures">Mesures</TabsTrigger>
                  <TabsTrigger value="mouvements">Mouvements</TabsTrigger>
                </TabsList>

                <TabsContent value="symptomes" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_entree">Date *</Label>
                    <Input
                      id="date_entree"
                      type="date"
                      value={nouvelleEntree.date}
                      onChange={(e) => setNouvelleEntree({...nouvelleEntree, date: e.target.value})}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Symptômes ressentis</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {symptomesCommuns.map((symptome) => (
                        <button
                          key={symptome}
                          type="button"
                          onClick={() => 
                            nouvelleEntree.symptomes.includes(symptome)
                              ? retirerSymptome(symptome)
                              : ajouterSymptome(symptome)
                          }
                          className={`p-2 text-sm rounded-lg border-2 transition-all ${
                            nouvelleEntree.symptomes.includes(symptome)
                              ? 'bg-purple-100 border-purple-500 text-purple-800'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300'
                          }`}
                        >
                          {symptome}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Autre symptôme..."
                        value={nouveauSymptome}
                        onChange={(e) => setNouveauSymptome(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (nouveauSymptome.trim()) {
                              ajouterSymptome(nouveauSymptome.trim());
                              setNouveauSymptome("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (nouveauSymptome.trim()) {
                            ajouterSymptome(nouveauSymptome.trim());
                            setNouveauSymptome("");
                          }
                        }}
                      >
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="mesures" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="poids">Poids (kg)</Label>
                    <Input
                      id="poids"
                      type="number"
                      step="0.1"
                      value={nouvelleEntree.poids}
                      onChange={(e) => setNouvelleEntree({...nouvelleEntree, poids: e.target.value})}
                      placeholder="Ex: 65.5"
                    />
                    <p className="text-xs text-gray-500">
                      Pesez-vous de préférence le matin à jeun
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="mouvements" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mouvements">Nombre de mouvements</Label>
                    <Input
                      id="mouvements"
                      type="number"
                      value={nouvelleEntree.mouvements_count}
                      onChange={(e) => setNouvelleEntree({...nouvelleEntree, mouvements_count: e.target.value})}
                      placeholder="Ex: 15"
                    />
                    <p className="text-xs text-gray-500">
                      Comptez les mouvements sur une période de 2 heures après un repas
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="notes_journal">Notes</Label>
                <Textarea
                  id="notes_journal"
                  value={nouvelleEntree.notes}
                  onChange={(e) => setNouvelleEntree({...nouvelleEntree, notes: e.target.value})}
                  rows={4}
                  placeholder="Comment vous sentez-vous aujourd'hui ? Notez vos pensées, questions, ou observations..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowAjouter(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                  Enregistrer
                </Button>
              </div>
            </form>
          )}

          {/* Historique */}
          {entries.length > 0 ? (
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        {format(new Date(entry.date), "EEEE dd MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <Badge variant="outline">
                      Semaine {semainesGrossesse}
                    </Badge>
                  </div>

                  {entry.symptomes && entry.symptomes.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Symptômes:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {entry.symptomes.map((symptome, i) => (
                          <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                            {symptome}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.poids && (
                    <div className="mb-3 flex items-center gap-2 text-sm">
                      <Weight className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold">Poids:</span> {entry.poids} kg
                    </div>
                  )}

                  {entry.mouvements_count && (
                    <div className="mb-3 flex items-center gap-2 text-sm">
                      <Footprints className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold">Mouvements:</span> {entry.mouvements_count}
                    </div>
                  )}

                  {entry.notes && (
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Commencez votre journal de grossesse</p>
              <Button 
                onClick={() => setShowAjouter(true)}
                variant="outline"
              >
                Ajouter ma première entrée
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}