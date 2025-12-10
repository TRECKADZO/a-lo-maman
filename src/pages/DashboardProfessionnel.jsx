import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Users,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Clock,
  Settings,
  Stethoscope,
  X,
  Bell,
  Sparkles,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import OnboardingProfessionnel from '../components/onboarding/OnboardingProfessionnel';
import MetricsCharts from '../components/dashboard-pro/MetricsCharts';
import AlertesRisqueIA from '../components/dashboard-pro/AlertesRisqueIA';

export default function DashboardProfessionnel() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profiles, isLoading: loadingPro } = useQuery({
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

  const { data: mesPatients } = useQuery({
    queryKey: ['mes_patients', profilPro?.id],
    queryFn: async () => {
      if (!profilPro) return [];
      const enfants = await base44.entities.EnfantCarnet.filter({
        professionnels_suivi: { $in: [profilPro.id] }
      });
      return enfants;
    },
    enabled: !!profilPro,
    initialData: [],
  });

  const { data: mesRendezVous } = useQuery({
    queryKey: ['rdv_professionnel', profilPro?.id],
    queryFn: async () => {
      if (!profilPro) return [];
      const rdvs = await base44.entities.RendezVous.filter(
        { professionnel_id: profilPro.id },
        '-date_rdv'
      );
      return rdvs;
    },
    enabled: !!profilPro,
    initialData: [],
  });

  const { data: documentsUploaded = [] } = useQuery({
    queryKey: ['documents_uploaded'],
    queryFn: async () => {
      const docs = await base44.entities.DocumentMedical.list();
      return docs;
    },
    enabled: !!profilPro,
  });

  const confirmerMutation = useMutation({
    mutationFn: async (rdv) => {
      await base44.entities.RendezVous.update(rdv.id, {
        statut: 'confirme'
      });
      
      await base44.entities.Notification.create({
        destinataire_email: rdv.created_by,
        type: 'rendez_vous_confirmation',
        titre: '✅ Rendez-vous confirmé',
        message: `Votre rendez-vous du ${format(new Date(rdv.date_rdv), 'dd MMMM yyyy à HH:mm', { locale: fr })} a été confirmé !`,
        action_page: 'MesRendezVous',
        priorite: 'haute',
        icone: 'CheckCircle',
      });

      await base44.integrations.Core.SendEmail({
        to: rdv.created_by,
        subject: '✅ Rendez-vous confirmé - A\'lo Maman',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom right, #f0fdfa, #ccfbf1); border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 64px; height: 64px; margin: 0 auto; background: linear-gradient(to bottom right, #14b8a6, #06b6d4); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px; color: white;">✓</span>
              </div>
            </div>
            
            <h2 style="color: #0f766e; text-align: center; font-size: 24px; margin-bottom: 16px;">
              Rendez-vous confirmé !
            </h2>
            
            <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #0f766e; font-size: 16px; margin-bottom: 12px;">📋 Détails du rendez-vous :</h3>
              <p style="color: #374151; margin: 8px 0;">
                <strong>Date :</strong> ${format(new Date(rdv.date_rdv), 'EEEE dd MMMM yyyy', { locale: fr })}
              </p>
              <p style="color: #374151; margin: 8px 0;">
                <strong>Heure :</strong> ${format(new Date(rdv.date_rdv), 'HH:mm')}
              </p>
              <p style="color: #374151; margin: 8px 0;">
                <strong>Type :</strong> ${rdv.type_consultation}
              </p>
              <p style="color: #374151; margin: 8px 0;">
                <strong>Motif :</strong> ${rdv.motif || 'Non précisé'}
              </p>
            </div>
            
            <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
              <p style="color: #065f46; margin: 0; font-size: 14px;">
                <strong>✨ Votre rendez-vous est maintenant confirmé.</strong><br/>
                Vous recevrez un rappel 24h avant et 1h avant votre consultation.
              </p>
            </div>
            
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #cbd5e1;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                © 2025 A'lo Maman - Plateforme de santé maternelle et infantile
              </p>
            </div>
          </div>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv_professionnel'] });
    },
  });

  // Loaders
  if (userLoading || loadingPro) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
        <p className="text-gray-600">Chargement de votre espace professionnel...</p>
      </div>
    );
  }

  // Filtrer les RDV
  const rdvAujourdhui = mesRendezVous.filter(rdv => 
    isToday(new Date(rdv.date_rdv)) && rdv.statut !== 'annule'
  );

  const rdvDemain = mesRendezVous.filter(rdv => 
    isTomorrow(new Date(rdv.date_rdv)) && rdv.statut !== 'annule'
  );

  const prochainRdv = mesRendezVous.find(rdv => 
    new Date(rdv.date_rdv) > new Date() && rdv.statut !== 'annule'
  );

  const stats = {
    patients_total: mesPatients.length,
    rdv_aujourdhui: rdvAujourdhui.length,
    rdv_semaine: mesRendezVous.filter(rdv => {
      const dateRdv = new Date(rdv.date_rdv);
      const dans7jours = addDays(new Date(), 7);
      return dateRdv >= new Date() && dateRdv <= dans7jours && rdv.statut !== 'annule';
    }).length,
  };

  const profilIncomplet = profilPro && !profilPro.onboarding_completed;

  if (showOnboarding && profilPro) {
    return (
      <div className="min-h-full bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-950 dark:to-black">
        <div className="p-4">
          <Button
            onClick={() => setShowOnboarding(false)}
            variant="ghost"
            className="mb-4"
          >
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
        </div>
        <OnboardingProfessionnel 
          professionnel={profilPro}
          onComplete={() => setShowOnboarding(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-950 dark:to-black pb-24 md:pb-8" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
      <div className="p-4 md:p-6 space-y-6">
        {profilIncomplet && (
          <Alert className="border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 flex items-center justify-between">
              <span>
                <strong>Votre profil est incomplet.</strong> Complétez-le pour être visible par les patients et recevoir des rendez-vous.
              </span>
              <Button 
                onClick={() => setShowOnboarding(true)}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 ml-4"
              >
                Compléter maintenant →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-none bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-teal-600" />
              Bonjour, Dr. {profilPro?.display_name || profilPro?.nom_complet || user?.full_name || 'Professionnel'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Bienvenue sur votre espace professionnel.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-none bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Patients suivis</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.patients_total}</p>
                </div>
                <Users className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">RDV aujourd'hui</p>
                  <p className="text-3xl font-bold text-green-600">{stats.rdv_aujourdhui}</p>
                </div>
                <Calendar className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">RDV cette semaine</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.rdv_semaine}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques interactifs */}
        <MetricsCharts 
          patients={mesPatients} 
          appointments={mesRendezVous}
          documents={documentsUploaded}
        />

        {/* Alertes IA */}
        <AlertesRisqueIA profesionnelEmail={user?.email} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-none bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Tableau de bord analytique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Analysez vos performances, revenus et l'utilisation des fonctionnalités en détail.
              </p>
              <Button 
                asChild
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Link to={createPageUrl('DashboardAnalytics')}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Voir les statistiques
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-cyan-600" />
                Assistant IA Professionnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Obtenez de l'aide instantanée sur la facturation, les fonctionnalités et les bonnes pratiques.
              </p>
              <Button 
                asChild
                variant="outline"
                className="w-full border-cyan-300 text-cyan-700 hover:bg-cyan-50"
              >
                <Link to={createPageUrl('AssistantIAPro')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Poser une question
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prochainRdv && (
            <Card className={`shadow-lg border-none ${
              prochainRdv.statut === 'planifie' 
                ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-l-orange-500' 
                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-600" />
                    Prochain rendez-vous
                  </div>
                  <Badge className={
                    prochainRdv.statut === 'planifie'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  }>
                    {prochainRdv.statut === 'planifie' ? 'Planifié' : 'Confirmé'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="font-semibold text-gray-800">
                    {format(new Date(prochainRdv.date_rdv), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                  </p>
                  <Badge variant="outline">{prochainRdv.type_consultation}</Badge>
                  {prochainRdv.motif && (
                    <p className="text-sm text-gray-600">{prochainRdv.motif}</p>
                  )}
                </div>

                {prochainRdv.statut === 'planifie' && (
                  <Alert className="bg-orange-50 border-orange-300">
                    <Bell className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-xs text-orange-800">
                      ⏳ En attente de votre confirmation
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  {prochainRdv.statut === 'planifie' && (
                    <Button 
                      onClick={() => confirmerMutation.mutate(prochainRdv)}
                      disabled={confirmerMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                    >
                      {confirmerMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmer
                        </>
                      )}
                    </Button>
                  )}
                  <Button 
                    asChild 
                    variant={prochainRdv.statut === 'planifie' ? 'outline' : 'default'}
                    className={prochainRdv.statut === 'planifie' ? 'flex-1' : 'w-full bg-teal-600 hover:bg-teal-700'}
                  >
                    <Link to={createPageUrl('MonAgenda')}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Voir l'agenda
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-600" />
                Mes patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mesPatients.length > 0 ? (
                <>
                  <p className="text-gray-600 mb-4">
                    Vous suivez actuellement {mesPatients.length} patient{mesPatients.length > 1 ? 's' : ''}.
                  </p>
                  <div className="space-y-2">
                    {mesPatients.slice(0, 3).map(patient => (
                      <div key={patient.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="font-medium">{patient.prenom} {patient.nom}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-600 mb-4">Aucun patient pour le moment.</p>
              )}
              <Button asChild variant="outline" className="w-full mt-4">
                <Link to={createPageUrl('MesPatients')}>Gérer mes patients</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-none bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
              Gérer mes disponibilités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Définissez vos horaires de consultation pour que les patients puissent prendre rendez-vous.
            </p>
            <Button 
              asChild
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Link to={createPageUrl('ConfigurerAgenda')}>
                <Settings className="w-4 h-4 mr-2" />
                Configurer mon agenda
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-gradient-to-r from-orange-50 to-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-orange-600" />
              Rappels automatiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Configurez et envoyez des rappels automatiques à vos patients avant leurs rendez-vous.
            </p>
            <Button 
              asChild
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Link to={createPageUrl('GestionRappels')}>
                <Bell className="w-4 h-4 mr-2" />
                Gérer les rappels
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Accès rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link to={createPageUrl('MonAgenda')}>
                  <Calendar className="w-6 h-6 mb-2" />
                  Mon Agenda
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link to={createPageUrl('MesPatients')}>
                  <Users className="w-6 h-6 mb-2" />
                  Mes Patients
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link to={createPageUrl('Messagerie')}>
                  <MessageSquare className="w-6 h-6 mb-2" />
                  Messagerie
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link to={createPageUrl('DashboardAnalytics')}>
                  <TrendingUp className="w-6 h-6 mb-2" />
                  Analytics
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link to={createPageUrl('ProfilProfessionnel')}>
                  <Settings className="w-6 h-6 mb-2" />
                  Mon Profil
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}