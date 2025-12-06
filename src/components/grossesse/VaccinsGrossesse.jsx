import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Syringe, Plus, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function VaccinsGrossesse({ grossesse, semainesGrossesse }) {
  const [showAjouter, setShowAjouter] = useState(false);
  const queryClient = useQueryClient();

  const [nouveauVaccin, setNouveauVaccin] = useState({
    nom_vaccin: "",
    date_administration: new Date().toISOString().split('T')[0],
    lieu: ""
  });

  const vaccinsRecommandes = [
    {
      nom: "Vaccin contre la grippe",
      periode: "Tout au long de la grossesse",
      semaine_min: 0,
      semaine_max: 40,
      obligatoire: false,
      description: "Recommandé surtout en période épidémique"
    },
    {
      nom: "Vaccin dTcaP (diphtérie, tétanos, coqueluche)",
      periode: "Entre 20 et 36 semaines",
      semaine_min: 20,
      semaine_max: 36,
      obligatoire: true,
      description: "Protection du bébé contre la coqueluche"
    },
    {
      nom: "Vaccination COVID-19",
      periode: "Tout au long de la grossesse",
      semaine_min: 0,
      semaine_max: 40,
      obligatoire: false,
      description: "Recommandé pour protéger mère et bébé"
    }
  ];

  const ajouterVaccinMutation = useMutation({
    mutationFn: async (data) => {
      const vaccins = [...(grossesse.vaccins || []), data];
      return base44.entities.SuiviGrossesse.update(grossesse.id, { vaccins });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      setShowAjouter(false);
      setNouveauVaccin({
        nom_vaccin: "",
        date_administration: new Date().toISOString().split('T')[0],
        lieu: ""
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    ajouterVaccinMutation.mutate(nouveauVaccin);
  };

  const vaccinsRecus = grossesse.vaccins || [];
  const vaccinsAFaire = vaccinsRecommandes.filter(v => {
    const estDansPeriode = semainesGrossesse >= v.semaine_min && semainesGrossesse <= v.semaine_max;
    const dejaRecu = vaccinsRecus.some(vr => 
      vr.nom_vaccin.toLowerCase().includes(v.nom.toLowerCase().split(' ')[2] || v.nom.toLowerCase())
    );
    return estDansPeriode && !dejaRecu;
  });

  return (
    <div className="space-y-6">
      {/* Vaccins recommandés */}
      {vaccinsAFaire.length > 0 && (
        <Card className="shadow-lg border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="w-5 h-5" />
              Vaccins recommandés actuellement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vaccinsAFaire.map((vaccin, index) => (
                <div 
                  key={index}
                  className="p-4 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-orange-900">{vaccin.nom}</p>
                      <p className="text-sm text-orange-700">Période: {vaccin.periode}</p>
                    </div>
                    {vaccin.obligatoire && (
                      <Badge className="bg-orange-600 text-white">Recommandé</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{vaccin.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tous les vaccins recommandés */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Calendrier vaccinal de grossesse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vaccinsRecommandes.map((vaccin, index) => {
              const dejaRecu = vaccinsRecus.some(vr => 
                vr.nom_vaccin.toLowerCase().includes(vaccin.nom.toLowerCase().split(' ')[2] || vaccin.nom.toLowerCase())
              );

              return (
                <div 
                  key={index}
                  className={`p-4 rounded-lg ${dejaRecu ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800 flex items-center gap-2">
                        {vaccin.nom}
                        {dejaRecu && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </p>
                      <p className="text-sm text-gray-600">
                        {vaccin.periode}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {vaccin.description}
                      </p>
                    </div>
                    {vaccin.obligatoire && !dejaRecu && (
                      <Badge variant="outline" className="border-orange-300 text-orange-700">
                        Recommandé
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mes vaccins */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-green-600" />
              Mes vaccins ({vaccinsRecus.length})
            </CardTitle>
            <Button 
              onClick={() => setShowAjouter(!showAjouter)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAjouter && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-green-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom_vaccin">Nom du vaccin *</Label>
                  <Input
                    id="nom_vaccin"
                    value={nouveauVaccin.nom_vaccin}
                    onChange={(e) => setNouveauVaccin({...nouveauVaccin, nom_vaccin: e.target.value})}
                    required
                    placeholder="Ex: dTcaP, Grippe..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_admin">Date d'administration *</Label>
                  <Input
                    id="date_admin"
                    type="date"
                    value={nouveauVaccin.date_administration}
                    onChange={(e) => setNouveauVaccin({...nouveauVaccin, date_administration: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="lieu_vaccin">Lieu</Label>
                  <Input
                    id="lieu_vaccin"
                    value={nouveauVaccin.lieu}
                    onChange={(e) => setNouveauVaccin({...nouveauVaccin, lieu: e.target.value})}
                    placeholder="Hôpital, clinique, pharmacie..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowAjouter(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  Enregistrer
                </Button>
              </div>
            </form>
          )}

          {vaccinsRecus.length > 0 ? (
            <div className="space-y-3">
              {vaccinsRecus
                .sort((a, b) => new Date(b.date_administration) - new Date(a.date_administration))
                .map((vaccin, index) => (
                  <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-green-900 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          {vaccin.nom_vaccin}
                        </p>
                        <p className="text-sm text-green-700 flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(vaccin.date_administration), "dd MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    {vaccin.lieu && (
                      <p className="text-sm text-gray-600">Lieu: {vaccin.lieu}</p>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Aucun vaccin enregistré</p>
              <Button 
                onClick={() => setShowAjouter(true)}
                variant="outline"
              >
                Ajouter mon premier vaccin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}