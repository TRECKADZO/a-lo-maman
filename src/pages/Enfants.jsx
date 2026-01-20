import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Baby,
  Plus,
  Syringe,
  AlertCircle,
  LayoutDashboard,
  BookOpen
} from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ProfilEnfant from "../components/enfants/ProfilEnfant";
import AjouterEnfant from "../components/enfants/AjouterEnfant";
import ParcoursBebe from "../components/enfants/ParcoursBebe";
import { PageTransition, CardTransition, ListTransition } from '@/components/ui/page-transition';
import { Touchable } from '@/components/ui/native-interactions';
import { ChildProfileSkeleton, ListSkeleton } from '@/components/ui/skeleton-loaders';

export default function Enfants() {
  const [showAjouter, setShowAjouter] = useState(false);
  const [enfantSelectionne, setEnfantSelectionne] = useState(null);
  const [showParcours, setShowParcours] = useState(null);
  const queryClient = useQueryClient();

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
    if (mois < 12) return `${mois} mois`;
    const annees = Math.floor(mois / 12);
    const moisRestants = mois % 12;
    return moisRestants > 0 ? `${annees} ans ${moisRestants} mois` : `${annees} ans`;
  };

  const getProchainVaccin = (enfant) => {
    if (!enfant.vaccins || enfant.vaccins.length === 0) return null;
    
    const vaccinsAvecRappel = enfant.vaccins
      .filter(v => v.prochain_rappel && new Date(v.prochain_rappel) > new Date())
      .sort((a, b) => new Date(a.prochain_rappel) - new Date(b.prochain_rappel));
    
    return vaccinsAvecRappel[0] || null;
  };

  const stats = {
    total_enfants: enfants.length,
    vaccins_a_jour: enfants.filter(e => {
      const prochainVaccin = getProchainVaccin(e);
      return !prochainVaccin || differenceInMonths(new Date(prochainVaccin.prochain_rappel), new Date()) > 1;
    }).length,
    alertes_vaccins: enfants.filter(e => {
      const prochainVaccin = getProchainVaccin(e);
      return prochainVaccin && differenceInMonths(new Date(prochainVaccin.prochain_rappel), new Date()) <= 1;
    }).length
  };

  if (isLoading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
        <ListSkeleton count={3} renderItem={ChildProfileSkeleton} />
      </div>
    );
  }

  return (
    <PageTransition type="fade">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8 pb-24 lg:pb-8">
          {/* Header optimisé */}
          <CardTransition>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl shadow-xl flex items-center justify-center">
                  <Baby className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold text-gray-900">
                    Carnets de Santé
                  </h1>
                  <p className="text-sm md:text-base text-gray-600">
                    Suivi complet de vos enfants
                  </p>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                {enfants.length > 1 && (
                  <Button 
                    variant="outline"
                    asChild
                    className="flex-1 md:flex-initial rounded-xl shadow-sm"
                  >
                    <Link to={createPageUrl('TableauBordEnfants')}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Tableau de bord
                    </Link>
                  </Button>
                )}
                <Touchable onPress={() => setShowAjouter(true)} haptic className="flex-1 md:flex-initial">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg rounded-xl">
                    <Plus className="w-5 h-5 mr-2" />
                    Ajouter un enfant
                  </Button>
                </Touchable>
              </div>
            </div>
          </CardTransition>

          {/* Statistiques optimisées */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6">
            <CardTransition delay={0.05}>
              <Card className="shadow-xl border-none bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl overflow-hidden">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-center md:justify-between gap-3">
                    <div className="text-center md:text-left">
                      <p className="text-xs md:text-sm text-gray-600 mb-1">Enfants suivis</p>
                      <p className="text-3xl md:text-4xl font-bold text-blue-600">{stats.total_enfants}</p>
                    </div>
                    <Baby className="w-10 h-10 md:w-12 md:h-12 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
            </CardTransition>

            <CardTransition delay={0.1}>
              <Card className="shadow-xl border-none bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl overflow-hidden">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-center md:justify-between gap-3">
                    <div className="text-center md:text-left">
                      <p className="text-xs md:text-sm text-gray-600 mb-1">Vaccins OK</p>
                      <p className="text-3xl md:text-4xl font-bold text-green-600">{stats.vaccins_a_jour}</p>
                    </div>
                    <Syringe className="w-10 h-10 md:w-12 md:h-12 text-green-200" />
                  </div>
                </CardContent>
              </Card>
            </CardTransition>

            <CardTransition delay={0.15}>
              <Card className="shadow-xl border-none bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl overflow-hidden">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-center md:justify-between gap-3">
                    <div className="text-center md:text-left">
                      <p className="text-xs md:text-sm text-gray-600 mb-1">Alertes</p>
                      <p className="text-3xl md:text-4xl font-bold text-orange-600">{stats.alertes_vaccins}</p>
                    </div>
                    <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </CardTransition>
          </div>

        {/* Liste des enfants */}
        {enfantSelectionne ? (
          <ProfilEnfant 
            enfant={enfantSelectionne}
            onRetour={() => setEnfantSelectionne(null)}
            isEditable={true}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enfants.length > 0 ? (
              <ListTransition staggerDelay={0.05}>
                {enfants.map((enfant) => {
                  const prochainVaccin = getProchainVaccin(enfant);
                  const age = calculateAge(enfant.date_naissance);
                  
                  return (
                    <Touchable 
                      key={enfant.id}
                      onPress={() => setEnfantSelectionne(enfant)}
                      haptic
                    >
                      <Card className="shadow-xl hover:shadow-2xl transition-all border-none rounded-3xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl flex items-center justify-center shadow-xl">
                              {enfant.photo ? (
                                <img src={enfant.photo} alt={enfant.prenom} className="w-full h-full rounded-3xl object-cover" />
                              ) : (
                                <Baby className="w-10 h-10 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-xl truncate">{enfant.prenom} {enfant.nom}</CardTitle>
                              <p className="text-sm text-gray-600">{age}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Sexe</span>
                            <Badge variant="outline">{enfant.sexe}</Badge>
                          </div>
                          
                          {enfant.numero_cmu && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">CMU</span>
                              <span className="text-sm font-medium">{enfant.numero_cmu}</span>
                            </div>
                          )}

                          {enfant.groupe_sanguin && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Groupe sanguin</span>
                              <Badge className="bg-red-100 text-red-800">{enfant.groupe_sanguin}</Badge>
                            </div>
                          )}

                          {prochainVaccin && (
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Syringe className="w-4 h-4 text-orange-600" />
                                <span className="text-sm font-semibold text-orange-900">Prochain vaccin</span>
                              </div>
                              <p className="text-sm text-orange-800">{prochainVaccin.nom_vaccin}</p>
                              <p className="text-xs text-orange-600">
                                {format(new Date(prochainVaccin.prochain_rappel), 'dd MMMM yyyy', { locale: fr })}
                              </p>
                            </div>
                          )}

                          {enfant.allergies && enfant.allergies.length > 0 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm font-semibold text-red-900 mb-1">Allergies</p>
                              <p className="text-sm text-red-800">{enfant.allergies.join(', ')}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant="outline" 
                              className="rounded-xl shadow-sm text-xs"
                              onClick={(e) => { e.stopPropagation(); setShowParcours(enfant); }}
                            >
                              <BookOpen className="w-3 h-3 mr-1" />
                              Parcours
                            </Button>
                            <Button variant="outline" className="rounded-xl shadow-sm text-xs">
                              Carnet
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Touchable>
                  );
                })}
              </ListTransition>
            ) : (
              <CardTransition>
                <Card className="col-span-full shadow-xl rounded-3xl">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Baby className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Aucun enfant enregistré
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Commencez par ajouter le carnet de santé de votre enfant
                    </p>
                    <Touchable onPress={() => setShowAjouter(true)} haptic>
                      <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter mon premier enfant
                      </Button>
                    </Touchable>
                  </CardContent>
                </Card>
              </CardTransition>
            )}
          </div>
        )}

        {/* Modal Ajouter enfant */}
        {showAjouter && (
          <AjouterEnfant onClose={() => setShowAjouter(false)} />
        )}

        {/* Parcours Bébé */}
        {showParcours && (
          <div className="fixed inset-0 z-50 bg-white">
            <ParcoursBebe 
              enfant={showParcours} 
              onRetour={() => setShowParcours(null)} 
            />
          </div>
        )}
        </div>
      </div>
    </PageTransition>
  );
}