import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Baby,
  TrendingUp,
  Syringe,
  Activity,
  AlertCircle,
  Users,
  Plus,
  Settings,
  Clock,
  Award
} from "lucide-react";
import { format, differenceInMonths, differenceInDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ComparaisonCroissance from "../components/enfants/ComparaisonCroissance";
import VueEnfantResume from "../components/enfants/VueEnfantResume";

export default function TableauBordEnfants() {
  const [ongletActif, setOngletActif] = useState("vue-ensemble");
  const [filtreAge, setFiltreAge] = useState("tous");
  const [alertesActives, setAlertesActives] = useState({
    vaccins: true,
    croissance: true,
    jalons: true,
    rendezVous: true
  });

  const { data: enfants, isLoading } = useQuery({
    queryKey: ['enfants'],
    queryFn: async () => {
      const allEnfants = await base44.entities.EnfantCarnet.list('-date_naissance');
      return allEnfants;
    },
    initialData: [],
  });

  const calculateAge = (dateNaissance) => {
    const mois = differenceInMonths(new Date(), new Date(dateNaissance));
    if (mois < 12) return { mois, annees: 0, label: `${mois} mois` };
    const annees = Math.floor(mois / 12);
    const moisRestants = mois % 12;
    return {
      mois,
      annees,
      label: moisRestants > 0 ? `${annees} ans ${moisRestants} mois` : `${annees} ans`
    };
  };

  // Filtrer les enfants selon l'âge
  const enfantsFiltres = enfants.filter(enfant => {
    if (filtreAge === "tous") return true;
    const age = calculateAge(enfant.date_naissance);
    if (filtreAge === "bebes" && age.mois <= 12) return true;
    if (filtreAge === "bambins" && age.mois > 12 && age.mois <= 36) return true;
    if (filtreAge === "enfants" && age.mois > 36) return true;
    return false;
  });

  // Calculer les statistiques globales
  const statsGlobales = {
    totalEnfants: enfants.length,
    bebes: enfants.filter(e => calculateAge(e.date_naissance).mois <= 12).length,
    bambins: enfants.filter(e => {
      const age = calculateAge(e.date_naissance).mois;
      return age > 12 && age <= 36;
    }).length,
    enfants: enfants.filter(e => calculateAge(e.date_naissance).mois > 36).length,
    vaccinsEnRetard: enfants.reduce((acc, e) => {
      const retards = (e.vaccins || []).filter(v => 
        v.prochain_rappel && new Date(v.prochain_rappel) < new Date()
      );
      return acc + retards.length;
    }, 0),
    alertesCroissance: enfants.reduce((acc, e) => {
      const derniereMesure = (e.mesures_croissance || [])[e.mesures_croissance?.length - 1];
      if (!derniereMesure) return acc;
      // Logique simplifiée - à améliorer avec courbes OMS
      return acc + (derniereMesure.poids < 3 || derniereMesure.taille < 45 ? 1 : 0);
    }, 0),
    jalonsEnRetard: enfants.reduce((acc, e) => {
      const ageEnMois = differenceInMonths(new Date(), new Date(e.date_naissance));
      const retards = (e.jalons_developpement || []).filter(j => 
        !j.atteint && j.age_attendu_mois && ageEnMois > j.age_attendu_mois + 2
      );
      return acc + retards.length;
    }, 0)
  };

  // Préparer les données pour les graphiques comparatifs
  const dataCroissanceComparative = enfantsFiltres.map(enfant => {
    const derniereMesure = (enfant.mesures_croissance || [])[enfant.mesures_croissance?.length - 1];
    return {
      nom: enfant.prenom,
      age: calculateAge(enfant.date_naissance).mois,
      poids: derniereMesure?.poids || 0,
      taille: derniereMesure?.taille || 0,
    };
  }).filter(d => d.poids > 0 || d.taille > 0);

  const dataVaccinationComparative = enfantsFiltres.map(enfant => {
    const totalVaccins = (enfant.vaccins || []).length;
    const vaccinsAJour = (enfant.vaccins || []).filter(v => 
      !v.prochain_rappel || new Date(v.prochain_rappel) > new Date()
    ).length;
    const vaccinsEnRetard = totalVaccins - vaccinsAJour;
    
    return {
      nom: enfant.prenom,
      "À jour": vaccinsAJour,
      "En retard": vaccinsEnRetard,
      total: totalVaccins
    };
  });

  const dataJalonsComparative = enfantsFiltres.map(enfant => {
    const jalons = enfant.jalons_developpement || [];
    const atteints = jalons.filter(j => j.atteint).length;
    const total = jalons.length;
    const pourcentage = total > 0 ? Math.round((atteints / total) * 100) : 0;

    return {
      nom: enfant.prenom,
      pourcentage,
      atteints,
      total
    };
  });

  // Alertes consolidées
  const toutesLesAlertes = enfantsFiltres.flatMap(enfant => {
    const alertes = [];
    const ageEnMois = differenceInMonths(new Date(), new Date(enfant.date_naissance));

    // Alertes vaccins
    if (alertesActives.vaccins) {
      (enfant.vaccins || []).forEach(vaccin => {
        if (vaccin.prochain_rappel && new Date(vaccin.prochain_rappel) < new Date()) {
          alertes.push({
            type: 'vaccin',
            priorite: 'haute',
            enfant: enfant.prenom,
            enfantId: enfant.id,
            message: `Vaccin ${vaccin.nom_vaccin} en retard`,
            details: `Rappel prévu le ${format(new Date(vaccin.prochain_rappel), 'dd/MM/yyyy')}`,
            joursRetard: Math.abs(differenceInDays(new Date(vaccin.prochain_rappel), new Date()))
          });
        } else if (vaccin.prochain_rappel && differenceInDays(new Date(vaccin.prochain_rappel), new Date()) <= 7) {
          alertes.push({
            type: 'vaccin',
            priorite: 'moyenne',
            enfant: enfant.prenom,
            enfantId: enfant.id,
            message: `Vaccin ${vaccin.nom_vaccin} à prévoir`,
            details: `Rappel dans ${differenceInDays(new Date(vaccin.prochain_rappel), new Date())} jours`
          });
        }
      });
    }

    // Alertes jalons
    if (alertesActives.jalons) {
      (enfant.jalons_developpement || []).forEach(jalon => {
        if (!jalon.atteint && jalon.age_attendu_mois && ageEnMois > jalon.age_attendu_mois + 2) {
          alertes.push({
            type: 'jalon',
            priorite: 'moyenne',
            enfant: enfant.prenom,
            enfantId: enfant.id,
            message: `Jalon "${jalon.jalon}" non atteint`,
            details: `Attendu à ${jalon.age_attendu_mois} mois (${jalon.categorie})`
          });
        }
      });
    }

    return alertes;
  });

  const alertesParPriorite = {
    haute: toutesLesAlertes.filter(a => a.priorite === 'haute'),
    moyenne: toutesLesAlertes.filter(a => a.priorite === 'moyenne'),
    basse: toutesLesAlertes.filter(a => a.priorite === 'basse')
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Baby className="w-12 h-12 animate-pulse text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (enfants.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Aucun enfant enregistré
            </h2>
            <p className="text-gray-600 mb-6">
              Commencez par ajouter les carnets de santé de vos enfants
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link to={createPageUrl('Enfants')}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter mon premier enfant
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 md:p-8 pb-safe">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              Tableau de Bord Familial
            </h1>
            <p className="text-sm md:text-base text-gray-600 ml-0 md:ml-16">
              Vue d'ensemble de la santé de vos {enfants.length} enfant{enfants.length > 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={createPageUrl('Enfants')}>
                <Baby className="w-4 h-4 mr-2" />
                Gérer les enfants
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-none shadow-md">
            <CardContent className="p-3 md:p-4">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-600 mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{statsGlobales.totalEnfants}</p>
              <p className="text-xs text-gray-600">Total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-none shadow-md">
            <CardContent className="p-3 md:p-4">
              <Baby className="w-6 h-6 md:w-8 md:h-8 text-pink-600 mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-pink-600">{statsGlobales.bebes}</p>
              <p className="text-xs text-gray-600">Bébés</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-none shadow-md">
            <CardContent className="p-3 md:p-4">
              <Activity className="w-6 h-6 md:w-8 md:h-8 text-purple-600 mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-purple-600">{statsGlobales.bambins}</p>
              <p className="text-xs text-gray-600">Bambins</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-none shadow-md">
            <CardContent className="p-3 md:p-4">
              <Award className="w-6 h-6 md:w-8 md:h-8 text-green-600 mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-green-600">{statsGlobales.enfants}</p>
              <p className="text-xs text-gray-600">Enfants</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${statsGlobales.vaccinsEnRetard > 0 ? 'from-red-50 to-orange-50' : 'from-green-50 to-emerald-50'} border-none shadow-md`}>
            <CardContent className="p-3 md:p-4">
              <Syringe className={`w-6 h-6 md:w-8 md:h-8 ${statsGlobales.vaccinsEnRetard > 0 ? 'text-red-600' : 'text-green-600'} mb-2`} />
              <p className={`text-2xl md:text-3xl font-bold ${statsGlobales.vaccinsEnRetard > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {statsGlobales.vaccinsEnRetard}
              </p>
              <p className="text-xs text-gray-600">Vaccins retard</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${statsGlobales.alertesCroissance > 0 ? 'from-orange-50 to-amber-50' : 'from-green-50 to-emerald-50'} border-none shadow-md`}>
            <CardContent className="p-3 md:p-4">
              <TrendingUp className={`w-6 h-6 md:w-8 md:h-8 ${statsGlobales.alertesCroissance > 0 ? 'text-orange-600' : 'text-green-600'} mb-2`} />
              <p className={`text-2xl md:text-3xl font-bold ${statsGlobales.alertesCroissance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {statsGlobales.alertesCroissance}
              </p>
              <p className="text-xs text-gray-600">Alertes croiss.</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${statsGlobales.jalonsEnRetard > 0 ? 'from-orange-50 to-yellow-50' : 'from-green-50 to-emerald-50'} border-none shadow-md`}>
            <CardContent className="p-3 md:p-4">
              <Activity className={`w-6 h-6 md:w-8 md:h-8 ${statsGlobales.jalonsEnRetard > 0 ? 'text-orange-600' : 'text-green-600'} mb-2`} />
              <p className={`text-2xl md:text-3xl font-bold ${statsGlobales.jalonsEnRetard > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {statsGlobales.jalonsEnRetard}
              </p>
              <p className="text-xs text-gray-600">Jalons retard</p>
            </CardContent>
          </Card>
        </div>

        {/* Alertes consolidées */}
        {toutesLesAlertes.length > 0 && (
          <Card className="border-l-4 border-l-red-500 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-6 h-6" />
                  Alertes importantes ({toutesLesAlertes.length})
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertesParPriorite.haute.slice(0, 3).map((alerte, i) => (
                  <div key={i} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900">{alerte.enfant} - {alerte.message}</p>
                          <p className="text-sm text-red-700 mt-1">{alerte.details}</p>
                          {alerte.joursRetard && (
                            <Badge className="mt-2 bg-red-600 text-white">
                              En retard de {alerte.joursRetard} jours
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700" asChild>
                        <Link to={createPageUrl(`Enfants`)}>
                          Agir
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                
                {alertesParPriorite.moyenne.slice(0, 2).map((alerte, i) => (
                  <div key={i} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-orange-900 text-sm">{alerte.enfant} - {alerte.message}</p>
                          <p className="text-xs text-orange-700 mt-1">{alerte.details}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {toutesLesAlertes.length > 5 && (
                  <Button variant="outline" className="w-full">
                    Voir toutes les alertes ({toutesLesAlertes.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtres */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Filtrer par âge:</span>
                <div className="flex gap-2">
                  {[
                    { value: 'tous', label: 'Tous' },
                    { value: 'bebes', label: 'Bébés (0-12m)' },
                    { value: 'bambins', label: 'Bambins (1-3 ans)' },
                    { value: 'enfants', label: 'Enfants (3+ ans)' }
                  ].map(filtre => (
                    <Badge
                      key={filtre.value}
                      variant={filtreAge === filtre.value ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setFiltreAge(filtre.value)}
                    >
                      {filtre.label}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <span className="text-sm text-gray-600">
                {enfantsFiltres.length} enfant{enfantsFiltres.length > 1 ? 's' : ''} affiché{enfantsFiltres.length > 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Onglets principaux */}
        <Tabs value={ongletActif} onValueChange={setOngletActif}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="vue-ensemble">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="croissance">Croissance</TabsTrigger>
            <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
            <TabsTrigger value="jalons">Jalons</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="vue-ensemble" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enfantsFiltres.map(enfant => (
                <VueEnfantResume key={enfant.id} enfant={enfant} />
              ))}
            </div>
          </TabsContent>

          {/* Croissance comparative */}
          <TabsContent value="croissance" className="space-y-6 mt-6">
            {dataCroissanceComparative.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Comparaison des poids</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dataCroissanceComparative}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nom" />
                        <YAxis label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="poids" fill="#3b82f6" name="Poids (kg)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Comparaison des tailles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dataCroissanceComparative}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nom" />
                        <YAxis label={{ value: 'Taille (cm)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="taille" fill="#10b981" name="Taille (cm)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <ComparaisonCroissance enfants={enfantsFiltres} />
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune donnée de croissance disponible</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Vaccinations comparatives */}
          <TabsContent value="vaccinations" className="space-y-6 mt-6">
            {dataVaccinationComparative.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>État des vaccinations par enfant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dataVaccinationComparative}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nom" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="À jour" fill="#10b981" stackId="a" />
                        <Bar dataKey="En retard" fill="#ef4444" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enfantsFiltres.map(enfant => {
                    const vaccins = enfant.vaccins || [];
                    const aJour = vaccins.filter(v => !v.prochain_rappel || new Date(v.prochain_rappel) > new Date()).length;
                    const enRetard = vaccins.filter(v => v.prochain_rappel && new Date(v.prochain_rappel) < new Date()).length;
                    const taux = vaccins.length > 0 ? Math.round((aJour / vaccins.length) * 100) : 0;

                    return (
                      <Card key={enfant.id} className={`border-l-4 ${taux >= 80 ? 'border-l-green-500' : taux >= 50 ? 'border-l-orange-500' : 'border-l-red-500'}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{enfant.prenom}</CardTitle>
                            <Badge className={taux >= 80 ? 'bg-green-600' : taux >= 50 ? 'bg-orange-600' : 'bg-red-600'}>
                              {taux}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-semibold">{vaccins.length} vaccins</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600">À jour:</span>
                              <span className="font-semibold">{aJour}</span>
                            </div>
                            {enRetard > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-red-600">En retard:</span>
                                <span className="font-semibold">{enRetard}</span>
                              </div>
                            )}
                          </div>
                          <Button size="sm" className="w-full mt-4" variant="outline" asChild>
                            <Link to={createPageUrl('Enfants')}>
                              Voir le détail
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Syringe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune donnée de vaccination disponible</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Jalons comparatifs */}
          <TabsContent value="jalons" className="space-y-6 mt-6">
            {dataJalonsComparative.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Progression des jalons de développement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dataJalonsComparative}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nom" />
                        <YAxis label={{ value: 'Progression (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="pourcentage" fill="#8b5cf6" name="Jalons atteints (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enfantsFiltres.map(enfant => {
                    const jalons = enfant.jalons_developpement || [];
                    const atteints = jalons.filter(j => j.atteint).length;
                    const total = jalons.length;
                    const pourcentage = total > 0 ? Math.round((atteints / total) * 100) : 0;

                    return (
                      <Card key={enfant.id} className={`border-l-4 ${pourcentage >= 80 ? 'border-l-green-500' : pourcentage >= 50 ? 'border-l-orange-500' : 'border-l-red-500'}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{enfant.prenom}</CardTitle>
                            <Badge className={pourcentage >= 80 ? 'bg-green-600' : pourcentage >= 50 ? 'bg-orange-600' : 'bg-red-600'}>
                              {pourcentage}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Jalons suivis:</span>
                              <span className="font-semibold">{total}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600">Atteints:</span>
                              <span className="font-semibold">{atteints}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Restants:</span>
                              <span className="font-semibold">{total - atteints}</span>
                            </div>
                          </div>
                          <Button size="sm" className="w-full mt-4" variant="outline" asChild>
                            <Link to={createPageUrl('Enfants')}>
                              Voir le détail
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune donnée de jalon disponible</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <style jsx>{`
        .pb-safe {
          padding-bottom: max(6rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}