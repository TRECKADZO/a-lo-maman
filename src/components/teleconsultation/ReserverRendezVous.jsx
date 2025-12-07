import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  Phone,
  Building2,
  Video,
  ChevronRight,
  CheckCircle,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format, addDays, isSameDay, setHours, setMinutes, addHours, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const JOURS_SEMAINE_MAP = {
  'monday': 'Lundi',
  'tuesday': 'Mardi',
  'wednesday': 'Mercredi',
  'thursday': 'Jeudi',
  'friday': 'Vendredi',
  'saturday': 'Samedi',
  'sunday': 'Dimanche'
};

export default function ReserverRendezVous({ professionnel, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [etape, setEtape] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHeure, setSelectedHeure] = useState('');
  const [motif, setMotif] = useState('');
  const [notes, setNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rdvExistants = [] } = useQuery({
    queryKey: ['rdv_professionnel', professionnel.id],
    queryFn: async () => {
      return await base44.entities.RendezVous.filter(
        { professionnel_id: professionnel.id },
        '-date_rdv'
      );
    },
  });

  const creerRdvMutation = useMutation({
    mutationFn: async (rdvData) => {
      const rdv = await base44.entities.RendezVous.create(rdvData);
      
      await base44.entities.Notification.create({
        destinataire_email: professionnel.email,
        type: 'rendez_vous_confirmation',
        titre: 'Nouveau rendez-vous',
        message: `Nouvelle demande de rendez-vous le ${format(new Date(rdvData.date_rdv), 'dd/MM/yyyy à HH:mm')}`,
        action_page: 'MonAgenda',
        priorite: 'haute',
        icone: 'Calendar',
      });

      await base44.integrations.Core.SendEmail({
        to: professionnel.email,
        subject: 'Nouveau rendez-vous',
        body: `
          <h2>Nouveau rendez-vous</h2>
          <p><strong>Patient:</strong> ${user?.email}</p>
          <p><strong>Date:</strong> ${format(new Date(rdvData.date_rdv), 'dd/MM/yyyy à HH:mm')}</p>
          <p><strong>Type:</strong> ${rdvData.type_consultation}</p>
          <p><strong>Motif:</strong> ${rdvData.motif || 'Non précisé'}</p>
        `
      });

      return rdv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes_rendez_vous'] });
      queryClient.invalidateQueries({ queryKey: ['rdv_professionnel'] });
      setShowConfirmation(true);
      if (onSuccess) onSuccess();
    },
  });

  const normalizeJour = (jour) => {
    if (!jour) return '';
    return jour.charAt(0).toUpperCase() + jour.slice(1).toLowerCase();
  };

  const getException = (date) => {
    if (!professionnel.exceptions_agenda) return null;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return professionnel.exceptions_agenda.find(e => e.date === dateStr);
  };

  const datesDisponibles = [];
  
  for (let i = 0; i < 60; i++) {
    const date = addDays(startOfDay(new Date()), i);
    const jourSemaine = format(date, 'EEEE', { locale: fr });
    const jourNormalized = normalizeJour(jourSemaine);
    
    const exception = getException(date);
    
    if (exception?.type === 'fermeture' || exception?.type === 'conges') {
      continue;
    }
    
    let disponibilitesJour;
    if (exception?.type === 'modification' && exception.horaires?.length > 0) {
      disponibilitesJour = exception.horaires.filter(h => {
        const matchType = !selectedType || 
                         !h.types_consultation || 
                         h.types_consultation.length === 0 || 
                         h.types_consultation.includes(selectedType);
        return matchType;
      });
    } else {
      const planningType = professionnel.disponibilites || [];
      
      disponibilitesJour = planningType.filter(d => {
        const jourDispoNormalized = normalizeJour(d.jour);
        const matchJour = jourDispoNormalized === jourNormalized;
        
        const matchType = !selectedType || 
                         !d.types_consultation || 
                         d.types_consultation.length === 0 || 
                         d.types_consultation.includes(selectedType);
        
        return matchJour && matchType;
      });
    }
    
    if (disponibilitesJour && disponibilitesJour.length > 0) {
      datesDisponibles.push(date);
    }
  }

  const creneauxDisponibles = [];
  if (selectedDate && selectedType) {
    const jourSemaine = format(selectedDate, 'EEEE', { locale: fr });
    const jourNormalized = normalizeJour(jourSemaine);
    const exception = getException(selectedDate);
    
    let dispoJour;
    if (exception?.type === 'modification' && exception.horaires?.length > 0) {
      dispoJour = exception.horaires.filter(h => {
        const matchType = !h.types_consultation || 
                         h.types_consultation.length === 0 || 
                         h.types_consultation.includes(selectedType);
        return matchType;
      });
    } else {
      const planningType = professionnel.disponibilites || [];
      
      dispoJour = planningType.filter(d => {
        const jourDispoNormalized = normalizeJour(d.jour);
        const matchJour = jourDispoNormalized === jourNormalized;
        const matchType = !d.types_consultation || 
                         d.types_consultation.length === 0 || 
                         d.types_consultation.includes(selectedType);
        return matchJour && matchType;
      });
    }

    dispoJour.forEach(dispo => {
      const [heureDebut, minuteDebut] = dispo.heure_debut.split(':').map(Number);
      const [heureFin, minuteFin] = dispo.heure_fin.split(':').map(Number);
      
      let currentTime = setMinutes(setHours(selectedDate, heureDebut), minuteDebut);
      const endTime = setMinutes(setHours(selectedDate, heureFin), minuteFin);
      
      while (currentTime < endTime) {
        const heureString = format(currentTime, 'HH:mm');
        const dateTimeRdv = new Date(selectedDate);
        const [h, m] = heureString.split(':').map(Number);
        dateTimeRdv.setHours(h, m, 0, 0);
        
        const estPris = rdvExistants.some(rdv => {
          const rdvDate = new Date(rdv.date_rdv);
          return isSameDay(rdvDate, selectedDate) && 
                 format(rdvDate, 'HH:mm') === heureString;
        });
        
        if (!estPris && dateTimeRdv > new Date()) {
          creneauxDisponibles.push(heureString);
        }
        
        currentTime = addHours(currentTime, 0.5);
      }
    });
  }

  const handleSubmit = () => {
    if (!selectedType || !selectedDate || !selectedHeure || !motif) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const [heures, minutes] = selectedHeure.split(':').map(Number);
    const dateRdv = new Date(selectedDate);
    dateRdv.setHours(heures, minutes, 0, 0);

    creerRdvMutation.mutate({
      professionnel_id: professionnel.id,
      professionnel_email: professionnel.email,
      professionnel_nom: professionnel.nom_complet,
      professionnel_specialite: professionnel.specialite,
      date_rdv: dateRdv.toISOString(),
      type_consultation: selectedType,
      motif: motif,
      notes_patient: notes,
      statut: 'planifie',
    });
  };

  const getIconType = (type) => {
    switch(type) {
      case 'cabinet': return <Briefcase className="w-4 h-4" />;
      case 'clinique': return <Briefcase className="w-4 h-4" />;
      case 'hopital': return <Building2 className="w-4 h-4" />;
      case 'telephone': return <Phone className="w-4 h-4" />;
      case 'visio': return <Video className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'cabinet': return 'Cabinet';
      case 'clinique': return 'Clinique';
      case 'hopital': return 'Hôpital';
      case 'telephone': return 'Téléphone';
      case 'visio': return 'Vidéoconsultation';
      default: return type;
    }
  };

  // Obtenir les couleurs pour chaque type de consultation
  const getTypeColors = (type, isSelected) => {
    const colors = {
      cabinet: {
        border: isSelected ? 'border-blue-600' : 'border-gray-300 hover:border-blue-400',
        bg: isSelected ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-white hover:bg-blue-50',
        text: isSelected ? 'text-white' : 'text-gray-700',
        iconBg: isSelected ? 'bg-white/20' : 'bg-blue-100',
        iconColor: isSelected ? 'text-white' : 'text-blue-600',
        shadow: isSelected ? 'shadow-lg shadow-blue-200' : ''
      },
      clinique: {
        border: isSelected ? 'border-purple-600' : 'border-gray-300 hover:border-purple-400',
        bg: isSelected ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-white hover:bg-purple-50',
        text: isSelected ? 'text-white' : 'text-gray-700',
        iconBg: isSelected ? 'bg-white/20' : 'bg-purple-100',
        iconColor: isSelected ? 'text-white' : 'text-purple-600',
        shadow: isSelected ? 'shadow-lg shadow-purple-200' : ''
      },
      hopital: {
        border: isSelected ? 'border-red-600' : 'border-gray-300 hover:border-red-400',
        bg: isSelected ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-white hover:bg-red-50',
        text: isSelected ? 'text-white' : 'text-gray-700',
        iconBg: isSelected ? 'bg-white/20' : 'bg-red-100',
        iconColor: isSelected ? 'text-white' : 'text-red-600',
        shadow: isSelected ? 'shadow-lg shadow-red-200' : ''
      },
      telephone: {
        border: isSelected ? 'border-green-600' : 'border-gray-300 hover:border-green-400',
        bg: isSelected ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-white hover:bg-green-50',
        text: isSelected ? 'text-white' : 'text-gray-700',
        iconBg: isSelected ? 'bg-white/20' : 'bg-green-100',
        iconColor: isSelected ? 'text-white' : 'text-green-600',
        shadow: isSelected ? 'shadow-lg shadow-green-200' : ''
      },
      visio: {
        border: isSelected ? 'border-teal-600' : 'border-gray-300 hover:border-teal-400',
        bg: isSelected ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-white hover:bg-teal-50',
        text: isSelected ? 'text-white' : 'text-gray-700',
        iconBg: isSelected ? 'bg-white/20' : 'bg-teal-100',
        iconColor: isSelected ? 'text-white' : 'text-teal-600',
        shadow: isSelected ? 'shadow-lg shadow-teal-200' : ''
      }
    };
    return colors[type] || colors.visio;
  };

  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-lg w-full shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Rendez-vous confirmé !</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Votre demande de rendez-vous a été envoyée au professionnel. 
                Vous recevrez une notification une fois confirmé.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-600" />
                <span className="font-semibold">
                  {selectedDate && format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="font-semibold">{selectedHeure}</span>
              </div>
              <div className="flex items-center gap-2">
                {getIconType(selectedType)}
                <span>{getTypeLabel(selectedType)}</span>
              </div>
            </div>

            <Button onClick={onClose} className="w-full bg-teal-600 hover:bg-teal-700">
              Fermer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 md:p-4 overflow-y-auto">
      <Card className="w-full md:max-w-2xl my-0 md:my-8 shadow-2xl h-full md:h-auto rounded-none md:rounded-lg overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Prendre rendez-vous</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold
                  ${etape >= step ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${etape > step ? 'bg-teal-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {etape === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Type de consultation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(professionnel.types_consultation_offerts || ['cabinet', 'visio']).map((type) => {
                  const tarifType = professionnel.tarifs_par_type?.[type] || professionnel.tarif_consultation || 0;
                  const isSelected = selectedType === type;
                  
                  const typeConfig = {
                    cabinet: { color: 'blue', icon: Briefcase, label: 'Cabinet' },
                    clinique: { color: 'purple', icon: Briefcase, label: 'Clinique' },
                    hopital: { color: 'red', icon: Building2, label: 'Hôpital' },
                    telephone: { color: 'green', icon: Phone, label: 'Téléphone' },
                    visio: { color: 'teal', icon: Video, label: 'Vidéoconsultation' },
                  };
                  
                  const config = typeConfig[type] || typeConfig.visio;
                  const IconComponent = config.icon;
                  
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedType(type);
                        setSelectedDate(null);
                        setSelectedHeure('');
                      }}
                      className={`
                        relative p-5 rounded-2xl cursor-pointer transition-all duration-300 text-left w-full
                        ${isSelected 
                          ? `bg-${config.color}-600 text-white shadow-xl shadow-${config.color}-200 ring-4 ring-${config.color}-300 scale-[1.02]` 
                          : `bg-white border-2 border-gray-200 hover:border-${config.color}-400 hover:shadow-lg`
                        }
                      `}
                      style={{
                        backgroundColor: isSelected ? (
                          config.color === 'blue' ? '#2563eb' :
                          config.color === 'purple' ? '#9333ea' :
                          config.color === 'red' ? '#dc2626' :
                          config.color === 'green' ? '#16a34a' :
                          '#0d9488'
                        ) : 'white',
                        boxShadow: isSelected ? `0 10px 40px -10px ${
                          config.color === 'blue' ? 'rgba(37, 99, 235, 0.5)' :
                          config.color === 'purple' ? 'rgba(147, 51, 234, 0.5)' :
                          config.color === 'red' ? 'rgba(220, 38, 38, 0.5)' :
                          config.color === 'green' ? 'rgba(22, 163, 74, 0.5)' :
                          'rgba(13, 148, 136, 0.5)'
                        }` : undefined
                      }}
                    >
                      {/* Indicateur de sélection */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-md">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      
                      <div className="flex items-start gap-4">
                        <div className={`
                          p-3 rounded-xl flex-shrink-0
                          ${isSelected 
                            ? 'bg-white/20' 
                            : `bg-${config.color}-100`
                          }
                        `}
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : (
                            config.color === 'blue' ? '#dbeafe' :
                            config.color === 'purple' ? '#f3e8ff' :
                            config.color === 'red' ? '#fee2e2' :
                            config.color === 'green' ? '#dcfce7' :
                            '#ccfbf1'
                          )
                        }}
                        >
                          <IconComponent className={`w-6 h-6 ${isSelected ? 'text-white' : ''}`} 
                            style={{ 
                              color: isSelected ? 'white' : (
                                config.color === 'blue' ? '#2563eb' :
                                config.color === 'purple' ? '#9333ea' :
                                config.color === 'red' ? '#dc2626' :
                                config.color === 'green' ? '#16a34a' :
                                '#0d9488'
                              )
                            }}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <p className={`font-bold text-lg mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {config.label}
                          </p>
                          {tarifType > 0 && (
                            <p className={`text-sm font-semibold ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                              {tarifType.toLocaleString()} FCFA
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Barre de sélection en bas */}
                      {isSelected && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/40 rounded-b-2xl" />
                      )}
                    </button>
                  );
                })}
              </div>

              <Button
                type="button"
                onClick={() => setEtape(2)}
                disabled={!selectedType}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Suivant <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {etape === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Date et heure</h3>

              {datesDisponibles.length === 0 ? (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    Aucune disponibilité pour le type de consultation sélectionné.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Sélectionnez une date</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {datesDisponibles.map((date) => (
                        <div
                          key={date.toString()}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedHeure('');
                          }}
                          className={`
                            p-3 border-2 rounded-lg cursor-pointer text-center transition-all
                            ${selectedDate && isSameDay(selectedDate, date)
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-300 hover:border-teal-300'
                            }
                          `}
                        >
                          <p className="text-sm font-semibold">
                            {format(date, 'EEE', { locale: fr })}
                          </p>
                          <p className="text-lg font-bold">
                            {format(date, 'd')}
                          </p>
                          <p className="text-xs text-gray-600">
                            {format(date, 'MMM', { locale: fr })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedDate && creneauxDisponibles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Sélectionnez une heure</Label>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        {creneauxDisponibles.map((heure) => (
                          <div
                            key={heure}
                            onClick={() => setSelectedHeure(heure)}
                            className={`
                              p-2 border-2 rounded-lg cursor-pointer text-center transition-all
                              ${selectedHeure === heure
                                ? 'border-teal-500 bg-teal-50'
                                : 'border-gray-300 hover:border-teal-300'
                              }
                            `}
                          >
                            <Clock className="w-4 h-4 mx-auto mb-1" />
                            <p className="text-sm font-semibold">{heure}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2">
                <Button type="button" onClick={() => setEtape(1)} variant="outline" className="flex-1">
                  Retour
                </Button>
                <Button
                  type="button"
                  onClick={() => setEtape(3)}
                  disabled={!selectedDate || !selectedHeure}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  Suivant <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {etape === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informations complémentaires</h3>

              <div className="space-y-2">
                <Label>Motif de consultation *</Label>
                <Input
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Ex: Consultation de routine, suivi..."
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations supplémentaires pour le professionnel..."
                  rows={4}
                />
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800">
                  <strong>Récapitulatif :</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Type : {getTypeLabel(selectedType)}</li>
                    <li>• Date : {selectedDate && format(selectedDate, 'dd/MM/yyyy', { locale: fr })}</li>
                    <li>• Heure : {selectedHeure}</li>
                    {selectedType && (professionnel.tarifs_par_type?.[selectedType] || professionnel.tarif_consultation) > 0 && (
                      <li className="font-bold text-purple-900">
                        • Tarif : {(professionnel.tarifs_par_type?.[selectedType] || professionnel.tarif_consultation).toLocaleString()} FCFA
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button type="button" onClick={() => setEtape(2)} variant="outline" className="flex-1">
                  Retour
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!motif || creerRdvMutation.isPending}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {creerRdvMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Confirmation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmer le rendez-vous
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}