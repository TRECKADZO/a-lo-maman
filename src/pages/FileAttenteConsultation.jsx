import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Clock,
  Video,
  Phone,
  AlertCircle,
  CheckCircle,
  Loader2,
  UserCheck,
  XCircle,
  Play,
  Timer
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';

const URGENCE_CONFIG = {
  normale: { label: 'Normale', color: 'bg-blue-100 text-blue-800', priority: 3 },
  moderee: { label: 'Modérée', color: 'bg-orange-100 text-orange-800', priority: 2 },
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-800', priority: 1 }
};

export default function FileAttenteConsultation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: profilPro } = useQuery({
    queryKey: ['profil_professionnel', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    },
    enabled: !!user
  });

  const { data: fileAttente = [], isLoading } = useQuery({
    queryKey: ['file_attente', profilPro?.id],
    queryFn: async () => {
      if (!profilPro) return [];
      
      const patients = await base44.entities.FileAttente.filter({
        professionnel_id: profilPro.id,
        statut: { $in: ['en_attente', 'en_consultation'] }
      }, 'heure_arrivee');
      
      // Recalculer les positions et temps d'attente
      let position = 1;
      const patientsAvecInfos = patients.map(patient => {
        const attente = differenceInMinutes(new Date(), new Date(patient.heure_arrivee));
        const tempsEstime = position * 15; // 15 min par patient en moyenne
        
        return {
          ...patient,
          position: patient.statut === 'en_attente' ? position++ : 0,
          temps_attente_reel: attente,
          temps_attente_estime: tempsEstime
        };
      });
      
      // Trier par urgence puis par heure d'arrivée
      return patientsAvecInfos.sort((a, b) => {
        if (a.statut === 'en_consultation') return -1;
        if (b.statut === 'en_consultation') return 1;
        
        const urgenceA = URGENCE_CONFIG[a.urgence].priority;
        const urgenceB = URGENCE_CONFIG[b.urgence].priority;
        
        if (urgenceA !== urgenceB) return urgenceA - urgenceB;
        return new Date(a.heure_arrivee) - new Date(b.heure_arrivee);
      });
    },
    enabled: !!profilPro,
    refetchInterval: 5000 // Refresh toutes les 5 secondes
  });

  const demarrerConsultationMutation = useMutation({
    mutationFn: async (patientId) => {
      const now = new Date().toISOString();
      
      await base44.entities.FileAttente.update(patientId, {
        statut: 'en_consultation',
        heure_debut_consultation: now
      });
      
      // Notifier le patient
      const patient = fileAttente.find(p => p.id === patientId);
      await base44.entities.Notification.create({
        destinataire_email: patient.patient_email,
        type: 'rendez_vous_confirmation',
        titre: 'Votre consultation commence',
        message: 'Le professionnel est prêt à vous recevoir. Préparez votre appareil pour la téléconsultation.',
        priorite: 'haute',
        icone: 'Video',
        action_page: 'FileAttenteConsultation'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file_attente'] });
    }
  });

  const terminerConsultationMutation = useMutation({
    mutationFn: async (patientId) => {
      const now = new Date().toISOString();
      const patient = fileAttente.find(p => p.id === patientId);
      const duree = differenceInMinutes(new Date(), new Date(patient.heure_debut_consultation));
      
      await base44.entities.FileAttente.update(patientId, {
        statut: 'termine',
        heure_fin_consultation: now,
        duree_consultation: duree
      });
      
      // Notifier le prochain patient
      const prochainPatient = fileAttente.find(p => p.statut === 'en_attente' && p.position === 1);
      if (prochainPatient) {
        await base44.entities.Notification.create({
          destinataire_email: prochainPatient.patient_email,
          type: 'rendez_vous_rappel',
          titre: 'Prochainement votre tour',
          message: 'Vous passerez bientôt. Préparez-vous.',
          priorite: 'normale',
          icone: 'Clock'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file_attente'] });
      setSelectedPatient(null);
    }
  });

  const retirerFileMutation = useMutation({
    mutationFn: async (patientId) => {
      await base44.entities.FileAttente.update(patientId, {
        statut: 'annule'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file_attente'] });
    }
  });

  const stats = {
    enAttente: fileAttente.filter(p => p.statut === 'en_attente').length,
    enConsultation: fileAttente.filter(p => p.statut === 'en_consultation').length,
    urgent: fileAttente.filter(p => p.urgence === 'urgente').length,
    tempsAttenteModyen: fileAttente.length > 0
      ? Math.round(fileAttente.reduce((sum, p) => sum + (p.temps_attente_reel || 0), 0) / fileAttente.length)
      : 0
  };

  const patientEnCours = fileAttente.find(p => p.statut === 'en_consultation');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
            File d'attente - Consultations Virtuelles
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos téléconsultations en temps réel
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">En attente</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.enAttente}</p>
                </div>
                <Clock className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">En consultation</p>
                  <p className="text-3xl font-bold text-green-600">{stats.enConsultation}</p>
                </div>
                <Video className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Urgent</p>
                  <p className="text-3xl font-bold text-red-600">{stats.urgent}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Attente moy.</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.tempsAttenteModyen}</p>
                  <p className="text-xs text-gray-500">minutes</p>
                </div>
                <Timer className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient en consultation actuelle */}
        {patientEnCours && (
          <Card className="border-l-4 border-l-green-500 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Consultation en cours</h3>
                      <p className="text-sm text-gray-600">{patientEnCours.patient_nom}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Type</p>
                      <Badge className="mt-1">
                        {patientEnCours.type_consultation === 'teleconsultation' ? (
                          <><Video className="w-3 h-3 mr-1" /> Vidéo</>
                        ) : (
                          <><Phone className="w-3 h-3 mr-1" /> Téléphone</>
                        )}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-gray-600">Début</p>
                      <p className="font-semibold text-gray-900">
                        {format(new Date(patientEnCours.heure_debut_consultation), 'HH:mm')}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">Durée</p>
                      <p className="font-semibold text-gray-900">
                        {differenceInMinutes(new Date(), new Date(patientEnCours.heure_debut_consultation))} min
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">Motif</p>
                      <p className="font-semibold text-gray-900 truncate">{patientEnCours.motif}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => terminerConsultationMutation.mutate(patientEnCours.id)}
                  disabled={terminerConsultationMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {terminerConsultationMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Terminer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File d'attente */}
        <Card className="shadow-xl border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Patients en attente ({stats.enAttente})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.enAttente > 0 ? (
              <div className="space-y-3">
                {fileAttente.filter(p => p.statut === 'en_attente').map(patient => (
                  <div key={patient.id} className="p-4 bg-gradient-to-r from-gray-50 to-cyan-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Position */}
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">{patient.position}</span>
                        </div>

                        {/* Info patient */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{patient.patient_nom}</h4>
                            <Badge className={URGENCE_CONFIG[patient.urgence].color}>
                              {URGENCE_CONFIG[patient.urgence].label}
                            </Badge>
                            {patient.type_consultation === 'teleconsultation' ? (
                              <Badge variant="outline">
                                <Video className="w-3 h-3 mr-1" />
                                Vidéo
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Phone className="w-3 h-3 mr-1" />
                                Téléphone
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-2">{patient.motif}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                              <p className="text-gray-500">Arrivée</p>
                              <p className="font-semibold text-gray-700">
                                {format(new Date(patient.heure_arrivee), 'HH:mm')}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-500">Attente</p>
                              <p className="font-semibold text-gray-700">
                                {patient.temps_attente_reel} min
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-500">Estimation</p>
                              <p className="font-semibold text-gray-700">
                                ~{patient.temps_attente_estime} min
                              </p>
                            </div>

                            {patient.temperature && (
                              <div>
                                <p className="text-gray-500">Température</p>
                                <p className="font-semibold text-gray-700">
                                  {patient.temperature}°C
                                </p>
                              </div>
                            )}
                          </div>

                          {patient.symptomes && patient.symptomes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {patient.symptomes.map((symptome, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {symptome}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          onClick={() => demarrerConsultationMutation.mutate(patient.id)}
                          disabled={demarrerConsultationMutation.isPending || patientEnCours}
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          {demarrerConsultationMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Démarrer
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => retirerFileMutation.mutate(patient.id)}
                          disabled={retirerFileMutation.isPending}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Aucun patient en attente
                </h3>
                <p className="text-gray-500">
                  La file d'attente est vide pour le moment
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}