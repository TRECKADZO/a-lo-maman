import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, CheckCircle, ArrowLeft, Info } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ReserverRDVEchographie({ centre, grossesse, onRetour, onSuccess }) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [motif, setMotif] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const creerRDV = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime) {
        throw new Error('Date et heure requises');
      }

      const [heures, minutes] = selectedTime.split(':');
      const dateRDV = setMinutes(setHours(selectedDate, parseInt(heures)), parseInt(minutes));

      const joursDepuisDDR = Math.floor(
        (new Date() - new Date(grossesse.date_derniere_regle)) / (1000 * 60 * 60 * 24)
      );
      const semainesGrossesse = Math.floor(joursDepuisDDR / 7);

      const rdv = await base44.entities.RDVTeleEchographie.create({
        maman_email: user.email,
        grossesse_id: grossesse.id,
        centre_id: centre.id,
        gynecologue_id: centre.gynecologue_referent_id,
        type_echographie: getTypeEchoFromSemaine(semainesGrossesse),
        date_rdv: dateRDV.toISOString(),
        semaine_grossesse: semainesGrossesse,
        statut: 'planifie',
        motif: motif || `Échographie ${getTypeEchoFromSemaine(semainesGrossesse)}`,
        instructions_pre_rdv: getInstructionsPreRDV(getTypeEchoFromSemaine(semainesGrossesse))
      });

      // Créer notification
      await base44.entities.Notification.create({
        destinataire_email: user.email,
        type: 'rendez_vous_confirmation',
        titre: '✅ RDV Télé-Échographie confirmé',
        message: `Votre rendez-vous au ${centre.nom_centre} le ${format(dateRDV, 'dd MMMM à HH:mm', { locale: fr })}`,
        action_page: 'Grossesse',
        priorite: 'haute',
        icone: 'Calendar'
      });

      return rdv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rdv_teleecho']);
      toast.success('Rendez-vous confirmé !');
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la réservation');
    }
  });

  const getTypeEchoFromSemaine = (semaines) => {
    if (semaines <= 14) return 'datation';
    if (semaines >= 20 && semaines <= 24) return 'morphologique';
    return 'croissance';
  };

  const getInstructionsPreRDV = (type) => {
    switch (type) {
      case 'datation':
        return 'Vessie pleine recommandée pour une meilleure visualisation.';
      case 'morphologique':
        return 'Examen détaillé de tous les organes du bébé. Prévoir 30-45 minutes.';
      case 'croissance':
        return 'Contrôle de la croissance et du bien-être fœtal.';
      default:
        return 'Suivez les instructions de votre sage-femme.';
    }
  };

  // Créneaux disponibles (simplifiés)
  const creneauxDisponibles = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'
  ];

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onRetour}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Choisir un autre centre
      </Button>

      {/* Info centre */}
      <Card className="shadow-lg border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
        <CardContent className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2">{centre.nom_centre}</h3>
          <div className="space-y-1 text-sm text-gray-700">
            <p>📍 {centre.adresse}, {centre.ville}</p>
            {centre.sage_femme_nom && <p>👩‍⚕️ {centre.sage_femme_nom}</p>}
            {centre.telephone && <p>📞 {centre.telephone}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Sélection date */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-pink-600" />
            Choisissez une date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date() || date > addDays(new Date(), 60)}
            locale={fr}
            className="rounded-md border w-full"
          />
        </CardContent>
      </Card>

      {/* Sélection heure */}
      {selectedDate && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-pink-600" />
              Choisissez une heure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {creneauxDisponibles.map(time => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  onClick={() => setSelectedTime(time)}
                  className={selectedTime === time ? 'bg-pink-500' : ''}
                >
                  {time}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motif */}
      {selectedDate && selectedTime && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">Informations complémentaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="motif">Motif ou remarques (optionnel)</Label>
              <Textarea
                id="motif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Ex: Douleurs abdominales, vérifier position bébé..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Résumé */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Récapitulatif
              </p>
              <div className="space-y-1 text-sm text-blue-800">
                <p>📅 {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</p>
                <p>🕐 {selectedTime}</p>
                <p>📍 {centre.nom_centre}</p>
                <p>💉 {centre.sage_femme_nom}</p>
              </div>
            </div>

            <Button
              onClick={() => creerRDV.mutate()}
              disabled={creerRDV.isPending}
              className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-600 text-lg"
            >
              {creerRDV.isPending ? (
                'Confirmation...'
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirmer le rendez-vous
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}