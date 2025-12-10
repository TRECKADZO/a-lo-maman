import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Building2,
  ArrowLeft,
  User,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ReserverRDVClinique({ clinique, onBack }) {
  const [selectedPro, setSelectedPro] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [typeConsultation, setTypeConsultation] = useState('cabinet');
  const [motif, setMotif] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: professionnels = [] } = useQuery({
    queryKey: ['professionnels_clinique', clinique?.id],
    queryFn: async () => {
      const all = await base44.entities.Professionnel.list();
      return all.filter(p => clinique?.professionnels_ids?.includes(p.id));
    },
    enabled: !!clinique,
  });

  const { data: rdvs = [] } = useQuery({
    queryKey: ['rdv_clinique', clinique?.id],
    queryFn: async () => {
      const all = await base44.entities.RendezVous.list();
      return all.filter(r => 
        professionnels.some(p => p.id === r.professionnel_id)
      );
    },
    enabled: !!clinique && professionnels.length > 0,
  });

  const createRDVMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.RendezVous.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mes_rendez_vous']);
      queryClient.invalidateQueries(['rdv_clinique']);
      toast.success('Rendez-vous confirmé !', {
        description: `Votre RDV à ${clinique.nom} a été réservé`
      });
      setDialogOpen(false);
      onBack();
    },
  });

  const generateTimeSlots = (pro) => {
    if (!pro?.disponibilites || !selectedDate) return [];

    const dayName = format(selectedDate, 'EEEE', { locale: fr });
    const dayDispos = pro.disponibilites.filter(d => d.jour === dayName);

    if (dayDispos.length === 0) return [];

    const slots = [];
    dayDispos.forEach(dispo => {
      const [startH, startM] = dispo.heure_debut.split(':').map(Number);
      const [endH, endM] = dispo.heure_fin.split(':').map(Number);
      
      let currentH = startH;
      let currentM = startM;

      while (currentH < endH || (currentH === endH && currentM < endM)) {
        const slotTime = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
        const slotDateTime = new Date(selectedDate);
        slotDateTime.setHours(currentH, currentM, 0, 0);

        // Vérifier si créneau déjà pris
        const isBooked = rdvs.some(r => 
          r.professionnel_id === pro.id &&
          format(new Date(r.date_rdv), 'yyyy-MM-dd HH:mm') === format(slotDateTime, 'yyyy-MM-dd HH:mm') &&
          r.statut !== 'annule'
        );

        if (!isBooked && slotDateTime > new Date()) {
          slots.push({
            time: slotTime,
            dateTime: slotDateTime,
            types: dispo.types_consultation || ['cabinet', 'visio', 'telephone']
          });
        }

        currentM += 30;
        if (currentM >= 60) {
          currentM = 0;
          currentH++;
        }
      }
    });

    return slots;
  };

  const slots = selectedPro ? generateTimeSlots(selectedPro) : [];

  const handleConfirmRDV = () => {
    if (!selectedSlot || !selectedPro || !typeConsultation) {
      toast.error('Veuillez sélectionner tous les champs');
      return;
    }

    createRDVMutation.mutate({
      professionnel_id: selectedPro.id,
      date_rdv: selectedSlot.dateTime.toISOString(),
      type_consultation: typeConsultation,
      motif,
      statut: 'planifie',
      adresse_consultation: typeConsultation === 'cabinet' ? clinique.adresse : undefined
    });
  };

  const typesConsult = [
    { value: 'cabinet', label: 'Cabinet', icon: '🏥' },
    { value: 'visio', label: 'Visio', icon: '💻' },
    { value: 'telephone', label: 'Téléphone', icon: '📞' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-500" />
                {clinique.nom}
              </CardTitle>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {clinique.ville}, {clinique.region}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Étape 1: Choisir un professionnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 bg-teal-500 rounded-full text-white text-sm flex items-center justify-center">1</span>
              Choisir un professionnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {professionnels.map((pro) => (
              <button
                key={pro.id}
                onClick={() => {
                  setSelectedPro(pro);
                  setSelectedSlot(null);
                }}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  selectedPro?.id === pro.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                    {pro.nom_complet?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{pro.nom_complet}</p>
                    <p className="text-xs text-gray-600">{pro.specialite?.replace(/_/g, ' ')}</p>
                    {pro.types_consultation_offerts && (
                      <div className="flex gap-1 mt-1">
                        {pro.types_consultation_offerts.map(type => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {typesConsult.find(t => t.value === type)?.icon}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedPro?.id === pro.id && (
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                  )}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Étape 2: Choisir date et heure */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 bg-teal-500 rounded-full text-white text-sm flex items-center justify-center">2</span>
              Date et heure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedPro ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Sélectionnez d'abord un professionnel
              </p>
            ) : (
              <>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {slots.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucun créneau disponible ce jour
                    </p>
                  ) : (
                    slots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full p-2 rounded-lg border transition-all ${
                          selectedSlot?.time === slot.time
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{slot.time}</span>
                          {selectedSlot?.time === slot.time && (
                            <CheckCircle className="w-4 h-4 text-teal-500" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Étape 3: Type de consultation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 bg-teal-500 rounded-full text-white text-sm flex items-center justify-center">3</span>
              Type de consultation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedSlot ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Sélectionnez d'abord un créneau
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {typesConsult.map((type) => {
                    const available = selectedSlot?.types?.includes(type.value);
                    return (
                      <button
                        key={type.value}
                        onClick={() => available && setTypeConsultation(type.value)}
                        disabled={!available}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          !available
                            ? 'opacity-50 cursor-not-allowed border-gray-200'
                            : typeConsultation === type.value
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{type.icon}</span>
                            <span className="font-medium">{type.label}</span>
                          </div>
                          {typeConsultation === type.value && (
                            <CheckCircle className="w-5 h-5 text-teal-500" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600"
                  onClick={() => setDialogOpen(true)}
                  disabled={!typeConsultation}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Confirmer le rendez-vous
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog confirmation */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le rendez-vous</DialogTitle>
          </DialogHeader>

          {selectedPro && selectedSlot && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50 rounded-lg space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {clinique.nom}
                </p>
                <p className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {selectedPro.nom_complet}
                </p>
                <p className="text-sm flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {format(selectedSlot.dateTime, 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
                <p className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {selectedSlot.time}
                </p>
                <Badge className="bg-teal-100 text-teal-800">
                  {typesConsult.find(t => t.value === typeConsultation)?.label}
                </Badge>
              </div>

              <div>
                <Label>Motif de consultation (optionnel)</Label>
                <Textarea
                  placeholder="Décrivez brièvement le motif de votre consultation..."
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleConfirmRDV}
                disabled={createRDVMutation.isPending}
              >
                {createRDVMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmer
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}