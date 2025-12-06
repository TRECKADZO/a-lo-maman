import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Video as VideoIcon,
  User,
  CheckCircle,
  XCircle,
  Edit,
  Loader2,
  AlertCircle,
  FileText,
  Briefcase,
  Phone,
  Building2,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';
import IntegrationVideoCall from './IntegrationVideoCall';

export default function GestionRendezVous({ rdv, currentUserEmail, isSpecialist }) {
  const queryClient = useQueryClient();
  const [showActions, setShowActions] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [notes, setNotes] = useState(rdv.notes_professionnel || '');

  const { data: professionnel } = useQuery({
    queryKey: ['professionnel', rdv.professionnel_id],
    queryFn: async () => {
      const pros = await base44.entities.Professionnel.filter({ id: rdv.professionnel_id });
      return pros[0] || null;
    },
    enabled: !rdv.professionnel_nom && !!rdv.professionnel_id,
  });

  const nomProfessionnel = rdv.professionnel_nom || professionnel?.nom_complet || rdv.professionnel_email || 'Professionnel';

  const confirmerMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.RendezVous.update(rdv.id, {
        statut: 'confirme'
      });
      
      await base44.entities.Notification.create({
        destinataire_email: rdv.created_by,
        type: 'rendez_vous_confirmation',
        titre: '✅ Rendez-vous confirmé',
        message: `Votre rendez-vous du ${format(new Date(rdv.date_rdv), 'dd MMMM yyyy à HH:mm', { locale: fr })} avec ${nomProfessionnel} a été confirmé !`,
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
                <strong>Professionnel :</strong> ${nomProfessionnel}
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
      queryClient.invalidateQueries({ queryKey: ['mes_rendez_vous'] });
      queryClient.invalidateQueries({ queryKey: ['rdv_professionnel'] });
      setShowActions(false);
    },
  });

  const reprogrammerMutation = useMutation({
    mutationFn: async () => {
      const newDateTime = `${newDate}T${newTime}:00`;
      
      await base44.entities.RendezVous.update(rdv.id, {
        ancien_date_rdv: rdv.date_rdv,
        date_rdv: newDateTime,
        reprogramme: true,
        statut: 'planifie'
      });
      
      await base44.entities.Notification.create({
        destinataire_email: isSpecialist ? rdv.created_by : rdv.professionnel_email,
        type: 'rendez_vous_confirmation',
        titre: 'Rendez-vous reprogrammé',
        message: `Votre rendez-vous a été reprogrammé au ${format(new Date(newDateTime), 'dd MMMM yyyy à HH:mm', { locale: fr })}.`,
        action_page: isSpecialist ? 'Teleconsultation' : 'MonAgenda',
        priorite: 'haute',
        icone: 'Calendar',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes_rendez_vous'] });
      queryClient.invalidateQueries({ queryKey: ['rdv_professionnel'] });
      setShowReschedule(false);
    },
  });

  const annulerMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.RendezVous.update(rdv.id, {
        statut: 'annule',
        raison_annulation: cancelReason,
        annule_par: isSpecialist ? 'professionnel' : 'patient',
        date_annulation: new Date().toISOString()
      });
      
      await base44.entities.Notification.create({
        destinataire_email: isSpecialist ? rdv.created_by : rdv.professionnel_email,
        type: 'rendez_vous_annulation',
        titre: 'Rendez-vous annulé',
        message: `Le rendez-vous du ${format(new Date(rdv.date_rdv), 'dd MMMM yyyy à HH:mm', { locale: fr })} a été annulé. Raison: ${cancelReason}`,
        action_page: isSpecialist ? 'Teleconsultation' : 'MonAgenda',
        priorite: 'haute',
        icone: 'XCircle',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes_rendez_vous'] });
      queryClient.invalidateQueries({ queryKey: ['rdv_professionnel'] });
      setShowCancel(false);
    },
  });

  const terminerMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.RendezVous.update(rdv.id, {
        statut: 'termine',
        notes_professionnel: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv_professionnel'] });
      setShowNotes(false);
    },
  });

  const getStatusColor = (statut) => {
    switch(statut) {
      case 'confirme': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md';
      case 'planifie': return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md';
      case 'termine': return 'bg-gray-100 text-gray-800';
      case 'en_cours': return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-md';
      case 'annule': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut) => {
    switch(statut) {
      case 'confirme': return <CheckCircle className="w-3 h-3" />;
      case 'planifie': return <Clock className="w-3 h-3" />;
      case 'termine': return <CheckCircle className="w-3 h-3" />;
      case 'en_cours': return <VideoIcon className="w-3 h-3" />;
      case 'annule': return <XCircle className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getStatusLabel = (statut) => {
    switch(statut) {
      case 'confirme': return 'Confirmé';
      case 'planifie': return 'En attente';
      case 'termine': return 'Terminé';
      case 'en_cours': return 'En cours';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  const getIconType = (type) => {
    switch(type) {
      case 'teleconsultation': return <VideoIcon className="w-4 h-4" />;
      case 'cabinet': return <Briefcase className="w-4 h-4" />;
      case 'clinique': return <Briefcase className="w-4 h-4" />;
      case 'hopital': return <Building2 className="w-4 h-4" />;
      case 'domicile': return <MapPin className="w-4 h-4" />;
      case 'telephone': return <Phone className="w-4 h-4" />;
      case 'visio': return <VideoIcon className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'teleconsultation': return 'Téléconsultation';
      case 'cabinet': return 'Cabinet';
      case 'clinique': return 'Clinique';
      case 'hopital': return 'Hôpital';
      case 'domicile': return 'Domicile';
      case 'telephone': return 'Téléphone';
      case 'visio': return 'Vidéoconsultation';
      default: return type;
    }
  };

  const canConfirm = isSpecialist && rdv.statut === 'planifie';
  const canReschedule = rdv.statut !== 'annule' && rdv.statut !== 'termine';
  const canCancel = rdv.statut !== 'annule' && rdv.statut !== 'termine';
  const canComplete = isSpecialist && (rdv.statut === 'confirme' || rdv.statut === 'en_cours');

  return (
    <Card className={`hover:shadow-lg transition-all overflow-hidden ${
      rdv.statut === 'planifie' ? 'border-l-4 border-l-orange-500' : 
      rdv.statut === 'confirme' ? 'border-l-4 border-l-green-500' : ''
    }`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {getIconType(rdv.type_consultation)}
                <span className="font-semibold text-sm md:text-base break-words">
                  {format(new Date(rdv.date_rdv), 'EEEE dd MMMM yyyy', { locale: fr })}
                </span>
                <Badge className={`${getStatusColor(rdv.statut)} flex items-center gap-1 flex-shrink-0`}>
                  {getStatusIcon(rdv.statut)}
                  {getStatusLabel(rdv.statut)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mb-1 flex-wrap">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{format(new Date(rdv.date_rdv), 'HH:mm')}</span>
                {rdv.type_consultation && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="capitalize truncate">{getTypeLabel(rdv.type_consultation)}</span>
                  </>
                )}
              </div>

              {!isSpecialist && rdv.statut === 'planifie' && (
                <Alert className="mt-2 bg-orange-50 border-orange-300">
                  <Bell className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <AlertDescription className="text-xs text-orange-800 break-words">
                    ⏳ En attente de confirmation par le professionnel. Vous serez notifié dès validation.
                  </AlertDescription>
                </Alert>
              )}

              {!isSpecialist && rdv.statut === 'confirme' && (
                <Alert className="mt-2 bg-green-50 border-green-300">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <AlertDescription className="text-xs text-green-800 break-words">
                    ✅ Rendez-vous confirmé ! Vous recevrez un rappel avant votre consultation.
                  </AlertDescription>
                </Alert>
              )}

              {isSpecialist && rdv.statut === 'planifie' && (
                <Alert className="mt-2 bg-orange-50 border-orange-300">
                  <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <AlertDescription className="text-xs text-orange-800 break-words">
                    ⏳ En attente de votre confirmation. Le patient attend votre validation.
                  </AlertDescription>
                </Alert>
              )}

              {!isSpecialist && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-700 mb-2">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium truncate">{nomProfessionnel}</span>
                  {rdv.professionnel_specialite && (
                    <Badge variant="outline" className="text-xs truncate">
                      {rdv.professionnel_specialite}
                    </Badge>
                  )}
                </div>
              )}

              {isSpecialist && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-700 mb-2">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium truncate">{rdv.created_by}</span>
                </div>
              )}

              {rdv.motif && (
                <p className="text-xs md:text-sm text-gray-700 mb-2 line-clamp-2 break-words">{rdv.motif}</p>
              )}

              {rdv.reprogramme && rdv.ancien_date_rdv && (
                <Alert className="mt-2 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <AlertDescription className="text-xs break-words">
                    Reprogrammé depuis le {format(new Date(rdv.ancien_date_rdv), 'dd/MM/yyyy à HH:mm')}
                  </AlertDescription>
                </Alert>
              )}

              {rdv.notes_professionnel && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs md:text-sm overflow-hidden">
                  <p className="font-semibold text-gray-700 mb-1 truncate">Notes du professionnel:</p>
                  <p className="text-gray-600 line-clamp-2 break-words">{rdv.notes_professionnel}</p>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="flex-shrink-0 active:scale-95 transition-transform"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>

          {showActions && (
            <div className="space-y-3 pt-3 border-t">
              <IntegrationVideoCall
                rendezVous={rdv}
                currentUserEmail={currentUserEmail}
                isSpecialist={isSpecialist}
              />
              
              <div className="flex flex-wrap gap-2">
                {canConfirm && (
                  <Button
                    size="sm"
                    onClick={() => confirmerMutation.mutate()}
                    disabled={confirmerMutation.isPending}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg active:scale-95 transition-transform"
                  >
                    {confirmerMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="ml-2 text-xs md:text-sm font-bold">Confirmer le RDV</span>
                      </>
                    )}
                  </Button>
                )}

                {canComplete && (
                  <Button
                    size="sm"
                    onClick={() => setShowNotes(true)}
                    className="bg-teal-600 hover:bg-teal-700 active:scale-95 transition-transform"
                  >
                    <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate text-xs md:text-sm">Terminer</span>
                  </Button>
                )}

                {canReschedule && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowReschedule(true)}
                    className="active:scale-95 transition-transform"
                  >
                    <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate text-xs md:text-sm">Reprogrammer</span>
                  </Button>
                )}

                {canCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCancel(true)}
                    className="text-red-600 hover:text-red-700 border-red-300 active:scale-95 transition-transform"
                  >
                    <XCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate text-xs md:text-sm">Annuler</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {showReschedule && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-3">
              <h4 className="font-semibold">Reprogrammer le rendez-vous</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Nouvelle date</Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nouvelle heure</Label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReschedule(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={() => reprogrammerMutation.mutate()}
                  disabled={!newDate || !newTime || reprogrammerMutation.isPending}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {reprogrammerMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmer'}
                </Button>
              </div>
            </div>
          )}

          {showCancel && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-3">
              <h4 className="font-semibold text-red-900">Annuler le rendez-vous</h4>
              <div>
                <Label className="text-xs">Raison de l'annulation</Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="Expliquez pourquoi vous annulez ce rendez-vous..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCancel(false)}
                  className="flex-1"
                >
                  Retour
                </Button>
                <Button
                  size="sm"
                  onClick={() => annulerMutation.mutate()}
                  disabled={!cancelReason || annulerMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {annulerMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmer l\'annulation'}
                </Button>
              </div>
            </div>
          )}

          {showNotes && (
            <div className="mt-4 p-4 bg-teal-50 rounded-lg space-y-3">
              <h4 className="font-semibold">Terminer la consultation</h4>
              <div>
                <Label className="text-xs">Notes de consultation</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Notes pour le dossier patient..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNotes(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={() => terminerMutation.mutate()}
                  disabled={terminerMutation.isPending}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {terminerMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Terminer'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}