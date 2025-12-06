import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Pill,
  Shield,
  Leaf,
  AlertCircle,
  TrendingUp,
  Filter,
  Loader2,
  Plus
} from "lucide-react";

import MethodesList from "@/components/contraception/MethodesList";
import SuiviActif from "@/components/contraception/SuiviActif";
import ConfigurerSuivi from "@/components/contraception/ConfigurerSuivi";
import AuthGuard from '../components/auth/AuthGuard';
import { DashboardSkeleton, StatCardSkeleton } from '@/components/ui/skeleton-loaders';
import { PageTransition, TabTransition, CardTransition } from '@/components/ui/page-transition';
import { Touchable } from '@/components/ui/native-interactions';

export default function Contraception() {
  const navigate = useNavigate();
  const [selectedCategorie, setSelectedCategorie] = useState("toutes");
  const [showConfigurer, setShowConfigurer] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profiles, isLoading: profilProLoading } = useQuery({
    queryKey: ['user_profiles', user?.email],
    queryFn: async () => {
      if (!user) return { maman: null, pro: null };
      
      const [mamanProfiles, proProfiles] = await Promise.all([
        base44.entities.ProfilMaman.filter({ created_by: user.email }).catch(() => []),
        base44.entities.Professionnel.list().catch(() => [])
      ]);
      
      const proProfil = proProfiles.find(p => p.email === user.email);
      
      return {
        maman: mamanProfiles[0] || null,
        pro: proProfil || null
      };
    },
    enabled: !!user,
  });

  const profilPro = profiles?.pro;
  const isSpecialist = !!profilPro;

  React.useEffect(() => {
    if (!profilProLoading && isSpecialist) {
      navigate(createPageUrl('Dashboard'), { replace: true });
    }
  }, [isSpecialist, profilProLoading, navigate]);

  const { data: methodes = [], isLoading: loadingMethodes } = useQuery({
    queryKey: ['methodesContraception'],
    queryFn: () => base44.entities.MethodeContraception.list(),
    enabled: !isSpecialist,
  });

  const { data: suiviActif } = useQuery({
    queryKey: ['suiviContraception', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const suivis = await base44.entities.SuiviContraception.filter({ 
        created_by: user.email,
        active: true 
      });
      return suivis[0] || null;
    },
    enabled: !!user && !isSpecialist,
  });

  if (userLoading || profilProLoading) {
    return (
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 min-h-screen p-4">
        <DashboardSkeleton />
      </div>
    );
  }

  if (isSpecialist) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Redirection...</p>
        </div>
      </div>
    );
  }

  const methodesFiltrees = selectedCategorie === "toutes" 
    ? methodes 
    : methodes.filter(m => m.categorie === selectedCategorie);

  return (
    <AuthGuard>
      <PageTransition type="fade">
        <div className="min-h-full bg-gradient-to-br from-rose-50 via-white to-pink-50">
          <div className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto pb-24 lg:pb-6">
            {/* Header optimisé mobile */}
            <CardTransition>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-xl flex-shrink-0">
                    <Heart className="w-7 h-7 text-white fill-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-4xl font-bold text-gray-900 truncate">
                      Contraception
                    </h1>
                    <p className="text-xs md:text-sm text-gray-600 truncate">
                      Choisissez votre méthode en toute sécurité
                    </p>
                  </div>
                </div>
                {!suiviActif && (
                  <Touchable 
                    onPress={() => setShowConfigurer(true)}
                    haptic
                    className="w-full md:w-auto"
                  >
                    <Button className="w-full md:w-auto bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg h-12 flex-shrink-0">
                      <Plus className="w-5 h-5 mr-2" />
                      <span className="truncate">Démarrer un suivi</span>
                    </Button>
                  </Touchable>
                )}
              </div>
            </CardTransition>

          {suiviActif && (
            <CardTransition delay={0.1}>
              <SuiviActif 
                suivi={suiviActif} 
                onEdit={() => setShowConfigurer(true)}
              />
            </CardTransition>
          )}

          {showConfigurer && (
            <ConfigurerSuivi 
              suiviExistant={suiviActif}
              onClose={() => setShowConfigurer(false)}
            />
          )}

          {/* Statistiques avec animations */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {loadingMethodes ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <CardTransition delay={0.05}>
                  <Touchable onPress={() => setSelectedCategorie('hormonale')} haptic>
                    <Card className="border-none shadow-md bg-gradient-to-br from-rose-100 to-pink-100 hover:shadow-lg transition-shadow overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Pill className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {methodes.filter(m => m.categorie === 'hormonale').length}
                            </p>
                            <p className="text-xs text-gray-600">Hormonales</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Touchable>
                </CardTransition>

                <CardTransition delay={0.1}>
                  <Touchable onPress={() => setSelectedCategorie('barriere')} haptic>
                    <Card className="border-none shadow-md bg-gradient-to-br from-blue-100 to-cyan-100 hover:shadow-lg transition-shadow overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Shield className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {methodes.filter(m => m.categorie === 'barriere').length}
                            </p>
                            <p className="text-xs text-gray-600">Barrière</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Touchable>
                </CardTransition>

                <CardTransition delay={0.15}>
                  <Touchable onPress={() => setSelectedCategorie('naturelle')} haptic>
                    <Card className="border-none shadow-md bg-gradient-to-br from-green-100 to-emerald-100 hover:shadow-lg transition-shadow overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center gap-2">
                          <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Leaf className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {methodes.filter(m => m.categorie === 'naturelle').length}
                            </p>
                            <p className="text-xs text-gray-600">Naturelles</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Touchable>
                </CardTransition>

                <CardTransition delay={0.2}>
                  <Card className="border-none shadow-md bg-gradient-to-br from-purple-100 to-violet-100 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-gray-900">70-100%</p>
                          <p className="text-xs text-gray-600">Par CMU</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardTransition>
              </>
            )}
          </div>

          {/* Catalogue avec transitions */}
          <CardTransition delay={0.25}>
            <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
              <CardHeader className="p-4 md:p-6 bg-gradient-to-r from-rose-50 to-pink-50">
                <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                  <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <span className="truncate">Catalogue des Méthodes</span>
                </CardTitle>
                <Tabs value={selectedCategorie} onValueChange={setSelectedCategorie} className="mt-4">
                  <TabsList className="w-full h-auto flex flex-wrap justify-start gap-2 p-1.5 bg-white/80 rounded-2xl shadow-sm">
                    <TabsTrigger 
                      value="toutes" 
                      className="text-xs md:text-sm px-3 py-2 rounded-xl data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      Toutes
                    </TabsTrigger>
                    <TabsTrigger 
                      value="hormonale" 
                      className="text-xs md:text-sm px-3 py-2 rounded-xl data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      Hormonale
                    </TabsTrigger>
                    <TabsTrigger 
                      value="barriere" 
                      className="text-xs md:text-sm px-3 py-2 rounded-xl data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      Barrière
                    </TabsTrigger>
                    <TabsTrigger 
                      value="naturelle" 
                      className="text-xs md:text-sm px-3 py-2 rounded-xl data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      Naturelle
                    </TabsTrigger>
                    <TabsTrigger 
                      value="permanente" 
                      className="text-xs md:text-sm px-3 py-2 rounded-xl data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      Permanente
                    </TabsTrigger>
                    <TabsTrigger 
                      value="urgence" 
                      className="text-xs md:text-sm px-3 py-2 rounded-xl data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      Urgence
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <TabTransition selectedTab={selectedCategorie}>
                  <MethodesList methodes={methodesFiltrees} isLoading={loadingMethodes} />
                </TabTransition>
              </CardContent>
            </Card>
          </CardTransition>

          {/* Info CMU optimisée */}
          <CardTransition delay={0.3}>
            <Card className="border-l-4 border-l-teal-500 shadow-lg bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-teal-900 mb-2 flex items-center gap-2">
                      Prise en Charge par la CMU
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-teal-600 text-white text-xs font-bold">
                        70-100%
                      </span>
                    </h3>
                    <p className="text-sm text-teal-800 leading-relaxed break-words">
                      La CMU en Côte d'Ivoire prend en charge entre <strong>70% et 100%</strong> du coût de la plupart des méthodes contraceptives. 
                      Les pilules, stérilets et implants sont remboursés. Pour les femmes de moins de 26 ans, 
                      les préservatifs sont <strong>gratuits en PMI</strong>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardTransition>
        </div>
      </div>
      </PageTransition>
    </AuthGuard>
  );
}