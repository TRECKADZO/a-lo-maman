
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Bell,
  Clock,
  Mail,
  MessageSquare,
  Send,
  Settings,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  User,
  Info,
  Zap,
  Syringe,
  Pill,
  Plus,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, differenceInHours, differenceInMinutes, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function GestionRappels() {
  const queryClient = useQueryClient();
  const [sendingReminders, setSendingReminders] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profilPro, isLoading: loadingPro } = useQuery({
    queryKey: ['profil_professionnel', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    },
    enabled: !!user,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  // Configuration par défaut des rappels
  const defaultConfig = {
    // RDV
    rappel_rdv_24h_actif: true,
    rappel_rdv_1h_actif: true,
    rappel_rdv_email: true,
    rappel_rdv_notification: true,
    rappel_rdv_sms: false,
    message_rdv_24h: "Rappel : Vous avez un rendez-vous demain à {heure} pour {motif}.",
    message_rdv_1h: "Rappel : Votre rendez-vous commence dans 1 heure - {motif}.",
    
    // Vaccins
    rappel_vaccins_actif: true,
    rappel_vaccins_delai_jours: 7, // J-7
    rappel_vaccins_email: true,
    rappel_vaccins_notification: true,
    rappel_vaccins_sms: false,
    message_vaccins: "Rappel de vaccination : {nom_vaccin} prévu le {date} pour {patient}.",
    
    // Médicaments
    rappel_medicaments_actif: true,
    rappel_medicaments_quotidien: true,
    rappel_medicaments_heures: ["08:00", "14:00", "20:00"],
    rappel_medicaments_notification: true,
    rappel_medicaments_sms: false,
    message_medicaments: "🔔 Prise de médicament : {medicament} - {dosage}"
  };

  const [config, setConfig] = useState(
    profilPro?.config_rappels || defaultConfig
  );

  const [nouvelleHeure, setNouvelleHeure] = useState("");

  const { data: rendezVous = [] } = useQuery({
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
  });

  // Récupérer les carnets d'enfants suivis
  const { data: enfantsSuivis = [] } = useQuery({
    queryKey: ['enfants_suivis', profilPro?.id],
    queryFn: async () => {
      if (!profilPro) return [];
      return await base44.entities.EnfantCarnet.filter({
        professionnels_suivi: { $in: [profilPro.id] }
      });
    },
    enabled: !!profilPro
  });

  // Filtrer les vaccins en attente
  const vaccinsAVenir = enfantsSuivis.flatMap(enfant => 
    (enfant.vaccins || [])
      .filter(vaccin => {
        if (!vaccin.prochain_rappel) return false;
        const joursRestants = differenceInDays(new Date(vaccin.prochain_rappel), new Date());
        return joursRestants > 0 && joursRestants <= config.rappel_vaccins_delai_jours;
      })
      .map(vaccin => ({
        ...vaccin,
        enfant_id: enfant.id,
        enfant_prenom: enfant.prenom,
        patient_email: enfant.created_by,
        jours_restants: differenceInDays(new Date(vaccin.prochain_rappel), new Date())
      }))
  );

  // Filtrer les RDV nécessitant des rappels
  const rdvPourRappel24h = rendezVous.filter(rdv => {
    if (rdv.statut === 'annule' || rdv.rappel_24h_envoye) return false;
    const heuresRestantes = differenceInHours(new Date(rdv.date_rdv), new Date());
    return heuresRestantes > 20 && heuresRestantes <= 28;
  });

  const rdvPourRappel1h = rendezVous.filter(rdv => {
    if (rdv.statut === 'annule' || rdv.rappel_1h_envoye) return false;
    const minutesRestantes = differenceInMinutes(new Date(rdv.date_rdv), new Date());
    return minutesRestantes > 50 && minutesRestantes <= 70;
  });

  const rdvAVenir = rendezVous.filter(rdv => 
    new Date(rdv.date_rdv) > new Date() && rdv.statut !== 'annule'
  );

  const saveConfigMutation = useMutation({
    mutationFn: async (newConfig) => {
      await base44.entities.Professionnel.update(profilPro.id, {
        config_rappels: newConfig
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profil_professionnel'] });
      alert('✅ Configuration enregistrée avec succès !');
    },
  });

  const envoyerRappelMutation = useMutation({
    mutationFn: async ({ rdv, type }) => {
      const message = type === '24h' 
        ? config.message_rdv_24h 
        : config.message_rdv_1h;
      
      const messageFormate = message
        .replace('{heure}', format(new Date(rdv.date_rdv), 'HH:mm', { locale: fr }))
        .replace('{date}', format(new Date(rdv.date_rdv), 'dd/MM/yyyy', { locale: fr }))
        .replace('{motif}', rdv.motif || 'consultation');

      const promises = [];

      // Envoyer notification in-app
      if (config.rappel_rdv_notification) {
        promises.push(
          base44.entities.Notification.create({
            destinataire_email: rdv.created_by,
            type: 'rendez_vous_rappel',
            titre: `Rappel : RDV ${type === '24h' ? 'demain' : 'dans 1h'}`,
            message: messageFormate,
            priorite: type === '1h' ? 'haute' : 'normale',
            icone: 'Bell',
            action_page: 'Teleconsultation',
          })
        );
      }

      // Envoyer email
      if (config.rappel_rdv_email) {
        promises.push(
          base44.integrations.Core.SendEmail({
            to: rdv.created_by,
            subject: `Rappel de rendez-vous - ${format(new Date(rdv.date_rdv), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
            body: `
              <h2>Rappel de rendez-vous</h2>
              <p>${messageFormate}</p>
              <p><strong>Date et heure :</strong> ${format(new Date(rdv.date_rdv), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}</p>
              <p><strong>Type :</strong> ${rdv.type_consultation}</p>
              ${rdv.adresse_consultation ? `<p><strong>Lieu :</strong> ${rdv.adresse_consultation}</p>` : ''}
              <p>Cordialement,<br/>${profilPro.nom_complet}</p>
            `
          })
        );
      }

      await Promise.all(promises);

      // Marquer le rappel comme envoyé
      const updateField = type === '24h' ? { rappel_24h_envoye: true } : { rappel_1h_envoye: true };
      await base44.entities.RendezVous.update(rdv.id, updateField);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv_professionnel'] });
    },
  });

  const envoyerRappelVaccinMutation = useMutation({
    mutationFn: async ({ vaccin }) => {
      const messageFormate = config.message_vaccins
        .replace('{nom_vaccin}', vaccin.nom_vaccin)
        .replace('{date}', format(new Date(vaccin.prochain_rappel), 'dd/MM/yyyy', { locale: fr }))
        .replace('{patient}', vaccin.enfant_prenom);

      const promises = [];

      if (config.rappel_vaccins_notification) {
        promises.push(
          base44.entities.Notification.create({
            destinataire_email: vaccin.patient_email,
            type: 'vaccin_rappel',
            titre: 'Rappel de vaccination',
            message: messageFormate,
            priorite: 'normale',
            icone: 'Syringe',
            action_page: 'Enfants',
          })
        );
      }

      if (config.rappel_vaccins_email) {
        promises.push(
          base44.integrations.Core.SendEmail({
            to: vaccin.patient_email,
            subject: `Rappel vaccination - ${vaccin.nom_vaccin}`,
            body: `
              <h2>Rappel de vaccination</h2>
              <p>${messageFormate}</p>
              <p><strong>Vaccin :</strong> ${vaccin.nom_vaccin}</p>
              <p><strong>Patient :</strong> ${vaccin.enfant_prenom}</p>
              <p><strong>Date prévue :</strong> ${format(new Date(vaccin.prochain_rappel), 'dd MMMM yyyy', { locale: fr })}</p>
              <p>Pensez à prendre rendez-vous dès que possible.</p>
              <p>Cordialement,<br/>${profilPro.nom_complet}</p>
            `
          })
        );
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      alert('✅ Rappel de vaccination envoyé');
    },
  });

  const envoyerTousLesRappels = async () => {
    setSendingReminders(true);
    try {
      const promises = [];

      if (config.rappel_rdv_24h_actif) {
        rdvPourRappel24h.forEach(rdv => {
          promises.push(envoyerRappelMutation.mutateAsync({ rdv, type: '24h' }));
        });
      }

      if (config.rappel_rdv_1h_actif) {
        rdvPourRappel1h.forEach(rdv => {
          promises.push(envoyerRappelMutation.mutateAsync({ rdv, type: '1h' }));
        });
      }

      if (config.rappel_vaccins_actif) {
        vaccinsAVenir.forEach(vaccin => {
          promises.push(envoyerRappelVaccinMutation.mutateAsync({ vaccin }));
        });
      }

      await Promise.all(promises);
      alert(`✅ ${promises.length} rappel(s) envoyé(s) avec succès !`);
    } catch (error) {
      alert('❌ Erreur lors de l\'envoi des rappels');
    } finally {
      setSendingReminders(false);
    }
  };

  const ajouterHeureRappel = () => {
    if (!nouvelleHeure) return;
    if (config.rappel_medicaments_heures.includes(nouvelleHeure)) {
      alert('Cette heure existe déjà');
      return;
    }
    setConfig({
      ...config,
      rappel_medicaments_heures: [...config.rappel_medicaments_heures, nouvelleHeure].sort()
    });
    setNouvelleHeure("");
  };

  const supprimerHeureRappel = (heure) => {
    setConfig({
      ...config,
      rappel_medicaments_heures: config.rappel_medicaments_heures.filter(h => h !== heure)
    });
  };

  if (loadingPro) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  const stats = {
    rappels24h: rdvPourRappel24h.length,
    rappels1h: rdvPourRappel1h.length,
    rdvAVenir: rdvAVenir.length,
    vaccinsAVenir: vaccinsAVenir.length,
    totalRappels: rdvPourRappel24h.length + rdvPourRappel1h.length + vaccinsAVenir.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-gray-900 dark:to-gray-950">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" className="mb-2 -ml-2">
              <Link to={createPageUrl('MonAgenda')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'agenda
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Bell className="w-8 h-8 text-purple-600" />
              </div>
              Rappels automatiques
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configurez et gérez tous les rappels : RDV, vaccins, médicaments
            </p>
          </div>

          <Button
            onClick={envoyerTousLesRappels}
            disabled={sendingReminders || stats.totalRappels === 0}
            className="bg-purple-600 hover:bg-purple-700 shadow-md"
          >
            {sendingReminders ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer tous les rappels ({stats.totalRappels})
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Rappels RDV 24h</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.rappels24h}</p>
                  <p className="text-xs text-gray-500 mt-1">À envoyer</p>
                </div>
                <Clock className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Rappels RDV 1h</p>
                  <p className="text-3xl font-bold text-red-600">{stats.rappels1h}</p>
                  <p className="text-xs text-gray-500 mt-1">Urgent</p>
                </div>
                <Zap className="w-12 h-12 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Vaccins à venir</p>
                  <p className="text-3xl font-bold text-green-600">{stats.vaccinsAVenir}</p>
                  <p className="text-xs text-gray-500 mt-1">J-{config.rappel_vaccins_delai_jours}</p>
                </div>
                <Syringe className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">RDV à venir</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.rdvAVenir}</p>
                  <p className="text-xs text-gray-500 mt-1">Total</p>
                </div>
                <Calendar className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        <Alert className="bg-purple-50 border-purple-200">
          <Info className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-purple-800">
            <strong>💡 Système de rappels automatiques avancé</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• <strong>Rendez-vous :</strong> Rappels 24h et 1h avant (configurable)</li>
              <li>• <strong>Vaccins :</strong> Rappels X jours avant la date prévue</li>
              <li>• <strong>Médicaments :</strong> Rappels quotidiens aux heures définies</li>
              <li>• <strong>Canaux :</strong> Email, notification in-app, SMS (bientôt)</li>
              <li>• <strong>Messages personnalisables</strong> avec variables dynamiques</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="rappels" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rappels">
              <Bell className="w-4 h-4 mr-2" />
              Rappels en attente
            </TabsTrigger>
            <TabsTrigger value="configuration">
              <Settings className="w-4 h-4 mr-2" />
              Configuration avancée
            </TabsTrigger>
          </TabsList>

          {/* Rappels en attente */}
          <TabsContent value="rappels" className="space-y-4">
            {/* Rappels RDV 24h */}
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Rappels RDV 24 heures ({rdvPourRappel24h.length})
                  </span>
                  {rdvPourRappel24h.length > 0 && (
                    <Badge className="bg-orange-600 text-white">À envoyer</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rdvPourRappel24h.length > 0 ? (
                  <div className="space-y-3">
                    {rdvPourRappel24h.map(rdv => (
                      <Card key={rdv.id} className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <User className="w-4 h-4 text-gray-600" />
                                <p className="font-semibold text-gray-900">{rdv.created_by}</p>
                                <Badge variant="outline">{rdv.type_consultation}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{format(new Date(rdv.date_rdv), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{rdv.motif}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => envoyerRappelMutation.mutate({ rdv, type: '24h' })}
                              disabled={envoyerRappelMutation.isPending}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Envoyer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="font-medium">Aucun rappel 24h en attente</p>
                    <p className="text-sm">Tous les rappels ont été envoyés</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rappels RDV 1h */}
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-red-600" />
                    Rappels RDV 1 heure ({rdvPourRappel1h.length})
                  </span>
                  {rdvPourRappel1h.length > 0 && (
                    <Badge className="bg-red-600 text-white">Urgent</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rdvPourRappel1h.length > 0 ? (
                  <div className="space-y-3">
                    {rdvPourRappel1h.map(rdv => (
                      <Card key={rdv.id} className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <User className="w-4 h-4 text-gray-600" />
                                <p className="font-semibold text-gray-900">{rdv.created_by}</p>
                                <Badge variant="outline">{rdv.type_consultation}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{format(new Date(rdv.date_rdv), 'HH:mm', { locale: fr })}</span>
                                <Badge className="bg-red-600 text-white text-xs">
                                  Dans {differenceInMinutes(new Date(rdv.date_rdv), new Date())} min
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{rdv.motif}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => envoyerRappelMutation.mutate({ rdv, type: '1h' })}
                              disabled={envoyerRappelMutation.isPending}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Envoyer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="font-medium">Aucun rappel 1h en attente</p>
                    <p className="text-sm">Tous les rappels ont été envoyés</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rappels Vaccins */}
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Syringe className="w-5 h-5 text-green-600" />
                    Rappels de vaccination ({vaccinsAVenir.length})
                  </span>
                  {vaccinsAVenir.length > 0 && (
                    <Badge className="bg-green-600 text-white">J-{config.rappel_vaccins_delai_jours}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vaccinsAVenir.length > 0 ? (
                  <div className="space-y-3">
                    {vaccinsAVenir.map((vaccin, index) => (
                      <Card key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <User className="w-4 h-4 text-gray-600" />
                                <p className="font-semibold text-gray-900">{vaccin.enfant_prenom}</p>
                                <Badge className="bg-green-600 text-white text-xs">
                                  J-{vaccin.jours_restants}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <Syringe className="w-4 h-4" />
                                <span className="font-semibold">{vaccin.nom_vaccin}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>Prévu le {format(new Date(vaccin.prochain_rappel), 'dd MMMM yyyy', { locale: fr })}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => envoyerRappelVaccinMutation.mutate({ vaccin })}
                              disabled={envoyerRappelVaccinMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Envoyer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="font-medium">Aucun vaccin à rappeler</p>
                    <p className="text-sm">Tous les vaccins sont à jour</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration */}
          <TabsContent value="configuration" className="space-y-6">
            <Tabs defaultValue="rdv" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="rdv">
                  <Calendar className="w-4 h-4 mr-2" />
                  Rendez-vous
                </TabsTrigger>
                <TabsTrigger value="vaccins">
                  <Syringe className="w-4 h-4 mr-2" />
                  Vaccins
                </TabsTrigger>
                <TabsTrigger value="medicaments">
                  <Pill className="w-4 h-4 mr-2" />
                  Médicaments
                </TabsTrigger>
              </TabsList>

              {/* Config RDV */}
              <TabsContent value="rdv" className="space-y-4">
                <Card className="shadow-lg border-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-teal-600" />
                      Paramètres des rappels de RDV
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Activation */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Activation</h3>
                      
                      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <div>
                            <Label className="font-semibold">Rappel 24 heures avant</Label>
                            <p className="text-sm text-gray-600">Envoyer un rappel la veille</p>
                          </div>
                        </div>
                        <Switch
                          checked={config.rappel_rdv_24h_actif}
                          onCheckedChange={(checked) => setConfig({ ...config, rappel_rdv_24h_actif: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-red-600" />
                          <div>
                            <Label className="font-semibold">Rappel 1 heure avant</Label>
                            <p className="text-sm text-gray-600">Rappel juste avant le RDV</p>
                          </div>
                        </div>
                        <Switch
                          checked={config.rappel_rdv_1h_actif}
                          onCheckedChange={(checked) => setConfig({ ...config, rappel_rdv_1h_actif: checked })}
                        />
                      </div>
                    </div>

                    {/* Canaux */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Canaux de communication</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className={`p-4 rounded-lg border-2 transition-all ${config.rappel_rdv_email ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <Mail className="w-5 h-5 text-blue-600" />
                            <Switch
                              checked={config.rappel_rdv_email}
                              onCheckedChange={(checked) => setConfig({ ...config, rappel_rdv_email: checked })}
                            />
                          </div>
                          <Label className="font-semibold">Email</Label>
                        </div>

                        <div className={`p-4 rounded-lg border-2 transition-all ${config.rappel_rdv_notification ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <Bell className="w-5 h-5 text-purple-600" />
                            <Switch
                              checked={config.rappel_rdv_notification}
                              onCheckedChange={(checked) => setConfig({ ...config, rappel_rdv_notification: checked })}
                            />
                          </div>
                          <Label className="font-semibold">Notification</Label>
                        </div>

                        <div className={`p-4 rounded-lg border-2 transition-all ${config.rappel_rdv_sms ? 'border-green-300 bg-green-50' : 'border-gray-200 opacity-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <MessageSquare className="w-5 h-5 text-green-600" />
                            <Switch
                              checked={config.rappel_rdv_sms}
                              onCheckedChange={(checked) => setConfig({ ...config, rappel_rdv_sms: checked })}
                              disabled
                            />
                          </div>
                          <Label className="font-semibold">SMS</Label>
                          <Badge variant="outline" className="mt-1 text-xs">Bientôt</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Messages personnalisés</h3>
                      <Alert>
                        <Info className="w-4 h-4" />
                        <AlertDescription className="text-sm">
                          Variables : <code>{'{heure}'}</code>, <code>{'{date}'}</code>, <code>{'{motif}'}</code>
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label>Message rappel 24h</Label>
                        <Textarea
                          value={config.message_rdv_24h}
                          onChange={(e) => setConfig({ ...config, message_rdv_24h: e.target.value })}
                          className="min-h-20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Message rappel 1h</Label>
                        <Textarea
                          value={config.message_rdv_1h}
                          onChange={(e) => setConfig({ ...config, message_rdv_1h: e.target.value })}
                          className="min-h-20"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Config Vaccins */}
              <TabsContent value="vaccins" className="space-y-4">
                <Card className="shadow-lg border-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Syringe className="w-5 h-5 text-green-600" />
                      Paramètres des rappels de vaccination
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <Label className="font-semibold">Activer les rappels de vaccination</Label>
                        <p className="text-sm text-gray-600 mt-1">Envoyer des rappels avant les dates de vaccination</p>
                      </div>
                      <Switch
                        checked={config.rappel_vaccins_actif}
                        onCheckedChange={(checked) => setConfig({ ...config, rappel_vaccins_actif: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Délai de rappel (jours avant)</Label>
                      <Input
                        type="number"
                        value={config.rappel_vaccins_delai_jours}
                        onChange={(e) => setConfig({ ...config, rappel_vaccins_delai_jours: parseInt(e.target.value) })}
                        min="1"
                        max="30"
                      />
                      <p className="text-xs text-gray-500">Envoyer le rappel X jours avant la date prévue</p>
                    </div>

                    {/* Canaux */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className={`p-4 rounded-lg border-2 ${config.rappel_vaccins_email ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <Switch
                            checked={config.rappel_vaccins_email}
                            onCheckedChange={(checked) => setConfig({ ...config, rappel_vaccins_email: checked })}
                          />
                        </div>
                        <Label className="font-semibold">Email</Label>
                      </div>

                      <div className={`p-4 rounded-lg border-2 ${config.rappel_vaccins_notification ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <Bell className="w-5 h-5 text-purple-600" />
                          <Switch
                            checked={config.rappel_vaccins_notification}
                            onCheckedChange={(checked) => setConfig({ ...config, rappel_vaccins_notification: checked })}
                          />
                        </div>
                        <Label className="font-semibold">Notification</Label>
                      </div>

                      <div className="p-4 rounded-lg border-2 border-gray-200 opacity-50">
                        <div className="flex items-center justify-between mb-2">
                          <MessageSquare className="w-5 h-5 text-green-600" />
                          <Switch checked={false} disabled />
                        </div>
                        <Label className="font-semibold">SMS</Label>
                        <Badge variant="outline" className="mt-1 text-xs">Bientôt</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Message personnalisé</Label>
                      <Alert>
                        <Info className="w-4 h-4" />
                        <AlertDescription className="text-sm">
                          Variables : <code>{'{nom_vaccin}'}</code>, <code>{'{date}'}</code>, <code>{'{patient}'}</code>
                        </AlertDescription>
                      </Alert>
                      <Textarea
                        value={config.message_vaccins}
                        onChange={(e) => setConfig({ ...config, message_vaccins: e.target.value })}
                        className="min-h-20"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Config Médicaments */}
              <TabsContent value="medicaments" className="space-y-4">
                <Card className="shadow-lg border-none">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5 text-indigo-600" />
                      Paramètres des rappels de médicaments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>Note :</strong> Cette fonctionnalité permet aux patients de recevoir des rappels pour leur prise de médicaments. La configuration est gérée depuis leur profil.
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div>
                        <Label className="font-semibold">Activer les rappels de médicaments</Label>
                        <p className="text-sm text-gray-600 mt-1">Permettre aux patients de configurer des rappels</p>
                      </div>
                      <Switch
                        checked={config.rappel_medicaments_actif}
                        onCheckedChange={(checked) => setConfig({ ...config, rappel_medicaments_actif: checked })}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Heures de rappel par défaut</h3>
                      <p className="text-sm text-gray-600">Heures suggérées aux patients pour leurs rappels quotidiens</p>
                      
                      <div className="flex gap-2">
                        <Input
                          type="time"
                          value={nouvelleHeure}
                          onChange={(e) => setNouvelleHeure(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={ajouterHeureRappel}
                          disabled={!nouvelleHeure}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {config.rappel_medicaments_heures.map(heure => (
                          <Badge key={heure} className="bg-indigo-100 text-indigo-800 px-3 py-2 text-sm">
                            <Clock className="w-3 h-3 mr-2" />
                            {heure}
                            <button
                              onClick={() => supprimerHeureRappel(heure)}
                              className="ml-2 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Message personnalisé</Label>
                      <Alert>
                        <Info className="w-4 h-4" />
                        <AlertDescription className="text-sm">
                          Variables : <code>{'{medicament}'}</code>, <code>{'{dosage}'}</code>
                        </AlertDescription>
                      </Alert>
                      <Textarea
                        value={config.message_medicaments}
                        onChange={(e) => setConfig({ ...config, message_medicaments: e.target.value })}
                        className="min-h-20"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => setConfig(profilPro?.config_rappels || defaultConfig)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => saveConfigMutation.mutate(config)}
                disabled={saveConfigMutation.isPending}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                {saveConfigMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Enregistrer la configuration
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
