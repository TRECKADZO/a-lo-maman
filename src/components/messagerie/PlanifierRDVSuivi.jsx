import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Calendar as CalendarIcon, Clock, Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PlanifierRDVSuivi({ patientEmail, conversationId, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date_rdv: null,
    heure: '',
    type_consultation: 'telephone',
    motif: 'Suivi post-consultation',
    notes_professionnel: ''
  });

  const { data: profilPro } = useQuery({
    queryKey: ['profil_professionnel_current'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    }
  });

  const creerRDVMutation = useMutation({
    mutationFn: async (data) => {
      if (!profilPro) throw new Error("Profil professionnel introuvable");
      
      const dateTime = new Date(data.date_rdv);
      const [heures, minutes] = data.heure.split(':');
      dateTime.setHours(parseInt(heures), parseInt(minutes));

      const rdv = await base44.entities.RendezVous.create({
        professionnel_id: profilPro.id,
        date_rdv: dateTime.toISOString(),
        type_consultation: data.type_consultation,
        motif: data.motif,
        notes_professionnel: data.notes_professionnel,
        statut: 'planifie'
      });

      // Envoyer un message dans la conversation
      const user = await base44.auth.me();
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: user.email,
        content: `📅 Rendez-vous de suivi planifié\n\n📆 Date : ${format(dateTime, 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}\n📋 Type : ${data.type_consultation}\n📝 Motif : ${data.motif}`,
        is_read: false
      });

      await base44.entities.Conversation.update(conversationId, {
        last_message_content: '📅 Rendez-vous de suivi planifié',
        last_message_date: new Date().toISOString()
      });

      return rdv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['rdv_professionnel'] });
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date_rdv || !formData.heure) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    creerRDVMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-600" />
              Planifier un rendez-vous de suivi
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Patient : <span className="font-semibold">{patientEmail}</span>
          </p>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label>Date du rendez-vous *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date_rdv ? format(formData.date_rdv, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date_rdv}
                      onSelect={(date) => setFormData({ ...formData, date_rdv: date })}
                      locale={fr}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Heure */}
              <div className="space-y-2">
                <Label htmlFor="heure">Heure *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="heure"
                    type="time"
                    value={formData.heure}
                    onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Type de consultation */}
            <div className="space-y-2">
              <Label>Type de consultation *</Label>
              <Select
                value={formData.type_consultation}
                onValueChange={(value) => setFormData({ ...formData, type_consultation: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telephone">📞 Téléphone</SelectItem>
                  <SelectItem value="video">📹 Visio</SelectItem>
                  <SelectItem value="cabinet">🏢 Cabinet</SelectItem>
                  <SelectItem value="clinique">🏥 Clinique</SelectItem>
                  <SelectItem value="hopital">🏥 Hôpital</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Motif */}
            <div className="space-y-2">
              <Label htmlFor="motif">Motif du rendez-vous *</Label>
              <Input
                id="motif"
                value={formData.motif}
                onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                placeholder="Ex: Suivi post-consultation, Contrôle..."
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={formData.notes_professionnel}
                onChange={(e) => setFormData({ ...formData, notes_professionnel: e.target.value })}
                placeholder="Informations complémentaires pour le patient..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={creerRDVMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={creerRDVMutation.isPending}
              >
                {creerRDVMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Planification...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Planifier et notifier
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}