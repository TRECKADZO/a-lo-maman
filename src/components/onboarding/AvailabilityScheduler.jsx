import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DAYS = [
  { id: 'lundi', label: 'Lundi' },
  { id: 'mardi', label: 'Mardi' },
  { id: 'mercredi', label: 'Mercredi' },
  { id: 'jeudi', label: 'Jeudi' },
  { id: 'vendredi', label: 'Vendredi' },
  { id: 'samedi', label: 'Samedi' },
  { id: 'dimanche', label: 'Dimanche' },
];

const CONSULTATION_TYPES = [
  { id: 'teleconsultation', label: 'Téléconsultation', color: 'bg-blue-100 text-blue-800' },
  { id: 'cabinet', label: 'Cabinet', color: 'bg-purple-100 text-purple-800' },
  { id: 'clinique', label: 'Clinique', color: 'bg-green-100 text-green-800' },
  { id: 'hopital', label: 'Hôpital', color: 'bg-orange-100 text-orange-800' },
  { id: 'domicile', label: 'À domicile', color: 'bg-pink-100 text-pink-800' },
];

const DEFAULT_SLOTS = {
  lundi: [],
  mardi: [],
  mercredi: [],
  jeudi: [],
  vendredi: [],
  samedi: [],
  dimanche: [],
};

export default function AvailabilityScheduler({ onComplete, initialSchedule = DEFAULT_SLOTS }) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [selectedDay, setSelectedDay] = useState('lundi');
  const [error, setError] = useState(null);
  const [newSlot, setNewSlot] = useState({
    heure_debut: '',
    heure_fin: '',
    types_consultation: []
  });

  const handleTypeToggle = (typeId) => {
    setNewSlot(prev => ({
      ...prev,
      types_consultation: prev.types_consultation.includes(typeId)
        ? prev.types_consultation.filter(id => id !== typeId)
        : [...prev.types_consultation, typeId]
    }));
  };

  const handleAddSlot = () => {
    setError(null);

    if (!newSlot.heure_debut || !newSlot.heure_fin) {
      setError('Veuillez renseigner les heures de début et de fin');
      return;
    }

    if (newSlot.types_consultation.length === 0) {
      setError('Veuillez sélectionner au moins un type de consultation');
      return;
    }

    // Validation: heure de fin après heure de début
    if (newSlot.heure_debut >= newSlot.heure_fin) {
      setError('L\'heure de fin doit être après l\'heure de début');
      return;
    }

    setSchedule(prev => ({
      ...prev,
      [selectedDay]: [...prev[selectedDay], { ...newSlot }]
    }));

    // Reset
    setNewSlot({
      heure_debut: '',
      heure_fin: '',
      types_consultation: []
    });
  };

  const handleRemoveSlot = (dayId, slotIndex) => {
    setSchedule(prev => ({
      ...prev,
      [dayId]: prev[dayId].filter((_, i) => i !== slotIndex)
    }));
  };

  const handleCopyToOtherDays = (sourceDayId) => {
    const sourceSlots = schedule[sourceDayId];
    if (sourceSlots.length === 0) {
      setError('Aucun créneau à copier pour ce jour');
      return;
    }

    const updatedSchedule = { ...schedule };
    DAYS.forEach(day => {
      if (day.id !== sourceDayId && updatedSchedule[day.id].length === 0) {
        updatedSchedule[day.id] = [...sourceSlots];
      }
    });

    setSchedule(updatedSchedule);
    setError(null);
  };

  const handleComplete = () => {
    setError(null);

    // Vérifier qu'au moins un jour a des créneaux
    const hasSlots = Object.values(schedule).some(slots => slots.length > 0);
    if (!hasSlots) {
      setError('Veuillez définir au moins un créneau de disponibilité');
      return;
    }

    // Convertir l'objet en array pour l'API
    const disponibilites = [];
    Object.entries(schedule).forEach(([jour, slots]) => {
      slots.forEach(slot => {
        disponibilites.push({
          jour,
          heure_debut: slot.heure_debut,
          heure_fin: slot.heure_fin,
          types_consultation: slot.types_consultation
        });
      });
    });

    onComplete(disponibilites);
  };

  const getTotalSlots = () => {
    return Object.values(schedule).reduce((total, slots) => total + slots.length, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Définissez vos disponibilités</h3>
        <p className="text-sm text-gray-600">
          Configurez vos créneaux horaires pour chaque jour de la semaine
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-medium text-teal-800">
            {getTotalSlots()} créneau(x) configuré(s)
          </span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={selectedDay} onValueChange={setSelectedDay}>
        <TabsList className="w-full grid grid-cols-7 h-auto">
          {DAYS.map(day => (
            <TabsTrigger key={day.id} value={day.id} className="text-xs">
              <div className="flex flex-col items-center gap-1">
                <span>{day.label.slice(0, 3)}</span>
                {schedule[day.id].length > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {schedule[day.id].length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {DAYS.map(day => (
          <TabsContent key={day.id} value={day.id} className="space-y-4">
            <Card className="p-4 bg-gray-50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">{day.label}</Label>
                  {schedule[day.id].length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToOtherDays(day.id)}
                    >
                      Copier aux autres jours
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Début</Label>
                    <Input
                      type="time"
                      value={newSlot.heure_debut}
                      onChange={(e) => setNewSlot({ ...newSlot, heure_debut: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fin</Label>
                    <Input
                      type="time"
                      value={newSlot.heure_fin}
                      onChange={(e) => setNewSlot({ ...newSlot, heure_fin: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Types de consultation</Label>
                  <div className="flex flex-wrap gap-2">
                    {CONSULTATION_TYPES.map(type => (
                      <Badge
                        key={type.id}
                        className={`cursor-pointer transition-all ${
                          newSlot.types_consultation.includes(type.id)
                            ? type.color + ' border-2 border-current'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        onClick={() => handleTypeToggle(type.id)}
                      >
                        {type.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleAddSlot}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter ce créneau
                </Button>
              </div>
            </Card>

            {/* Liste des créneaux du jour */}
            {schedule[day.id].length > 0 && (
              <div className="space-y-2">
                <Label>Créneaux configurés pour {day.label}</Label>
                {schedule[day.id].map((slot, index) => (
                  <Card key={index} className="p-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <div className="flex-1">
                          <p className="font-medium">
                            {slot.heure_debut} - {slot.heure_fin}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {slot.types_consultation.map(typeId => {
                              const type = CONSULTATION_TYPES.find(t => t.id === typeId);
                              return (
                                <Badge key={typeId} variant="secondary" className={`text-xs ${type?.color}`}>
                                  {type?.label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSlot(day.id, index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Boutons de navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => handleComplete()}>
          Passer cette étape
        </Button>
        <Button
          onClick={handleComplete}
          disabled={getTotalSlots() === 0}
          className="bg-teal-600 hover:bg-teal-700"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}