import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Syringe, Calendar, CheckCircle, AlertCircle, Plus, Clock, Award } from "lucide-react";
import { format, differenceInDays, differenceInMonths } from "date-fns";
import { fr } from "date-fns/locale";
import AjouterVaccinModal from "./modals/AjouterVaccinModal";

// Calendrier vaccinal recommandé en Côte d'Ivoire (Programme Élargi de Vaccination)
const calendrierVaccinal = [
  { nom: 'BCG', age_mois: 0, description: 'Tuberculose' },
  { nom: 'Polio 0', age_mois: 0, description: 'Poliomyélite' },
  { nom: 'Pentavalent 1', age_mois: 2, description: 'Diphtérie, tétanos, coqueluche, hépatite B, Hib' },
  { nom: 'Polio 1', age_mois: 2, description: 'Poliomyélite' },
  { nom: 'Pneumocoque 1', age_mois: 2, description: 'Infections à pneumocoque' },
  { nom: 'Rotavirus 1', age_mois: 2, description: 'Gastro-entérites' },
  { nom: 'Pentavalent 2', age_mois: 3, description: 'Rappel' },
  { nom: 'Polio 2', age_mois: 3, description: 'Rappel' },
  { nom: 'Pneumocoque 2', age_mois: 3, description: 'Rappel' },
  { nom: 'Rotavirus 2', age_mois: 3, description: 'Rappel' },
  { nom: 'Pentavalent 3', age_mois: 4, description: 'Rappel' },
  { nom: 'Polio 3', age_mois: 4, description: 'Rappel' },
  { nom: 'Pneumocoque 3', age_mois: 4, description: 'Rappel' },
  { nom: 'VPI', age_mois: 4, description: 'Vaccin antipolio injectable' },
  { nom: 'Rougeole-Rubéole 1', age_mois: 9, description: 'Rougeole et rubéole' },
  { nom: 'Fièvre jaune', age_mois: 9, description: 'Fièvre jaune' },
  { nom: 'Méningite A', age_mois: 9, description: 'Méningite' },
  { nom: 'Rougeole-Rubéole 2', age_mois: 15, description: 'Rappel' },
];

const statutVaccin = (vaccin) => {
  const today = new Date();
  if (!vaccin.prochain_rappel) {
    return 'complet';
  }

  const prochainRappelDate = new Date(vaccin.prochain_rappel);

  if (prochainRappelDate < today) {
    return 'en_retard';
  } else if (differenceInDays(prochainRappelDate, today) <= 30 && differenceInDays(prochainRappelDate, today) >= 0) {
    return 'a_venir_bientot';
  } else {
    return 'a_jour';
  }
};

export default function SuiviVaccins({ enfant, isEditable = false }) {
  const [showModal, setShowModal] = useState(false);
  const [ongletActif, setOngletActif] = useState("statut");
  const vaccins = enfant.vaccins || [];
  const today = new Date();
  const ageEnMois = differenceInMonths(new Date(), new Date(enfant.date_naissance));

  // Analyser les vaccins
  const vaccinsAJour = vaccins.filter(v =>
    !v.prochain_rappel || new Date(v.prochain_rappel) > today
  );

  const vaccinsEnRetard = vaccins.filter(v =>
    v.prochain_rappel && new Date(v.prochain_rappel) < today
  );

  const vaccinsProchainement = vaccins.filter(v =>
    v.prochain_rappel &&
    differenceInDays(new Date(v.prochain_rappel), today) <= 30 &&
    differenceInDays(new Date(v.prochain_rappel), today) > 0
  );

  // Vaccins recommandés non effectués
  const vaccinsRecommandes = calendrierVaccinal.filter(rec => {
    const existe = vaccins.some(v => v.nom_vaccin.toLowerCase().includes(rec.nom.toLowerCase()));
    return !existe && rec.age_mois <= ageEnMois + 1; // Afficher jusqu'à 1 mois dans le futur
  });

  const vaccinsManques = calendrierVaccinal.filter(rec => {
    const existe = vaccins.some(v => v.nom_vaccin.toLowerCase().includes(rec.nom.toLowerCase()));
    return !existe && rec.age_mois < ageEnMois; // Vaccins qui auraient dû être faits
  });

  // Calculer le taux de couverture
  const vaccinsAttendus = calendrierVaccinal.filter(rec => rec.age_mois <= ageEnMois);
  const tauxCouverture = vaccinsAttendus.length > 0 
    ? Math.round((vaccins.length / vaccinsAttendus.length) * 100) 
    : 0;

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Syringe className="w-6 h-6 text-blue-500" />
          Carnet de vaccination
        </CardTitle>
        {isEditable && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un vaccin
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Indicateur de couverture */}
          <Card className={`border-l-4 ${tauxCouverture >= 80 ? 'border-l-green-500 bg-green-50' : tauxCouverture >= 50 ? 'border-l-orange-500 bg-orange-50' : 'border-l-red-500 bg-red-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className={`w-8 h-8 ${tauxCouverture >= 80 ? 'text-green-600' : tauxCouverture >= 50 ? 'text-orange-600' : 'text-red-600'}`} />
                  <div>
                    <p className="font-semibold text-gray-900">Taux de couverture vaccinale</p>
                    <p className="text-sm text-gray-600">{vaccins.length} vaccins sur {vaccinsAttendus.length} attendus</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${tauxCouverture >= 80 ? 'text-green-600' : tauxCouverture >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                    {tauxCouverture}%
                  </p>
                  <Badge className={tauxCouverture >= 80 ? 'bg-green-600' : tauxCouverture >= 50 ? 'bg-orange-600' : 'bg-red-600'}>
                    {tauxCouverture >= 80 ? 'Excellent' : tauxCouverture >= 50 ? 'Correct' : 'À améliorer'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-4">
                <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">{vaccinsAJour.length}</p>
                <p className="text-xs text-gray-600">À jour</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-rose-50">
              <CardContent className="p-4">
                <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
                <p className="text-2xl font-bold text-red-600">{vaccinsEnRetard.length}</p>
                <p className="text-xs text-gray-600">En retard</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
              <CardContent className="p-4">
                <Clock className="w-6 h-6 text-orange-600 mb-2" />
                <p className="text-2xl font-bold text-orange-600">{vaccinsProchainement.length}</p>
                <p className="text-xs text-gray-600">À venir</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-4">
                <Calendar className="w-6 h-6 text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-blue-600">{vaccinsRecommandes.length}</p>
                <p className="text-xs text-gray-600">Recommandés</p>
              </CardContent>
            </Card>
          </div>

          {/* Onglets */}
          <Tabs value={ongletActif} onValueChange={setOngletActif}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="statut">Statut</TabsTrigger>
              <TabsTrigger value="historique">Historique</TabsTrigger>
              <TabsTrigger value="recommandes">Recommandés</TabsTrigger>
              <TabsTrigger value="calendrier">Calendrier</TabsTrigger>
            </TabsList>

            {/* Onglet Statut */}
            <TabsContent value="statut" className="space-y-4">
              {/* Alertes vaccins en retard */}
              {vaccinsEnRetard.length > 0 && (
                <Card className="border-l-4 border-l-red-500 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-5 h-5" />
                      Vaccins en retard ({vaccinsEnRetard.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vaccinsEnRetard.map((vaccin, i) => (
                        <div key={i} className="p-4 bg-red-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-red-900">{vaccin.nom_vaccin}</p>
                              <p className="text-sm text-red-700">
                                Rappel prévu: {format(new Date(vaccin.prochain_rappel), 'dd MMMM yyyy', { locale: fr })}
                              </p>
                              <p className="text-xs text-red-600 mt-1">
                                ⚠️ En retard de {Math.abs(differenceInDays(new Date(vaccin.prochain_rappel), today))} jours
                              </p>
                            </div>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700">
                              Planifier
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vaccins manquants */}
              {vaccinsManques.length > 0 && (
                <Card className="border-l-4 border-l-orange-500 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <AlertCircle className="w-5 h-5" />
                      Vaccins non effectués ({vaccinsManques.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {vaccinsManques.map((vaccin, i) => (
                        <div key={i} className="p-3 bg-orange-50 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-orange-900">{vaccin.nom}</p>
                            <p className="text-sm text-orange-700">{vaccin.description}</p>
                            <p className="text-xs text-orange-600">Attendu à {vaccin.age_mois} mois</p>
                          </div>
                          {isEditable && (
                            <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
                              Ajouter
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vaccins à venir */}
              {vaccinsProchainement.length > 0 && (
                <Card className="border-l-4 border-l-blue-500 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Calendar className="w-5 h-5" />
                      Prochains rappels ({vaccinsProchainement.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vaccinsProchainement.map((vaccin, i) => (
                        <div key={i} className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-blue-900">{vaccin.nom_vaccin}</p>
                              <p className="text-sm text-blue-700">
                                Rappel prévu: {format(new Date(vaccin.prochain_rappel), 'dd MMMM yyyy', { locale: fr })}
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                📅 Dans {differenceInDays(new Date(vaccin.prochain_rappel), today)} jours
                              </p>
                            </div>
                            <Button size="sm" variant="outline">
                              Planifier
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {vaccinsEnRetard.length === 0 && vaccinsManques.length === 0 && vaccinsProchainement.length === 0 && (
                <Card className="border-2 border-dashed border-green-300 bg-green-50">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-green-900 mb-2">
                      Vaccinations à jour ! 🎉
                    </h3>
                    <p className="text-green-700">
                      Tous les vaccins recommandés sont effectués.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Onglet Historique */}
            <TabsContent value="historique" className="space-y-4">
              {vaccins.length > 0 ? (
                <div className="space-y-4">
                  {vaccins.map((vaccin, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Syringe className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{vaccin.nom_vaccin}</p>
                            <p className="text-sm text-gray-600">
                              ✅ Administré le {format(new Date(vaccin.date_administration), 'dd MMMM yyyy', { locale: fr })}
                            </p>
                            {vaccin.lieu && (
                              <p className="text-xs text-gray-500 mt-1">
                                📍 {vaccin.lieu}
                              </p>
                            )}
                            {vaccin.professionnel && (
                              <p className="text-xs text-gray-500">
                                👨‍⚕️ {vaccin.professionnel}
                              </p>
                            )}
                            {vaccin.lot && (
                              <p className="text-xs text-gray-500">
                                🏷️ Lot: {vaccin.lot}
                              </p>
                            )}
                          </div>
                        </div>
                        {vaccin.prochain_rappel && new Date(vaccin.prochain_rappel) > today && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            À jour
                          </Badge>
                        )}
                      </div>
                      {vaccin.prochain_rappel && (
                        <div className="mt-3 p-2 bg-blue-50 rounded">
                          <p className="text-xs text-blue-800">
                            <strong>Prochain rappel:</strong> {format(new Date(vaccin.prochain_rappel), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-8 text-center">
                    <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Aucun vaccin enregistré</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Onglet Recommandés */}
            <TabsContent value="recommandes" className="space-y-4">
              {vaccinsRecommandes.length > 0 ? (
                <div className="space-y-2">
                  {vaccinsRecommandes.map((vaccin, i) => (
                    <Card key={i} className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-blue-900">{vaccin.nom}</p>
                            <p className="text-sm text-blue-700">{vaccin.description}</p>
                            <p className="text-xs text-blue-600 mt-1">
                              📅 Recommandé à {vaccin.age_mois} mois
                            </p>
                          </div>
                          {isEditable && (
                            <Button size="sm" onClick={() => setShowModal(true)}>
                              Ajouter
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-600">Aucun vaccin recommandé pour le moment</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Onglet Calendrier */}
            <TabsContent value="calendrier">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Calendrier vaccinal de Côte d'Ivoire (PEV)
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Programme Élargi de Vaccination - Calendrier recommandé
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {calendrierVaccinal.map((vaccin, i) => {
                      const effectue = vaccins.some(v => v.nom_vaccin.toLowerCase().includes(vaccin.nom.toLowerCase()));
                      return (
                        <div 
                          key={i} 
                          className={`p-3 rounded-lg flex items-center justify-between ${effectue ? 'bg-green-50' : 'bg-gray-50'}`}
                        >
                          <div className="flex items-center gap-3">
                            {effectue ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                            )}
                            <div>
                              <p className={`font-semibold ${effectue ? 'text-green-900' : 'text-gray-900'}`}>
                                {vaccin.nom}
                              </p>
                              <p className="text-sm text-gray-600">{vaccin.description}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{vaccin.age_mois} mois</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>

      {showModal && (
        <AjouterVaccinModal
          enfantId={enfant.id}
          vaccinsExistants={vaccins}
          onClose={() => setShowModal(false)}
        />
      )}
    </Card>
  );
}