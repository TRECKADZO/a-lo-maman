import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ParcoursGuideMaman from '../components/onboarding/ParcoursGuideMaman';
import ConseilsPersonnalises from '../components/ia/ConseilsPersonnalises';
import NaissanceCTA from '../components/naissance/NaissanceCTA';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRight,
  Heart,
  Calendar,
  Baby,
  Stethoscope,
  HeartPulse,
  Users,
  TrendingUp,
  Droplet,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Pill,
  Activity,
  Download,
  Eye
} from 'lucide-react';
import { format, differenceInWeeks, differenceInDays, addDays, isToday, isTomorrow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RappelsWidget from '@/components/rappels/RappelsWidget';
import { DashboardSkeleton } from '@/components/ui/skeleton-loaders';
import { PageTransition, TabTransition } from '@/components/ui/page-transition';
import { MobilePageContainer } from '@/components/ui/safe-area-view'; // Added as per outline, though not used in JSX

const DashboardWidget = ({ title, icon: Icon, children, link, linkText, color = "pink" }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow border-none active:scale-[0.98]">
    <CardHeader className="p-4">
      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
        <Icon className={`w-5 h-5 md:w-6 md:h-6 text-${color}-500 flex-shrink-0`} />
        <span className="text-gray-900 truncate">{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      {children}
      {link && (
        <Button asChild variant="outline" className="w-full mt-4 active:scale-95 transition-transform">
          <Link to={link}>
            <span className="text-sm truncate">{linkText}</span>
            <ArrowRight className="w-4 h-4 ml-2 flex-shrink-0" />
          </Link>
        </Button>
      )}
    </CardContent>
  </Card>
);

export default function DashboardMaman() {
  const [vueActive, setVueActive] = useState('apercu');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profilMaman, isLoading: profilLoading } = useQuery({
    queryKey: ['profilMaman', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.ProfilMaman.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  // Afficher onboarding si pas de profil
  useEffect(() => {
    if (user && !profilLoading && !profilMaman) {
      setShowOnboarding(true);
    }
  }, [user, profilMaman, profilLoading]);

  const { data: grossesse, isLoading: grossesseLoading } = useQuery({
    queryKey: ['grossesse_active'],
    queryFn: async () => {
      const grossesses = await base44.entities.SuiviGrossesse.filter({
        grossesse_active: true,
      });
      return grossesses[0];
    },
  });

  const { data: dernierCycle } = useQuery({
    queryKey: ['dernier_cycle'],
    queryFn: async () => {
      const cycles = await base44.entities.CycleMenstruel.list('-date_debut_regles', 1);
      return cycles[0];
    },
  });

  const { data: suiviContraception } = useQuery({
    queryKey: ['suiviContraceptionActif'],
    queryFn: async () => {
      const suivis = await base44.entities.SuiviContraception.filter({ active: true });
      return suivis[0];
    },
  });
  
  const { data: enfants, isLoading: enfantsLoading } = useQuery({
    queryKey: ['enfants'],
    queryFn: () => base44.entities.EnfantCarnet.list('-created_date'),
    initialData: []
  });

  const { data: mesRendezVous, isLoading: rdvLoading } = useQuery({
    queryKey: ['mesRendezVous'],
    queryFn: async () => {
      if (!user) return [];
      const rdvs = await base44.entities.RendezVous.filter(
        { created_by: user.email },
        '-date_rdv'
      );
      return rdvs;
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: professionnels } = useQuery({
    queryKey: ['professionnels'],
    queryFn: () => base44.entities.Professionnel.list(),
    initialData: [],
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const notifs = await base44.entities.Notification.filter(
        { destinataire_email: user.email, lu: false },
        '-created_date',
        5
      );
      return notifs;
    },
    enabled: !!user,
  });

  const isLoading = userLoading || profilLoading || grossesseLoading || enfantsLoading || rdvLoading;

  if (showOnboarding && !profilMaman) {
    return (
      <ParcoursGuideMaman
        onComplete={() => setShowOnboarding(false)}
        userEmail={user?.email}
      />
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const getSemaineGrossesse = () => {
    if (!grossesse) return null;
    const semaines = differenceInWeeks(new Date(), new Date(grossesse.date_derniere_regle));
    return semaines;
  };

  // Rendez-vous
  const rdvActifs = mesRendezVous?.filter(r => 
    new Date(r.date_rdv) > new Date() && 
    r.statut !== 'annule'
  ) || [];

  const rdvPasses = mesRendezVous?.filter(r => 
    new Date(r.date_rdv) <= new Date() || 
    r.statut === 'termine'
  ) || [];

  const prochainRendezVous = rdvActifs[0];
  const professionnelProchainRdv = prochainRendezVous
    ? professionnels.find(p => p.id === prochainRendezVous.professionnel_id)
    : null;

  // Documents médicaux de tous les enfants
  const tousDocs = enfants.flatMap(enfant => 
    (enfant.documents_medicaux || []).map(doc => ({ ...doc, enfant_nom: enfant.prenom }))
  );

  // Statistiques
  const stats = {
    rdvTotal: mesRendezVous.length,
    rdvActifs: rdvActifs.length,
    rdvPasses: rdvPasses.length,
    enfants: enfants.length,
    documents: tousDocs.length,
    notifications: notifications.length
  };

  return (
    <PageTransition type="fade">
      <div className="bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24 md:pb-8" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
        <div className="p-4 space-y-4 max-w-7xl mx-auto">
          
          {/* Bienvenue - Mobile optimized */}
          <Card className="shadow-lg border-none bg-gradient-to-r from-pink-100 to-purple-100 overflow-hidden scale-in">
            <CardContent className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2 break-words">
                Bonjour {profilMaman?.display_name || user?.full_name?.split(' ')[0] || 'Maman'} ! 👋
              </h2>
              <p className="text-sm md:text-base text-gray-700 break-words">
                Gérez votre santé et celle de votre famille
              </p>
            </CardContent>
          </Card>

          {/* Statistiques rapides - Mobile Grid 2x2 */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <Card className="shadow-md border-none bg-gradient-to-br from-blue-50 to-cyan-50 active:scale-95 transition-transform overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <Calendar className="w-7 h-7 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.rdvActifs}</p>
                    <p className="text-xs text-gray-600 truncate">RDV actifs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-none bg-gradient-to-br from-purple-50 to-pink-50 active:scale-95 transition-transform overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <Baby className="w-7 h-7 md:w-8 md:h-8 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-purple-600">{stats.enfants}</p>
                    <p className="text-xs text-gray-600 truncate">Enfant(s)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-none bg-gradient-to-br from-green-50 to-emerald-50 active:scale-95 transition-transform overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <FileText className="w-7 h-7 md:w-8 md:h-8 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-green-600">{stats.documents}</p>
                    <p className="text-xs text-gray-600 truncate">Documents</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-none bg-gradient-to-br from-orange-50 to-amber-50 active:scale-95 transition-transform overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <AlertCircle className="w-7 h-7 md:w-8 md:h-8 text-orange-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-orange-600">{stats.notifications}</p>
                    <p className="text-xs text-gray-600 truncate">Alertes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prochain RDV alerte */}
          {prochainRendezVous && (
            <Card className="shadow-lg border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 active:scale-[0.99] transition-transform overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm md:text-base text-blue-900 mb-1 break-words">Prochain rendez-vous</h3>
                    <div className="space-y-1 text-blue-800">
                      <p className="text-sm md:text-base font-semibold break-words">
                        {format(new Date(prochainRendezVous.date_rdv), "EEE d MMM 'à' HH:mm", { locale: fr })}
                      </p>
                      {professionnelProchainRdv && (
                        <p className="text-xs md:text-sm truncate">
                          <strong>{professionnelProchainRdv.nom_complet}</strong>
                        </p>
                      )}
                      <Badge className="mt-2 bg-blue-600 text-white text-xs">
                        {isToday(new Date(prochainRendezVous.date_rdv)) && 'Aujourd\'hui'}
                        {isTomorrow(new Date(prochainRendezVous.date_rdv)) && 'Demain'}
                        {!isToday(new Date(prochainRendezVous.date_rdv)) && !isTomorrow(new Date(prochainRendezVous.date_rdv)) && 
                          `Dans ${differenceInDays(new Date(prochainRendezVous.date_rdv), new Date())} jours`}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Widget Rappels */}
          <RappelsWidget userEmail={user?.email} />

          {/* CTA Déclaration de Naissance - Affichage conditionnel */}
          {grossesse && getSemaineGrossesse() >= 37 && (
            <Card className="shadow-xl border-2 border-pink-300 bg-gradient-to-br from-pink-100 via-white to-rose-100 animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Baby className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      🎉 Votre bébé arrive bientôt !
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Préparez dès maintenant sa déclaration de naissance
                    </p>
                    <Button asChild className="w-full bg-gradient-to-r from-pink-500 to-rose-600 shadow-lg">
                      <Link to={createPageUrl('DeclarationNaissance')}>
                        Préparer la déclaration
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ou si grossesse inactive mais pas de déclaration récente */}
          {!grossesse && enfants.length === 0 && (
            <NaissanceCTA variant="compact" />
          )}

          {/* Conseils personnalisés IA */}
          <ConseilsPersonnalises 
            profil={profilMaman}
            grossesse={grossesse}
            enfants={enfants}
          />

          {/* Onglets - Mobile optimized */}
          <Tabs value={vueActive} onValueChange={setVueActive}>
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-white rounded-xl shadow-md sticky top-0 z-10">
              <TabsTrigger value="apercu" className="text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg py-2">
                Aperçu
              </TabsTrigger>
              <TabsTrigger value="rendez-vous" className="text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg py-2 relative">
                RDV
                {stats.rdvActifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {stats.rdvActifs}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg py-2">
                Docs
              </TabsTrigger>
              <TabsTrigger value="profil" className="text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg py-2">
                Profil
              </TabsTrigger>
            </TabsList>

            {/* Vue Aperçu */}
            <TabsContent value="apercu" className="space-y-4 mt-4">
              <TabTransition selectedTab={vueActive}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grossesse && (
                    <DashboardWidget
                      title="Suivi de Grossesse"
                      icon={HeartPulse}
                      link={createPageUrl('Grossesse')}
                      linkText="Voir ma grossesse"
                      color="pink"
                    >
                      <div className="space-y-2">
                        <p className="text-3xl font-bold text-pink-600">{getSemaineGrossesse()} SA</p>
                        <p className="text-sm text-gray-600 break-words">
                          Accouchement prévu le {format(new Date(grossesse.date_accouchement_prevue), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </DashboardWidget>
                  )}

                  {suiviContraception && !grossesse && (
                    <DashboardWidget
                      title="Contraception"
                      icon={Heart}
                      link={createPageUrl('Contraception')}
                      linkText="Gérer"
                      color="rose"
                    >
                      <p className="text-sm text-gray-700">Méthode active</p>
                      <Badge className="mt-2 bg-rose-100 text-rose-800">Suivi en cours</Badge>
                    </DashboardWidget>
                  )}

                  {dernierCycle && !grossesse && (
                    <DashboardWidget
                      title="Cycle & Fertilité"
                      icon={Activity}
                      link={createPageUrl('Cycle')}
                      linkText="Calendrier"
                      color="purple"
                    >
                      <p className="text-sm text-gray-600 break-words">
                        Dernier cycle: {format(new Date(dernierCycle.date_debut_regles), 'dd MMM', { locale: fr })}
                      </p>
                      <Badge variant="outline" className="mt-2">Durée: {dernierCycle.duree_cycle}j</Badge>
                    </DashboardWidget>
                  )}

                  <DashboardWidget
                    title="Carnets Enfants"
                    icon={Baby}
                    link={createPageUrl('Enfants')}
                    linkText="Voir les carnets"
                    color="blue"
                  >
                    <p className="text-3xl font-bold text-blue-600">{enfants.length}</p>
                    <p className="text-sm text-gray-600">Enfant(s) enregistré(s)</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {enfants.slice(0, 3).map(e => <Badge key={e.id} variant="outline" className="truncate max-w-full">{e.prenom}</Badge>)}
                    </div>
                  </DashboardWidget>

                  <DashboardWidget
                    title="Spécialistes"
                    icon={Stethoscope}
                    link={createPageUrl('Teleconsultation')}
                    linkText="Trouver un spécialiste"
                    color="teal"
                  >
                    <p className="text-sm text-gray-700 break-words">
                      Consultez des professionnels de santé certifiés
                    </p>
                    <Badge className="mt-2 bg-teal-100 text-teal-800">
                      {professionnels.length} disponibles
                    </Badge>
                  </DashboardWidget>
                </div>
              </TabTransition>
            </TabsContent>

            {/* Vue Rendez-vous */}
            <TabsContent value="rendez-vous" className="space-y-6 mt-6">
              <TabTransition selectedTab={vueActive}>
                {rdvActifs.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 break-words">
                      <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      Rendez-vous à venir ({rdvActifs.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rdvActifs.slice(0, 6).map((rdv) => {
                        const pro = professionnels.find(p => p.id === rdv.professionnel_id);
                        return (
                          <Card key={rdv.id} className="shadow-md overflow-hidden animate-slide-in-up">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <Calendar className="w-8 h-8 text-blue-600 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 break-words">
                                      {format(new Date(rdv.date_rdv), 'd MMM yyyy', { locale: fr })}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {format(new Date(rdv.date_rdv), 'HH:mm', { locale: fr })}
                                    </p>
                                  </div>
                                </div>
                                <Badge className={`flex-shrink-0 ml-2 ${
                                  rdv.statut === 'confirme' ? 'bg-green-100 text-green-800' :
                                  rdv.statut === 'planifie' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {rdv.statut}
                                </Badge>
                              </div>
                              {pro && (
                                <p className="text-sm text-gray-700 truncate">
                                  Dr. {pro.nom_complet} - {pro.specialite}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2 break-words">{rdv.motif}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Card className="shadow-lg">
                    <CardContent className="p-12 text-center">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2 break-words">
                        Aucun rendez-vous à venir
                      </h3>
                      <p className="text-gray-500 mb-4 break-words">
                        Vous n'avez pas encore de rendez-vous programmé
                      </p>
                      <Button asChild>
                        <Link to={createPageUrl('Teleconsultation')}>
                          Prendre rendez-vous
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {rdvPasses.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      Consultations passées ({rdvPasses.length})
                    </h3>
                    <div className="space-y-3">
                      {rdvPasses.slice(0, 5).map((rdv) => {
                        const pro = professionnels.find(p => p.id === rdv.professionnel_id);
                        return (
                          <Card key={rdv.id} className="shadow-sm overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-900 break-words">
                                      {format(new Date(rdv.date_rdv), 'd MMMM yyyy', { locale: fr })}
                                    </p>
                                    {pro && (
                                      <p className="text-sm text-gray-600 truncate">
                                        {pro.nom_complet} - {rdv.motif}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge className="bg-gray-100 text-gray-800 flex-shrink-0">
                                  {rdv.statut}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabTransition>
            </TabsContent>

            {/* Vue Documents */}
            <TabsContent value="documents" className="space-y-6 mt-6">
              <TabTransition selectedTab={vueActive}>
                {tousDocs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tousDocs.slice(0, 10).map((doc, idx) => (
                      <Card key={idx} className="shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <FileText className="w-8 h-8 text-gray-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 truncate">{doc.nom}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {doc.enfant_nom} - {format(new Date(doc.date_document), 'dd/MM/yyyy', { locale: fr })}
                                </p>
                                <Badge variant="outline" className="mt-2 text-xs truncate max-w-full">
                                  {doc.type}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="flex-shrink-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="shadow-lg">
                    <CardContent className="p-12 text-center">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2 break-words">
                        Aucun document
                      </h3>
                      <p className="text-gray-500 break-words">
                        Les documents médicaux apparaîtront ici
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabTransition>
            </TabsContent>

            {/* Vue Profil Santé */}
            <TabsContent value="profil" className="space-y-6 mt-6">
              <TabTransition selectedTab={vueActive}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informations médicales */}
                  <Card className="shadow-lg overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <Droplet className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <span className="truncate">Informations Médicales</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {profilMaman?.groupe_sanguin && (
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg gap-2">
                          <span className="text-sm text-gray-700">Groupe sanguin</span>
                          <Badge className="bg-red-600 text-white flex-shrink-0">{profilMaman.groupe_sanguin}</Badge>
                        </div>
                      )}
                      {profilMaman?.numero_cmu && (
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg gap-2">
                          <span className="text-sm text-gray-700">N° CMU</span>
                          <span className="text-sm font-mono truncate">{profilMaman.numero_cmu}</span>
                        </div>
                      )}
                      {profilMaman?.allergies && profilMaman.allergies.length > 0 && (
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <p className="text-sm font-semibold text-orange-900 mb-2">Allergies</p>
                          <div className="flex flex-wrap gap-2">
                            {profilMaman.allergies.map((allergie, idx) => (
                              <Badge key={idx} className="bg-orange-100 text-orange-800 truncate max-w-full">
                                {allergie}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button asChild variant="outline" className="w-full">
                        <Link to={createPageUrl('Parametres')}>
                          Modifier mon profil
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Statistiques santé */}
                  <Card className="shadow-lg overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="truncate">Mon Suivi</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-blue-600">{stats.rdvTotal}</p>
                          <p className="text-xs text-gray-600 break-words">Consultations</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-purple-600">{stats.enfants}</p>
                          <p className="text-xs text-gray-600 break-words">Enfants suivis</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-600">{stats.documents}</p>
                          <p className="text-xs text-gray-600 break-words">Documents</p>
                        </div>
                        <div className="p-3 bg-pink-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-pink-600 truncate">
                            {grossesse ? getSemaineGrossesse() + ' SA' : '-'}
                          </p>
                          <p className="text-xs text-gray-600 break-words">Grossesse</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabTransition>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
}