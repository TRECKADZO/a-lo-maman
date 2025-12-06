import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, 
  Plus, 
  Calendar, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ConsultationsPrenatales({ grossesse, semainesGrossesse }) {
  const [showAjouter, setShowAjouter] = useState(false);
  const queryClient = useQueryClient();

  const [nouvelleConsultation, setNouvelleConsultation] = useState({
    date: new Date().toISOString().split('T')[0],
    semaine_grossesse: semainesGrossesse,
    poids: "",
    tension_arterielle: "",
    hauteur_uterine: "",
    notes: "",
    professionnel: "",
    lieu: ""
  });

  const consultationsRecommandees = [
    { semaine: 8, titre: "1ère consultation obligatoire", description: "Examen clinique complet, prescriptions analyses" },
    { semaine: 12, titre: "Échographie de datation", description: "Confirmer la date de grossesse, dépistage trisomie 21" },
    { semaine: 16, titre: "2ème consultation", description: "Suivi de la croissance, examens biologiques" },
    { semaine: 20, titre: "Échographie morphologique", description: "Examen détaillé des organes du bébé" },
    { semaine: 24, titre: "3ème consultation", description: "Dépistage diabète gestationnel" },
    { semaine: 28, titre: "4ème consultation", description: "Injection anti-D si rhésus négatif, vaccin coqueluche" },
    { semaine: 32, titre: "Échographie de croissance", description: "Vérifier position et croissance du bébé" },
    { semaine: 36, titre: "5ème consultation", description: "Préparation à l'accouchement, prélèvement vaginal" },
    { semaine: 39, titre: "Consultation du terme", description: "Surveillance, déclenchement si nécessaire" }
  ];

  const ajouterConsultationMutation = useMutation({
    mutationFn: async (data) => {
      const consultations = [...(grossesse.consultations || []), data];
      return base44.entities.SuiviGrossesse.update(grossesse.id, { consultations });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      setShowAjouter(false);
      setNouvelleConsultation({
        date: new Date().toISOString().split('T')[0],
        semaine_grossesse: semainesGrossesse,
        poids: "",
        tension_arterielle: "",
        hauteur_uterine: "",
        notes: "",
        professionnel: "",
        lieu: ""
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSend = { ...nouvelleConsultation };
    if (dataToSend.poids) dataToSend.poids = parseFloat(dataToSend.poids);
    if (dataToSend.hauteur_uterine) dataToSend.hauteur_uterine = parseFloat(dataToSend.hauteur_uterine);
    ajouterConsultationMutation.mutate(dataToSend);
  };

  const consultationsFaites = grossesse.consultations || [];
  const prochainesConsultations = consultationsRecommandees.filter(
    c => c.semaine > semainesGrossesse
  );

  return (
    <div className="space-y-6">
      {/* Prochaines consultations recommandées */}
      <Card className="shadow-lg border-l-4 border-l-teal-500">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              Prochaines consultations recommandées
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {prochainesConsultations.length > 0 ? (
            <div className="space-y-3">
              {prochainesConsultations.slice(0, 3).map((consult, index) => (
                <div 
                  key={index}
                  className="p-4 bg-teal-50 rounded-lg border border-teal-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-teal-900">{consult.titre}</p>
                      <p className="text-sm text-teal-700">Semaine {consult.semaine}</p>
                    </div>
                    <Badge className="bg-teal-600 text-white">
                      Dans {consult.semaine - semainesGrossesse} sem.
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{consult.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              Vous avez effectué toutes les consultations recommandées ! 🎉
            </p>
          )}
        </CardContent>
      </Card>

      {/* Historique des consultations */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Mes consultations ({consultationsFaites.length})
            </CardTitle>
            <Button 
              onClick={() => setShowAjouter(!showAjouter)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAjouter && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-blue-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={nouvelleConsultation.date}
                    onChange={(e) => setNouvelleConsultation({...nouvelleConsultation, date: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semaine">Semaine de grossesse *</Label>
                  <Input
                    id="semaine"
                    type="number"
                    value={nouvelleConsultation.semaine_grossesse}
                    onChange={(e) => setNouvelleConsultation({...nouvelleConsultation, semaine_grossesse: parseInt(e.target.value)})}
                    required
                    min="1"
                    max="42"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poids">Poids (kg)</Label>
                  <Input
                    id="poids"
                    type="number"
                    step="0.1"
                    value={nouvelleConsultation.poids}
                    onChange={(e) => setNouvelleConsultation({...nouvelleConsultation, poids: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tension">Tension artérielle</Label>
                  <Input
                    id="tension"
                    placeholder="12/8"
                    value={nouvelleConsultation.tension_arterielle}
                    onChange={(e) => setNouvelleConsultation({...nouvelleConsultation, tension_arterielle: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hauteur">Hauteur utérine (cm)</Label>
                  <Input
                    id="hauteur"
                    type="number"
                    value={nouvelleConsultation.hauteur_uterine}
                    onChange={(e) => setNouvelleConsultation({...nouvelleConsultation, hauteur_uterine: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professionnel">Professionnel</Label>
                  <Input
                    id="professionnel"
                    placeholder="Dr. Nom"
                    value={nouvelleConsultation.professionnel}
                    onChange={(e) => setNouvelleConsultation({...nouvelleConsultation, professionnel: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lieu">Lieu</Label>
                <Input
                  id="lieu"
                  placeholder="Hôpital, clinique..."
                  value={nouvelleConsultation.lieu}
                  onChange={(e) => setNouvelleConsultation({...nouvelleConsultation, lieu: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={nouvelleConsultation.notes}
                  onChange={(e) => setNouvelleConsultation({...nouvelleConsultation, notes: e.target.value})}
                  rows={3}
                  placeholder="Observations, recommandations..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowAjouter(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Enregistrer
                </Button>
              </div>
            </form>
          )}

          {consultationsFaites.length > 0 ? (
            <div className="space-y-4">
              {consultationsFaites
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((consult, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">
                          Consultation - Semaine {consult.semaine_grossesse}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(consult.date), "dd MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {consult.poids && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-700">Poids: {consult.poids} kg</span>
                        </div>
                      )}
                      {consult.tension_arterielle && (
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-red-600" />
                          <span className="text-gray-700">TA: {consult.tension_arterielle}</span>
                        </div>
                      )}
                      {consult.hauteur_uterine && (
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">HU: {consult.hauteur_uterine} cm</span>
                        </div>
                      )}
                    </div>

                    {consult.professionnel && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Par:</strong> {consult.professionnel}
                        {consult.lieu && ` - ${consult.lieu}`}
                      </p>
                    )}

                    {consult.notes && (
                      <p className="text-sm text-gray-700 mt-2 p-2 bg-white rounded">
                        {consult.notes}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Aucune consultation enregistrée</p>
              <Button 
                onClick={() => setShowAjouter(true)}
                variant="outline"
              >
                Ajouter ma première consultation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}