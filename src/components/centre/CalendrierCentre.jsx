import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter,
  Clock,
  User,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, startOfDay, endOfDay, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const STATUTS = {
  planifie: { label: 'En attente', color: 'bg-orange-100 text-orange-800', icon: Clock },
  confirme: { label: 'Confirmé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  annule: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const TYPES_CONSULTATION = [
  { value: 'consultation_prenatale', label: 'Consultation prénatale' },
  { value: 'echographie', label: 'Échographie' },
  { value: 'pediatrie', label: 'Pédiatrie' },
  { value: 'urgences', label: 'Urgences' },
  { value: 'suivi_grossesse', label: 'Suivi grossesse' },
  { value: 'planning_familial', label: 'Planning familial' },
  { value: 'autre', label: 'Autre' }
];

export default function CalendrierCentre({ centre }) {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('mois'); // jour, semaine, mois
  const [filters, setFilters] = useState({
    professionnel: 'tous',
    statut: 'tous',
    type: 'tous'
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [formData, setFormData] = useState({
    patient_nom: '',
    patient_email: '',
    patient_telephone: '',
    date_rdv: '',
    type_consultation: 'consultation_prenatale',
    professionnel_id: '',
    professionnel_nom: '',
    duree_minutes: 30,
    notes_patient: '',
    statut: 'planifie'
  });

  // Récupérer les rendez-vous
  const { data: rdvs = [], isLoading } = useQuery({
    queryKey: ['rdv_centre', centre.id, currentDate, view],
    queryFn: async () => {
      let startDate, endDate;
      
      if (view === 'jour') {
        startDate = startOfDay(currentDate);
        endDate = endOfDay(currentDate);
      } else if (view === 'semaine') {
        startDate = startOfWeek(currentDate, { locale: fr });
        endDate = endOfWeek(currentDate, { locale: fr });
      } else {
        startDate = startOfWeek(startOfMonth(currentDate), { locale: fr });
        endDate = endOfWeek(endOfMonth(currentDate), { locale: fr });
      }

      const rdvs = await base44.entities.RendezVousAdministratif.filter({
        centre_id: centre.id,
        date_rdv: {
          $gte: startDate.toISOString(),
          $lte: endDate.toISOString()
        }
      });
      
      return rdvs.sort((a, b) => new Date(a.date_rdv) - new Date(b.date_rdv));
    }
  });

  // Récupérer les membres du centre
  const { data: membres = [] } = useQuery({
    queryKey: ['membres_centre', centre.id],
    queryFn: async () => {
      return await base44.entities.MembreCentre.filter({
        centre_id: centre.id,
        statut: 'actif'
      });
    }
  });

  // Créer un RDV
  const createRdvMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.RendezVousAdministratif.create({
        ...data,
        centre_id: centre.id,
        centre_nom: centre.nom,
        source: 'plateforme'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rdv_centre']);
      toast.success('Rendez-vous créé');
      setShowCreateDialog(false);
      resetForm();
    },
    onError: () => toast.error('Erreur lors de la création')
  });

  // Modifier un RDV
  const updateRdvMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.RendezVousAdministratif.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rdv_centre']);
      toast.success('Rendez-vous modifié');
      setShowEditDialog(false);
      setSelectedRdv(null);
    },
    onError: () => toast.error('Erreur lors de la modification')
  });

  // Supprimer un RDV
  const deleteRdvMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.RendezVousAdministratif.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rdv_centre']);
      toast.success('Rendez-vous supprimé');
      setShowEditDialog(false);
      setSelectedRdv(null);
    },
    onError: () => toast.error('Erreur lors de la suppression')
  });

  const resetForm = () => {
    setFormData({
      patient_nom: '',
      patient_email: '',
      patient_telephone: '',
      date_rdv: '',
      type_consultation: 'consultation_prenatale',
      professionnel_id: '',
      professionnel_nom: '',
      duree_minutes: 30,
      notes_patient: '',
      statut: 'planifie'
    });
  };

  const handleCreateRdv = () => {
    if (!formData.patient_nom || !formData.patient_email || !formData.date_rdv) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    createRdvMutation.mutate(formData);
  };

  const handleUpdateRdv = () => {
    if (!selectedRdv) return;
    updateRdvMutation.mutate({ id: selectedRdv.id, data: formData });
  };

  const handleEditRdv = (rdv) => {
    setSelectedRdv(rdv);
    setFormData({
      patient_nom: rdv.patient_nom,
      patient_email: rdv.patient_email,
      patient_telephone: rdv.patient_telephone || '',
      date_rdv: rdv.date_rdv,
      type_consultation: rdv.type_consultation,
      professionnel_id: rdv.professionnel_id || '',
      professionnel_nom: rdv.professionnel_nom || '',
      duree_minutes: rdv.duree_minutes || 30,
      notes_patient: rdv.notes_patient || '',
      statut: rdv.statut
    });
    setShowEditDialog(true);
  };

  const handleDeleteRdv = () => {
    if (!selectedRdv || !confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) return;
    deleteRdvMutation.mutate(selectedRdv.id);
  };

  const navigateDate = (direction) => {
    if (view === 'jour') {
      setCurrentDate(direction === 'prev' ? addDays(currentDate, -1) : addDays(currentDate, 1));
    } else if (view === 'semaine') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  const filteredRdvs = rdvs.filter(rdv => {
    if (filters.professionnel !== 'tous' && rdv.professionnel_id !== filters.professionnel) return false;
    if (filters.statut !== 'tous' && rdv.statut !== filters.statut) return false;
    if (filters.type !== 'tous' && rdv.type_consultation !== filters.type) return false;
    return true;
  });

  const getRdvsForDate = (date) => {
    return filteredRdvs.filter(rdv => isSameDay(new Date(rdv.date_rdv), date));
  };

  const renderCalendarMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: fr });
    const endDate = endOfWeek(monthEnd, { locale: fr });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
          <div key={d} className="p-2 text-center font-semibold text-sm text-gray-600 border-b">
            {d}
          </div>
        ))}
        {days.map((day, idx) => {
          const rdvsForDay = getRdvsForDate(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div
              key={idx}
              className={`min-h-24 p-2 border ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'ring-2 ring-purple-500' : ''} hover:bg-purple-50 transition-colors cursor-pointer`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-purple-600' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {rdvsForDay.slice(0, 3).map(rdv => (
                  <div
                    key={rdv.id}
                    onClick={() => handleEditRdv(rdv)}
                    className={`text-xs p-1 rounded ${STATUTS[rdv.statut]?.color || 'bg-gray-100'} truncate cursor-pointer hover:shadow-sm`}
                  >
                    {format(new Date(rdv.date_rdv), 'HH:mm')} - {rdv.patient_nom}
                  </div>
                ))}
                {rdvsForDay.length > 3 && (
                  <div className="text-xs text-gray-500">+{rdvsForDay.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCalendarWeek = () => {
    const weekStart = startOfWeek(currentDate, { locale: fr });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const rdvsForDay = getRdvsForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={idx} className="border rounded-lg overflow-hidden">
              <div className={`p-2 text-center font-semibold ${isToday ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}>
                <div className="text-xs">{format(day, 'EEE', { locale: fr })}</div>
                <div className="text-lg">{format(day, 'd')}</div>
              </div>
              <div className="p-2 space-y-2 min-h-96 bg-gray-50">
                {rdvsForDay.map(rdv => (
                  <div
                    key={rdv.id}
                    onClick={() => handleEditRdv(rdv)}
                    className={`p-2 rounded ${STATUTS[rdv.statut]?.color || 'bg-white'} cursor-pointer hover:shadow-md transition-shadow`}
                  >
                    <div className="font-semibold text-sm">{format(new Date(rdv.date_rdv), 'HH:mm')}</div>
                    <div className="text-xs mt-1">{rdv.patient_nom}</div>
                    <div className="text-xs text-gray-600">{TYPES_CONSULTATION.find(t => t.value === rdv.type_consultation)?.label}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCalendarDay = () => {
    const rdvsForDay = getRdvsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-1">
        {hours.map(hour => {
          const rdvsAtHour = rdvsForDay.filter(rdv => {
            const rdvHour = new Date(rdv.date_rdv).getHours();
            return rdvHour === hour;
          });

          return (
            <div key={hour} className="flex border-t">
              <div className="w-20 p-2 text-sm font-medium text-gray-600 border-r">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 p-2 space-y-1 min-h-16">
                {rdvsAtHour.map(rdv => (
                  <div
                    key={rdv.id}
                    onClick={() => handleEditRdv(rdv)}
                    className={`p-2 rounded ${STATUTS[rdv.statut]?.color || 'bg-white'} cursor-pointer hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{rdv.patient_nom}</div>
                        <div className="text-xs text-gray-600">
                          {format(new Date(rdv.date_rdv), 'HH:mm')} - {TYPES_CONSULTATION.find(t => t.value === rdv.type_consultation)?.label}
                        </div>
                      </div>
                      <Badge className={STATUTS[rdv.statut]?.color}>
                        {STATUTS[rdv.statut]?.label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header avec navigation */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-lg md:text-xl">
                  {view === 'jour' && format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
                  {view === 'semaine' && `Semaine du ${format(startOfWeek(currentDate, { locale: fr }), 'd MMM', { locale: fr })} au ${format(endOfWeek(currentDate, { locale: fr }), 'd MMM yyyy', { locale: fr })}`}
                  {view === 'mois' && format(currentDate, 'MMMM yyyy', { locale: fr })}
                </CardTitle>
              </div>
              <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Aujourd'hui
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Select value={view} onValueChange={setView}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jour">Jour</SelectItem>
                  <SelectItem value="semaine">Semaine</SelectItem>
                  <SelectItem value="mois">Mois</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau RDV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-base">Filtres</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Professionnel</Label>
              <Select value={filters.professionnel} onValueChange={(v) => setFilters({ ...filters, professionnel: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  {membres.filter(m => ['medecin', 'sage_femme', 'infirmier'].includes(m.role)).map(m => (
                    <SelectItem key={m.id} value={m.user_email}>{m.user_nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Statut</Label>
              <Select value={filters.statut} onValueChange={(v) => setFilters({ ...filters, statut: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="planifie">En attente</SelectItem>
                  <SelectItem value="confirme">Confirmé</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type de service</Label>
              <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous</SelectItem>
                  {TYPES_CONSULTATION.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier */}
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              {view === 'mois' && renderCalendarMonth()}
              {view === 'semaine' && renderCalendarWeek()}
              {view === 'jour' && renderCalendarDay()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Créer RDV */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nom du patient *</Label>
                <Input
                  value={formData.patient_nom}
                  onChange={(e) => setFormData({ ...formData, patient_nom: e.target.value })}
                  placeholder="Nom complet"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.patient_email}
                  onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>
            </div>

            <div>
              <Label>Téléphone</Label>
              <Input
                type="tel"
                value={formData.patient_telephone}
                onChange={(e) => setFormData({ ...formData, patient_telephone: e.target.value })}
                placeholder="+225..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Date et heure *</Label>
                <Input
                  type="datetime-local"
                  value={formData.date_rdv}
                  onChange={(e) => setFormData({ ...formData, date_rdv: e.target.value })}
                />
              </div>
              <div>
                <Label>Durée (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duree_minutes}
                  onChange={(e) => setFormData({ ...formData, duree_minutes: parseInt(e.target.value) })}
                  min={15}
                  step={15}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Type de consultation *</Label>
                <Select value={formData.type_consultation} onValueChange={(v) => setFormData({ ...formData, type_consultation: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_CONSULTATION.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Professionnel assigné</Label>
                <Select value={formData.professionnel_id} onValueChange={(v) => {
                  const membre = membres.find(m => m.user_email === v);
                  setFormData({ 
                    ...formData, 
                    professionnel_id: v,
                    professionnel_nom: membre?.user_nom || ''
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {membres.filter(m => ['medecin', 'sage_femme', 'infirmier'].includes(m.role)).map(m => (
                      <SelectItem key={m.id} value={m.user_email}>{m.user_nom} - {m.role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes_patient}
                onChange={(e) => setFormData({ ...formData, notes_patient: e.target.value })}
                placeholder="Motif de consultation, précisions..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreateRdv}
                disabled={createRdvMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {createRdvMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier RDV */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le rendez-vous</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nom du patient *</Label>
                <Input
                  value={formData.patient_nom}
                  onChange={(e) => setFormData({ ...formData, patient_nom: e.target.value })}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.patient_email}
                  onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Téléphone</Label>
              <Input
                type="tel"
                value={formData.patient_telephone}
                onChange={(e) => setFormData({ ...formData, patient_telephone: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Date et heure *</Label>
                <Input
                  type="datetime-local"
                  value={formData.date_rdv}
                  onChange={(e) => setFormData({ ...formData, date_rdv: e.target.value })}
                />
              </div>
              <div>
                <Label>Durée (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duree_minutes}
                  onChange={(e) => setFormData({ ...formData, duree_minutes: parseInt(e.target.value) })}
                  min={15}
                  step={15}
                />
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={formData.statut} onValueChange={(v) => setFormData({ ...formData, statut: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planifie">En attente</SelectItem>
                    <SelectItem value="confirme">Confirmé</SelectItem>
                    <SelectItem value="annule">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Type de consultation *</Label>
                <Select value={formData.type_consultation} onValueChange={(v) => setFormData({ ...formData, type_consultation: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_CONSULTATION.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Professionnel assigné</Label>
                <Select value={formData.professionnel_id} onValueChange={(v) => {
                  const membre = membres.find(m => m.user_email === v);
                  setFormData({ 
                    ...formData, 
                    professionnel_id: v,
                    professionnel_nom: membre?.user_nom || ''
                  });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {membres.filter(m => ['medecin', 'sage_femme', 'infirmier'].includes(m.role)).map(m => (
                      <SelectItem key={m.id} value={m.user_email}>{m.user_nom} - {m.role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes_patient}
                onChange={(e) => setFormData({ ...formData, notes_patient: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-between">
              <Button 
                variant="destructive"
                onClick={handleDeleteRdv}
                disabled={deleteRdvMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpdateRdv}
                  disabled={updateRdvMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {updateRdvMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}